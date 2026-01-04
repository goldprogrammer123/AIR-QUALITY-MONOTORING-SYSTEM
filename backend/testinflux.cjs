const { InfluxDB }  = require ('@influxdata/influxdb-client');
require('dotenv').config();

const client = new InfluxDB({
  url: process.env.INFLUX_URL,
  token: process.env.INFLUX_TOKEN,
});

const queryApi = client.getQueryApi(process.env.INFLUX_ORG);

queryApi.queryRows('from(bucket:"mybucket") |> range(start: -1h)', {
  next(row, tableMeta) {
    console.log(tableMeta.toObject(row));
  },
  error(error) {
    console.error(error);
  },
  complete() {
    console.log('Query complete');
  },
});
