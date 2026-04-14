const db = require('./src/config/database');
require('dotenv').config();

async function run() {
  try {
    const res = await db.query(`
      SELECT tc.constraint_name, kcu.column_name 
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu 
        ON tc.constraint_name = kcu.constraint_name 
        AND tc.table_schema = kcu.table_schema
      WHERE tc.table_name = 'event_participants'
    `);
    console.log('Constraints:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
