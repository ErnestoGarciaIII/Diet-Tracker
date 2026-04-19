import { getUserId, getElement } from '../utils.js';
import { getFoodHistory, updateFoodEntry, deleteFoodEntry, clearFoodHistory, getNutrientProgress, getGenericProgress } from '../api.js';


let foodHistoryData = [];
let selectedDateString = new Date().toDateString();
let compareDateString = '';
let isCompareMode = false;
const mealSectionOrder = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

export async function initHistory() {
    if (typeof viewDate === 'undefined') {
        window.viewDate = new Date();
    }
    selectedDateString = new Date().toDateString();
    compareDateString = '';
    isCompareMode = false;

    const jumpBtn = getElement('jumpTodayBtn');
    if (jumpBtn) {
        jumpBtn.addEventListener('click', window.jumpToToday);
    }

    const compareModeBtn = getElement('compareModeBtn');
    if (compareModeBtn) {
        compareModeBtn.addEventListener('click', () => {
            window.toggleCompareMode();
        });
    }

    const clearCompareBtn = getElement('clearCompareBtn');
    if (clearCompareBtn) {
        clearCompareBtn.addEventListener('click', () => {
            window.clearCompareDate();
        });
    }

    try {
        // Fetch food history from database
        foodHistoryData = await getFoodHistory(getUserId());
    } catch (err) {
        console.error('Failed to load food history:', err);
        foodHistoryData = [];
    }

    renderCalendar();
    showDayDetails(selectedDateString); // Show today's details by default
    showCompareDayDetails(compareDateString);
    updateCompareControls();
}
// normalizes the history date values
function normalizeHistoryDate(dateValue) {
    if (!dateValue) return '';
    const parsed = new Date(dateValue);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toDateString();
    }
    return String(dateValue).trim();
}
// normalizes the meal tag values
function normalizeMealTag(mealTag) {
    const value = String(mealTag || '').trim().toLowerCase();
    if (value === 'breakfast') return 'Breakfast';
    if (value === 'lunch') return 'Lunch';
    if (value === 'dinner') return 'Dinner';
    if (value === 'snack' || value === 'snacks') return 'Snack';
    return 'Other';
}
// groups by meal Tag
function groupEntriesByMealTag(entries) {
    const grouped = {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snack: [],
        Other: []
    };

    entries.forEach(entry => {
        grouped[normalizeMealTag(entry.mealTag)].push(entry);
    });

    return grouped;
}
//Displays food log history
function createHistoryEntry(item, includeActions = false) {
    const entryDiv = document.createElement('div');
    const safeName = String(item.name || 'Unknown food');
    const safePortion = item.portion ?? 1;
    const safeUnit = item.unit || 'Serving';
    const safeMealTag = normalizeMealTag(item.mealTag);

    if (includeActions) {
        const escapedName = safeName.replace(/'/g, "\\'");
        entryDiv.innerHTML = `
        <div class="historyItem">
            <div class="foodInfo">
                <span class="label">${safeName}</span> <strong>|</strong>
                <span class="value">${safePortion} ${safeUnit}</span>
            </div>
            <div class="foodActions">
                <button class="delete-Btn" onclick="deleteFoodEntry(${item.id}, '${escapedName}')" aria-label="Delete food entry">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </div>
    `;
    } else {
        entryDiv.innerHTML = `
        <div class="historyItem">
            <div class="foodInfo">
                <span class="label">${safeName}</span> <strong>|</strong>
                <span class="value">${safePortion} ${safeUnit}</span>
            </div>
        </div>
    `;
    }

    return entryDiv;
}

async function renderGraphs(graphContainer, selectedDate) {
    console.log("graphContainer:", graphContainer);
    graphContainer.replaceChildren();
    const userId = getUserId();
    const nutrientProgress = await getNutrientProgress(userId, selectedDate);
    const actualConsumed = nutrientProgress[0];
    const percentConsumed = nutrientProgress[1];
    const dailyRecomended = nutrientProgress[2];
    const genericProgress = await getGenericProgress(userId, selectedDate);

    console.log(nutrientProgress);
    console.log(genericProgress);

    const nutrientGraph = document.createElement('section');
    nutrientGraph.className = 'nutrientGraph';

    const nutrientGraphHeader = document.createElement('h4');
    nutrientGraphHeader.className = 'nutrientGraphHeader';
    nutrientGraphHeader.innerText = 'Nutrients Progress';
    nutrientGraph.appendChild(nutrientGraphHeader);

    Object.keys(actualConsumed).forEach(nutrient => {
        nutrientGraph.appendChild(createGraphItem(`Total ${nutrient} consumed`, Math.round(actualConsumed[nutrient]*10)/10));
        nutrientGraph.appendChild(createGraphItem(`Daily ${nutrient} reccomended`, Math.round(dailyRecomended[nutrient]*10)/10));
        nutrientGraph.appendChild(createGraphItem(`Percentage of ${nutrient} consumed`, Math.round(parseFloat(percentConsumed[nutrient])*1000)/10, true));
    })

    graphContainer.appendChild(nutrientGraph);

    const genericGraph = document.createElement('section');
    genericGraph.className = 'genericGraph';

    const genericGraphHeader = document.createElement('h4');
    genericGraphHeader.className = 'genericGraphHeader';
    genericGraphHeader.innerText = 'General Progress';
    genericGraph.appendChild(genericGraphHeader);

    genericGraph.appendChild(createGraphItem(`Total Micronutrient Progress `, genericProgress[0]));
    genericGraph.appendChild(createGraphItem(`Total Macronutrient Progress `, genericProgress[1]));
    genericGraph.appendChild(createGraphItem(`Total Caloric Progress `, genericProgress[2], true));
    genericGraph.appendChild(createGraphItem(`Total Calories consumed `, Math.round(actualConsumed["Energy"]*10)/10));
    genericGraph.appendChild(createGraphItem(`Total recommended calories`, Math.round(dailyRecomended["Energy"]*10)/10));

    graphContainer.appendChild(genericGraph);
}

function createGraphItem(nutrient, value, percentage) {
    const entryDiv = document.createElement('div');
    entryDiv.innerHTML = `
        <div class="graphItem">
            <div class="nutrientInfo">
                <span class="label">${nutrient}</span> <strong>|</strong>
                <span class="value">${value}${percentage ? '%' : ''}</span>
            </div>
        </div>
        `;

    return entryDiv;
}

//organizes and renders entries grouped by meal tag
async function renderGroupedEntries(container, entries, includeActions = false) {
    const grouped = groupEntriesByMealTag(entries);

    mealSectionOrder.forEach(mealName => {
        const mealEntries = grouped[mealName];
        if (!mealEntries.length) return;

        const mealSection = document.createElement('section');
        mealSection.className = 'mealGroup';

        const mealHeader = document.createElement('h4');
        mealHeader.className = 'mealGroupHeader';
        mealHeader.innerText = mealName;

        mealSection.appendChild(mealHeader);

        mealEntries.forEach(item => {
            mealSection.appendChild(createHistoryEntry(item, includeActions));
        });

        container.appendChild(mealSection);
    });
}
//updates and renders the calendar view
function renderCalendar() {
    const grid = getElement('calendarGrid');
    const monthLabel = getElement('monthDisplay');

    if (!grid || !monthLabel) return;

    // Convert date strings to toDateString format for matching
    const history = foodHistoryData.map(item => ({
        date: normalizeHistoryDate(item.date),
        name: item.name
    }));
    const displayMonth = window.viewDate.getMonth();
    const displayYear = window.viewDate.getFullYear();

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

        const dayCard = document.createElement('div');
        const classes = ['calendarDay'];
        if (dayStr === selectedDateString) classes.push('active');
        if (compareDateString && dayStr === compareDateString) classes.push('compareActive');
        dayCard.className = classes.join(' ');

        dayCard.innerHTML = `
            <span class="dayNumber">${day}</span>
        `;
        
        dayCard.onclick = () => {
            if (isCompareMode) {
                if (dayStr === selectedDateString) {
                    alert('Choose a different day for comparison.');
                    return;
                }
                compareDateString = dayStr;
                isCompareMode = false;
                showCompareDayDetails(compareDateString);
                updateCompareControls();
                renderCalendar();
                return;
            }

            selectedDateString = dayStr;
            if (compareDateString && compareDateString === selectedDateString) {
                compareDateString = '';
            }
            renderCalendar();
            showDayDetails(dayStr);
            showCompareDayDetails(compareDateString);
            updateCompareControls();
        };
        grid.appendChild(dayCard);
    }
}

