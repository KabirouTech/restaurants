export async function GET() {
  const firebaseConfig = JSON.stringify({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  });

  const sw = `
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

firebase.initializeApp(${firebaseConfig});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    if (payload.notification) {
        const notificationTitle = payload.notification.title;
        const notificationOptions = {
            body: payload.notification.body,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: payload.data
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    }
});
`.trimStart();

  return new Response(sw, {
    headers: {
      "Content-Type": "application/javascript",
      "Service-Worker-Allowed": "/",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
