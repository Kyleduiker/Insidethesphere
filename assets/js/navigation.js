/**
 * Sphere Navigation System - Inside The Sphere
 * Handles authentication, navigation menu, and user management with modal login
 */

// Configuration object
const sphereNavConfig = {
    requireAuth: true,
    loginRedirectUrl: 'https://insidethesphere.com/login', // Fallback for direct navigation
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

    // Create login modal HTML
    const loginModalHTML = `
        <!-- Login Modal Overlay -->
        <div id="loginModalOverlay" class="login-modal-overlay" onclick="closeLoginModalOnOverlay(event)">
            <div class="login-modal-content">
                <!-- Close Button -->
                <button class="login-modal-close" onclick="closeLoginModal()">&times;</button>
                
                <!-- Error/Success Messages -->
                <div id="loginError" class="login-error-message"></div>
                <div id="loginSuccess" class="login-success-message"></div>
                
                <div class="login-tabs">
                    <button class="login-tab active" onclick="switchTab('login')">Login</button>
                    <button class="login-tab" onclick="switchTab('signup')">Sign Up</button>
                </div>
                
                <!-- Login Form -->
                <form id="loginForm" class="login-form active" onsubmit="handleLoginSubmit(event)">
                    <div class="form-group">
                        <input type="email" placeholder="Email Address" required name="email">
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required name="password">
                    </div>
                    <button type="submit" class="login-submit-btn">Login</button>
                </form>
                
                <!-- Sign Up Form -->
                <form id="signupForm" class="login-form" onsubmit="handleSignupSubmit(event)">
                    <div class="form-group">
                        <input type="text" placeholder="Full Name" required name="name">
                    </div>
                    <div class="form-group">
                        <input type="email" placeholder="Email Address" required name="email">
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Password" required name="password">
                    </div>
                    <div class="form-group">
                        <input type="password" placeholder="Confirm Password" required name="confirmPassword">
                    </div>
                    <button type="submit" class="login-submit-btn">Sign Up</button>
                </form>
                
                <!-- Google Login -->
                <div class="login-divider">or</div>
                <button type="button" class="google-login-btn" onclick="handleGoogleLogin()">
                    <span>Continue with Google</span>
                </button>
            </div>
        </div>
    `;

    // Create navigation HTML
    const navigationHTML = `
        <!-- Navigation Menu -->
        <nav class="sphere-nav">
            <div class="sphere-nav-container">
                <a href="${sphereNavConfig.homeUrl}" class="sphere-logo">Inside The Sphere</a>
                
                <div class="nav-actions">
                    <!-- SINGLE TRANSFORMING BUTTON -->
                    <button class="auth-btn" id="authBtn" onclick="handleAuthClick()">Login / Sign Up</button>
                    
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
            </div>
        </div>
    `;

    // Insert HTML into page
    if (sphereNavConfig.requireAuth) {
        document.body.insertAdjacentHTML('afterbegin', authLoadingHTML);
    }
    document.body.insertAdjacentHTML('afterbegin', loginModalHTML);
    document.body.insertAdjacentHTML('afterbegin', navigationHTML);
    
    // Add class to body for padding
    document.body.classList.add('has-sphere-nav');
}

