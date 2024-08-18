import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: 'db',
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: 5432, // standard PostgreSQL port
});


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error', err.stack);
  } else {
    console.log('Connected to the database:', res.rows[0]);
    console.log('POSTGRES_USER:', process.env.POSTGRES_USER);
    console.log('POSTGRES_DB:', process.env.POSTGRES_DB);
    console.log('POSTGRES_PASSWORD:', process.env.POSTGRES_PASSWORD);
  }
});

export default pool;
