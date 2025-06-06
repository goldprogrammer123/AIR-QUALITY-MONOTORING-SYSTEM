const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'your_username',
  password: 'your_password',
  database: 'your_database'
});

// Get all devices
router.get('/devices', async (req, res) => {
  try {
    const [devices] = await pool.query('SELECT * FROM devices');
    const [measurements] = await pool.query('SELECT * FROM device_measurements');
    
    // Combine devices with their measurements
    const devicesWithMeasurements = devices.map(device => ({
      ...device,
      measurements: measurements
        .filter(m => m.device_id === device.device_id)
        .map(m => m.measurement_type)
    }));
    
    res.json(devicesWithMeasurements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add new device
router.post('/devices/add', async (req, res) => {
  const { deviceId, location, description, measurements } = req.body;
  
  try {
    await pool.query(
      'INSERT INTO devices (device_id, location, description) VALUES (?, ?, ?)',
      [deviceId, location, description]
    );
    
    // Add measurements for the device
    for (const measurement of measurements) {
      await pool.query(
        'INSERT INTO device_measurements (device_id, measurement_type) VALUES (?, ?)',
        [deviceId, measurement]
      );
    }
    
    res.json({ message: 'Device added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;