require('dotenv').config();
const db = require('./src/config/database');

async function reset() {
  try {
    const res = await db.query(
      "UPDATE invitation_batches SET status = 'Pending', error_message = NULL WHERE status IN ('Completed', 'Failed')"
    );
    console.log('Reset', res.rowCount, 'batches to Pending.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

reset();
