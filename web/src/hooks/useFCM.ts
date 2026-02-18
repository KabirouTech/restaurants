"use client";

import { useEffect, useState } from "react";
import { initMessaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { toast } from "sonner";

export function useFCM() {
    const [token, setToken] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "default">("default");

    useEffect(() => {
        const setupMessaging = async () => {
            try {
                const messaging = await initMessaging();
                if (!messaging) return;

                // Handle incoming messages when app is in foreground
                onMessage(messaging, (payload) => {
                    console.log("[FCM] Foreground message received:", payload);
                    toast(payload.notification?.title || "Notification", {
                        description: payload.notification?.body,
                        action: payload.data?.url ? {
                            label: "Voir",
                            onClick: () => window.location.href = payload.data!.url
                        } : undefined,
                    });
                });

            } catch (error) {
                console.error("[FCM] Error initializing messaging:", error);
            }
        };

        setupMessaging();
    }, []);

    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);

            if (permission === "granted") {
                const messaging = await initMessaging();
                if (!messaging) return;

                // Get FCM Token
                // IMPORTANT: You need to generate a VAPID key in Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
                // Add it to .env.local as NEXT_PUBLIC_FIREBASE_VAPID_KEY
                const currentToken = await getToken(messaging, {
                    vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
                });

                if (currentToken) {
                    console.log("[FCM] Token generated:", currentToken);
                    setToken(currentToken);
                    // TODO: Send this token to your backend to associate with the user
                } else {
                    console.log("[FCM] No registration token available. Request permission to generate one.");
                }
            }
        } catch (error) {
            console.error("[FCM] Error requesting permission:", error);
        }
    };

    return { token, requestPermission, permissionStatus };
}
