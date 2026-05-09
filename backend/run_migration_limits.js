const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');
    await client.query('BEGIN');

    console.log('Altering students table...');
    await client.query('ALTER TABLE students ALTER COLUMN phone TYPE VARCHAR(50)');

    console.log('Altering guests table...');
    await client.query('ALTER TABLE guests ALTER COLUMN phone TYPE VARCHAR(50)');

    console.log('Altering graduates table...');
    await client.query('ALTER TABLE graduates ALTER COLUMN degree_level TYPE VARCHAR(50)');

    await client.query('COMMIT');
    console.log('Migration completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    client.release();
    pool.end();
  }
}

runMigration();
