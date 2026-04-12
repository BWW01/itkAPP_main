import {useRuntimeConfig} from "nuxt/app";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, "+")  // ✅ dash to plus
        .replace(/_/g, "/")  // ✅ underscore to slash
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export const usePushNotifications = () => {
    const config = useRuntimeConfig();

    const isSupported = computed(
        () =>
            import.meta.client &&
            typeof window !== "undefined" &&
            "Notification" in window &&
            "serviceWorker" in navigator &&
            "PushManager" in window
    );

    const permission = ref<NotificationPermission>("default");

    if (import.meta.client && "Notification" in window) {
        permission.value = Notification.permission;

        navigator.permissions.query({ name: "notifications" }).then((status) => {
            permission.value = Notification.permission;
            status.onchange = () => {
                permission.value = Notification.permission;
            };
        });
    }


    const requestPermission = async (): Promise<boolean> => {
        if(!isSupported.value){return false;}
        permission.value = await Notification.requestPermission();
        return permission.value == "granted";
    }

    const subscribe = async (): Promise<PushSubscription | null> => {
        console.log("permission.value:", permission.value);
        console.log("Notification.permission:", Notification.permission);
        console.log("serviceWorker ready?", "serviceWorker" in navigator);

        if (permission.value !== "granted") {
            const granted = await requestPermission();
            console.log("requestPermission result:", granted);
            if (!granted) { return null; }
        }

        const registration = await navigator.serviceWorker.ready;
        console.log("registration:", registration);

        const existing = await registration.pushManager.getSubscription();
        console.log("existing subscription:", existing);

        console.log("vapidPublicKey raw:", config.public.vapidPublicKey);
        const key = urlBase64ToUint8Array(config.public.vapidPublicKey);
        console.log("converted key length:", key.length); // must be 65
        console.log("converted key:", key);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                config.public.vapidPublicKey
            ),
        }).catch((err) => {
            console.error("pushManager.subscribe error:", err.name, err.message);
            throw err;
        });
        console.log("new subscription:", subscription);

        await $fetch("/api/push/subscribe", {
            method: "POST",
            body: subscription.toJSON(),
        });
        return subscription;
    };

    const unsubscribe = async (): Promise<void> => {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if(subscription){
            await subscription.unsubscribe();
            await $fetch("/api/push/unsubscribe", {
                method: "POST",
                body: {endpoint: subscription.endpoint },
            });
            permission.value = "default";
        }
    };
    return {isSupported, permission, requestPermission, subscribe, unsubscribe};
}