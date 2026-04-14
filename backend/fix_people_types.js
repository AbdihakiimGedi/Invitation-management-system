require('dotenv').config();
const db = require('./src/config/database');

async function fix() {
  const update = await db.query(
    "UPDATE people_types SET table_name = 'students' WHERE type_name = 'Graduates'"
  );
  console.log('Fixed:', update.rowCount, 'row(s) updated');

  const current = await db.query('SELECT type_name, table_name FROM people_types ORDER BY type_name');
  console.log('\nCurrent people_types:');
  current.rows.forEach(r => console.log(' -', r.type_name, '->', r.table_name));

  process.exit(0);
}
fix().catch(e => { console.error('Error:', e.message); process.exit(1); });
