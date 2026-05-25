import { promises as fs } from 'fs';
import path from 'path';
// @ts-expect-error - better-sqlite3 has incomplete ESM typings here
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

const getDbPath = () => {
  const dbDir = path.join(process.cwd(), '.data');
  return path.join(dbDir, 'kapad-mitra.db');
};

export const initializeDatabase = async () => {
  if (db) return db;
  
  try {
    // Ensure .data directory exists
    const dbDir = path.join(process.cwd(), '.data');
    await fs.mkdir(dbDir, { recursive: true });
    
    // Initialize SQLite database
    db = new Database(getDbPath());
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'lib', 'db-schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    
    // Split schema into individual statements and execute
    const statements = schema.split(';').filter(s => s.trim());
    for (const statement of statements) {
      try {
        db.exec(statement);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : '';
        // Ignore "already exists" errors
        if (!message.includes('already exists')) {
          console.error('Schema execution error:', error);
        }
      }
    }
    
    return db;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
};

// Query helpers
export const query = (sql: string, params: unknown[] = []) => {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.all(...params);
};

export const queryOne = (sql: string, params: unknown[] = []) => {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  return stmt.get(...params);
};

export const execute = (sql: string, params: unknown[] = []) => {
  const db = getDatabase();
  const stmt = db.prepare(sql);
  const result = stmt.run(...params);
  return result;
};

export const beginTransaction = () => {
  const db = getDatabase();
  return db.transaction(() => true);
};

// Seed database with initial data if needed
export const seedDatabase = () => {
  try {
    // Check if data already exists
    const result = queryOne('SELECT COUNT(*) as count FROM users') as { count?: number } | undefined;
    const userCount = result?.count ?? 0;
    
    if (userCount === 0) {
      console.log('Seeding database with initial data...');
      
      // This will be populated when users create accounts
      // Seeds are not needed for this app since it's multi-tenant
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};
