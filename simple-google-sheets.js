// Simple Google Sheets Integration via Apps Script (JSONP for GET, no-cors for POST)
class SimpleGoogleSheets {
    constructor() {
        this.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwaesDJC5rVG6x5LHIkHDk4-RKbOr9x0BTckhpIlEps8KZg7ERCPhH5K6g4gzs-Zg/exec';
        this.sheetData = [];
        this.updateTimeout = null; // For batching quantity updates
        this.isInitialLoad = true; // Track if this is the first load
        this.broadcastChannel = null; // For cross-tab communication
        this.initBroadcastChannel();
    }

    // Initialize broadcast channel for cross-tab communication
    initBroadcastChannel() {
        try {
            this.broadcastChannel = new BroadcastChannel('stock_system_updates');
            console.log('BroadcastChannel initialized successfully');
            
            // Listen for messages from other tabs
            this.broadcastChannel.onmessage = (event) => {
                console.log('Received message via BroadcastChannel:', event.data);
                if (event.data.type === 'data_changed') {
                    console.log('Received update signal from another tab');
                    this.loadSheetData(); // Reload data
                }
            };
        } catch (error) {
            console.log('BroadcastChannel not supported, using localStorage fallback');
            // Fallback for browsers that don't support BroadcastChannel
            this.initLocalStorageFallback();
        }
    }

    // Fallback using localStorage for cross-tab communication
    initLocalStorageFallback() {
        console.log('Initializing localStorage fallback');
        window.addEventListener('storage', (event) => {
            console.log('Storage event received:', event);
            if (event.key === 'stock_system_update') {
                console.log('Received update signal via localStorage');
                this.loadSheetData(); // Reload data
            }
        });
    }

    // Broadcast change to all other tabs
    broadcastChange() {
        const message = { type: 'data_changed', timestamp: Date.now() };
        console.log('Broadcasting change:', message);
        
        if (this.broadcastChannel) {
            console.log('Using BroadcastChannel');
            this.broadcastChannel.postMessage(message);
        } else {
            console.log('Using localStorage fallback');
            // Fallback to localStorage
            localStorage.setItem('stock_system_update', JSON.stringify(message));
            // Clear after a short delay to prevent immediate re-trigger
            setTimeout(() => localStorage.removeItem('stock_system_update'), 100);
        }
    }

    // GET: Load data using JSONP (bypasses CORS)
    loadSheetData() {
        const contentArea = document.querySelector('.content-area');
        
        // Only show loading text on initial boot
        if (this.isInitialLoad) {
            contentArea.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">Loading...</p>';
        }

        // Remove any previous JSONP script tag
        const old = document.getElementById('jsonp-script');
        if (old) old.remove();

        // Define the global callback Apps Script will call
        window.handleSheetData = (data) => {
            this.sheetData = data;
            this.displayItems();
            console.log('Data loaded:', data);
            this.isInitialLoad = false; // After first load, no longer initial
        };

        // Inject script tag — Apps Script will respond with handleSheetData([...])
        const script = document.createElement('script');
        script.id = 'jsonp-script';
        script.src = `${this.APPS_SCRIPT_URL}?callback=handleSheetData`;
        script.onerror = () => {
            if (this.isInitialLoad) {
                contentArea.innerHTML = `<div style="text-align:center; padding:40px; color:#721c24; background:#f8d7da; border-radius:8px; margin:20px;">
                    ❌ Could not load data. Make sure your Apps Script is deployed with "Anyone" access and the Code.gs is up to date.
                </div>`;
            }
        };
        document.body.appendChild(script);
    }

