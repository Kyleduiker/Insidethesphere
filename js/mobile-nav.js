/**
 * Inside The Sphere — Mobile Navigation Drawer
 *
 * Turns the existing 220px fixed sidebar into a slide-in drawer below 900px.
 * Works with the baked-in `.sidebar` markup already on every platform page —
 * no sidebar rewrite required.
 *
 * Usage: add ONE line to any page that has a `.sidebar`, at the end of body
 * or in the head after firebase-config.js:
 *
 *   <script src="../js/mobile-nav.js"></script>     (subfolder pages)
 *   <script src="js/mobile-nav.js"></script>        (root pages)
 *
 * Desktop (>900px) is completely untouched.
 */

(function() {

  var BREAKPOINT = 900;

  var css = ''
    + '#mnav-toggle{'
    +   'display:none;align-items:center;justify-content:center;'
    +   'width:34px;height:34px;flex-shrink:0;'
    +   'background:transparent;border:0.5px solid #D9D3CB;border-radius:2px;'
    +   'color:#0F0F0F;font-size:15px;line-height:1;cursor:pointer;'
    +   'font-family:Inter,-apple-system,sans-serif;padding:0;'
    +   'transition:border-color .12s,background .12s;'
    + '}'
    + '#mnav-toggle:hover{border-color:#0F0F0F;background:#F7F4EF}'
    + '#mnav-backdrop{'
    +   'display:none;position:fixed;inset:0;'
    +   'background:rgba(15,15,15,.45);z-index:1100;'
    +   'opacity:0;visibility:hidden;'
    +   'transition:opacity .25s ease,visibility .25s ease;'
    + '}'

    + '@media(max-width:' + BREAKPOINT + 'px){'

    /* The sidebar becomes an off-canvas drawer. display is forced because the
       page scripts set an inline display:flex once auth resolves, which would
       otherwise beat the stylesheet's display:none and leave a 220px panel
       sitting on top of the content. */
    +   '.sidebar,#sphere-sidebar{'
    +     'display:flex !important;'
    +     'transform:translateX(-100%);'
    +     'transition:transform .25s ease;'
    +     'z-index:1200 !important;'
    +     'will-change:transform;'
    +   '}'
    +   'body.mnav-open .sidebar,body.mnav-open #sphere-sidebar{'
    +     'transform:translateX(0);'
    +     'box-shadow:0 0 40px rgba(15,15,15,.18);'
    +   '}'
    +   'body.mnav-open{overflow:hidden}'

    +   '#mnav-toggle{display:inline-flex}'
    +   '#mnav-backdrop{display:block}'
    +   'body.mnav-open #mnav-backdrop{opacity:1;visibility:visible}'

    /* Make room for the toggle at the head of the topbar without disturbing
       the existing left/right grouping. */
    +   '.topbar{justify-content:flex-start !important;gap:12px !important}'
    +   '.topbar > *:last-child{margin-left:auto !important}'

    + '}'

    + '@media(prefers-reduced-motion:reduce){'
    +   '.sidebar,#sphere-sidebar,#mnav-backdrop{transition:none !important}'
    + '}';

  function injectStyles() {
    if (document.getElementById('mnav-styles')) return;
    var style = document.createElement('style');
    style.id = 'mnav-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function openDrawer() {
    document.body.classList.add('mnav-open');
    var btn = document.getElementById('mnav-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'true');
  }

  function closeDrawer() {
    document.body.classList.remove('mnav-open');
    var btn = document.getElementById('mnav-toggle');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  function toggleDrawer() {
    if (document.body.classList.contains('mnav-open')) closeDrawer();
    else openDrawer();
  }

  function buildToggle() {
    if (document.getElementById('mnav-toggle')) return;

    var btn = document.createElement('button');
    btn.id = 'mnav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open navigation');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = '\u2630';
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      toggleDrawer();
    });

    var topbar = document.querySelector('.topbar');
    if (topbar) {
      topbar.insertBefore(btn, topbar.firstChild);
    } else {
      /* No topbar on this page — float the toggle in the top-left corner. */
      btn.style.position = 'fixed';
      btn.style.top = '12px';
      btn.style.left = '12px';
      btn.style.zIndex = '1150';
      btn.style.background = '#fff';
      document.body.appendChild(btn);
    }
  }

  function buildBackdrop() {
    if (document.getElementById('mnav-backdrop')) return;
    var bd = document.createElement('div');
    bd.id = 'mnav-backdrop';
    bd.addEventListener('click', closeDrawer);
    document.body.appendChild(bd);
  }

  function wireSidebar(sidebar) {
    /* Close on any nav tap — the link navigates, but if it's a same-page
       anchor the drawer would otherwise stay open over the content. */
    sidebar.addEventListener('click', function(e) {
      var link = e.target.closest ? e.target.closest('a') : null;
      if (link) closeDrawer();
    });
  }

  function init() {
    var sidebar = document.querySelector('.sidebar') ||
                  document.getElementById('sphere-sidebar');
    if (!sidebar) return;

    injectStyles();
    buildBackdrop();
    buildToggle();
    wireSidebar(sidebar);

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeDrawer();
    });

    /* Rotating an iPad from portrait to landscape brings the fixed sidebar
       back; the drawer state has to be cleared or the backdrop lingers. */
    window.addEventListener('resize', function() {
      if (window.innerWidth > BREAKPOINT) closeDrawer();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
