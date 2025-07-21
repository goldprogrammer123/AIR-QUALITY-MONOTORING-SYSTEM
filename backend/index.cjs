const { Pool } = require('pg');
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mysql = require("mysql2");

dotenv.config();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const PORT = 3000;

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

pool.connect((err) => {
  if (err) {
    console.error('❌ Connection error', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL');
  }
});

/**
 * ✅ Optimized PostgreSQL Pagination (30 per page)
 * Use: /pg?page=1
 */
app.get('/pg', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 30; // allow limit from query
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      'SELECT * FROM your_table_name ORDER BY received_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    const data = result.rows;
    res.json({
      data,
      pagination: {
        page,
        limit,
        hasMore: data.length === limit,
      },
    });
  } catch (err) {
    console.error('❌ PostgreSQL Query Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});