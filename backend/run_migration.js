const fs = require('fs');
const path = require('path');
const { pool } = require('./src/config/database');
require('dotenv').config();

async function runMigration() {
    const migrationPath = path.join(__dirname, 'migrations', 'qr_system_update.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: qr_system_update.sql...');
    
    const client = await pool.connect();
    try {
        await client.query(sql);
        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
