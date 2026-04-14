require('dotenv').config();
const db = require('./src/config/database');

async function checkScansSchema() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invitation_scans'
    `);
    if (res.rows.length === 0) {
      console.log('TABLE invitation_scans DOES NOT EXIST');
    } else {
      console.log('Columns in invitation_scans:');
      res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkScansSchema();
