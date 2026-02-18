importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: "AIzaSyCdRkP_Rqo80fUnFirrMfTfcfgHeCIBuCc",
    authDomain: "restaurantsos2026.firebaseapp.com",
    projectId: "restaurantsos2026",
    storageBucket: "restaurantsos2026.firebasestorage.app",
    messagingSenderId: "397951040375",
    appId: "1:397951040375:web:bf4d1f37eb3e3762aa7f72",
    measurementId: "G-09BVEBHZM3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    if (payload.notification) {
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon-192x192.png', // Fallback icon
            badge: '/badge-72x72.png',
            data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});
