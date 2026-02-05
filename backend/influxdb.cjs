const { InfluxDB, Point } = require('@influxdata/influxdb-client')

// InfluxDB Config
const url = 'http://89.168.93.160:8086'
const token = 'THIVVNQQSSjnW22eADNrJ6QCY7VXNazzz9WKhNmEGfghTBjq9Q8EdMSqbHUl7eu2XSYR4kvi1R_TUookQeC3zQ=='
const org = 'myorg'
const bucket = 'mybucket'

// Create client and write API
const client = new InfluxDB({ url, token })
const writeApi = client.getQueryApi(org, bucket)

// Function to save data
function saveSensorReading(sensor_id, value, timestamp = new Date()) {
  const point = new Point('sensor_readings')
    .tag('sensor_id', sensor_id)
    .floatField('value', value)
    .timestamp(timestamp)

  writeApi.writePoint(point)
}

// Function to save device metadata
function saveDeviceMetadata(device_id, device_name, device_type, min, max, units, long, lat) {
  const point = new Point('device_metadata')
    .tag('device_id', device_id)
    .tag('device_name', device_name)
    .tag('device_type', device_type)
    .floatField('min_value', min)
    .floatField('max_value', max)
    .stringField('units', units)
    .floatField('longitude', long)
    .floatField('latitude', lat)

  writeApi.writePoint(point)
}

writeApi.queryRows(`
from(bucket: "live")
  |> range(start: -10000000h)
  |> filter(fn: (r) => r["_measurement"] == "ardhi")
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
  |> filter(fn: (r) => r["id"] == "ardhi-bme-280" or r["id"] == "bme680-ph-dox-full-sensor-test")
  |> keep(columns: ["id", "_measurement", "value", "_time"]) 
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

// writeApi
//   .close()
//   .then(() => {
//     console.log('Waiting for data...')
//     console.log(writeApi)
//   })
//   .catch(err => {
//     console.error('Error writing data', err)
//   })
