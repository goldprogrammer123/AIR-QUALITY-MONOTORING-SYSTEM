const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes in milliseconds
const MAX_CACHE_SIZE = 5 * 1024 * 1024; // 5MB limit for localStorage

let memoryCache = {
  timestamp: null,
  data: null
};

/**
 * Compress data for storage by removing unnecessary fields and truncating large arrays
 * @param {any} data - Data to compress
 * @returns {string} - Compressed JSON string
 */
const compressData = (data) => {
  try {
    // For large arrays, keep only the most recent items
    if (Array.isArray(data) && data.length > 100) {
      data = data.slice(-100); // Keep only last 100 items
    }
    
    // Remove unnecessary fields that might be large
    if (Array.isArray(data)) {
      data = data.map(item => {
        const compressed = { ...item };
        // Remove large fields that aren't essential for display
        delete compressed.measurements;
        delete compressed.raw_data;
        delete compressed.metadata;
        return compressed;
      });
    }
    
    return JSON.stringify(data);
  } catch (error) {
    console.warn('Data compression failed:', error);
    return JSON.stringify(data);
  }
};

/**
 * Check if data size is within localStorage limits
 * @param {string} dataString - Stringified data
 * @returns {boolean} - Whether data fits in localStorage
 */
const isDataSizeAcceptable = (dataString) => {
  const sizeInBytes = new Blob([dataString]).size;
  return sizeInBytes < MAX_CACHE_SIZE;
};

/**
 * Clear old cache entries to make space
 */
const clearOldCache = () => {
  try {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.includes('dashboard_page_') || key.includes('_at'));
    
    // Remove oldest cache entries
    cacheKeys.sort((a, b) => {
      const timeA = localStorage.getItem(a.includes('_at') ? a : `${a}_at`);
      const timeB = localStorage.getItem(b.includes('_at') ? b : `${b}_at`);
      return (timeA || 0) - (timeB || 0);
    });
    
    // Remove oldest 50% of cache entries
    const toRemove = cacheKeys.slice(0, Math.floor(cacheKeys.length / 2));
    toRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to clear old cache:', error);
  }
};

/**
 * Smart cache fetch with in-memory + localStorage support
 * @param {string} url - API URL to fetch
 * @param {string} cacheKey - Optional unique key to cache data
 * @param {number} cacheTime - Duration to keep cache (in ms)
 * @returns {Promise<any>} - Fetched or cached data
 */
export const fetchWithCache = async (url, cacheKey = url, cacheTime = CACHE_DURATION) => {
  const now = Date.now();

  // ✅ 1. Check in-memory cache first
  if (
    memoryCache.timestamp &&
    memoryCache.data &&
    (now - memoryCache.timestamp < cacheTime)
  ) {
    return memoryCache.data;
  }

  // ✅ 2. Check localStorage cache next
  try {
    const cached = localStorage.getItem(cacheKey);
    const cachedAt = localStorage.getItem(`${cacheKey}_at`);
    if (cached && cachedAt && now - Number(cachedAt) < cacheTime) {
      const data = JSON.parse(cached);
      memoryCache = { timestamp: now, data }; // update memory cache
      return data;
    }
  } catch (error) {
    console.warn('Failed to read from localStorage cache:', error);
  }

  // ✅ 3. Fetch from server if no valid cache
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    console.error('Network error fetching:', url, error);
    throw new Error(`Failed to connect to server. Make sure the backend is running on port 5000. Error: ${error.message}`);
  }
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    console.error(`HTTP error ${response.status} for ${url}:`, errorText);
    throw new Error(`HTTP error! Status: ${response.status}. ${errorText.substring(0, 100)}`);
  }
  
  let data;
  try {
    data = await response.json();
  } catch (error) {
    console.error('Failed to parse JSON response:', error);
    throw new Error(`Invalid JSON response from server: ${error.message}`);
  }

  // Store in memory cache
  memoryCache = { timestamp: now, data };

  // Try to store in localStorage with compression and size checks
  try {
    const compressedData = compressData(data);
    
    if (isDataSizeAcceptable(compressedData)) {
      localStorage.setItem(cacheKey, compressedData);
      localStorage.setItem(`${cacheKey}_at`, now.toString());
    } else {
      // If data is too large, clear old cache and try again
      clearOldCache();
      
      // Try with even more compression
      const moreCompressed = compressData(data.slice ? data.slice(-50) : data);
      if (isDataSizeAcceptable(moreCompressed)) {
        localStorage.setItem(cacheKey, moreCompressed);
        localStorage.setItem(`${cacheKey}_at`, now.toString());
      } else {
        console.warn('Data too large for localStorage, using memory cache only');
      }
    }
  } catch (error) {
    console.warn('Failed to store in localStorage:', error);
    // Continue with memory cache only
  }

  return data;
};

/**
 * Group data by 15-minute time intervals and average the values
 * @param {Array} data - Raw sensor data with `_time`, `value`, `id`, and `measurement`
 * @returns {Array} - Grouped and averaged data
 */
export const groupDataBy15Minutes = (data) => {
  const groups = {};

  data.forEach(item => {
    const date = new Date(item._time);
    date.setMinutes(Math.floor(date.getMinutes() / 15) * 15);
    date.setSeconds(0);
    date.setMilliseconds(0);

    const key = `${item.id}-${item.measurement}-${date.getTime()}`;

    if (!groups[key]) {
      groups[key] = {
        id: item.id,
        measurement: item.measurement,
        _time: date.toISOString(),
        values: []
      };
    }

    groups[key].values.push(item.value);
  });

  return Object.values(groups).map(group => ({
    ...group,
    value: group.values.reduce((sum, val) => sum + val, 0) / group.values.length
  }));
};
