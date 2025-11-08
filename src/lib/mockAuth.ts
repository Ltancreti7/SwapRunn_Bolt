// Mock auth service that simulates Supabase auth for local development
import { initializeLocalDb, localDbHelpers } from './localDb';

// Initialize the database when this module loads
try {
  initializeLocalDb();
} catch (error) {
  console.error('Failed to initialize local database:', error);
}

interface MockUser {
  id: string;
  email: string;
  created_at: string;
  raw_user_meta_data?: any;
}

interface MockSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: MockUser;
}

// Simple in-memory store for sessions
const sessions = new Map<string, MockSession>();
const users = new Map<string, MockUser>();

// Generate random IDs
function generateId() {
  return 'local-' + Math.random().toString(36).substr(2, 9);
}

export const mockAuth = {
  // Mock signUp
  async signUp(options: {
    email: string;
    password: string;
    options?: {
      data?: any;
      emailRedirectTo?: string;
    };
  }) {
    const userId = generateId();
    const user: MockUser = {
      id: userId,
      email: options.email,
      created_at: new Date().toISOString(),
      raw_user_meta_data: options.options?.data || {}
    };
    
    users.set(userId, user);
    
    // Create session immediately (no email confirmation in local mode)
    const session: MockSession = {
      access_token: 'mock-token-' + generateId(),
      refresh_token: 'mock-refresh-' + generateId(),
      expires_in: 3600,
      user
    };
    
    sessions.set(userId, session);
    localStorage.setItem('mock-session', JSON.stringify(session));
    
    try {
      // Create profile in local database
      const result = localDbHelpers.createUser({
        id: userId,
        email: options.email,
        user_type: options.options?.data?.user_type || 'driver',
        full_name: options.options?.data?.full_name
      });
      
      return { 
        data: { user, session }, 
        error: null 
      };
    } catch (error) {
      return {
        data: { user: null, session: null },
        error: { message: 'Failed to create user profile: ' + (error as Error).message }
      };
    }
  },

  // Mock signIn
  async signInWithPassword(credentials: { email: string; password: string }) {
    // Find user by email (in real app, would check password too)
    const user = Array.from(users.values()).find(u => u.email === credentials.email);
    
    if (!user) {
      return {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };
    }
    
    const session: MockSession = {
      access_token: 'mock-token-' + generateId(),
      refresh_token: 'mock-refresh-' + generateId(),
      expires_in: 3600,
      user
    };
    
    sessions.set(user.id, session);
    localStorage.setItem('mock-session', JSON.stringify(session));
    
    return { data: { user, session }, error: null };
  },

  // Mock getSession
  async getSession() {
    const storedSession = localStorage.getItem('mock-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        return { data: { session }, error: null };
      } catch {
        return { data: { session: null }, error: null };
      }
    }
    return { data: { session: null }, error: null };
  },

  // Mock signOut
  async signOut() {
    localStorage.removeItem('mock-session');
    return { error: null };
  },

  // Mock RPC calls
  rpc: (funcName: string, params?: any) => {
    if (funcName === 'get_user_profile') {
      const storedSession = localStorage.getItem('mock-session');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          const profile = localDbHelpers.getUserProfile(session.user.id);
          return Promise.resolve({ data: profile, error: null });
        } catch (error) {
          return Promise.resolve({ data: null, error: { message: 'Session not found' } });
        }
      }
      return Promise.resolve({ data: null, error: { message: 'Not authenticated' } });
    }
    
    return Promise.resolve({ data: null, error: { message: `RPC ${funcName} not implemented in local mode` } });
  }
};

// Mock database operations
export const mockDatabase = {
  from: (table: string) => ({
    update: (data: any) => ({
      eq: (column: string, value: any) => {
        try {
          if (table === 'dealers' || table === 'dealership_profiles') {
            localDbHelpers.updateDealer(value, data);
            return Promise.resolve({ data: null, error: null });
          }
          return Promise.resolve({ data: null, error: { message: `Table ${table} not implemented` } });
        } catch (error) {
          return Promise.resolve({ data: null, error: { message: (error as Error).message } });
        }
      }
    })
  })
};