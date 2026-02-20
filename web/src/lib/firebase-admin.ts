import admin from "firebase-admin";

function getFirebaseAdmin() {
  if (admin.apps.length > 0) {
    return admin.apps[0]!;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY env var is not set");
  }

  const serviceAccount = JSON.parse(serviceAccountKey);

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
) {
  const app = getFirebaseAdmin();
  const messaging = app.messaging();

  await messaging.send({
    token,
    notification: { title, body },
    data,
    webpush: {
      fcmOptions: {
        link: data?.url || "/dashboard/inbox",
      },
    },
  });
}
