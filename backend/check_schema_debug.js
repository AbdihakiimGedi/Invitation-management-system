const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'Digital Invitation & Attendance Management'
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    console.log('--- Table: faculties ---');
    const facCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'faculties'
    `);
    console.table(facCols.rows);

    console.log('\n--- Table: departments ---');
    const depCols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'departments'
    `);
    console.table(depCols.rows);

    console.log('\n--- Sample Data: faculties ---');
    const facData = await client.query('SELECT * FROM faculties LIMIT 5');
    console.table(facData.rows);

    console.log('\n--- Sample Data: departments ---');
    const depData = await client.query('SELECT * FROM departments LIMIT 5');
    console.table(depData.rows);

  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}

checkSchema();
