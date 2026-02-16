// firebase-config.js - SafePass Emergency App

// Your Firebase configuration (from Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyAYbeoWssWBGmiZW260J27jxqWVoNmZoPE",
  authDomain: "safepass-emergency-app.firebaseapp.com",  // Fixed: added 'r'
  projectId: "safepass-emegency-app",                    // This can stay as is
  storageBucket: "safepass-emegency-app.firebasestorage.app",
  messagingSenderId: "117433604348",
  appId: "1:117433604348:web:c779bce54854512861df79",
  measurementId: "G-69TZ5BY1XN"
};

// Initialize Firebase only once
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();

// Enable offline persistence (so app works without internet)
db.enablePersistence()
  .then(() => {
    console.log("✅ SafePass: Offline mode enabled - App works without internet!");
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log("⚠️ Multiple tabs open - offline mode limited");
    } else if (err.code == 'unimplemented') {
      console.log("⚠️ Browser doesn't support offline mode");
    }
  });

// Make services available globally
window.auth = auth;
window.db = db;