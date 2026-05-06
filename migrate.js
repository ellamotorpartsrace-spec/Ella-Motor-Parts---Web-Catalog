import { pool } from './server/config/db.js';

async function migrate() {
  try {
    console.log('Adding role column to users table...');
    await pool.query("ALTER TABLE users ADD COLUMN role ENUM('customer', 'admin') DEFAULT 'customer';");
    console.log('Role column added successfully.');
    
    console.log('Setting first user as admin...');
    await pool.query("UPDATE users SET role = 'admin' WHERE id = 1;");
    console.log('Migration complete.');
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('Role column already exists.');
    } else {
      console.error('Migration failed:', error);
    }
    process.exit(0);
  }
}

migrate();
