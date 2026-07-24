const firebaseConfig = {
  apiKey: "AIzaSyAcHeHQdUmVwQls3RNGIJNNDjUGyAekgnM",
  authDomain: "inside-the-sphere.firebaseapp.com",
  projectId: "inside-the-sphere",
  storageBucket: "inside-the-sphere.firebasestorage.app",
  messagingSenderId: "318965201693",
  appId: "1:318965201693:web:fa695da06154008e6cfff4",
  measurementId: "G-H3Y4X2HEMB"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
