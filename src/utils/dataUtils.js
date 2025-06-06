const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

let memoryCache = {
  timestamp: null,
  data: null
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
  const cached = localStorage.getItem(cacheKey);
  const cachedAt = localStorage.getItem(`${cacheKey}_at`);
  if (cached && cachedAt && now - Number(cachedAt) < cacheTime) {
    const data = JSON.parse(cached);
    memoryCache = { timestamp: now, data }; // update memory cache
    return data;
  }

  // ✅ 3. Fetch from server if no valid cache
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
  const data = await response.json();

  // Store in memory and localStorage
  memoryCache = { timestamp: now, data };
  localStorage.setItem(cacheKey, JSON.stringify(data));
  localStorage.setItem(`${cacheKey}_at`, now.toString());

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
