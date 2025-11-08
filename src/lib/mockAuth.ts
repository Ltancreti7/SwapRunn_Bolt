// Mock auth service that simulates Supabase auth for local development
// Local mock now uses in-memory + localStorage only (removed better-sqlite3 dependency)

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

// Simple in-memory store for sessions & users persisted to localStorage
const sessions = new Map<string, MockSession>();
const users = new Map<string, MockUser>();
const profiles = new Map<string, { user_id: string; user_type: string; dealer_id?: string | null; full_name?: string | null; phone?: string | null; email?: string | null }>();
const dealers = new Map<string, { id: string; user_id?: string | null; name?: string | null; email?: string | null; status?: string | null }>();

function persist() {
  try {
    localStorage.setItem('mock-users', JSON.stringify(Array.from(users.entries())));
    localStorage.setItem('mock-sessions', JSON.stringify(Array.from(sessions.entries())));
    localStorage.setItem('mock-profiles', JSON.stringify(Array.from(profiles.entries())));
    localStorage.setItem('mock-dealers', JSON.stringify(Array.from(dealers.entries())));
  } catch {}
}
function restore() {
  try {
    const u = localStorage.getItem('mock-users');
    const s = localStorage.getItem('mock-sessions');
    const p = localStorage.getItem('mock-profiles');
    const d = localStorage.getItem('mock-dealers');
    if (u) new Map<string, MockUser>(JSON.parse(u)).forEach((v,k)=>users.set(k,v));
    if (s) new Map<string, MockSession>(JSON.parse(s)).forEach((v,k)=>sessions.set(k,v));
    if (p) new Map<string, any>(JSON.parse(p)).forEach((v,k)=>profiles.set(k,v));
    if (d) new Map<string, any>(JSON.parse(d)).forEach((v,k)=>dealers.set(k,v));
  } catch {}
}
restore();

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
    
    const user_type = options.options?.data?.user_type || 'driver';
    let dealer_id: string | null = null;
    if (user_type === 'dealer') {
      dealer_id = 'dealer-' + generateId();
      dealers.set(dealer_id, { id: dealer_id, user_id: userId, email: options.email, name: options.options?.data?.full_name || options.email, status: 'active' });
    }
    profiles.set(userId, { user_id: userId, user_type, dealer_id, full_name: options.options?.data?.full_name || options.email, email: options.email });
    persist();
    return { data: { user, session }, error: null };
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
  persist();
    
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

  // Mock getUser (subset of supabase-js API)
  async getUser() {
    const storedSession = localStorage.getItem('mock-session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        return { data: { user: session.user }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    }
    return { data: { user: null }, error: null };
  },

  // Mock signOut
  async signOut() {
    localStorage.removeItem('mock-session');
    return { error: null };
  },

  // Mock onAuthStateChange – immediately invokes callback with current session
  onAuthStateChange(callback: (event: string, session: MockSession | null) => void) {
    let stored: MockSession | null = null;
    const raw = localStorage.getItem('mock-session');
    if (raw) {
      try { stored = JSON.parse(raw); } catch { stored = null; }
    }
    // Fire initial event asynchronously to mimic real client behavior
    setTimeout(() => {
      callback(stored ? 'SIGNED_IN' : 'SIGNED_OUT', stored);
    }, 0);
    return {
      data: {
        subscription: {
          unsubscribe() {
            // No-op for mock
          }
        }
      }
    } as any;
  },

  // Mock RPC calls
  rpc: (funcName: string, params?: any) => {
    if (funcName === 'get_user_profile') {
      const storedSession = localStorage.getItem('mock-session');
      if (storedSession) {
        try {
          const session = JSON.parse(storedSession);
          const profile = profiles.get(session.user.id) || null;
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

// Mock database operations with proper TypeScript interface
export const mockDatabase = {
  from: (table: string) => {
    const createMockQuery = () => ({
      select: (columns?: string) => createMockQuery(),
      insert: (data: any) => createMockQuery(),
      update: (data: any) => createMockQuery(),
      eq: (column: string, value: any) => createMockQuery(),
      neq: (column: string, value: any) => createMockQuery(),
      is: (column: string, value: any) => createMockQuery(),
      maybeSingle: () => {
        try {
          if (table === 'profiles') {
            // Try to get profile from localStorage session
            const session = localStorage.getItem('mock-session');
            if (session) {
              const sessionData = JSON.parse(session);
              const profile = profiles.get(sessionData.user.id) || null;
              return Promise.resolve({ data: profile, error: null });
            }
          }
          return Promise.resolve({ data: null, error: null });
        } catch (error) {
          return Promise.resolve({ data: null, error: { message: (error as Error).message } });
        }
      },
      single: () => createMockQuery().maybeSingle(),
      // For update operations that need eq()
      then: (resolve: any) => {
        try {
          console.log(`🔧 Local mode: Database operation on ${table}`);
          resolve({ data: null, error: null });
        } catch (error) {
          resolve({ data: null, error: { message: (error as Error).message } });
        }
      }
    });
    
    return createMockQuery();
  }
};

// Helper to create a mock client of the same shape as supabase-js
export function makeMockClient(): any {
  return {
    auth: mockAuth,
    from: mockDatabase.from,
    rpc: mockAuth.rpc,
    channel: (name: string) => {
      console.log(`🔧 Local mode: Subscribing to channel ${name} (no-op)`);
      const api = {
        on: (_event: any, _filter: any, _callback?: any) => api,
        subscribe: () => ({
          unsubscribe() { /* no-op */ }
        }),
      } as any;
      return api;
    },
    removeChannel: (_channel: any) => {
      // no-op
    },
    functions: {
      invoke: (funcName: string, options?: any) => {
        console.log(`🔧 Local mode: Skipping edge function ${funcName}`, options);
        return Promise.resolve({ data: null, error: null });
      }
    }
  } as any;
}