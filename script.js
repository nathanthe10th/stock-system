// Stock System JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Hamburger menu functionality
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const sidebar = document.getElementById('sidebar');

    hamburgerMenu.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        
        if (sidebar.classList.contains('active')) {
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
                
                overlay.addEventListener('click', function() {
                    sidebar.classList.remove('active');
                    overlay.style.display = 'none';
                });
            }
            document.querySelector('.overlay').style.display = 'block';
        } else {
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.style.display = 'none';
        }
    });

    // Navigation item click handlers
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            sidebar.classList.remove('active');
            const overlay = document.querySelector('.overlay');
            if (overlay) overlay.style.display = 'none';
        });
    });

    // Search functionality
    const searchBar = document.querySelector('.search-bar');
    searchBar.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Searching for:', searchTerm);
        
        // Filter visible item rows by name
        document.querySelectorAll('.item-row').forEach(row => {
            const nameInput = row.querySelector('.item-name-input');
            if (nameInput) {
                const name = nameInput.value.toLowerCase();
                // Only show items that start with the search term
                row.style.display = name.startsWith(searchTerm) ? '' : 'none';
            }
        });
    });
});