// SHows specific day details i.e. logged food, curent intake
function showDayDetails(dateString) {
    const graphContainer = getElement('historyGraph');
    const detailsContainer = getElement('historyList');
    const header = getElement('selectedDateHeader');
    if (!detailsContainer || !header || !graphContainer) return;

    const selectedDate = dateString || selectedDateString || new Date().toDateString();
    selectedDateString = selectedDate;

    header.innerText = `Selected: ${selectedDate}`;
    detailsContainer.innerHTML = '';

    const dayEntries = foodHistoryData.filter(item => normalizeHistoryDate(item.date) === selectedDate);

    if (dayEntries.length === 0) {
        detailsContainer.innerHTML = '<p class="text-muted">No food logged for this day.</p>';
        graphContainer.innerHTML = '';
        return;
    }

    renderGraphs(graphContainer, selectedDate);
    renderGroupedEntries(detailsContainer, dayEntries, true);
}

function showCompareDayDetails(dateString) {
    const graphContainer = getElement('compareGraph');
    const compareSection = getElement('compareDetails');
    const compareHeader = getElement('compareDateHeader');
    const compareContainer = getElement('compareHistoryList');
    if (!compareSection || !compareHeader || !compareContainer) return;

    compareContainer.innerHTML = '';

    if (!dateString) {
        compareSection.classList.add('hidden');
        compareHeader.innerText = 'Select Compare Two Dates, then pick another day.';
        return;
    }

    compareSection.classList.remove('hidden');
    compareHeader.innerText = `Compare: ${dateString}`;

    const dayEntries = foodHistoryData.filter(item => normalizeHistoryDate(item.date) === dateString);
    if (dayEntries.length === 0) {
        compareContainer.innerHTML = '<p class="text-muted">No food logged for this comparison day.</p>';
        graphContainer.innerHTML = '';
        return;
    }

    renderGraphs(graphContainer, dateString);
    renderGroupedEntries(compareContainer, dayEntries, false);
}

