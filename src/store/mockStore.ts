// In-memory mock store for SwapRunn MVP

export interface Job {
  id: string;
  type: "Delivery" | "Swap";
  customerName: string;
  customerPhone: string;
  pickupAddress: string;
  deliveryAddress: string;
  status: "Posted" | "Accepted" | "In Progress" | "Completed";
  driverId?: string;
  driverName?: string;
  createdAt: Date;
  acceptedAt?: Date;
  clockedInAt?: Date;
  clockedOutAt?: Date;
  trackingToken: string;
  notes?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  currentJobId?: string;
  status: "Available" | "On Job" | "Clocked In";
}

class MockStore {
  private jobs: Job[] = [];
  private drivers: Driver[] = [
    {
      id: "driver1",
      name: "John Smith",
      phone: "(555) 123-4567",
      status: "Available",
    },
    {
      id: "driver2",
      name: "Sarah Johnson",
      phone: "(555) 987-6543",
      status: "Available",
    },
    {
      id: "driver3",
      name: "Mike Wilson",
      phone: "(555) 456-7890",
      status: "Available",
    },
  ];

  // Job Management
  createJob(
    jobData: Omit<Job, "id" | "createdAt" | "trackingToken" | "status">,
  ): Job {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      trackingToken: Math.random().toString(36).substr(2, 12).toUpperCase(),
      status: "Posted",
      createdAt: new Date(),
      ...jobData,
    };
    this.jobs.push(job);
    return job;
  }

  getJobs(): Job[] {
    return [...this.jobs].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  getJob(id: string): Job | undefined {
    return this.jobs.find((job) => job.id === id);
  }

  getJobByTrackingToken(token: string): Job | undefined {
    return this.jobs.find((job) => job.trackingToken === token);
  }

  updateJobStatus(
    jobId: string,
    status: Job["status"],
    updates?: Partial<Job>,
  ): Job | null {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job) return null;

    job.status = status;
    if (updates) {
      Object.assign(job, updates);
    }

    return job;
  }

  acceptJob(jobId: string, driverId: string): Job | null {
    const job = this.jobs.find((j) => j.id === jobId);
    const driver = this.drivers.find((d) => d.id === driverId);

    if (!job || !driver || job.status !== "Posted") return null;

    job.status = "Accepted";
    job.driverId = driverId;
    job.driverName = driver.name;
    job.acceptedAt = new Date();

    driver.currentJobId = jobId;
    driver.status = "On Job";

    return job;
  }

  clockIn(jobId: string): Job | null {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || job.status !== "Accepted") return null;

    job.status = "In Progress";
    job.clockedInAt = new Date();

    const driver = this.drivers.find((d) => d.id === job.driverId);
    if (driver) {
      driver.status = "Clocked In";
    }

    return job;
  }

  clockOut(jobId: string): Job | null {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || job.status !== "In Progress") return null;

    job.status = "Completed";
    job.clockedOutAt = new Date();

    const driver = this.drivers.find((d) => d.id === job.driverId);
    if (driver) {
      driver.status = "Available";
      driver.currentJobId = undefined;
    }

    return job;
  }

  // Driver Management
  getDrivers(): Driver[] {
    return [...this.drivers];
  }

  getDriver(id: string): Driver | undefined {
    return this.drivers.find((driver) => driver.id === id);
  }

  // History
  getCompletedJobs(): Job[] {
    return this.jobs
      .filter((job) => job.status === "Completed")
      .sort(
        (a, b) =>
          (b.clockedOutAt?.getTime() || 0) - (a.clockedOutAt?.getTime() || 0),
      );
  }
}

export const mockStore = new MockStore();

// Add some sample data
mockStore.createJob({
  type: "Delivery",
  customerName: "Alice Cooper",
  customerPhone: "(555) 111-2233",
  pickupAddress: "123 Main St, Downtown",
  deliveryAddress: "456 Oak Ave, Uptown",
  notes: "Ring doorbell twice",
});

mockStore.createJob({
  type: "Swap",
  customerName: "Bob Martinez",
  customerPhone: "(555) 444-5566",
  pickupAddress: "789 Pine Rd, Westside",
  deliveryAddress: "321 Elm St, Eastside",
  notes: "Customer will be waiting outside",
});
