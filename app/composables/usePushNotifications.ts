import {useRuntimeConfig} from "nuxt/app";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4-(base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
        .replace(/\_/g, "+")
        .replace(/_/g, "/")
    const rawData = atob(base64);
    return Uint8Array.from([...rawData].map((c)=> c.charCodeAt(0)));
}

export const usePushNotifications = () => {
    const config = useRuntimeConfig();

    const isSupported = computed(
        () =>
            typeof window !== "undefined" &&
            "Notifications" in window &&
            "serviceWorker" in navigator
    );

    const permission = ref<NotificationPermission>(
        isSupported.value? Notification.permission : "default"
    );

    if (isSupported.value) {
        navigator.permissions.query({ name: "notifications" }).then((status) => {
            // Sync initial value
            permission.value = Notification.permission;
            // Keep in sync if it changes
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

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(
                config.public.vapidPublicKey
            ),
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