function updateCompareControls() {
    const compareModeBtn = getElement('compareModeBtn');
    const clearCompareBtn = getElement('clearCompareBtn');

    if (compareModeBtn) {
        if (isCompareMode) {
            compareModeBtn.innerHTML = '<i class="fa-solid fa-ban"></i> Cancel Compare';
        } else if (compareDateString) {
            compareModeBtn.innerHTML = '<i class="fa-solid fa-code-compare"></i> Pick New Compare Date';
        } else {
            compareModeBtn.innerHTML = '<i class="fa-solid fa-code-compare"></i> Compare Two Dates';
        }
    }

    if (clearCompareBtn) {
        clearCompareBtn.classList.toggle('hidden', !compareDateString);
    }
}

// Change month navigation
window.changeMonth = function(direction) {
    window.viewDate.setMonth(window.viewDate.getMonth() + direction);
    renderCalendar();
};

// Jump to today's date
window.jumpToToday = function() {
    window.viewDate = new Date();
    selectedDateString = window.viewDate.toDateString();
    renderCalendar();
    showDayDetails(selectedDateString);
    showCompareDayDetails(compareDateString);
    updateCompareControls();
};

window.toggleCompareMode = function() {
    isCompareMode = !isCompareMode;
    updateCompareControls();
};

window.clearCompareDate = function() {
    compareDateString = '';
    isCompareMode = false;
    showCompareDayDetails(compareDateString);
    renderCalendar();
    updateCompareControls();
};

// Clear all history
window.clearHistory = function() {
    if (confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
        clearFoodHistory(getUserId())
            .then(result => {
                // Clear local data
                foodHistoryData = [];
                compareDateString = '';
                isCompareMode = false;
                
                // Refresh the display
                renderCalendar();
                showDayDetails(selectedDateString);
                showCompareDayDetails(compareDateString);
                updateCompareControls();
                
                alert(result.message);
            })
            .catch(err => {
                console.error('Failed to clear food history:', err);
                alert('Failed to clear food history. Please try again.');
            });
    }
};

// Edit food entry
window.editFoodEntry = function(entryId, currentName, currentCalories, currentPortion) {
    const entry = foodHistoryData.find(item => item.id === entryId);
    const baseKcal = entry && entry.base_kcal ? entry.base_kcal : (currentCalories / (currentPortion || 1));

    const newPortion = parseFloat(prompt('Edit portion size:', currentPortion));
    if (isNaN(newPortion) || newPortion <= 0) {
        alert('Please enter a valid portion size.');
        return;
    }
    if (newPortion === currentPortion) {
        return; // No changes made
    }

    const newKcal = Math.round(baseKcal * newPortion);

    updateFoodEntry(entryId, getUserId(), { name: currentName, kcal: newKcal, portion: newPortion })
        .then(result => {
            // Updates local data
            const entryIndex = foodHistoryData.findIndex(item => item.id === entryId);
            if (entryIndex !== -1) {
                foodHistoryData[entryIndex].name = currentName.trim();
                foodHistoryData[entryIndex].kcal = newKcal;
                foodHistoryData[entryIndex].portion = newPortion;
                foodHistoryData[entryIndex].base_kcal = baseKcal;
            }
            renderCalendar();
            showDayDetails(selectedDateString);
            showCompareDayDetails(compareDateString);
            alert('Food entry updated successfully!');
        })
        .catch(err => {
            console.error('Failed to update food entry:', err);
            alert('Failed to update food entry. Please try again.');
        });
};

// Deletes food entry
window.deleteFoodEntry = async function(entryId, foodName) {
    if (!confirm(`Are you sure you want to delete "${foodName}"?`)) return;
    const entryBtn = document.querySelector(`button[onclick*="deleteFoodEntry(${entryId},"]`);
    const entryDiv = entryBtn ? entryBtn.closest('.historyItem') : null;
    if (entryDiv) entryDiv.remove();

    foodHistoryData = foodHistoryData.filter(item => item.id !== entryId);

    try {
        await deleteFoodEntry(entryId, getUserId());
        renderCalendar();
        showDayDetails(selectedDateString);
        showCompareDayDetails(compareDateString);
        updateCompareControls();
        alert('Food entry deleted successfully!');
    } catch (err) {
        console.error('Failed to delete food entry:', err);
        alert('Failed to delete food entry. Please try again.');

    }
};
