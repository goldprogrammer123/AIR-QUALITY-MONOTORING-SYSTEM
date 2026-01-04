

require('dotenv').config()
const express = require('express')
const cors = require('cors')
const { InfluxDB } = require('@influxdata/influxdb-client')

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 2000

// ✅ InfluxDB Client (CORRECT)
const influxDB = new InfluxDB({
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
})

const queryApi = influxDB.getQueryApi(process.env.INFLUX_ORG)

console.log('INFLUX_URL =', process.env.INFLUX_URL)
console.log('INFLUX_ORG =', process.env.INFLUX_ORG)
console.log('INFLUX_BUCKET =', process.env.INFLUX_BUCKET)



console.log('✅ InfluxDB client initialized')


/**
 * ✅ API: Get latest air quality data
 * URL: /influxdb/latest
 */
app.get('/influxdb/latest', async (req, res) => {
  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -10m)
      |> filter(fn: (r) => r._measurement == "VOC" or r._measurement == "RawHumidity" or r._measurement == "Pressure" or r._measurement == "RawTemperature" or r._measurement == "AbsoluteHumidity" or r._measurement == "AirQualityScore" or r._measurement == "BatteryPercentage" or r._measurement == "GasResistance" or r._measurement == "WeatherVibes" or r._measurement == "StabaStatus")
      |> last()
  `

  const data = []

  try {
    await queryApi.collectRows(query, row => {
      data.push(row)
    })
    res.json(data)
  } catch (err) {
    console.error('❌ Influx Query Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * ✅ API: Historical data with pagination-like limit
 * URL: /influxdb/history?hours=24&limit=100
 */
app.get('/influxdb/history', async (req, res) => {
  const hours = req.query.hours || 24;
  const limit = req.query.limit || 100;

  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -${hours}h)
      |> filter(fn: (r) => r._measurement == "VOC" or r._measurement == "RawHumidity" or r._measurement == "Pressure" or r._measurement == "RawTemperature" or r._measurement == "AbsoluteHumidity" or r._measurement == "AirQualityScore" or r._field == "BatteryPercentage" or r._field == "GasResistance" or r._field == "WeatherVibes" or r._measurement == "StabaStatus")
      |> sort(columns: ["_time"], desc: true)
      |> drop(columns: ["_start", "_stop", "host", "topic", "result", "table"])
      |> limit(n: ${limit})
  `;

  let results = [];
  try {
    await queryApi.collectRows(query, (row) => {
      results.push(row);
    });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching data');
  }
});

 
/**
 * ✅ API: Average values for dashboard cards
 * URL: /influxdb/avg
 */
app.get('/influxdb/avg', async (req, res) => {
  const query = `
    from(bucket: "${process.env.INFLUX_BUCKET}")
      |> range(start: -1h)
      |> filter(fn: (r) => r._measurement == "airquality")
      |> mean()
  `

  const data = []

  try {
    await queryApi.collectRows(query, row => {
      data.push(row)
    })
    res.json(data)
  } catch (err) {
    console.error('❌ Influx Query Error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

/**
 * ✅ Health check
 */
app.get('/', (req, res) => {
  res.send('🚀 InfluxDB API running')
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
