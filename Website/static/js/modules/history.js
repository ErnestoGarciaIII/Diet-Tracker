import { getUserId } from '../utils.js';
import { getFoodHistory, updateFoodEntry, deleteFoodEntry, clearFoodHistory } from '../api.js';

let foodHistoryData = [];

export async function initHistory() {
    // Initialize viewDate to current date
    if (typeof viewDate === 'undefined') {
        window.viewDate = new Date();
    }
    
    try {
        // Fetch food history from database
        foodHistoryData = await getFoodHistory(getUserId());
    } catch (err) {
        console.error('Failed to load food history:', err);
        foodHistoryData = [];
    }
    
    renderCalendar();
    showDayDetails(new Date().toDateString()); // Show today's details by default
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('monthDisplay');

    if (!grid || !monthLabel) return;

    // Convert date strings to toDateString format for matching
    const history = foodHistoryData.map(item => ({
        date: item.date,
        name: item.name,
        kcal: item.kcal
    }));
    const now = new Date();
    const displayMonth = window.viewDate.getMonth();
    const displayYear = window.viewDate.getFullYear();

    const dailyGoal = 2000; // This will change based on the selected goal

    // Display Month Name
    monthLabel.innerText = window.viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    // Clears the grid but keeps the weekday labels if we have them
    const labels = `
    <div class="dayLabel">Sun</div>
    <div class="dayLabel">Mon</div>
    <div class="dayLabel">Tue</div>
    <div class="dayLabel">Wed</div>
    <div class="dayLabel">Thu</div>
    <div class="dayLabel">Fri</div>
    <div class="dayLabel">Sat</div>`;
    grid.innerHTML = labels;

    // Gets the  first day of month (0 = Sunday, 1 = Monday...)
    const firstDay = new Date(displayYear, displayMonth, 1).getDay();
    // Get the total days in a month
    const lastDayDate = new Date(displayYear, displayMonth + 1, 0).getDate();

    // Adds Empty Slots for previous month padding
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendarDay empty';
        grid.appendChild(emptyDiv);
    }

    // Add Actual Days
    for (let day = 1; day <= lastDayDate; day++) {
        const dateObj = new Date(displayYear, displayMonth, day);
        const dayStr = dateObj.toDateString();
        const dayLogs = history.filter(item => item.date === dayStr);
        const totalCals = dayLogs.reduce((sum, item) => sum + item.kcal, 0);

        const dayCard = document.createElement('div');
        dayCard.className = `calendarDay ${dayStr === new Date().toDateString() ? 'active' : ''}`;
        
        const kcalClass = totalCals > dailyGoal ? 'goalExceeded' : 'goalMet';

        dayCard.innerHTML = `
            <span class="dayNumber">${day}</span>
            ${totalCals > 0 ? `<span class="dayKcal ${kcalClass}">${totalCals} kcal</span>` : ''}
        `;
        
        dayCard.onclick = () => showDayDetails(dayStr, dayLogs);
        grid.appendChild(dayCard);
    }
}

// SHows specific day details i.e. logged food, curent intake
function showDayDetails(dateStr, logs) {
    document.getElementById('selectedDateHeader').innerText = dateStr || 'Select a day';
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (!logs) {
        logs = foodHistoryData.filter(item => item.date === dateStr);
    }

    if (logs.length === 0) {
        list.innerHTML = '<li>No logs for this day</li>';
        return;
    }

    logs.reverse().forEach(log => {
        const item = document.createElement('div');
        item.className = "historyItem";
        item.innerHTML = `
            <div class="food-info">
                <span class="label"><strong>${log.name}</strong></span>
                <span class="value">${log.kcal} kcal</span>
            </div>
            <div class="food-actions">
                <button class="edit-btn" onclick="editFoodEntry(${log.id}, '${log.name}', ${log.kcal})">
                    <i class="fa-solid fa-edit"></i>
                </button>
                <button class="delete-btn" onclick="deleteFoodEntry(${log.id}, '${log.name}')">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(item);
    });
}

// Change month navigation
window.changeMonth = function(direction) {
    window.viewDate.setMonth(window.viewDate.getMonth() + direction);
    renderCalendar();
};

// Jump to today's date
window.jumpToToday = function() {
    window.viewDate = new Date();
    renderCalendar();
    showDayDetails(new Date().toDateString());
};

// Clear all history
window.clearHistory = function() {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
        clearFoodHistory(getUserId())
            .then(result => {
                // Clear local data
                foodHistoryData = [];
                
                // Refresh the display
                renderCalendar();
                showDayDetails();
                
                alert(result.message);
            })
            .catch(err => {
                console.error('Failed to clear food history:', err);
                alert('Failed to clear food history. Please try again.');
            });
    }
};

// Edit food entry
window.editFoodEntry = function(entryId, currentName, currentCalories) {
    const newName = prompt('Edit food name:', currentName);
    if (newName === null) return; // User cancelled
    
    const newCalories = parseInt(prompt('Edit calories:', currentCalories));
    if (isNaN(newCalories) || newCalories < 0) {
        alert('Please enter a valid number of calories.');
        return;
    }
    
    if (newName.trim() === '' || newCalories === currentCalories && newName === currentName) {
        return; // No changes made
    }
    
    // Update the entry
    updateFoodEntry(entryId, getUserId(), { name: newName.trim(), kcal: newCalories })
        .then(result => {
            // Update local data
            const entryIndex = foodHistoryData.findIndex(item => item.id === entryId);
            if (entryIndex !== -1) {
                foodHistoryData[entryIndex].name = newName.trim();
                foodHistoryData[entryIndex].kcal = newCalories;
            }
            
            // Refresh the display
            renderCalendar();
            showDayDetails(document.getElementById('selectedDateHeader').innerText);
            
            alert('Food entry updated successfully!');
        })
        .catch(err => {
            console.error('Failed to update food entry:', err);
            alert('Failed to update food entry. Please try again.');
        });
};

// Deletes food entry
window.deleteFoodEntry = function(entryId, foodName) {
    if (!confirm(`Are you sure you want to delete "${foodName}"?`)) {
        return;
    }
    
    deleteFoodEntry(entryId, getUserId())
        .then(result => {
            // Remove from local data
            foodHistoryData = foodHistoryData.filter(item => item.id !== entryId);
            
            // Refresh the display
            renderCalendar();
            showDayDetails(document.getElementById('selectedDateHeader').innerText);
            
            alert('Food entry deleted successfully!');
        })
        .catch(err => {
            console.error('Failed to delete food entry:', err);
            alert('Failed to delete food entry. Please try again.');
        });
};