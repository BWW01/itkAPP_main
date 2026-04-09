/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

self.addEventListener("push", (event) => {
    const data = event.data?.json() ?? {};

    event.waitUntil(
        self.registration.showNotification(data.title ?? "Notification", {
            body: data.body ?? "",
            icon: data.icon ?? "/icon-192.png",
            badge: data.badge ?? "/badge.png",
            data: data.url ? { url: data.url } : undefined,
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    if (event.notification.data?.url) {
        event.waitUntil(clients.openWindow(event.notification.data.url));
    }
});