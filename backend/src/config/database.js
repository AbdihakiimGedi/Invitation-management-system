const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const connectionOptions = connectionString
  ? { connectionString }
  : {
      host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
      user: process.env.DB_USER || process.env.PGUSER || 'postgres',
      password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
      database:
        process.env.DB_NAME ||
        process.env.PGDATABASE ||
        process.env.POSTGRES_DB ||
        'Digital Invitation & Attendance Management',
    };

const pool = new Pool(connectionOptions);

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  pool, // Exporting pool directly for transaction support (e.g. pool.connect())
  query: (text, params) => pool.query(text, params),
};
