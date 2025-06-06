const axios = require("axios");

// POST Location Data
axios
  .post("http://127.0.0.1:5000/location", {
    id: "",
    name: "Building A",
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });

// POST Device Type
axios
  .post("http://127.0.0.1:5000/device_type", {
    id: "",
    name: "Temperature",
  })
  .then((response) => {
    console.log(response.data);
  })
  .catch((error) => {
    console.error(error);
  });
