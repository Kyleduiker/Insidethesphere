/**
 * Inside The Sphere — Shared Sidebar
 *
 * SINGLE SOURCE OF TRUTH for platform navigation.
 * To add, rename, remove or reorder a nav item, edit navItems / soonItems
 * below. Every page updates on the next deploy.
 *
 * ── Usage on any platform page ────────────────────────────────────────────
 *
 * 1. Replace the entire hardcoded <nav class="sidebar">...</nav> block with:
 *      <div id="sphere-header"></div>
 *
 * 2. In <head>, after firebase-config.js:
 *      <script>window.sphereActivePage = 'cma';</script>
 *      <script src="../js/header.js"></script>
 *
 *    Keys: dashboard, clients, cma, market-data, newsletter, boldtrail, profile
 *
 * 3. Before </body>, AFTER header.js:
 *      <script src="../js/mobile-nav.js"></script>
 *
 * 4. Delete the page's .sidebar / .sb-* CSS and any JS that writes to
 *    sb-name, sb-role, sb-initials or sets sidebar.style.display.
 *
 * REQUIRES: the page keeps its own `.main{margin-left:220px}` rule.
 * This script does NOT wrap or reposition page content.
 *
 * Client-facing CMA pages must NOT include this file.
 */

(function() {

/* Resolve the site root from this script's own URL, so links work at any
   folder depth without guessing from the pathname. */
var thisScript = document.currentScript;
var base = '/';
if (thisScript && thisScript.src) {
  base = thisScript.src.replace(/js\/header\.js.*$/, '');
}

/* ── NAVIGATION — edit here, updates everywhere ────────────────────────── */

var navItems = [
  { key: 'dashboard',   label: 'Dashboard',   href: 'smarttools/' },
  { key: 'clients',     label: 'Clients',     href: 'clients/' },
  { key: 'cma',         label: 'CMA Builder', href: 'cma/' },
  { key: 'market-data', label: 'Market Data', href: 'market-data/' },
  { key: 'newsletter',  label: 'Newsletter',  href: 'newsletter/' },
  { key: 'boldtrail',   label: 'Bold Trail',  href: 'Bold-trail-newsletter/' }
];

var soonItems = [
  'Listing Checklist',
  'Buyer Checklist',
  'Market Reports'
];

/* ─────────────────────────────────────────────────────────────────────── */

var css = ''
+ '#sphere-sidebar{'
+   'width:220px;flex-shrink:0;background:#fff;'
+   'border-right:0.5px solid #D9D3CB;'
+   'display:flex;flex-direction:column;'
+   'position:fixed;top:0;left:0;bottom:0;z-index:100;'
+   'font-family:Inter,-apple-system,sans-serif;box-sizing:border-box;'
+ '}'
+ '#sphere-sidebar *{box-sizing:border-box;margin:0;padding:0}'
+ '#sphere-sidebar .sb-logo{padding:22px 20px 18px;border-bottom:0.5px solid #D9D3CB;flex-shrink:0}'
+ '#sphere-sidebar .sb-logo-text{'
+   'font-family:"Cormorant Garamond",Georgia,serif;'
+   'font-size:1rem;font-weight:300;color:#0F0F0F;'
+   'letter-spacing:.04em;line-height:1.2;text-decoration:none;display:block;'
+ '}'
+ '#sphere-sidebar .sb-logo-text span{color:#A0714F}'
+ '#sphere-sidebar .sb-logo-sub{font-size:8px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#D9D3CB;margin-top:3px;display:block}'
+ '#sphere-sidebar .sb-section{font-size:8px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#D9D3CB;padding:14px 20px 5px;flex-shrink:0;display:block}'
+ '#sphere-sidebar .sb-item{'
+   'display:flex;align-items:center;gap:10px;padding:9px 20px;'
+   'font-size:13px;font-weight:400;color:#8C8479;'
+   'border-left:2px solid transparent;'
+   'transition:color .12s,background .12s,border-color .12s;'
+   'text-decoration:none;background:transparent;font-family:Inter,sans-serif;'
+ '}'
+ '#sphere-sidebar .sb-item:hover{color:#0F0F0F;background:#F7F4EF}'
+ '#sphere-sidebar .sb-item.active{color:#0F0F0F;font-weight:500;border-left-color:#A0714F;background:#F7F4EF}'
+ '#sphere-sidebar .sb-item.soon{opacity:.4;pointer-events:none;cursor:default}'
+ '#sphere-sidebar .sb-soon-tag{font-size:8px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#D9D3CB;margin-left:auto}'
+ '#sphere-sidebar .sb-footer{margin-top:auto;padding:14px 20px;border-top:0.5px solid #D9D3CB;flex-shrink:0}'
+ '#sphere-sidebar .sb-agent{display:flex;align-items:center;gap:10px;padding:8px;border-radius:2px;text-decoration:none;transition:background .12s;background:transparent;width:100%}'
+ '#sphere-sidebar .sb-agent:hover{background:#F7F4EF}'
+ '#sphere-sidebar .sb-avatar{width:32px;height:32px;border-radius:50%;object-fit:cover;flex-shrink:0;border:1.5px solid #D9D3CB;display:block}'
+ '#sphere-sidebar .sb-initials{width:32px;height:32px;border-radius:50%;background:#A0714F;color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0;letter-spacing:.04em}'
+ '#sphere-sidebar .sb-name{font-size:12px;font-weight:500;color:#0F0F0F;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
+ '#sphere-sidebar .sb-role{font-size:10px;color:#8C8479;margin-top:1px;display:block}'
+ '#sphere-sidebar .sb-logout{'
+   'width:100%;margin-top:8px;padding:8px;border:0.5px solid #D9D3CB;'
+   'background:transparent;border-radius:2px;font-size:10px;font-weight:500;'
+   'color:#8C8479;cursor:pointer;font-family:Inter,sans-serif;'
+   'letter-spacing:.08em;text-transform:uppercase;'
+   'transition:border-color .12s,color .12s;display:block;'
+ '}'
+ '#sphere-sidebar .sb-logout:hover{border-color:#0F0F0F;color:#0F0F0F}'
+ '@media(max-width:900px){#sphere-sidebar{display:none}}';

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function(c) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
  });
}

