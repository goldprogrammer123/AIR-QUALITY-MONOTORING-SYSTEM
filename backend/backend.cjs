const { InfluxDB } = require('@influxdata/influxdb-client');
const express = require("express");

const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2");

// Load .env from parent directory (project root)
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 5000;
console.log('🔧 Loaded PORT from .env:', process.env.PORT || 'using default 5000');

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

//connect to influxdb
const url = process.env.INFLUXDB_URL || 'http://89.168.93.160:8086';
const token = process.env.INFLUXDB_TOKEN || 'THIVVNQQSSjnW22eADNrJ6QCY7VXNazzz9WKhNmEGfghTBjq9Q8EdMSqbHUl7eu2XSYR4kvi1R_TUookQeC3zQ==';
const org = process.env.INFLUXDB_ORG || 'myorg';
const bucket = process.env.INFLUXDB_BUCKET || 'mybucket';

// Validate InfluxDB configuration
if (!url || !token || !org || !bucket) {
  console.error('⚠️  Warning: InfluxDB configuration incomplete!');
  console.error('Please set INFLUXDB_URL, INFLUXDB_TOKEN, INFLUXDB_ORG, and INFLUXDB_BUCKET in .env file');
}

const client = new InfluxDB({ url, token });

//MySQL database connection - make it optional
let mysqlConnected = false;
db.connect((err) => {
  if (err) {
    mysqlConnected = false;
    // Only show warning if MySQL is actually configured
    if (process.env.MYSQL_HOST && process.env.MYSQL_HOST !== 'localhost') {
      console.warn('⚠️  MySQL connection failed (optional):', err.message);
      console.warn('   MySQL endpoints will not work, but InfluxDB endpoints will function.');
    }
  } else {
    mysqlConnected = true;
    console.log("✅ Connected to MySQL");
  }
});


// Create query API for influxdb
const queryApi = client.getQueryApi(org);

// Log InfluxDB connection info
console.log('\n📡 InfluxDB Configuration:');
console.log('  URL:', url);
console.log('  Org:', org);
console.log('  Bucket:', bucket);
console.log('');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      influxdb: {
        url,
        org,
        bucket,
        status: 'configured'
      },
      mysql: {
        connected: mysqlConnected,
        status: mysqlConnected ? 'connected' : 'not connected'
      }
    }
  });
});

// Test endpoint to check InfluxDB connection and see available data
app.get('/influx/test', (req, res) => {
  const data = [];
  const testQuery = `
    from(bucket: "${bucket}")
    |> range(start: -1h)
    |> limit(n: 10)
  `;
  
  console.log('Test query:', testQuery);
  
  queryApi.queryRows(testQuery, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);
      data.push(o);
    },
    error(err) {
      console.error('InfluxDB test error:', err);
      res.status(500).json({ 
        error: err.message || 'Failed to query InfluxDB',
        details: err.toString(),
        query: testQuery
      });
    },
    complete() {
      res.json({
        success: true,
        message: `Retrieved ${data.length} sample records`,
        sampleData: data,
        config: {
          url,
          org,
          bucket
        }
      });
    },
  });
});

app.get('/influx', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100; // Reduced default limit
  const deviceId = req.query.deviceId || '';
  const measurement = req.query.measurement || '';
  const startTime = req.query.startTime || '-1h'; // Reduced default to 1 hour to avoid timeout
  const data = [];
  let responseSent = false;
  
  // Build query WITHOUT pivot to avoid timeout - process raw InfluxDB format
  let fluxQuery = `
    from(bucket: "${bucket}")
    |> range(start: ${startTime})
  `;
  
  // Add measurement filter if specified
  if (measurement) {
    fluxQuery += `|> filter(fn: (r) => r["_measurement"] == "${measurement}")`;
  }
  
  // Add device ID filter if specified (check topic, id, or device_id fields)
  if (deviceId) {
    fluxQuery += `|> filter(fn: (r) => r["id"] == "${deviceId}" or r["device_id"] == "${deviceId}" or contains(value: r["topic"], substr: "${deviceId}"))`;
  }
  
  // Sort and limit BEFORE processing to reduce data volume
  fluxQuery += `
    |> sort(columns: ["_time"], desc: true)
    |> limit(n: ${limit * 2}, offset: ${(page - 1) * limit})
  `;
  
  console.log('📊 Executing Flux query (no pivot):', fluxQuery.replace(/\s+/g, ' ').trim());
  
  // Set timeout to ensure response is sent
  const timeout = setTimeout(() => {
    if (!responseSent) {
      responseSent = true;
      console.warn('⏱️  Query timeout - sending partial results');
      res.json({
        data,
        pagination: {
          page,
          limit,
          total: data.length,
          hasMore: false
        },
        warning: 'Query timeout - results may be incomplete. Try reducing time range or limit.'
      });
    }
  }, 20000); // 20 second timeout
  
  // Store topic mappings by measurement+timestamp to extract device ID
  // Key format: `${_measurement}_${_time}`
  const topicMap = new Map();
  const allRows = []; // Store all rows first, then process
  
  queryApi.queryRows(fluxQuery, {
    next(row, tableMeta) {
      const o = tableMeta.toObject(row);
      allRows.push(o);
      
      // Collect topic information for device ID extraction
      // Topics are stored as _value when _field === 'topic'
      if (o._field === 'topic' && o._value && typeof o._value === 'string') {
        const key = `${o._measurement}_${o._time}`;
        topicMap.set(key, o._value);
      }
    },
    error(err) {
      clearTimeout(timeout);
      if (!responseSent) {
        responseSent = true;
        console.error('❌ InfluxDB query error:', err);
        res.status(500).json({ 
          error: err.message || 'Failed to query InfluxDB',
          details: err.toString(),
          query: fluxQuery
        });
      }
    },
    complete() {
      clearTimeout(timeout);
      if (!responseSent) {
        responseSent = true;
        
        // Process all rows: extract device IDs from topics, then process value rows
        allRows.forEach(o => {
          // Only process records with "value" field (skip "topic" and other metadata fields)
          if (o._field === 'value' && o._value !== undefined && o._value !== null && typeof o._value !== 'string') {
            // Extract device ID from topic (available directly in the row or from map)
            let extractedDeviceId = 'unknown';
            
            // First try: topic is directly in the row object
            let topic = o.topic;
            
            // Second try: get from topic map (for cases where topic is in separate row)
            if (!topic) {
              const key = `${o._measurement}_${o._time}`;
              topic = topicMap.get(key);
            }
            
            if (topic && typeof topic === 'string') {
              // Extract device ID from topic like "v3/ardhi-dar-es-salaam@ttn/devices/bme680-ph-dox-full-sensor-test/up"
              const topicMatch = topic.match(/devices\/([^\/]+)/);
              if (topicMatch) {
                extractedDeviceId = topicMatch[1];
              }
            }
            
            // Fallback to other ID sources
            if (extractedDeviceId === 'unknown') {
              if (o.id) extractedDeviceId = o.id;
              else if (o.device_id) extractedDeviceId = o.device_id;
              else if (o.host) extractedDeviceId = o.host;
            }
            
            // Use _measurement as the measurement name (e.g., "VOC", "AbsoluteHumidity", "PM2.5")
            const measurementName = o._measurement || 'unknown';
            
            data.push({
              id: extractedDeviceId,
              measurement: measurementName,
              value: o._value,
              _time: o._time || new Date().toISOString()
            });
          }
        });
        
        // Remove duplicates and sort
        const uniqueData = data.filter((item, index, self) => 
          index === self.findIndex(t => t.id === item.id && t.measurement === item.measurement && t._time === item._time)
        );
        
        // Sort by time descending
        uniqueData.sort((a, b) => new Date(b._time) - new Date(a._time));
        
        // Apply pagination
        const paginatedData = uniqueData.slice(0, limit);
        
        console.log(`✅ Query completed. Retrieved ${paginatedData.length} records (from ${allRows.length} raw rows, ${data.length} value records).`);
        res.json({
          data: paginatedData,
          pagination: {
            page,
            limit,
            total: paginatedData.length,
            hasMore: uniqueData.length > limit
          },
          message: paginatedData.length === 0 ? 'No data found for the specified criteria. Try adjusting filters or time range.' : undefined
        });
      }
    },
  });
});


