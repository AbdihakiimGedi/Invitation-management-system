const db = require('./src/config/database');

async function run() {
  const r = await db.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
  );
  console.log('Tables in database:');
  r.rows.forEach(row => console.log(' -', row.table_name));

  const pt = await db.query("SELECT * FROM people_types");
  console.log('\nPeople Types:');
  pt.rows.forEach(row => console.log(' -', row.type_name, '->', row.table_name));

  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
