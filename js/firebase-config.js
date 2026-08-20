const firebaseConfig = {
  apiKey: "AIzaSyAcHeHQdUmVwQls3RNGIJNNDjUGyAekgnM",
  authDomain: "inside-the-sphere.firebaseapp.com",
  projectId: "inside-the-sphere",
  storageBucket: "inside-the-sphere.firebasestorage.app",
  messagingSenderId: "318965201693",
  appId: "1:318965201693:web:fa695da06154008e6cfff4",
  measurementId: "G-H3Y4X2HEMB"
};

// A missing compat SDK used to throw right here at load time, which aborted the
// rest of this file — so one absent <script> tag silently took out every service
// declared after it. Each service is now probed on its own and says so loudly.
function initFirebaseService(name, scriptFile) {
  if (typeof firebase === 'undefined') {
    console.error(
      'firebase-config: Firebase SDK not loaded on ' + window.location.pathname +
      '. Add firebase-app-compat.js before firebase-config.js.'
    );
    return null;
  }
  if (typeof firebase[name] !== 'function') {
    console.error(
      'firebase-config: ' + name + ' SDK not loaded on ' + window.location.pathname +
      '. Add ' + scriptFile + ' before firebase-config.js.'
    );
    return null;
  }
  try {
    return firebase[name]();
  } catch (err) {
    console.error(
      'firebase-config: ' + name + '() threw on ' + window.location.pathname + ' —', err
    );
    return null;
  }
}

if (typeof firebase === 'undefined') {
  console.error(
    'firebase-config: Firebase SDK not loaded on ' + window.location.pathname +
    '. Add firebase-app-compat.js before firebase-config.js.'
  );
} else if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Same names as before, so no calling page changes.
const auth    = initFirebaseService('auth',      'firebase-auth-compat.js');
const db      = initFirebaseService('firestore', 'firebase-firestore-compat.js');
const storage = initFirebaseService('storage',   'firebase-storage-compat.js');
