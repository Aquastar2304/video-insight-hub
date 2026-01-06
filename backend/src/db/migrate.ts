import { readFileSync } from 'fs';
import { join } from 'path';
import { query, pool } from '../config/database';

const schemaPath = join(__dirname, 'schema.sql');

export const runMigrations = async () => {
  try {
    console.log('🔄 Running database migrations...');
    
    const schema = readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolons and execute each statement
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await query(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && 
              !error.message.includes('duplicate')) {
            console.error('Migration error:', error.message);
            throw error;
          }
        }
      }
    }

    console.log('✅ Database migrations completed');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run migrations if called directly
if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

