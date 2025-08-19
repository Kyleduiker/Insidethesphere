/**
 * Sphere Navigation System - Inside The Sphere
 * Handles authentication, navigation menu, and user management
 */

// Configuration object
const sphereNavConfig = {
    requireAuth: true,
    loginRedirectUrl: 'https://insidethesphere.com/login',
    homeUrl: '/'
};

// Function to create and insert navigation HTML
function createSphereNavigation() {
    // Create auth loading screen
    const authLoadingHTML = `
        <div id="authLoading" class="auth-loading">
            <div class="loading-spinner"></div>
            <div class="loading-text">Verifying access...</div>
        </div>
    `;

    // Create navigation HTML
    const navigationHTML = `
    <!-- Navigation Menu -->
    <nav class="sphere-nav">
        <div class="sphere-nav-container">
            <a href="${sphereNavConfig.homeUrl}" class="sphere-logo">Inside The Sphere</a>
            
            <div class="nav-actions">
                <!-- LOGGED IN STATE -->
                <div class="user-info" id="userInfo" style="display: none;">
                    <span>👤</span>
                    <span id="userNameNav">User</span>
                </div>
                <button class="logout-btn" id="logoutBtn" onclick="logout()" style="display: none;">Logout</button>
                
                <!-- LOGGED OUT STATE -->
                <a href="${sphereNavConfig.loginRedirectUrl}" class="login-btn" id="loginBtn" style="display: none;">Login / Sign Up</a>
                
                <!-- ALWAYS VISIBLE -->
                <button class="sphere-menu-btn" onclick="toggleSphereMenu()">
                    <span>☰</span>
                    <span>Menu</span>
                </button>
            </div>
        </div>
    </nav>

    <!-- Navigation Overlay -->
    <div class="sphere-overlay" id="sphereOverlay" onclick="closeSphereMenu()"></div>

    <!-- Navigation Popout Menu -->
    <div class="sphere-popout-menu" id="spherePopoutMenu">
        <div class="sphere-menu-header">
            <div class="sphere-menu-title">Navigation</div>
            <div class="sphere-menu-subtitle">Inside The Sphere</div>
        </div>

        <div class="sphere-menu-items">
            <a href="${sphereNavConfig.homeUrl}" class="sphere-menu-item">
                <div class="sphere-menu-icon sphere-icon-home">🏠</div>
                <div class="sphere-menu-text">Home</div>
            </a>

            <a href="${sphereNavConfig.homeUrl}dashboard.html" class="sphere-menu-item">
                <div class="sphere-menu-icon sphere-icon-dashboard">👤</div>
                <div class="sphere-menu-text">My Account</div>
            </a>

            <a href="${sphereNavConfig.homeUrl}smarttools/" class="sphere-menu-item">
                <div class="sphere-menu-icon sphere-icon-tools">🛠️</div>
                <div class="sphere-menu-text">Smart Tools</div>
            </a>

            <a href="${sphereNavConfig.homeUrl}newsletter/" class="sphere-menu-item">
                <div class="sphere-menu-icon sphere-icon-newsletter">📧</div>
                <div class="sphere-menu-text">Newsletter Builder</div>
            </a>
        </div>
    </div>
`;

        <!-- Navigation Overlay -->
        <div class="sphere-overlay" id="sphereOverlay" onclick="closeSphereMenu()"></div>

        <!-- Navigation Popout Menu -->
        <div class="sphere-popout-menu" id="spherePopoutMenu">
            <div class="sphere-menu-header">
                <div class="sphere-menu-title">Navigation</div>
                <div class="sphere-menu-subtitle">Inside The Sphere</div>
            </div>

            <div class="sphere-menu-items">
                <a href="${sphereNavConfig.homeUrl}" class="sphere-menu-item">
                    <div class="sphere-menu-icon sphere-icon-home">🏠</div>
                    <div class="sphere-menu-text">Home</div>
                </a>

                <a href="${sphereNavConfig.homeUrl}dashboard.html" class="sphere-menu-item">
                    <div class="sphere-menu-icon sphere-icon-dashboard">👤</div>
                    <div class="sphere-menu-text">My Account</div>
                </a>

                <a href="${sphereNavConfig.homeUrl}smarttools/" class="sphere-menu-item">
                    <div class="sphere-menu-icon sphere-icon-tools">🛠️</div>
                    <div class="sphere-menu-text">Smart Tools</div>
                </a>

                <a href="${sphereNavConfig.homeUrl}newsletter/" class="sphere-menu-item">
                    <div class="sphere-menu-icon sphere-icon-newsletter">📧</div>
                    <div class="sphere-menu-text">Newsletter Builder</div>
                </a>
            </div>
        </div>
    `;

    // Insert HTML into page
    if (sphereNavConfig.requireAuth) {
        document.body.insertAdjacentHTML('afterbegin', authLoadingHTML);
    }
    document.body.insertAdjacentHTML('afterbegin', navigationHTML);
    
    // Add class to body for padding
    document.body.classList.add('has-sphere-nav');
}

// Authentication Check - FIRST PRIORITY
function initializeAuthentication() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded - showing logged out state');
        showLoggedOutState();
        showPage();
        return;
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is authenticated - show logged in state
            showLoggedInState(user);
            showPage();
            console.log('User authenticated:', user.email);
        } else {
            // User is NOT authenticated
            if (sphereNavConfig.requireAuth) {
                // Redirect to login if auth is required
                window.location.href = sphereNavConfig.loginRedirectUrl;
            } else {
                // Show logged out state if auth is not required
                showLoggedOutState();
                showPage();
            }
        }
    });
}

// Show page function
function showPage() {
    const authLoading = document.getElementById('authLoading');
    if (authLoading) {
        authLoading.style.display = 'none';
    }
    document.body.style.visibility = 'visible';
}

// Logout function
function logout() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    firebase.auth().signOut().then(() => {
        window.location.href = sphereNavConfig.loginRedirectUrl;
    }).catch((error) => {
        console.error('Logout error:', error);
        alert('Error signing out. Please try again.');
    });
}

// Navigation functionality
function toggleSphereMenu() {
    const menu = document.getElementById('spherePopoutMenu');
    const overlay = document.getElementById('sphereOverlay');
    const menuBtn = document.querySelector('.sphere-menu-btn');
    
    if (menu && overlay && menuBtn) {
        const isActive = menu.classList.contains('active');
        
        if (isActive) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            menuBtn.classList.remove('active');
        } else {
            menu.classList.add('active');
            overlay.classList.add('active');
            menuBtn.classList.add('active');
        }
    }
}

function closeSphereMenu() {
    const menu = document.getElementById('spherePopoutMenu');
    const overlay = document.getElementById('sphereOverlay');
    const menuBtn = document.querySelector('.sphere-menu-btn');
    
    if (menu && overlay && menuBtn) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.classList.remove('active');
    }
}
}

// ADD THE NEW HELPER FUNCTIONS HERE (Step 3c):
function showLoggedInState(user) {
    const userName = user.displayName || user.email.split('@')[0] || 'User';
    const userNameElement = document.getElementById('userNameNav');
    const userInfoElement = document.getElementById('userInfo');
    const logoutBtnElement = document.getElementById('logoutBtn');
    const loginBtnElement = document.getElementById('loginBtn');
    
    // Show logged in elements
    if (userNameElement) userNameElement.textContent = userName;
    if (userInfoElement) userInfoElement.style.display = 'flex';
    if (logoutBtnElement) logoutBtnElement.style.display = 'flex';
    
    // Hide logged out elements
    if (loginBtnElement) loginBtnElement.style.display = 'none';
}

function showLoggedOutState() {
    const userInfoElement = document.getElementById('userInfo');
    const logoutBtnElement = document.getElementById('logoutBtn');
    const loginBtnElement = document.getElementById('loginBtn');
    
    // Hide logged in elements
    if (userInfoElement) userInfoElement.style.display = 'none';
    if (logoutBtnElement) logoutBtnElement.style.display = 'none';
    
    // Show logged out elements
    if (loginBtnElement) loginBtnElement.style.display = 'flex';
}

// Initialize navigation when page loads
function initializeNavigation() {
// Initialize navigation when page loads
function initializeNavigation() {
    createSphereNavigation();
    
    // Set up event listeners
    const overlay = document.getElementById('sphereOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeSphereMenu);
    }

    // Close menu with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeSphereMenu();
        }
    });

    // Close menu when clicking on menu items
    const menuItems = document.querySelectorAll('.sphere-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            closeSphereMenu();
        });
    });

    // Initialize authentication if required
    if (sphereNavConfig.requireAuth) {
        // Hide page content initially
        document.body.style.visibility = 'hidden';
        initializeAuthentication();
    } else {
        // Show page immediately if no auth required
        showPage();
    }
}

// Configuration function to update settings
function configureSphereNav(options) {
    Object.assign(sphereNavConfig, options);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}
