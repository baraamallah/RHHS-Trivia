const firebaseConfig = {
  apiKey: "AIzaSyDsHNKK2bc5fUYPDuM7h6FqEPr2i-V0MBw",
  authDomain: "rhhs-trivia.firebaseapp.com",
  projectId: "rhhs-trivia",
  storageBucket: "rhhs-trivia.firebasestorage.app",
  messagingSenderId: "611829136820",
  appId: "1:611829136820:web:6e5a102c91d94e79c0c6e1",
  measurementId: "G-947L8C34KZ"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize services using compat syntax
const db = firebase.firestore();
const auth = firebase.auth();
const analytics = firebase.analytics();

// Make auth globally available
window.auth = auth;
