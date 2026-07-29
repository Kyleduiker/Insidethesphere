/**
 * Inside The Sphere — Shared Sidebar
 * 
 * Usage on any page:
 * 
 * 1. Add a container at the start of body:
 *    <div id="sphere-header"></div>
 *
 * 2. Wrap your page content:
 *    <div id="sphere-main">...your content...</div>
 *
 * 3. Include after firebase-config.js:
 *    <script src="/js/profile.js"></script>
 *    <script src="/js/header.js"></script>
 *
 * 4. Set active page:
 *    <script>window.sphereActivePage = 'dashboard';</script>
 *    Options: 'dashboard', 'cma', 'newsletter', 'boldtrail', 'profile'
 */

(function() {

const css = `
  #sphere-sidebar {
    width: 220px;
    flex-shrink: 0;
    background: #ffffff;
    border-right: 0.5px solid #D9D3CB;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    font-family: 'Inter', -apple-system, sans-serif;
  }

  #sphere-sidebar * { box-sizing: border-box; margin: 0; padding: 0; }

  .ss-logo {
    padding: 22px 20px 18px;
    border-bottom: 0.5px solid #D9D3CB;
    flex-shrink: 0;
  }
  .ss-logo-text {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1rem; font-weight: 300;
    color: #0F0F0F; letter-spacing: .04em;
    line-height: 1.2; text-decoration: none;
    display: block;
  }
  .ss-logo-text span { color: #A0714F; }
  .ss-logo-sub {
    font-size: 8px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase;
    color: #D9D3CB; margin-top: 3px;
  }

  .ss-section {
    font-size: 8px; font-weight: 700;
    letter-spacing: .16em; text-transform: uppercase;
    color: #D9D3CB; padding: 16px 20px 6px;
    flex-shrink: 0;
  }

  .ss-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 20px; cursor: pointer;
    font-size: 13px; font-weight: 400;
    color: #8C8479;
    border-left: 2px solid transparent;
    transition: all .12s;
    text-decoration: none;
  }
  .ss-nav-item:hover { color: #0F0F0F; background: #F7F4EF; }
  .ss-nav-item.active {
    color: #0F0F0F; font-weight: 500;
    border-left-color: #A0714F;
    background: #F7F4EF;
  }
  .ss-nav-item.soon {
    opacity: .4; cursor: default; pointer-events: none;
  }
  .ss-nav-icon { width: 14px; text-align: center; font-size: 11px; flex-shrink: 0; }
  .ss-nav-soon {
    font-size: 8px; font-weight: 600;
    letter-spacing: .08em; text-transform: uppercase;
    color: #D9D3CB; margin-left: auto;
  }

  .ss-footer {
    margin-top: auto;
    padding: 14px 20px;
    border-top: 0.5px solid #D9D3CB;
    flex-shrink: 0;
  }
  .ss-agent {
    display: flex; align-items: center; gap: 10px;
    padding: 8px; border-radius: 2px;
    cursor: pointer; text-decoration: none;
    transition: background .12s;
  }
  .ss-agent:hover { background: #F7F4EF; }
  .ss-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    object-fit: cover; flex-shrink: 0;
    border: 1.5px solid #D9D3CB;
    display: block;
  }
  .ss-initials {
    width: 32px; height: 32px; border-radius: 50%;
    background: #A0714F; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 600; flex-shrink: 0;
    letter-spacing: .04em;
  }
  .ss-agent-info { min-width: 0; }
  .ss-agent-name {
    font-size: 12px; font-weight: 500; color: #0F0F0F;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .ss-agent-role { font-size: 10px; color: #8C8479; margin-top: 1px; }

  .ss-logout {
    width: 100%; margin-top: 8px;
    padding: 8px; border: 0.5px solid #D9D3CB;
    background: transparent; border-radius: 2px;
    font-size: 10px; font-weight: 500;
    color: #8C8479; cursor: pointer;
    font-family: 'Inter', sans-serif;
    transition: all .12s;
    letter-spacing: .08em; text-transform: uppercase;
  }
  .ss-logout:hover { border-color: #0F0F0F; color: #0F0F0F; }

  /* Main content push */
  body.sphere-has-sidebar {
    display: flex;
  }
  body.sphere-has-sidebar #sphere-main {
    margin-left: 220px;
    flex: 1;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Mobile */
  @media (max-width: 900px) {
    #sphere-sidebar { display: none; }
    body.sphere-has-sidebar #sphere-main { margin-left: 0; }
  }
`;

function getBasePath() {
  const path = window.location.pathname;
  const depth = (path.match(/\//g) || []).length - 1;
  return depth <= 1 ? '' : '../'.repeat(depth - 1);
}

const base = getBasePath();
const active = window.sphereActivePage || '';

const navItems = [
  { key: 'dashboard',  label: 'Dashboard',        href: base + 'smarttools/' },
  { key: 'cma',        label: 'CMA Builder',       href: base + 'cma/' },
  { key: 'newsletter', label: 'Newsletter',         href: base + 'newsletter/' },
  { key: 'boldtrail',  label: 'Bold Trail',         href: base + 'Bold-trail-newsletter/' },
];

const soonItems = [
  'Listing Checklist',
  'Buyer Checklist',
  'Market Reports',
];

function buildSidebar(profile) {
  const firstName = profile?.firstName || '';
  const lastName  = profile?.lastName  || '';
  const fullName  = [firstName, lastName].filter(Boolean).join(' ') || 'My Profile';
  const role      = profile?.title || 'Agent';
  const initials  = ((firstName.charAt(0)) + (lastName.charAt(0) || '')).toUpperCase() || 'ME';
  const headshot  = profile?.headshot || '';

  const avatarHTML = headshot
    ? `<img src="${headshot}" class="ss-avatar" alt="${firstName}" onerror="this.outerHTML='<div class=\\'ss-initials\\'>${initials}</div>'">`
    : `<div class="ss-initials">${initials}</div>`;

  const navHTML = navItems.map(item => `
    <a class="ss-nav-item${item.key === active ? ' active' : ''}" href="${item.href}">
      <span class="ss-nav-icon">◻</span>
      ${item.label}
    </a>`).join('');

  const soonHTML = soonItems.map(label => `
    <div class="ss-nav-item soon">
      <span class="ss-nav-icon">◻</span>
      ${label}
      <span class="ss-nav-soon">Soon</span>
    </div>`).join('');

  return `
    <div class="ss-logo">
      <a href="${base}smarttools/" class="ss-logo-text">Inside The <span>Sphere</span></a>
      <div class="ss-logo-sub">Real Estate Tools</div>
    </div>
    <div class="ss-section">Tools</div>
    ${navHTML}
    <div class="ss-section">Coming soon</div>
    ${soonHTML}
    <div class="ss-footer">
      <a href="${base}profile.html" class="ss-agent">
        ${avatarHTML}
        <div class="ss-agent-info">
          <div class="ss-agent-name">${fullName}</div>
          <div class="ss-agent-role">${role}</div>
        </div>
      </a>
      <button class="ss-logout" onclick="sphereLogout()">Log out</button>
    </div>`;
}

function inject(profile) {
  // Inject styles once
  if (!document.getElementById('sphere-sidebar-styles')) {
    const style = document.createElement('style');
    style.id = 'sphere-sidebar-styles';
    style.textContent = css;
    document.head.appendChild(style);

    // Load Cormorant Garamond if not already loaded
    if (!document.querySelector('link[href*="Cormorant"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500;600&display=swap';
      document.head.appendChild(link);
    }
  }

  // Find or create container
  let container = document.getElementById('sphere-header');
  if (!container) {
    container = document.createElement('div');
    container.id = 'sphere-header';
    document.body.insertBefore(container, document.body.firstChild);
  }

  // Build sidebar element
  const sidebar = document.createElement('nav');
  sidebar.id = 'sphere-sidebar';
  sidebar.innerHTML = buildSidebar(profile);
  container.innerHTML = '';
  container.appendChild(sidebar);

  // Wrap main content if not already wrapped
  if (!document.getElementById('sphere-main')) {
    // Find the main content (everything after sphere-header)
    const allChildren = Array.from(document.body.children);
    const headerIdx = allChildren.indexOf(container);
    const contentChildren = allChildren.slice(headerIdx + 1);
    
    if (contentChildren.length > 0) {
      const mainWrap = document.createElement('div');
      mainWrap.id = 'sphere-main';
      document.body.insertBefore(mainWrap, contentChildren[0]);
      contentChildren.forEach(el => mainWrap.appendChild(el));
    }
  }

  document.body.classList.add('sphere-has-sidebar');
}

// Logout
window.sphereLogout = function() {
  if (confirm('Log out of Inside The Sphere?')) {
    firebase.auth().signOut().then(() => {
      window.location.href = getBasePath() + 'login.html';
    });
  }
};

// Init
function init() {
  inject(null);
  document.addEventListener('sphereProfileReady', function(e) {
    inject(e.detail);
  });
  if (window.sphereProfile?._loaded) {
    inject(window.sphereProfile);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();
