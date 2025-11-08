// Local storage-based database (no native dependencies)
// This replaces SQLite for easier codespace compatibility

interface Profile {
  user_id: string;
  user_type: string;
  dealer_id?: string;
  full_name?: string;
  phone?: string;
  email?: string;
  created_at?: string;
  updated_at?: string;
}

interface DealerProfile {
  id: string;
  user_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  website?: string;
  position?: string;
  store?: string;
  dealership_code?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

// Simple localStorage-based storage
const STORAGE_KEYS = {
  profiles: 'local-dev-profiles',
  dealers: 'local-dev-dealers'
};

function generateId(): string {
  return 'local-' + Math.random().toString(36).substr(2, 16);
}

function saveToStorage<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromStorage<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Initialize storage
export function initializeLocalDb() {
  // Just ensure storage keys exist
  if (!localStorage.getItem(STORAGE_KEYS.profiles)) {
    saveToStorage(STORAGE_KEYS.profiles, []);
  }
  if (!localStorage.getItem(STORAGE_KEYS.dealers)) {
    saveToStorage(STORAGE_KEYS.dealers, []);
  }
  console.log('✅ Local storage database initialized');
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
      dealerId = generateId();
      const dealers = loadFromStorage<DealerProfile>(STORAGE_KEYS.dealers);
      const newDealer: DealerProfile = {
        id: dealerId,
        user_id: userData.id,
        email: userData.email,
        name: userData.full_name || userData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      dealers.push(newDealer);
      saveToStorage(STORAGE_KEYS.dealers, dealers);
    }
    
    // Create profile
    const profiles = loadFromStorage<Profile>(STORAGE_KEYS.profiles);
    const newProfile: Profile = {
      user_id: userData.id,
      user_type: userData.user_type,
      dealer_id: dealerId,
      full_name: userData.full_name,
      email: userData.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    profiles.push(newProfile);
    saveToStorage(STORAGE_KEYS.profiles, profiles);
    
    return { user: { id: userData.id, email: userData.email }, dealerId };
  },

  getUserProfile: (userId: string): Profile | null => {
    const profiles = loadFromStorage<Profile>(STORAGE_KEYS.profiles);
    return profiles.find(p => p.user_id === userId) || null;
  },

  updateDealer: (dealerId: string, data: Partial<DealerProfile>): void => {
    const dealers = loadFromStorage<DealerProfile>(STORAGE_KEYS.dealers);
    const index = dealers.findIndex(d => d.id === dealerId);
    if (index !== -1) {
      dealers[index] = { 
        ...dealers[index], 
        ...data, 
        updated_at: new Date().toISOString() 
      };
      saveToStorage(STORAGE_KEYS.dealers, dealers);
    }
  }
};