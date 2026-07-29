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
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&family=Inter:wght@300;400;500;600&display=swap');

  #sphere-sidebar {
    width: 220px !important;
    flex-shrink: 0 !important;
    background: #ffffff !important;
    border-right: 0.5px solid #D9D3CB !important;
    display: flex !important;
    flex-direction: column !important;
    position: fixed !important;
    top: 0 !important; left: 0 !important; bottom: 0 !important;
    z-index: 1000 !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    box-sizing: border-box !important;
  }

  #sphere-sidebar *, #sphere-sidebar *::before, #sphere-sidebar *::after {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
    line-height: normal !important;
  }

  #sphere-sidebar .ss-logo {
    padding: 22px 20px 18px !important;
    border-bottom: 0.5px solid #D9D3CB !important;
    flex-shrink: 0 !important;
  }
  #sphere-sidebar .ss-logo-text {
    font-family: 'Cormorant Garamond', Georgia, serif !important;
    font-size: 1rem !important; font-weight: 300 !important;
    color: #0F0F0F !important; letter-spacing: .04em !important;
    line-height: 1.3 !important; text-decoration: none !important;
    display: block !important;
  }
  #sphere-sidebar .ss-logo-text span { color: #A0714F !important; }
  #sphere-sidebar .ss-logo-sub {
    font-size: 8px !important; font-weight: 700 !important;
    letter-spacing: .16em !important; text-transform: uppercase !important;
    color: #D9D3CB !important; margin-top: 3px !important;
    display: block !important;
  }

  #sphere-sidebar .ss-section {
    font-size: 8px !important; font-weight: 700 !important;
    letter-spacing: .16em !important; text-transform: uppercase !important;
    color: #D9D3CB !important;
    padding: 14px 20px 5px !important;
    flex-shrink: 0 !important; display: block !important;
  }

  #sphere-sidebar .ss-nav-item {
    display: flex !important; align-items: center !important; gap: 10px !important;
    padding: 9px 20px !important; cursor: pointer !important;
    font-size: 13px !important; font-weight: 400 !important;
    color: #8C8479 !important;
    border-left: 2px solid transparent !important;
    transition: all .12s !important;
    text-decoration: none !important;
    font-family: 'Inter', sans-serif !important;
    background: transparent !important;
    border-top: none !important; border-right: none !important; border-bottom: none !important;
    width: 100% !important;
  }
  #sphere-sidebar .ss-nav-item:hover { color: #0F0F0F !important; background: #F7F4EF !important; }
  #sphere-sidebar .ss-nav-item.active {
    color: #0F0F0F !important; font-weight: 500 !important;
    border-left-color: #A0714F !important;
    background: #F7F4EF !important;
  }
  #sphere-sidebar .ss-nav-item.soon {
    opacity: .4 !important; cursor: default !important; pointer-events: none !important;
  }
  #sphere-sidebar .ss-nav-icon {
    width: 14px !important; text-align: center !important;
    font-size: 11px !important; flex-shrink: 0 !important;
  }
  #sphere-sidebar .ss-nav-soon {
    font-size: 8px !important; font-weight: 600 !important;
    letter-spacing: .08em !important; text-transform: uppercase !important;
    color: #D9D3CB !important; margin-left: auto !important;
  }

  #sphere-sidebar .ss-footer {
    margin-top: auto !important;
    padding: 14px 20px !important;
    border-top: 0.5px solid #D9D3CB !important;
    flex-shrink: 0 !important;
  }
  #sphere-sidebar .ss-agent {
    display: flex !important; align-items: center !important; gap: 10px !important;
    padding: 8px !important; border-radius: 2px !important;
    cursor: pointer !important; text-decoration: none !important;
    transition: background .12s !important;
    background: transparent !important;
    border: none !important; width: 100% !important;
  }
  #sphere-sidebar .ss-agent:hover { background: #F7F4EF !important; }
  #sphere-sidebar .ss-avatar {
    width: 32px !important; height: 32px !important; border-radius: 50% !important;
    object-fit: cover !important; flex-shrink: 0 !important;
    border: 1.5px solid #D9D3CB !important; display: block !important;
  }
  #sphere-sidebar .ss-initials {
    width: 32px !important; height: 32px !important; border-radius: 50% !important;
    background: #A0714F !important; color: #fff !important;
    display: flex !important; align-items: center !important; justify-content: center !important;
    font-size: 10px !important; font-weight: 600 !important; flex-shrink: 0 !important;
    letter-spacing: .04em !important;
  }
  #sphere-sidebar .ss-agent-info { min-width: 0 !important; }
  #sphere-sidebar .ss-agent-name {
    font-size: 12px !important; font-weight: 500 !important; color: #0F0F0F !important;
    white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important;
    display: block !important;
  }
  #sphere-sidebar .ss-agent-role {
    font-size: 10px !important; color: #8C8479 !important; margin-top: 1px !important;
    display: block !important;
  }
  #sphere-sidebar .ss-logout {
    width: 100% !important; margin-top: 8px !important;
    padding: 8px !important; border: 0.5px solid #D9D3CB !important;
    background: transparent !important; border-radius: 2px !important;
    font-size: 10px !important; font-weight: 500 !important;
    color: #8C8479 !important; cursor: pointer !important;
    font-family: 'Inter', sans-serif !important;
    transition: all .12s !important;
    letter-spacing: .08em !important; text-transform: uppercase !important;
    display: block !important;
  }
  #sphere-sidebar .ss-logout:hover { border-color: #0F0F0F !important; color: #0F0F0F !important; }

  /* Push main content */
  body.sphere-has-sidebar {
    display: flex !important;
  }
  body.sphere-has-sidebar #sphere-main {
    margin-left: 220px !important;
    flex: 1 !important;
    min-height: 100vh !important;
    display: flex !important;
    flex-direction: column !important;
  }

  /* Mobile */
  @media (max-width: 900px) {
    #sphere-sidebar { display: none !important; }
    body.sphere-has-sidebar #sphere-main { margin-left: 0 !important; }
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
