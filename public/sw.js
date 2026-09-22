/* Crisis V2 service worker — privacy-safe generic notification bodies only. */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let title = "Shepherds Oud Care";
  let body = "You have a checklist reminder. Open your dashboard for details.";

  try {
    if (event.data) {
      const payload = event.data.json();
      if (typeof payload.title === "string") title = payload.title;
      if (typeof payload.body === "string") body = payload.body;
    }
  } catch {
    // Keep generic defaults — never invent patient details.
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: "/icon",
      data: { url: "/dashboard" }
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(self.clients.openWindow(url));
});
