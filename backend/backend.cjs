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

const PORT = process.env.PORT || 3000;

// // Connect to MySQL
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

//connect to influxdb

const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;


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


// Create write API for influxdb

const writeApi = client.getQueryApi(org, bucket)

const id = "important..."


// writeApi.queryRows(`
//   from(bucket: "mybucket")
//   |> range(start: -10000000h)
//   |> filter(fn: (r) => r["_measurement"] == "ardhi")
//   |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
//   |> filter(fn: (r) => r["id"] == "${id}")
//   |> keep(columns: ["id", "measurement", "value", "_time"])  
// `, {
//   next(row, tableMeta) {
//     const o = tableMeta.toObject(row)
//     console.log(o)
//   },
//   error(e) {
//     console.error(e)
//   },
//   complete(){
//     console.log("finished")
//   }
// })

app.get('/influx', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const days = parseInt(req.query.days) || 30;

    const measurements = [
      "AbsoluteHumidity",
      "AirQualityScore",
      "BatteryPercentage",
      "BatteryVoltage",
      "GasResistance",
      "Latitude",
      "Longitude",
      "PM1.0 (ATM)",
      "PM10 (ATM)",
      "PM2.5 (ATM)",
      "Pressure",
      "RawHumidity",
      "RawTemperature",
      "RunInStatus",
      "StabStatus",
      "VOC",
      "WeatherVibes"
    ];

    // Filter only these measurements
    const measurementFilter = measurements.map(m => `r["_measurement"] == "${m}"`).join(" or ");

    const fluxQuery = `
      from(bucket: "${bucket}")
      |> range(start: -${days}d)
      |> filter(fn: (r) => ${measurementFilter})
      |> aggregateWindow(every: 1h, fn: mean, createEmpty: false)
      |> pivot(rowKey: ["_time"], columnKey: ["_measurement"], valueColumn: "_value")
      |> drop(columns: ["_start", "_stop", "_field", "_value", "_measurement", "_result", "_table", "topic"])
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit}, offset: ${(page - 1) * limit})
    `;

    const rawData = [];
    const lastValues = {}; // store last known value per measurement

    client.getQueryApi(org).queryRows(fluxQuery, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);

        // Add device ID from 'host' column (or replace with your tag)
        obj.id = obj.host || "Unknown";

        // Fill missing measurement values with last known value
        measurements.forEach(m => {
          if (obj[m] == null && lastValues[m] != null) {
            obj[m] = lastValues[m];
          }
          if (obj[m] != null) {
            lastValues[m] = obj[m];
          }
        });

        // Format time consistently
        obj._time = new Date(obj._time).toISOString();

        rawData.push(obj);
      },
      error(err) {
        console.error("Influx query error:", err);
        res.status(500).json({ error: err.message });
      },
      complete() {
        res.json({
          data: rawData,
          pagination: {
            page,
            limit,
            hasMore: rawData.length === limit
          }
        });
      }
    });

  } catch (err) {
    console.error("Backend error:", err);
    res.status(500).json({ error: err.message });
  }
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
