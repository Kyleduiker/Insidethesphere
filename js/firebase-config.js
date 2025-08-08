<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyAcHeHQdUmVwQls3RNGIJNNDjUGyAekgnM",
    authDomain: "inside-the-sphere.firebaseapp.com",
    projectId: "inside-the-sphere",
    storageBucket: "inside-the-sphere.firebasestorage.app",
    messagingSenderId: "318965201693",
    appId: "1:318965201693:web:fa695da06154008e6cfff4",
    measurementId: "G-H3Y4X2HEMB"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>
