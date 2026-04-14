require('dotenv').config();
const db = require('./src/config/database');

async function migrate() {
  try {
    console.log('Starting migration for invitation_batches...');
    
    // Add qty_per_person if missing
    await db.query(`
      ALTER TABLE invitation_batches 
      ADD COLUMN IF NOT EXISTS qty_per_person INT DEFAULT 1,
      ADD COLUMN IF NOT EXISTS total_count INT DEFAULT 0,
      ADD COLUMN IF NOT EXISTS processed_count INT DEFAULT 0
    `);
    
    // Also reset any failed batches to Pending for testing
    await db.query(`
      UPDATE invitation_batches 
      SET status = 'Pending', error_message = NULL 
      WHERE status = 'Failed'
    `);
    
    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