// Authentication Check
function initializeAuthentication() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded - showing logged out state');
        showLoggedOutState();
        showPage();
        return;
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User IS authenticated - always show logout button
            showLoggedInState(user);
            showPage();
            console.log('User authenticated:', user.email);
        } else {
            // User is NOT authenticated
            if (sphereNavConfig.requireAuth) {
                // Show login modal if auth is required (protected pages)
                showLoggedOutState();
                showPage();
                // Don't auto-open modal, let user click the login button
            } else {
                // Show logged out state (public pages)
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

// Logout function - UPDATED TO GO TO HOME PAGE
function logout() {
    if (typeof firebase === 'undefined') {
        console.error('Firebase not loaded');
        return;
    }

    firebase.auth().signOut().then(() => {
        // Go to home page instead of login page
        window.location.href = sphereNavConfig.homeUrl;
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

// Helper functions for authentication states - UPDATED FOR MODAL SYSTEM
function showLoggedInState(user) {
    const authBtn = document.getElementById('authBtn');
    
    if (authBtn) {
        authBtn.textContent = 'Logout';
        authBtn.className = 'logout-btn';
        authBtn.setAttribute('data-state', 'logged-in');
    }
    
    // Check if user should be redirected back to a specific page
    const returnUrl = sessionStorage.getItem('returnAfterLogin');
    if (returnUrl && returnUrl !== window.location.href) {
        sessionStorage.removeItem('returnAfterLogin');
        window.location.href = returnUrl;
    }
}

function showLoggedOutState() {
    const authBtn = document.getElementById('authBtn');
    
    if (authBtn) {
        authBtn.textContent = 'Login / Sign Up';
        authBtn.className = 'login-btn';
        authBtn.setAttribute('data-state', 'logged-out');
    }
}

// UPDATED: Handle click on the transforming auth button - NOW USES MODAL
function handleAuthClick() {
    const authBtn = document.getElementById('authBtn');
    const currentState = authBtn ? authBtn.getAttribute('data-state') : 'logged-out';
    
    if (currentState === 'logged-in') {
        // User is logged in, so logout
        logout();
    } else {
        // User is logged out, open login modal
        openLoginModal();
    }
}

// ===== MODAL LOGIN FUNCTIONS =====

// Enhanced Modal functions with better error handling
function openLoginModal() {
    const modal = document.getElementById('loginModalOverlay');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        // Clear any previous messages
        hideLoginMessages();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModalOverlay');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Reset forms
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        if (loginForm) loginForm.reset();
        if (signupForm) signupForm.reset();
        hideLoginMessages();
    }
}

// Close modal only when clicking overlay, not content
function closeLoginModalOnOverlay(event) {
    if (event.target === event.currentTarget) {
        closeLoginModal();
    }
}

function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const tabs = document.querySelectorAll('.login-tab');
    
    // Reset tabs and forms
    tabs.forEach(t => t.classList.remove('active'));
    if (loginForm) loginForm.classList.remove('active');
    if (signupForm) signupForm.classList.remove('active');
    hideLoginMessages();
    
    // Activate selected tab
    if (tab === 'login') {
        document.querySelector('.login-tab:first-child').classList.add('active');
        if (loginForm) loginForm.classList.add('active');
    } else {
        document.querySelector('.login-tab:last-child').classList.add('active');
        if (signupForm) signupForm.classList.add('active');
    }
}

// Enhanced login with better error handling
async function handleLoginSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('.login-submit-btn');
    const email = form.email.value;
    const password = form.password.value;
    
    // Show loading state
    submitBtn.textContent = 'Signing in...';
    submitBtn.disabled = true;
    hideLoginMessages();
    
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        showLoginSuccess('Welcome back! Loading your tools...');
        setTimeout(() => {
            closeLoginModal();
            // User state will be handled by onAuthStateChanged with return URL
        }, 1000);
    } catch (error) {
        console.error('Login error:', error);
        showLoginError(getLoginErrorMessage(error.code));
        submitBtn.textContent = 'Login';
        submitBtn.disabled = false;
    }
}

// Enhanced signup with better logic
async function handleSignupSubmit(event) {
    event.preventDefault();
    const form = event.target;
    const submitBtn = form.querySelector('.login-submit-btn');
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;
    
    if (password !== confirmPassword) {
        showLoginError('Passwords do not match');
        return;
    }
    
    if (password.length < 6) {
        showLoginError('Password must be at least 6 characters long');
        return;
    }
    
    // Show loading state
    submitBtn.textContent = 'Creating account...';
    submitBtn.disabled = true;
    hideLoginMessages();
    
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        
        // Update user profile with name
        await userCredential.user.updateProfile({
            displayName: name
        });
        
        // Create user profile in Firestore if available
        if (typeof db !== 'undefined') {
            try {
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    subscriptionStatus: 'free',
                    profileComplete: true
                });
            } catch (dbError) {
                console.log('Firestore error (non-critical):', dbError);
            }
        }
        
        showLoginSuccess('Account created! Welcome to Inside The Sphere!');
        setTimeout(() => {
            closeLoginModal();
            // User state will be handled by onAuthStateChanged
        }, 1000);
    } catch (error) {
        console.error('Signup error:', error);
        showLoginError(getLoginErrorMessage(error.code));
        submitBtn.textContent = 'Sign Up';
        submitBtn.disabled = false;
    }
}

// Add Google login function
async function handleGoogleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    hideLoginMessages();
    
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        // Create user profile if first time (only if db exists)
        if (typeof db !== 'undefined') {
            try {
                const doc = await db.collection('users').doc(user.uid).get();
                if (!doc.exists) {
                    await db.collection('users').doc(user.uid).set({
                        name: user.displayName || 'User',
                        email: user.email,
                        photoURL: user.photoURL || '',
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        subscriptionStatus: 'free',
                        profileComplete: true
                    });
                }
            } catch (dbError) {
                console.log('Firestore error (non-critical):', dbError);
            }
        }
        
        showLoginSuccess('Welcome! Loading your tools...');
        setTimeout(() => {
            closeLoginModal();
        }, 1000);
    } catch (error) {
        console.error('Google login error:', error);
        if (error.code === 'auth/popup-closed-by-user') {
            showLoginError('Sign-in was cancelled. Please try again.');
        } else {
            showLoginError('Google sign-in failed. Please try again.');
        }
    }
}

// Message handling functions
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => errorDiv.style.display = 'none', 6000);
    }
}

function showLoginSuccess(message) {
    const successDiv = document.getElementById('loginSuccess');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
    }
}

function hideLoginMessages() {
    const errorDiv = document.getElementById('loginError');
    const successDiv = document.getElementById('loginSuccess');
    if (errorDiv) errorDiv.style.display = 'none';
    if (successDiv) successDiv.style.display = 'none';
}

// Error message function
function getLoginErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/user-not-found':
            return 'No account found with this email. Ready to create one?';
        case 'auth/wrong-password':
            return 'Incorrect password. Please try again.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/user-disabled':
            return 'This account has been disabled. Contact support.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please wait and try again.';
        case 'auth/network-request-failed':
            return 'Network error. Please check your connection.';
        case 'auth/email-already-in-use':
            return 'An account with this email already exists.';
        case 'auth/weak-password':
            return 'Password is too weak. Please choose a stronger password.';
        default:
            return 'Authentication failed. Please try again.';
    }
}

// Initialize navigation when page loads
function initializeNavigation() {
    createSphereNavigation();
    
    // Set up event listeners
    const overlay = document.getElementById('sphereOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeSphereMenu);
    }

    // Close navigation menu with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeSphereMenu();
            // Also close login modal if open
            const loginModal = document.getElementById('loginModalOverlay');
            if (loginModal && loginModal.classList.contains('active')) {
                closeLoginModal();
            }
        }
    });

    // Close menu when clicking on menu items
    const menuItems = document.querySelectorAll('.sphere-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            closeSphereMenu();
        });
    });

    // Always check authentication, but only hide page if auth required
    if (sphereNavConfig.requireAuth) {
        // Hide page content initially for protected pages
        document.body.style.visibility = 'hidden';
    }

    // Always initialize authentication to update button state
    initializeAuthentication();
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
