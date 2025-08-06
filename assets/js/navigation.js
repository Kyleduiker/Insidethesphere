// Navigation functionality for Inside The Sphere

// Define functions globally immediately
function toggleSphereMenu() {
    console.log('Toggle menu function called');
    const menu = document.getElementById('spherePopoutMenu');
    const overlay = document.getElementById('sphereOverlay');
    const menuBtn = document.querySelector('.sphere-menu-btn');
    
    if (menu && overlay && menuBtn) {
        const isActive = menu.classList.contains('active');
        
        if (isActive) {
            menu.classList.remove('active');
            overlay.classList.remove('active');
            menuBtn.classList.remove('active');
            console.log('Menu closed');
        } else {
            menu.classList.add('active');
            overlay.classList.add('active');
            menuBtn.classList.add('active');
            console.log('Menu opened');
        }
    } else {
        console.error('One or more navigation elements not found');
    }
}

function closeSphereMenu() {
    console.log('Close menu function called');
    const menu = document.getElementById('spherePopoutMenu');
    const overlay = document.getElementById('sphereOverlay');
    const menuBtn = document.querySelector('.sphere-menu-btn');
    
    if (menu && overlay && menuBtn) {
        menu.classList.remove('active');
        overlay.classList.remove('active');
        menuBtn.classList.remove('active');
        console.log('Menu closed');
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
    initializeNavigation();
}

function initializeNavigation() {
    console.log('Initializing navigation...');
    
    // Add event listeners for additional functionality
    const overlay = document.getElementById('sphereOverlay');
    if (overlay) {
        overlay.addEventListener('click', closeSphereMenu);
        console.log('Overlay click listener added');
    }

    // Close menu with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            console.log('Escape key pressed');
            closeSphereMenu();
        }
    });

    // Close menu when clicking on menu items
    const menuItems = document.querySelectorAll('.sphere-menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            console.log('Menu item clicked');
            closeSphereMenu();
        });
    });

    console.log('Navigation initialization complete');
}

// Test that the functions are available
console.log('Navigation JS loaded successfully');
console.log('toggleSphereMenu function defined:', typeof toggleSphereMenu);
console.log('closeSphereMenu function defined:', typeof closeSphereMenu);
