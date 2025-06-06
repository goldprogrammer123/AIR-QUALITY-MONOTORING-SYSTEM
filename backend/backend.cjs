const { InfluxDB } = require('@influxdata/influxdb-client');
const express = require("express");

const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2");

dotenv.config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = process.env.PORT || 5000;

// Connect to MySQL
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
});

//connect to influxdb

const url = process.env.INFLUXDB_URL; 
 const token = process.env.INFLUXDB_TOKEN; 
const org = process.env.INFLUXDB_ORG; 
const bucket = process.env.INFLUXDB_BUCKET; 

const client = new InfluxDB({ url, token });

//MySQL database connection is established
db.connect((err) => {
  if (err) {
    throw err;
  } else {
    // No error, proceed
  }
  console.log("Connected to MySQL");
});


// Create write API for influxdb

const writeApi = client.getQueryApi(org, bucket)

const id = "important..."


writeApi.queryRows(`
  from(bucket: "live")
  |> range(start: -10000000h)
  |> filter(fn: (r) => r["_measurement"] == "ardhi")
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> filter(fn: (r) => r["id"] == "${id}")
  |> keep(columns: ["id", "measurement", "value", "_time"])  
`, {
  next(row, tableMeta) {
    const o = tableMeta.toObject(row)
    console.log(o)
  },
  error(e) {
    console.error(e)
  },
  complete(){
    console.log("finished")
  }
})

app.get('/influx', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 1000000; // Increased limit per page
  const data = [];
  
  client.getQueryApi(org).queryRows(
    `
    from(bucket: "live")
    |> range(start: -10000000h)
    |> filter(fn: (r) => r["_measurement"] == "ardhi")
    |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
    |> filter(fn: (r) => r["id"] != "")
    |> keep(columns: ["id", "measurement", "value", "_time"])
    |> sort(columns: ["_time"], desc: true)
    |> limit(n: ${limit}, offset: ${(page - 1) * limit})
    `
    {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        data.push(o);  
      },
      error(err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      },
      complete() {
        res.json({
          data,
          pagination: {
            page,
            limit,
            totalPages: 10, // Fixed number of pages
            hasMore: page < 10 && data.length === limit // Check if there are more pages
          }
        });
      },
    }
  );
});


// Fetch All Sensors from MySQL
app.get("/sensors", (_req, res) => {
  const query = "SELECT * FROM sensors ";

  db.query(query, (err, results) => {
    if (err) {
      {
        return res.status(500).json({ error: err.message });
      }
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
  console.log(`Server running on port ${PORT}`);
});
