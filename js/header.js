/**
 * Inside The Sphere — Shared Header
 * 
 * Usage on any page:
 * 
 * 1. Add a container where you want the header:
 *    <div id="sphere-header"></div>
 *
 * 2. Include firebase scripts + firebase-config.js first, then:
 *    <script src="/js/profile.js"></script>
 *    <script src="/js/header.js"></script>
 *
 * 3. Optional — mark the active nav item:
 *    <script>window.sphereActivePage = 'dashboard';</script>
 *    Options: 'dashboard', 'cma', 'newsletter', 'boldtrail', 'profile'
 *
 * 4. Add top padding to your body so content clears the header:
 *    body { padding-top: 60px; }
 */

(function() {

  // ── STYLES ──────────────────────────────────────────────────────
  const css = `
    #sphere-header-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 60px;
      background: #fff;
      border-bottom: 1px solid #eee;
      display: flex;
      align-items: center;
      padding: 0 32px;
      z-index: 1000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      gap: 0;
    }

    #sphere-header-bar * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .sh-logo {
      font-size: 1rem;
      font-weight: 700;
      color: #1a1a1a;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 7px;
      margin-right: 32px;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .sh-logo:hover { color: #1a1a1a; }

    .sh-nav {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
    }

    .sh-nav::-webkit-scrollbar { display: none; }

    .sh-nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 13px;
      font-weight: 500;
      color: #666;
      text-decoration: none;
      transition: all .15s;
      white-space: nowrap;
      border: 1px solid transparent;
    }

    .sh-nav-link:hover {
      background: #f5f5f5;
      color: #1a1a1a;
    }

    .sh-nav-link.active {
      background: #f5f5ff;
      color: #1a1a2e;
      font-weight: 600;
      border-color: #e8e8f0;
    }

    .sh-nav-icon { font-size: 14px; line-height: 1; }

    .sh-divider {
      width: 1px;
      height: 20px;
      background: #eee;
      margin: 0 8px;
      flex-shrink: 0;
    }

    .sh-right {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      margin-left: 16px;
    }

    .sh-profile-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 10px 5px 5px;
      border-radius: 8px;
      border: 1px solid #eee;
      text-decoration: none;
      transition: all .15s;
      cursor: pointer;
      background: #fff;
    }

    .sh-profile-btn:hover { background: #f9f9f9; border-color: #ddd; }

    .sh-avatar {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      object-fit: cover;
      border: 1.5px solid #eee;
      flex-shrink: 0;
      display: block;
    }

    .sh-initials {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: #1a1a2e;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .sh-profile-name {
      font-size: 13px;
      font-weight: 600;
      color: #1a1a1a;
      max-width: 100px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sh-logout-btn {
      padding: 6px 12px;
      border-radius: 7px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #fecaca;
      background: #fff5f5;
      color: #ef4444;
      font-family: inherit;
      transition: all .15s;
      white-space: nowrap;
    }

    .sh-logout-btn:hover { background: #fee2e2; }

    /* Mobile */
    @media (max-width: 768px) {
      #sphere-header-bar { padding: 0 16px; gap: 0; }
      .sh-logo { margin-right: 12px; font-size: .9rem; }
      .sh-nav-link span.sh-nav-label { display: none; }
      .sh-nav-link { padding: 6px 8px; }
      .sh-profile-name { display: none; }
      .sh-divider { margin: 0 4px; }
    }
  `;

  // ── NAV ITEMS ────────────────────────────────────────────────────
  // Determine base path (how many levels deep we are)
  function getBasePath() {
    const path = window.location.pathname;
    const depth = (path.match(/\//g) || []).length - 1;
    return depth <= 1 ? '' : '../'.repeat(depth - 1);
  }

  const base = getBasePath();

  const navItems = [
    { key: 'dashboard', icon: '⊞', label: 'Dashboard', href: base + 'smarttools/' },
    { key: 'cma',       icon: '📊', label: 'CMA Builder', href: base + 'cma/' },
    { key: 'newsletter',icon: '📧', label: 'Newsletter', href: base + 'newsletter/' },
    { key: 'boldtrail', icon: '📰', label: 'Bold Trail', href: base + 'Bold-trail-newsletter/' },
  ];

  const activePage = window.sphereActivePage || '';

  // ── BUILD HTML ───────────────────────────────────────────────────
  function buildHeader(profile) {
    const initials = profile
      ? ((profile.firstName?.charAt(0) || '') + (profile.lastName?.charAt(0) || '')).toUpperCase() || 'ME'
      : 'ME';

    const firstName = profile?.firstName || 'My Profile';
    const headshot  = profile?.headshot || '';

    const avatarHTML = headshot
      ? `<img src="${headshot}" class="sh-avatar" alt="${firstName}" onerror="this.outerHTML='<div class=\\'sh-initials\\'>${initials}</div>'">`
      : `<div class="sh-initials">${initials}</div>`;

    const navHTML = navItems.map(item => `
      <a class="sh-nav-link${item.key === activePage ? ' active' : ''}" href="${item.href}">
        <span class="sh-nav-icon">${item.icon}</span>
        <span class="sh-nav-label">${item.label}</span>
      </a>`).join('');

    return `
      <a class="sh-logo" href="${base}smarttools/">🏠 Inside The Sphere</a>
      <nav class="sh-nav">
        ${navHTML}
      </nav>
      <div class="sh-divider"></div>
      <div class="sh-right">
        <a class="sh-profile-btn" href="${base}profile.html" title="Profile & Account">
          ${avatarHTML}
          <span class="sh-profile-name">${firstName}</span>
        </a>
        <button class="sh-logout-btn" onclick="sphereLogout()">Logout</button>
      </div>`;
  }

  // ── INJECT ───────────────────────────────────────────────────────
  function inject(profile) {
    // Inject styles
    if (!document.getElementById('sphere-header-styles')) {
      const style = document.createElement('style');
      style.id = 'sphere-header-styles';
      style.textContent = css;
      document.head.appendChild(style);
    }

    // Find or create container
    let container = document.getElementById('sphere-header');
    if (!container) {
      // If no container exists, create one at the top of body
      container = document.createElement('div');
      container.id = 'sphere-header';
      document.body.insertBefore(container, document.body.firstChild);
    }

    // Create the bar
    const bar = document.createElement('header');
    bar.id = 'sphere-header-bar';
    bar.innerHTML = buildHeader(profile);
    container.innerHTML = '';
    container.appendChild(bar);

    // Add body padding so content clears the fixed header
    if (!document.body.style.paddingTop) {
      document.body.style.paddingTop = '60px';
    }
  }

  // ── LOGOUT ───────────────────────────────────────────────────────
  window.sphereLogout = function() {
    if (confirm('Log out of Inside The Sphere?')) {
      firebase.auth().signOut().then(() => {
        window.location.href = getBasePath() + 'login.html';
      });
    }
  };

  // ── INIT ─────────────────────────────────────────────────────────
  function init() {
    // Show header immediately with no profile data
    inject(null);

    // Update when profile loads
    document.addEventListener('sphereProfileReady', function(e) {
      inject(e.detail);
    });

    // Also check if profile already loaded
    if (window.sphereProfile?._loaded) {
      inject(window.sphereProfile);
    }
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
