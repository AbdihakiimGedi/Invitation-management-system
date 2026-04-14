require('dotenv').config();
const db = require('./src/config/database');

async function checkInvitationsSchema() {
  try {
    const res = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'invitations'
    `);
    console.log('Columns in invitations:');
    res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkInvitationsSchema();
