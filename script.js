// Stock System JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Navigation item click handlers
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            // Add active class to clicked item
            this.classList.add('active');
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