function injectStyles() {
  if (document.getElementById('sphere-sidebar-styles')) return;
  var style = document.createElement('style');
  style.id = 'sphere-sidebar-styles';
  style.textContent = css;
  document.head.appendChild(style);

  if (!document.querySelector('link[href*="Cormorant"]')) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500;600&display=swap';
    document.head.appendChild(link);
  }
}

function buildMarkup(profile) {
  var active = window.sphereActivePage || '';
  var p = profile || {};
  var first = p.firstName || '';
  var last  = p.lastName || '';
  var full  = [first, last].filter(Boolean).join(' ') || 'My Profile';
  var role  = p.title || 'Agent';
  var initials = ((first.charAt(0)) + (last.charAt(0) || '')).toUpperCase() || 'ME';
  var headshot = p.headshot || '';

  var avatar = headshot
    ? '<img src="' + esc(headshot) + '" class="sb-avatar" alt="' + esc(first) + '" id="sb-avatar-img">'
    : '<div class="sb-initials">' + esc(initials) + '</div>';

  var nav = navItems.map(function(item) {
    return '<a class="sb-item' + (item.key === active ? ' active' : '') + '" href="' +
      esc(base + item.href) + '"><span>\u25FB</span> ' + esc(item.label) + '</a>';
  }).join('');

  var soon = soonItems.map(function(label) {
    return '<div class="sb-item soon"><span>\u25FB</span> ' + esc(label) +
      ' <span class="sb-soon-tag">Soon</span></div>';
  }).join('');

  return ''
    + '<div class="sb-logo">'
    +   '<a href="' + esc(base + 'smarttools/') + '" class="sb-logo-text">Inside The <span>Sphere</span></a>'
    +   '<div class="sb-logo-sub">Real Estate Tools</div>'
    + '</div>'
    + '<div class="sb-section">Tools</div>'
    + nav
    + '<div class="sb-section">Coming soon</div>'
    + soon
    + '<div class="sb-footer">'
    +   '<a href="' + esc(base + 'profile.html') + '" class="sb-agent">'
    +     avatar
    +     '<div>'
    +       '<div class="sb-name">' + esc(full) + '</div>'
    +       '<div class="sb-role">' + esc(role) + '</div>'
    +     '</div>'
    +   '</a>'
    +   '<button class="sb-logout" onclick="sphereLogout()">Log out</button>'
    + '</div>';
}

function render(profile) {
  var container = document.getElementById('sphere-header');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sphere-header';
    document.body.insertBefore(container, document.body.firstChild);
  }

  var sidebar = document.getElementById('sphere-sidebar');
  if (!sidebar) {
    sidebar = document.createElement('nav');
    sidebar.id = 'sphere-sidebar';
    sidebar.className = 'sidebar';
    container.innerHTML = '';
    container.appendChild(sidebar);
  }
  sidebar.innerHTML = buildMarkup(profile);

  /* Fall back to initials if the headshot URL 404s. */
  var img = document.getElementById('sb-avatar-img');
  if (img) {
    img.onerror = function() {
      var p = window.sphereHeaderProfile || {};
      var ini = ((p.firstName || '').charAt(0) + ((p.lastName || '').charAt(0) || '')).toUpperCase() || 'ME';
      var div = document.createElement('div');
      div.className = 'sb-initials';
      div.textContent = ini;
      img.replaceWith(div);
    };
  }
}

function loadProfile(user) {
  if (typeof db === 'undefined') return;
  db.collection('users').doc(user.uid).get()
    .then(function(doc) {
      if (!doc.exists) return;
      var p = doc.data().agentProfile || {};
      var profile = {
        firstName: p.firstName || (user.displayName ? user.displayName.split(' ')[0] : ''),
        lastName:  p.lastName || '',
        title:     p.title || 'Agent',
        headshot:  (p.photoUrls && p.photoUrls.headshot) || ''
      };
      window.sphereHeaderProfile = profile;
      render(profile);
      document.dispatchEvent(new CustomEvent('sphereHeaderReady', { detail: profile }));
    })
    .catch(function(err) {
      console.error('Sidebar profile load failed:', err);
    });
}

window.sphereLogout = function() {
  if (confirm('Log out of Inside The Sphere?')) {
    firebase.auth().signOut().then(function() {
      window.location.href = base + 'login.html';
    });
  }
};

function init() {
  injectStyles();
  render(window.sphereHeaderProfile || null);

  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(user) {
      if (user) loadProfile(user);
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
