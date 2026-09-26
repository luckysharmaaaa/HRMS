importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCRq600SDHxKbvpKsOi_dxdz-mDO1cakSM",
  authDomain: "standupmanager-9e879.firebaseapp.com",
  projectId: "standupmanager-9e879",
  storageBucket: "standupmanager-9e879.firebasestorage.app",
  messagingSenderId: "267593649005",
  appId: "1:267593649005:web:f93dd44b4c09f02e05a864",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("Background Message:", payload);
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, { body, icon });
});
