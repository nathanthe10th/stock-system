// Stock System JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu functionality
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');

    hamburgerMenu.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        
        // Optional: Add overlay when sidebar is open
        if (sidebar.classList.contains('active')) {
            // Create overlay if it doesn't exist
            if (!document.querySelector('.overlay')) {
                const overlay = document.createElement('div');
                overlay.className = 'overlay';
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    z-index: 998;
                    display: none;
                `;
                document.body.appendChild(overlay);
                
                // Close sidebar when clicking overlay
                overlay.addEventListener('click', function() {
                    sidebar.classList.remove('active');
                    overlay.style.display = 'none';
                });
            }
            document.querySelector('.overlay').style.display = 'block';
        } else {
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        }
    });

    // Navigation item click handlers
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
            
            // Close sidebar after selection (optional)
            sidebar.classList.remove('active');
            const overlay = document.querySelector('.overlay');
            if (overlay) {
                overlay.style.display = 'none';
            }
        });
    });

    // Add button functionality
    const addBtn = document.querySelector('.add-btn');
    addBtn.addEventListener('click', function() {
        console.log('Add button clicked');
        // Add functionality will be implemented later
    });

    // Remove button functionality
    const removeBtn = document.querySelector('.remove-btn');
    removeBtn.addEventListener('click', function() {
        console.log('Remove button clicked');
        // Remove functionality will be implemented later
    });

    // Search functionality
    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Searching for:', searchTerm);
        // Search functionality will be implemented later
    });
});
