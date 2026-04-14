const db = require('./src/config/database');
require('dotenv').config();

async function run() {
  try {
    const res = await db.query(`
      SELECT 
        conname, 
        substring(pg_get_constraintdef(oid) from 'UNIQUE \((.*)\)') as cols
      FROM pg_constraint 
      WHERE conrelid = 'event_participants'::regclass
    `);
    console.log('Constraints:', res.rows);

    const data = await db.query(`
      SELECT event_id, user_id, guest_ref_id 
      FROM event_participants 
      WHERE guest_ref_id IS NULL
      LIMIT 5
    `);
    console.log('Rows with NULL guest_ref_id:', data.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

run();
