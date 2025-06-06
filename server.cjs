require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const { InfluxDB } = require('@influxdata/influxdb-client');
const { HealthAPI } = require('@influxdata/influxdb-client-apis');

const app = express();
const PORT = process.env.PORT || 5000;

// MySQL connection
const db = mysql.createConnection({
  host:'167.235.134.36',
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database:   process.env.MYSQL_DATABASE,
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// InfluxDB connection
const influx = new InfluxDB({
  url: 'http://localhost:8086',
  token: process.env.INFLUX_TOKEN
});

// Check InfluxDB health
const healthAPI = new HealthAPI(influx);
healthAPI.getHealth()
  .then((health) => {
    if (health.status === 'pass') {
      console.log('Connected to InfluxDB');
    } else {
      console.error('InfluxDB health check failed:', health);
    }
  })
  .catch((err) => {
    console.error('Error checking InfluxDB health:', err.message);
  });

app.use(cors());
app.use(express.json());

// Fetch All Sensors from MySQL
app.get('/sensors', (_req, res) => {
  const query = 'SELECT * FROM sensors ';

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Fetch Device Types from MySQL
app.get('/device-types', (req, res) => {
  const query = 'SELECT * FROM device_types';
--
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
});
});

// Fetch Air Quality Data from InfluxDB
app.get('/air-quality', async (req, res) => {
const query = `from(bucket: "${process.env.INFLUX_BUCKET}") |> range(start: -1h)`;

try {
  const data = await influx.queryRows(query);
  res.json(data);
} catch (error) {
  res.status(500).json({ error: error.message });
}
});

app.listen(PORT, () => {
console.log(`Server running on port ${PORT}`);
});