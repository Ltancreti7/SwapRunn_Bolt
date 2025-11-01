// Service Worker for Push Notifications
const CACHE_NAME = "swaprunn-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installed");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activated");
  event.waitUntil(self.clients.claim());
});

// Push event
self.addEventListener("push", (event) => {
  console.log("Push notification received:", event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: data.data || {},
    actions: [
      {
        action: "view",
        title: "View",
      },
      {
        action: "dismiss",
        title: "Dismiss",
      },
    ],
    requireInteraction: true,
    vibrate: [200, 100, 200],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click:", event);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Handle notification click
  const data = event.notification.data;
  const url = data.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window if app not open
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    }),
  );
});

// Background sync (for offline functionality)
self.addEventListener("sync", (event) => {
  console.log("Background sync:", event.tag);

  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }

  if (event.tag === "sync-jobs") {
    event.waitUntil(syncJobs());
  }
});

async function syncMessages() {
  try {
    // Sync pending messages when back online
    const pending = await getFromIndexedDB("pendingMessages");
    for (const message of pending) {
      await fetch("/api/messages", {
        method: "POST",
        body: JSON.stringify(message),
      });
    }
    await clearFromIndexedDB("pendingMessages");
  } catch (error) {
    console.error("Message sync failed:", error);
  }
}

async function syncJobs() {
  try {
    // Sync job status updates when back online
    const pending = await getFromIndexedDB("pendingJobUpdates");
    for (const update of pending) {
      await fetch("/api/jobs/status", {
        method: "PUT",
        body: JSON.stringify(update),
      });
    }
    await clearFromIndexedDB("pendingJobUpdates");
  } catch (error) {
    console.error("Job sync failed:", error);
  }
}

// Helper functions for IndexedDB
async function getFromIndexedDB(storeName) {
  return new Promise((resolve) => {
    const request = indexedDB.open("SwapRunnDB", 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const getAll = store.getAll();
      getAll.onsuccess = () => resolve(getAll.result || []);
    };
    request.onerror = () => resolve([]);
  });
}

async function clearFromIndexedDB(storeName) {
  return new Promise((resolve) => {
    const request = indexedDB.open("SwapRunnDB", 1);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.clear();
      transaction.oncomplete = () => resolve();
    };
    request.onerror = () => resolve();
  });
}
