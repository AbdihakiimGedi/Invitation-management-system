require('dotenv').config();
const db = require('./src/config/database');

async function checkBatches() {
  try {
    const res = await db.query('SELECT id, status, processed_count, total_count, error_message FROM invitation_batches ORDER BY created_at DESC LIMIT 5');
    console.log('Batch Status:');
    res.rows.forEach(row => {
      console.log(`- ID: ${row.id}, Status: ${row.status}, Progress: ${row.processed_count}/${row.total_count}, Error: ${row.error_message || 'None'}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkBatches();
