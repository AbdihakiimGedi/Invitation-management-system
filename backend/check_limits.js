const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function checkLimits() {
  const tableList = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
  console.log('Tables in DB:', tableList.rows.map(r => r.table_name).join(', '));

  const tables = ['graduates', 'parents_guests', 'students', 'guests'];
  for (const table of tables) {
    console.log(`--- Table: ${table} ---`);
    const res = await pool.query(`
      SELECT column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = $1 
    `, [table]);
    console.table(res.rows);
  }
  pool.end();
}

checkLimits();
