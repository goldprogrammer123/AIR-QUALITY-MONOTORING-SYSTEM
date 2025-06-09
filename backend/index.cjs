const { InfluxDB } = require('@influxdata/influxdb-client');
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2");

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 5000;

// MySQL connection
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

db.connect((err) => {
  if (err) throw err;
  console.log("✅ Connected to MySQL");
});

// InfluxDB connection
const url = process.env.INFLUXDB_URL;
const token = process.env.INFLUXDB_TOKEN;
const org = process.env.INFLUXDB_ORG;
const bucket = process.env.INFLUXDB_BUCKET;

const client = new InfluxDB({ url, token });

/**
 * ✅ Optimized InfluxDB Pagination (30 per page)
 * Use: /influx?page=1
 */
app.get('/influx', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
<<<<<<< HEAD
  const limit = 30;
=======
  const limit = parseInt(req.query.limit) || 30; // allow limit from query
>>>>>>> d95776d (feat: Refactor backend API connections and enhance InfluxDB data fetching with pagination)
  const offset = (page - 1) * limit;
  const data = [];

  const fluxQuery = `
    from(bucket: "${bucket}")
      |> range(start: -10000d)
      |> filter(fn: (r) => r._measurement == "ardhi")
      |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
      |> filter(fn: (r) => exists r.id and r.id != "")
      |> keep(columns: ["id", "measurement", "value", "_time"])
      |> sort(columns: ["_time"], desc: true)
      |> limit(n: ${limit}, offset: ${offset})
  `;

  try {
    const queryApi = client.getQueryApi(org);
    await queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const obj = tableMeta.toObject(row);
        data.push(obj);
      },
      error(error) {
        console.error("❌ InfluxDB Query Error:", error);
        res.status(500).json({ error: error.message });
      },
      complete() {
        res.json({
          data,
          pagination: {
            page,
            limit,
            hasMore: data.length === limit
          }
        });
      }
    });
  } catch (err) {
    console.error("❌ Influx Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ MySQL endpoints (unchanged)
app.get("/sensors", (_req, res) => {
  db.query("SELECT * FROM sensors", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/sensors", (req, res) => {
  const { id, name, type_id, latitude, longitude, location_id } = req.body;
  const query = "INSERT INTO sensors (id, name, type_id, latitude, longitude, location_id) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(query, [id, name, type_id, latitude, longitude, location_id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/parameter", (_req, res) => {
  db.query("SELECT * FROM parameter", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/parameter", (req, res) => {
  const { id, name, unit, max_value, min_value } = req.body;
  const query = "INSERT INTO parameter (id, name, unit, max_value, min_value) VALUES (?, ?, ?, ?, ?)";
  db.query(query, [id, name, unit, max_value, min_value], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/device_type", (_req, res) => {
  db.query("SELECT * FROM device_type", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/device_type", (req, res) => {
  const { id, name } = req.body;
  const query = "INSERT INTO device_type (id, name) VALUES (?, ?)";
  db.query(query, [id, name], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.get("/location", (_req, res) => {
  db.query("SELECT * FROM location", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/location", (req, res) => {
  const { id, name, latitude, longitude } = req.body;
  const query = "INSERT INTO location (id, name, latitude, longitude) VALUES (?, ?, ?, ?)";
  db.query(query, [id, name, latitude, longitude], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
