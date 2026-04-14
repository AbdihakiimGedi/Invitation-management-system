require('dotenv').config();
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

/**
 * DATABASE CONFIGURATION
 * Loads credentials from the existing .env file
 */
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

/**
 * HELPER: Check if a string is already a bcrypt hash
 * Bcrypt hashes typically start with $2a$, $2b$, or $2y$
 */
const isAlreadyHashed = (password) => {
  return typeof password === 'string' && password.startsWith('$2');
};

/**
 * MAIN MIGRATION LOGIC
 */
async function migratePasswords() {
  let processedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    console.log('[LOG] Connecting to PostgreSQL database...');
    await client.connect();
    console.log('[LOG] Connected successfully.');

    // 1. Retrieve all users
    const res = await client.query('SELECT id, username, password_hash FROM users');
    const users = res.rows;
    processedCount = users.length;

    console.log(`[LOG] Found ${processedCount} users. Starting migration...`);

    for (const user of users) {
      try {
        const { id, username, password_hash } = user;

        // 2. Check if password is NOT hashed
        if (!isAlreadyHashed(password_hash)) {
          // 3. Hash the plain text password
          const saltRounds = 10;
          const newHash = await bcrypt.hash(password_hash, saltRounds);

          // 4. Update the database
          await client.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [newHash, id]
          );

          console.log(`[SUCCESS] Hashed password for user: ${username}`);
          updatedCount++;
        } else {
          // 5. Skip already hashed passwords
          console.log(`[SKIP] User ${username} already has a hashed password.`);
          skippedCount++;
        }
      } catch (userErr) {
        console.error(`[ERROR] Failed to process user ${user.username}:`, userErr.message);
        errorCount++;
      }
    }

    console.log('\n--- MIGRATION SUMMARY ---');
    console.log(`Total Users Processed: ${processedCount}`);
    console.log(`Successfully Updated: ${updatedCount}`);
    console.log(`Skipped (Already Hashed): ${skippedCount}`);
    console.log(`Errors Encountered: ${errorCount}`);
    console.log('--------------------------\n');

  } catch (err) {
    console.error('[FATAL ERROR] Migration failed:', err.message);
  } finally {
    // 6. Close the connection
    await client.end();
    console.log('[LOG] Database connection closed.');
  }
}

// Execute the migration
migratePasswords();
