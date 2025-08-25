import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "boolion.firebaseapp.com",
  projectId: "boolion",
  storageBucket: "boolion.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestFirebaseNotificationPermission = async () => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: 'YOUR_WEB_PUSH_CERTIFICATE_KEY_PAIR',
    });
    if (currentToken) {
      console.log('Firebase token:', currentToken);
      return currentToken;
    }
    console.log('No registration token available.');
  } catch (err) {
    console.error('An error occurred while retrieving token.', err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

