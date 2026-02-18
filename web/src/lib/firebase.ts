import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const initMessaging = async () => {
    try {
        if (typeof window !== 'undefined' && await isSupported()) {
            return getMessaging(app);
        }
    } catch (err) {
        console.error("Firebase Messaging not supported", err);
    }
    return null;
};

export const initAnalytics = async () => {
    try {
        if (typeof window !== 'undefined' && await isAnalyticsSupported()) {
            return getAnalytics(app);
        }
    } catch (err) {
        console.error("Firebase Analytics not supported", err);
    }
    return null;
};

import { getStorage } from "firebase/storage";

export const storage = getStorage(app);

export { app, getToken, onMessage };
