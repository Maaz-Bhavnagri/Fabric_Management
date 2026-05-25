// Simple persistent database for development
// Uses JSON file storage to persist data across server restarts

import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

export interface User {
  id: string;
  email: string;
  fullName: string;
  password: string;
  createdAt: Date;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: Date;
}

// File-based storage
const DB_FILE = join(process.cwd(), '.data', 'db.json');

// Initialize database file if it doesn't exist
const initDb = () => {
  if (!existsSync(DB_FILE)) {
    const initialData = {
      users: [],
      profiles: []
    };
    writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2));
  }
};

// Read data from file
const readDb = () => {
  initDb();
  try {
    const data = readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return { users: [], profiles: [] };
  }
};

// Write data to file
const writeDb = (data: unknown) => {
  try {
    writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (error: unknown) {
    console.error('Failed to write to database file:', error);
  }
};

export const simpleDb = {
  // User operations
  createUser: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const db = readDb();
    const user: User = {
      id: Math.random().toString(36).substring(7),
      ...userData,
      createdAt: new Date()
    };
    db.users.push(user);
    
    // Create corresponding profile
    const profile: Profile = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: 'owner',
      createdAt: new Date()
    };
    db.profiles.push(profile);
    
    writeDb(db);
    return user;
  },
  
  getUserByEmail: async (email: string): Promise<User | null> => {
    const db = readDb();
    return db.users.find((user: User) => user.email === email) || null;
  },
  
  getUserById: async (id: string): Promise<User | null> => {
    const db = readDb();
    return db.users.find((user: User) => user.id === id) || null;
  },
  
  // Profile operations
  getProfileById: async (id: string): Promise<Profile | null> => {
    const db = readDb();
    return db.profiles.find((profile: Profile) => profile.id === id) || null;
  },
  
  getProfileCount: async (): Promise<number> => {
    const db = readDb();
    return db.profiles.length;
  },
  
  // Health check
  healthCheck: async () => {
    const db = readDb();
    return {
      database: 'connected',
      profiles: db.profiles.length,
      fabricDesigns: 0,
      needsInit: true
    };
  }
};
