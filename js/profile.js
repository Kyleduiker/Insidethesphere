/**
 * Inside The Sphere — Shared Profile Loader
 * Include this file on any page to access the agent's profile.
 *
 * Usage:
 *   <script src="/js/profile.js"></script>
 *
 * Then use:
 *   sphereProfile.firstName
 *   sphereProfile.headshot
 *   sphereProfile.phone
 *   sphereProfile.accentColor
 *   sphereProfile.reviews
 *   etc.
 *
 * Or listen for when it's ready:
 *   document.addEventListener('sphereProfileReady', (e) => {
 *     const profile = e.detail;
 *     // use profile data
 *   });
 */

window.sphereProfile = {
  // Identity
  firstName: '',
  lastName: '',
  fullName: '',
  title: '',
  brokerage: '',
  phone: '',
  email: '',
  city: '',
  tagline: '',
  calendlyUrl: '',
  licensedSince: '',

  // Photos
  headshot: '',
  logo: '',
  teamPhoto: '',

  // Bio
  shortBio: '',
  fullBio: '',
  promise1: '',
  promise2: '',
  promise3: '',
  promise4: '',

  // Stats
  homesSold: '',
  listToSaleRatio: '',
  brokerYear: '',
  yearsActive: '',

  // Reviews
  reviews: [],

  // Branding
  accentColor: '#EA002A',
  goldColor: '#C9A84C',

  // Shelter Foundation
  shelterText: '',

  // Account
  plan: 'free',
  profileComplete: false,

  // Internal
  _loaded: false,
  _uid: null
};

/**
 * Load the profile for the currently authenticated user.
 * Called automatically when Firebase Auth is ready.
 */
function _loadSphereProfile(user) {
  if (!user) return;
  window.sphereProfile._uid = user.uid;

  const db = window.db || (firebase.apps.length ? firebase.firestore() : null);
  if (!db) {
    console.warn('sphere/profile.js: Firestore not available');
    return;
  }

  db.collection('users').doc(user.uid).get()
    .then(doc => {
      if (!doc.exists) return;

      const data = doc.data();
      const p = data.agentProfile || {};
      const urls = p.photoUrls || {};

      // Merge into sphereProfile
      Object.assign(window.sphereProfile, {
        // Identity
        firstName: p.firstName || user.displayName?.split(' ')[0] || '',
        lastName: p.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
        fullName: [p.firstName, p.lastName].filter(Boolean).join(' ') || user.displayName || '',
        title: p.title || '',
        brokerage: p.brokerage || '',
        phone: p.phone || '',
        email: p.email || user.email || '',
        city: p.city || '',
        tagline: p.tagline || '',
        calendlyUrl: p.calendlyUrl || '',
        licensedSince: p.licensedSince || '',

        // Photos — only use if valid Storage URL
        headshot: urls.headshot?.startsWith('https://') ? urls.headshot : '',
        logo: urls.logo?.startsWith('https://') ? urls.logo : '',
        teamPhoto: urls.team?.startsWith('https://') ? urls.team : '',

        // Bio
        shortBio: p.shortBio || '',
        fullBio: p.fullBio || '',
        promise1: p.promise1 || '',
        promise2: p.promise2 || '',
        promise3: p.promise3 || '',
        promise4: p.promise4 || '',

        // Stats
        homesSold: p.homesSold || '',
        listToSaleRatio: p.listToSaleRatio || '',
        brokerYear: p.brokerYear || '',
        yearsActive: p.yearsActive || '',

        // Reviews
        reviews: Array.isArray(p.reviews) ? p.reviews : [],

        // Branding
        accentColor: p.accentColor || '#EA002A',
        goldColor: p.goldColor || '#C9A84C',

        // Shelter
        shelterText: p.shelterText || '',

        // Account
        plan: data.plan || 'free',
        profileComplete: data.profileComplete || false,

        _loaded: true
      });

      // Apply accent color as CSS variable to document root
      document.documentElement.style.setProperty('--sphere-accent', window.sphereProfile.accentColor);
      document.documentElement.style.setProperty('--sphere-gold', window.sphereProfile.goldColor);

      // Fire event so any page can react
      document.dispatchEvent(new CustomEvent('sphereProfileReady', {
        detail: window.sphereProfile
      }));

      // Auto-apply to common elements if they exist
      _autoApplyProfile();
    })
    .catch(err => {
      console.warn('sphere/profile.js: Failed to load profile', err);
    });
}

/**
 * Auto-apply profile data to standard elements.
 * Any page can use these data attributes to auto-populate.
 *
 * Examples:
 *   <span data-sphere="firstName"></span>
 *   <img data-sphere="headshot" alt="Agent">
 *   <a data-sphere-href="calendlyUrl">Book a meeting</a>
 */
function _autoApplyProfile() {
  const p = window.sphereProfile;

  // Text content
  document.querySelectorAll('[data-sphere]').forEach(el => {
    const key = el.dataset.sphere;
    if (p[key] !== undefined && p[key] !== '') {
      if (el.tagName === 'IMG') {
        el.src = p[key];
        el.style.display = 'block';
      } else {
        el.textContent = p[key];
      }
    }
  });

  // Href attributes
  document.querySelectorAll('[data-sphere-href]').forEach(el => {
    const key = el.dataset.sphereHref;
    if (p[key]) el.href = p[key];
  });

  // Src attributes (for images not using data-sphere)
  document.querySelectorAll('[data-sphere-src]').forEach(el => {
    const key = el.dataset.sphereSrc;
    if (p[key]) el.src = p[key];
  });
}

/**
 * Get initials from profile name.
 * Returns e.g. "KD" for Kyle Duiker.
 */
window.sphereInitials = function() {
  const p = window.sphereProfile;
  return ((p.firstName?.charAt(0) || '') + (p.lastName?.charAt(0) || '')).toUpperCase() || 'ME';
};

/**
 * Get a greeting based on time of day.
 */
window.sphereGreeting = function() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

/**
 * Save updated profile data back to Firestore.
 * Pass an object with any fields to update.
 *
 * Example:
 *   sphereSaveProfile({ firstName: 'Kyle', phone: '403-252-5900' });
 */
window.sphereSaveProfile = function(updates) {
  const uid = window.sphereProfile._uid;
  if (!uid) return Promise.reject('Not authenticated');

  const db = window.db || firebase.firestore();
  const profileUpdates = {};
  Object.keys(updates).forEach(k => {
    profileUpdates['agentProfile.' + k] = updates[k];
  });

  return db.collection('users').doc(uid).update(profileUpdates)
    .then(() => {
      Object.assign(window.sphereProfile, updates);
    });
};

// Auto-init when Firebase Auth is ready
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged(user => {
    if (user) _loadSphereProfile(user);
  });
} else {
  console.warn('sphere/profile.js: Firebase not loaded before profile.js');
}
