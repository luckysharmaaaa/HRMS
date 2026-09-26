import { getToken, getMessaging, isSupported } from "firebase/messaging";
import { app } from "./firebase";

export const generateFCMToken = async () => {
  try {
    // 1. Check if FCM is supported in this browser
    const supported = await isSupported();
    if (!supported) {
      console.warn("⚠️ FCM is not supported in this browser.");
      return null;
    }

    // 2. Request notification permission
    const permission = await Notification.requestPermission();
    console.log("Notification permission:", permission);

    if (permission !== "granted") {
      console.warn("⚠️ Notification permission denied by user.");
      return null;
    }

    // 3. Validate VAPID key
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    console.log("VAPID Key loaded:", vapidKey ? "✅ Present" : "❌ MISSING");

    if (!vapidKey) {
      console.error(
        "❌ VITE_FIREBASE_VAPID_KEY is missing in .env! Cannot generate FCM token.",
      );
      return null;
    }

    // 4. Get messaging instance fresh (avoids null timing issue)
    const messaging = getMessaging(app);

    // 5. Generate token
    const token = await getToken(messaging, { vapidKey });

    if (token) {
      console.log("✅ FCM Token generated:", token);
    } else {
      console.warn(
        "⚠️ FCM Token is empty — check service worker registration and VAPID key.",
      );
    }

    return token || null;
  } catch (error) {
    console.error("FCM Error:", error.code, error.message, error);
    return null;
  }
};