// Fetch All Sensors from MySQL
app.get("/sensors", (_req, res) => {
  if (!mysqlConnected) {
    return res.status(503).json({ 
      error: 'MySQL connection not available',
      message: 'MySQL server is not connected. Please check your MySQL configuration.'
    });
  }
  
  const query = "SELECT * FROM sensors ";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST Sensor Data
app.post("/sensors", (req, res) => {
  const query =
    "INSERT INTO sensors (id, name, type_id, latitude, longitude, location_id) VALUES (?, ?, ?, ?, ?, ?)";
  const { id, name, type_id, latitude, longitude, location_id } = req.body;
  db.query(
    query,
    [id, name, type_id, latitude, longitude, location_id],
    (err, results) => {
      if (err){
         return res.status(500).json({ error: err.message })
      };
      res.json(results);
    }
  );
});

// Fetch All parameters from MySQL
app.get("/parameter", (_req, res) => {
  const query = "SELECT * FROM parameter ";

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// POST Sensor Data
app.post("/parameter", (req, res) => {
  const query =
    "INSERT INTO parameter (id, name, unit, max_value, min_value) VALUES ( ?, ?, ?, ?, ?)";
  const { id, name, unit, max_value, min_value } = req.body;
  db.query(query, [id, name, unit, max_value, min_value], (err, results) => {
    if (err) {
        return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// Fetch Device Types from MySQL
app.get("/device_type", (_req, res) => {
  const query = "SELECT * FROM device_type";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
  });
});

// post device type to mysql

app.post("/device_type", (req, res) => {
  console.log(req.body);
  const query = "INSERT INTO device_type (id,name) VALUES(?,?)";
  const { id, name } = req.body;
  db.query(query, [id, name], (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(results);
   
});
});

//post location to mysql
app.post("/location", (req, res) => {
  const query =
    "INSERT INTO location (id,name,latitude,longitude) VALUES(?,?,?,?)";
  const { id, name, latitude, longitude } = req.body;
  db.query(query, [id, name, latitude, longitude], (err, results) => {
    if (err) 
      {
        return res.status(500).json({ error: err.message });
  }
    return res.json(results);
  });
})

// Fetch Locations from MySQL
app.get("/location", (_req, res) => {
  const query = "SELECT * FROM location";
  db.query(query, (err, results) => { 
    if(err) {
      return res.status(500).json({ error: err.message });
    }  
    return res.json(results);
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  http://localhost:${PORT}/health          - Health check`);
  console.log(`   GET  http://localhost:${PORT}/influx         - InfluxDB data (with pagination)`);
  console.log(`   GET  http://localhost:${PORT}/influx/test    - Test InfluxDB connection`);
  console.log(`   GET  http://localhost:${PORT}/sensors        - MySQL sensors (requires MySQL)`);
  console.log(`\n💡 Example queries:`);
  console.log(`   http://localhost:${PORT}/influx?limit=10`);
  console.log(`   http://localhost:${PORT}/influx?startTime=-1h&limit=100`);
  console.log(`   http://localhost:${PORT}/influx?measurement=ardhi&limit=10`);
  console.log(`\n`);
});
