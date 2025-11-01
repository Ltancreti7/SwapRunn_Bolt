// Mock driver data service
// Switch this to real API endpoints when ready

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
const USE_MOCK_DATA = true; // Set to false when real APIs are available

export interface DriverProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  rating?: number;
  phone: string;
  email: string;
  vehicle: {
    make: string;
    model: string;
    plate: string;
  };
  docs: Array<{
    type: string;
    status: "Valid" | "Expiring" | "Missing";
    expiresAt?: string;
  }>;
}

export interface TimecardData {
  todayHours: number;
  weekHours: number;
  clockedIn: boolean;
  lastClockInAt?: string;
}

export interface EarningsData {
  today: number;
  week: number;
  month: number;
}

export interface JobData {
  id: string;
  pickup: string;
  dropoff: string;
  distanceMi: number;
  pay: number;
  status: "Upcoming" | "Completed" | "Cancelled";
  startedAt?: string;
  completedAt?: string;
  assignmentId?: string;
  type?: string;
  customerName?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  date?: string;
  // Vehicle details
  vehicleMake?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vin?: string;
  // Job type details
  jobType?: "delivery" | "swap";
}

// Mock data
const mockDrivers: Record<string, DriverProfile> = {
  "123": {
    id: "123",
    name: "John Smith",
    avatarUrl: undefined,
    rating: 4.7,
    phone: "(555) 123-4567",
    email: "john.smith@email.com",
    vehicle: {
      make: "Toyota",
      model: "Camry",
      plate: "ABC-123",
    },
    docs: [
      { type: "Driver's License", status: "Valid", expiresAt: "2025-12-31" },
      { type: "Insurance", status: "Valid", expiresAt: "2024-06-15" },
      { type: "Registration", status: "Expiring", expiresAt: "2024-02-28" },
      { type: "Background Check", status: "Valid", expiresAt: "2025-03-15" },
    ],
  },
};

const mockTimecards: Record<string, TimecardData> = {
  "123": {
    todayHours: 6.5,
    weekHours: 32.5,
    clockedIn: false,
    lastClockInAt: "2024-01-15T08:30:00Z",
  },
};

const mockEarnings: Record<string, EarningsData> = {
  "123": {
    today: 0,
    week: 0,
    month: 0,
  },
};

const mockJobs: Record<string, JobData[]> = {
  "123": [
    {
      id: "JOB-001",
      pickup: "123 Main St, Springfield",
      dropoff: "456 Oak Ave, Springfield",
      distanceMi: 12.5,
      pay: 0,
      status: "Upcoming",
      startedAt: "2024-01-15T10:00:00Z",
      assignmentId: "ASSIGN-001",
      type: "delivery",
      customerName: "ABC Motors",
      pickupLocation: "123 Main St, Springfield",
      dropoffLocation: "456 Oak Ave, Springfield",
      date: "2024-01-15T10:00:00Z",
    },
    {
      id: "JOB-002",
      pickup: "789 Pine St, Springfield",
      dropoff: "321 Elm St, Springfield",
      distanceMi: 8.3,
      pay: 0,
      status: "Completed",
      startedAt: "2024-01-14T14:30:00Z",
      completedAt: "2024-01-14T16:15:00Z",
    },
    {
      id: "JOB-003",
      pickup: "555 Cedar Rd, Springfield",
      dropoff: "777 Maple Dr, Springfield",
      distanceMi: 15.2,
      pay: 0,
      status: "Completed",
      startedAt: "2024-01-13T09:00:00Z",
      completedAt: "2024-01-13T11:30:00Z",
    },
  ],
};

// Simulate API calls with delays
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getDriver = async (
  driverId: string,
): Promise<DriverProfile | null> => {
  if (USE_MOCK_DATA) {
    await delay(500);
    return mockDrivers[driverId] || null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/drivers/${driverId}`);
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error fetching driver:", error);
    return null;
  }
};

export const getTimecard = async (
  driverId: string,
  period = "week",
): Promise<TimecardData | null> => {
  if (USE_MOCK_DATA) {
    await delay(300);
    return mockTimecards[driverId] || null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/timecards?driverId=${driverId}&period=${period}`,
    );
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error fetching timecard:", error);
    return null;
  }
};

export const getEarnings = async (
  driverId: string,
  period = "week",
): Promise<EarningsData | null> => {
  if (USE_MOCK_DATA) {
    await delay(400);
    return mockEarnings[driverId] || null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/earnings?driverId=${driverId}&period=${period}`,
    );
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error fetching earnings:", error);
    return null;
  }
};

export const getJobs = async (
  driverId: string,
  limit = 20,
): Promise<JobData[]> => {
  if (USE_MOCK_DATA) {
    await delay(600);
    return mockJobs[driverId] || [];
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/jobs?driverId=${driverId}&limit=${limit}`,
    );
    return response.ok ? await response.json() : [];
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return [];
  }
};

export const clockInOut = async (
  driverId: string,
  clockIn: boolean,
): Promise<boolean> => {
  if (USE_MOCK_DATA) {
    await delay(800);
    // Update mock data
    if (mockTimecards[driverId]) {
      mockTimecards[driverId].clockedIn = clockIn;
      if (clockIn) {
        mockTimecards[driverId].lastClockInAt = new Date().toISOString();
      }
    }
    return true;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/timecards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        driverId,
        action: clockIn ? "clock_in" : "clock_out",
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error clocking in/out:", error);
    return false;
  }
};

export const findDriverByIdOrPhone = async (
  searchTerm: string,
): Promise<DriverProfile | null> => {
  if (USE_MOCK_DATA) {
    await delay(400);
    // Simple search in mock data
    const driver = Object.values(mockDrivers).find(
      (d) => d.id === searchTerm || d.phone === searchTerm,
    );
    return driver || null;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/drivers/search?q=${encodeURIComponent(searchTerm)}`,
    );
    return response.ok ? await response.json() : null;
  } catch (error) {
    console.error("Error searching driver:", error);
    return null;
  }
};
