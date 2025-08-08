// Firebase Configuration for Inside the Sphere
const firebaseConfig = {
  apiKey: "AIzaSyAcHeHQdUmVwQ1s3RNGIJNNDjUGyAekgnM",
  authDomain: "inside-the-sphere.firebaseapp.com",
  projectId: "inside-the-sphere",
  storageBucket: "inside-the-sphere.firebasestorage.app",
  messagingSenderId: "318965201693",
  appId: "1:318965201693:web:fa695da06154008e6cfff4",
  measurementId: "G-H3Y4X2HEMB"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Create shortcuts for easy use
const auth = firebase.auth();
const db = firebase.firestore();
