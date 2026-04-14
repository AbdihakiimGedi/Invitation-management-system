require('dotenv').config();
const db = require('./src/config/database');

async function check() {
  const result = await db.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name='event_participants'"
  );
  console.log('Columns in event_participants:');
  console.log(result.rows.map(r => r.column_name));
  process.exit(0);
}
check().catch(e => { console.error(e.message); process.exit(1); });
