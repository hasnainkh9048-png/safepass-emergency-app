// firebase-config.js
// SafePass - Firebase Configuration

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAYbeoWssWBGmiZW260J27jxqWVoNmZoPE",
  authDomain: "safepass-emegency-app.firebaseapp.com",
  projectId: "safepass-emegency-app",
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

// Enable offline persistence
db.enablePersistence()
  .then(() => {
    console.log("✅ SafePass: Offline mode enabled");
  })
  .catch((err) => {
    if (err.code == 'failed-precondition') {
      console.log("Multiple tabs open - persistence limited");
    } else if (err.code == 'unimplemented') {
      console.log("Browser doesn't support persistence");
    }
  });

// Make available globally
window.auth = auth;
window.db = db;