    // SEND: Add new item (no-cors POST — we don't need to read the response)
    async addItem(name, day, month, year, quantity) {
        try {
            // Immediately add to local data and display
            this.sheetData.push([name, day, month, year, quantity]);
            this.displayItems();
            
            await fetch(this.APPS_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'add', name, day, month, year, quantity })
            });
            console.log('Item added:', { name, day, month, year, quantity });
            
            // Broadcast change to all other tabs
            this.broadcastChange();
            
            // Still reload after a delay to sync with Google Sheet
            setTimeout(() => this.loadSheetData(), 1500);
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Error adding item: ' + error.message);
        }
    }

    // SEND: Update item quantity (no-cors POST)
    async updateItemQuantity(name, newQuantity, day = '', month = '', year = '') {
        // Clear any existing timeout
        if (this.updateTimeout) {
            clearTimeout(this.updateTimeout);
        }
        
        // Set new timeout to send data after 5 seconds
        this.updateTimeout = setTimeout(async () => {
            try {
                await fetch(this.APPS_SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'update', name, quantity: newQuantity, day, month, year })
                });
                console.log('Quantity updated:', { name, newQuantity, day, month, year });
                
                // Broadcast change to all other tabs
                this.broadcastChange();
                
                setTimeout(() => this.loadSheetData(), 1500);
            } catch (error) {
                console.error('Error updating quantity:', error);
            }
        }, 5000); // Wait 5 seconds before sending
    }

    displayItems() {
        const contentArea = document.querySelector('.content-area');
        contentArea.innerHTML = '';

        if (!this.sheetData || this.sheetData.length === 0) {
            contentArea.innerHTML = '<p style="text-align:center; color:#666; padding:40px;">No items found. Add some items to your Google Sheet!</p>';
            return;
        }

        // Group items by name to find all dates for each food and calculate totals
        const itemsByName = {};
        this.sheetData.forEach((row, index) => {
            const [name, day, month, year, quantity] = row;
            console.log('Row data:', { name, day, month, year, quantity }); // Debug log
            
            if (!name) return;

            // Convert date objects to strings if needed
            const dayStr = day instanceof Date ? day.getDate().toString().padStart(2, '0') : (day || '').toString();
            const monthStr = month instanceof Date ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month.getMonth()] : (month || '').toString();
            const yearStr = year instanceof Date ? year.getFullYear().toString() : (year || '').toString();

            // Group by name and calculate total quantity
            if (!itemsByName[name]) {
                itemsByName[name] = {
                    entries: [],
                    totalQuantity: 0
                };
            }
            itemsByName[name].entries.push({ day: dayStr, month: monthStr, year: yearStr, quantity: quantity || 0, index });
            itemsByName[name].totalQuantity += (quantity || 0);
        });

        // Create one row per unique item name with total quantity
        Object.keys(itemsByName).forEach(name => {
            const itemData = itemsByName[name];
            // Use the first entry's data for the main row
            const firstEntry = itemData.entries[0];
            contentArea.appendChild(this.createItemRow(name, firstEntry.day, firstEntry.month, firstEntry.year, itemData.totalQuantity, firstEntry.index, itemData.entries));
        });
    }

    createItemRow(name, day, month, year, quantity, index, allEntries = []) {
        console.log('Creating item row with:', { name, day, month, year, quantity }); // Debug log
        
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row';
        itemRow.innerHTML = `
            <div class="item-info">
                <input type="text" class="item-name-input" value="${name}" readonly>
                <div class="date-dropdowns">
                    <select class="day-select">${this.generateDayOptions(day)}</select>
                    <select class="month-select">${this.generateMonthOptions(month)}</select>
                    <select class="year-select">${this.generateYearOptions(year)}</select>
                </div>
            </div>
            <div class="button-group">
                <button class="btn add-btn">+</button>
                <span class="item-count">${quantity}</span>
                <button class="btn remove-btn">-</button>
            </div>
        `;

        const countSpan = itemRow.querySelector('.item-count');

        // Add click handler to show all dates for this item
        const nameInput = itemRow.querySelector('.item-name-input');
        nameInput.style.cursor = 'pointer';
        nameInput.addEventListener('click', () => {
            this.toggleDateList(itemRow, name, allEntries);
        });

        itemRow.querySelector('.add-btn').addEventListener('click', () => {
            const newQty = parseInt(countSpan.textContent) + 1;
            countSpan.textContent = newQty;
            
            // Get date from dropdowns
            const daySelect = itemRow.querySelector('.day-select');
            const monthSelect = itemRow.querySelector('.month-select');
            const yearSelect = itemRow.querySelector('.year-select');
            
            const day = daySelect ? daySelect.value : '';
            const month = monthSelect ? monthSelect.value : '';
            const year = yearSelect ? yearSelect.value : '';
            
            this.updateItemQuantity(name, newQty, day, month, year);
        });

        itemRow.querySelector('.remove-btn').addEventListener('click', () => {
            const current = parseInt(countSpan.textContent);
            if (current > 0) {
                const newQty = current - 1;
                countSpan.textContent = newQty;
                
                // Get date from dropdowns
                const daySelect = itemRow.querySelector('.day-select');
                const monthSelect = itemRow.querySelector('.month-select');
                const yearSelect = itemRow.querySelector('.year-select');
                
                const day = daySelect ? daySelect.value : '';
                const month = monthSelect ? monthSelect.value : '';
                const year = yearSelect ? yearSelect.value : '';
                
                this.updateItemQuantity(name, newQty, day, month, year);
            }
        });

        return itemRow;
    }

    // Toggle date list dropdown for an item
    toggleDateList(itemRow, itemName, allEntries) {
        // Remove any existing date list (look for it as next sibling)
        const existingList = itemRow.nextElementSibling;
        if (existingList && existingList.className === 'date-list-dropdown') {
            existingList.remove();
            return;
        }

        // Create date list dropdown
        const dateList = document.createElement('div');
        dateList.className = 'date-list-dropdown';

        // Always show all entries, even if there's only one
        // Filter out entries with 0 quantity or no date set
        const entriesWithQuantity = allEntries.filter(entry => 
            entry.quantity > 0 && entry.day && entry.month && entry.year
        );
        
        if (entriesWithQuantity.length === 0) {
            dateList.innerHTML = '<div class="date-list-item">No entries with quantity and date found</div>';
            itemRow.parentNode.insertBefore(dateList, itemRow.nextSibling);
            return;
        }

        entriesWithQuantity.forEach(entry => {
            const dateItem = document.createElement('div');
            dateItem.className = 'date-list-item';
            
            // Format date display
            const dateStr = entry.day && entry.month && entry.year 
                ? `${entry.day} ${entry.month} ${entry.year}`
                : 'No date set';
            
            dateItem.innerHTML = `
                <div class="date-list-info">
                    <input type="text" class="item-name-input" value="${itemName}" readonly>
                    <div class="date-display">${dateStr}</div>
                </div>
                <div class="button-group">
                    <button class="btn add-btn">+</button>
                    <span class="item-count">${entry.quantity}</span>
                    <button class="btn remove-btn">-</button>
                </div>
            `;
            
            // Add event listeners for this date entry
            const countSpan = dateItem.querySelector('.item-count');
            dateItem.querySelector('.add-btn').addEventListener('click', () => {
                const newQty = parseInt(countSpan.textContent) + 1;
                countSpan.textContent = newQty;
                
                // Use the original date values from this entry for update
                this.updateItemQuantity(itemName, newQty, entry.day, entry.month, entry.year);
            });

            dateItem.querySelector('.remove-btn').addEventListener('click', () => {
                const current = parseInt(countSpan.textContent);
                if (current > 0) {
                    const newQty = current - 1;
                    countSpan.textContent = newQty;
                    
                    // Use the original date values from this entry for update
                    this.updateItemQuantity(itemName, newQty, entry.day, entry.month, entry.year);
                }
            });

            dateList.appendChild(dateItem);
        });

        // Insert date list directly under the item row
        itemRow.parentNode.insertBefore(dateList, itemRow.nextSibling);
    }

    generateDayOptions(selectedDay) {
        let options = '';
        for (let i = 1; i <= 31; i++) {
            const day = i.toString().padStart(2, '0');
            options += `<option value="${day}" ${day === selectedDay ? 'selected' : ''}>${day}</option>`;
        }
        return options;
    }

    generateMonthOptions(selectedMonth) {
        const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        return months.map(m => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${m}</option>`).join('');
    }

    generateYearOptions(selectedYear) {
        let options = '';
        for (let year = 2020; year <= 2030; year++) {
            options += `<option value="${year}" ${year.toString() === selectedYear ? 'selected' : ''}>${year}</option>`;
        }
        return options;
    }
}

// Initialize
let simpleSheets;

window.onload = function() {
    simpleSheets = new SimpleGoogleSheets();
    simpleSheets.loadSheetData();
    setupEventListeners();
    
    // Add test function to console for debugging
    window.testBroadcast = () => {
        console.log('Testing broadcast manually...');
        simpleSheets.broadcastChange();
    };
};

function setupEventListeners() {
    const addNewItemBtn = document.getElementById('addNewItemBtn');
    const addItemModal  = document.getElementById('addItemModal');
    const closeModal    = document.getElementById('closeModal');
    const newItemInput  = document.getElementById('newItemName');
    const confirmAddBtn = document.getElementById('confirmAddBtn');
    const cancelAddBtn  = document.getElementById('cancelAddBtn');

    if (!addNewItemBtn) return;

    addNewItemBtn.addEventListener('click', () => {
        addItemModal.style.display = 'block';
        newItemInput.value = '';
        newItemInput.focus();
    });

    closeModal.addEventListener('click',    () => { addItemModal.style.display = 'none'; });
    cancelAddBtn.addEventListener('click',  () => { addItemModal.style.display = 'none'; });

    confirmAddBtn.addEventListener('click', () => {
        const itemName = newItemInput.value.trim();
        if (itemName) {
            // Get current date values from dropdowns, don't auto-set
            const daySelect = document.querySelector('.day-select');
            const monthSelect = document.querySelector('.month-select');
            const yearSelect = document.querySelector('.year-select');
            
            const day = daySelect ? daySelect.value : '';
            const month = monthSelect ? monthSelect.value : '';
            const year = yearSelect ? yearSelect.value : '';
            
            // Only add item if at least one date field is selected
            if (day || month || year) {
                simpleSheets.addItem(itemName, day, month, year, 0);
            } else {
                // Add without date if none selected
                simpleSheets.addItem(itemName, '', '', '', 0);
            }
            
            addItemModal.style.display = 'none';
        }
    });

    newItemInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') confirmAddBtn.click(); });
    addItemModal.addEventListener('click', (e) => { if (e.target === addItemModal) addItemModal.style.display = 'none'; });
    addItemModal.querySelector('.modal-content').addEventListener('click', (e) => { e.stopPropagation(); });
}