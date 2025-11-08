import Database from 'better-sqlite3';
import path from 'path';

// Create local SQLite database
const dbPath = path.join(process.cwd(), 'local-dev.db');
export const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
export function initializeLocalDb() {
  // Create profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      user_type TEXT NOT NULL CHECK (user_type IN ('dealer', 'driver', 'staff', 'admin', 'swap_coordinator')),
      dealer_id TEXT,
      full_name TEXT,
      phone TEXT,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create dealership_profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS dealership_profiles (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT,
      name TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      street TEXT,
      city TEXT,
      state TEXT,
      zip TEXT,
      website TEXT,
      position TEXT,
      store TEXT,
      dealership_code TEXT UNIQUE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES profiles(user_id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Local database initialized');
}

// Helper functions
export const localDbHelpers = {
  createUser: (userData: {
    id: string;
    email: string;
    user_type: string;
    full_name?: string;
  }) => {
    let dealerId = null;
    
    // If dealer, create dealership record first
    if (userData.user_type === 'dealer') {
      const insertDealer = db.prepare(`
        INSERT INTO dealership_profiles (user_id, email, name)
        VALUES (?, ?, ?)
        RETURNING id
      `);
      const dealerResult = insertDealer.get(userData.id, userData.email, userData.full_name || userData.email);
      dealerId = (dealerResult as any)?.id;
    }
    
    // Create profile
    const insertProfile = db.prepare(`
      INSERT INTO profiles (user_id, user_type, dealer_id, full_name, email)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertProfile.run(userData.id, userData.user_type, dealerId, userData.full_name, userData.email);
    
    return { user: { id: userData.id, email: userData.email }, dealerId };
  },

  getUserProfile: (userId: string) => {
    const stmt = db.prepare(`
      SELECT user_id, user_type, dealer_id, full_name, phone, email
      FROM profiles
      WHERE user_id = ?
    `);
    return stmt.get(userId);
  },

  updateDealer: (dealerId: string, data: any) => {
    const fields = Object.keys(data).map(key => `${key} = ?`).join(', ');
    const values = Object.values(data);
    const stmt = db.prepare(`
      UPDATE dealership_profiles 
      SET ${fields}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(...values, dealerId);
  }
};