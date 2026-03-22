// ---------------------- Authentication & Display Logic ------------------
document.addEventListener('DOMContentLoaded', () => {
    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;

            if (email && pass.length >= 8) {
                localStorage.setItem('userEmailDisplay', email);
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'dashboard.html';
            } else {
                alert("Please enter a valid email and 8+ character password.");
            }
        });
    }

    // --- SIGNUP LOGIC ---
    const signupForm = document.getElementById('credentialsForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (pass !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            localStorage.setItem('userNameDisplay', fullName);
            localStorage.setItem('userEmailDisplay', email);
            localStorage.setItem('userPassword', pass);
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'userInfo.html';
        });
    }

    // --- GLOBAL DATA DISPLAY ---
    const email = localStorage.getItem('userEmailDisplay') || 'Guest';
    const fullName = localStorage.getItem('userNameDisplay') || 'Guest User';
    const gender = localStorage.getItem('userGenderDisplay') || '--';
    const age = localStorage.getItem('userAgeDisplay') || '--';
    const weight = localStorage.getItem('userWeightDisplay') || '--';
    const height = localStorage.getItem('userHeightDisplay') || '--';
    const savedAvatar = localStorage.getItem('userAvatar');

    // Sync Text Fields
    const updateText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.innerText = (val && val !== "null") ? val : '--';
    };

    updateText('userNameDisplay', fullName);
    updateText('userGenderDisplay', gender);
    updateText('userAgeDisplay', age);
    updateText('userWeightDisplay', weight);
    updateText('userHeightDisplay', height);
    updateText('userEmailDisplay', email);
    updateText('userPassword', '••••••••');

    // Show full email (no splitting)
    const emailEl = document.getElementById('userEmailDisplay');
    if (emailEl) emailEl.innerText = email;

    // Sync Profile Pictures Across All Pages
    if (savedAvatar) {
        const allProfileImages = document.querySelectorAll('#profilePreview, #registrationPreview, .navAvatar');
        allProfileImages.forEach(img => {
            img.src = savedAvatar;
        });
    }

    // Load Restrictions List for Dashboard
    const list = document.getElementById('profileList');
    if (list) {
        const restrictions = JSON.parse(localStorage.getItem('userRestrictions') || '[]');
        list.innerHTML = ''; 
        restrictions.forEach(res => {
            let li = document.createElement('li');
            li.innerText = `🚫 ${res}`;
            list.appendChild(li);
        });
    }

    // Check if we are on the history page
    if (document.getElementById('calendarGrid')) {
        renderCalendar();
    }
});

let isEditing = false;

//edit mode for settings page
function enterEditMode(fieldId, label) {
    if (isEditing) return;
    isEditing = true;

    const valSpan = document.getElementById(fieldId);
    const currentValue = valSpan.innerText;

    valSpan.innerHTML = `<input type="text" id="editInput" value="${currentValue}" style="width: 70px; padding: 2px 5px; border-radius: 4px; border: 1px solid #16a34a; font-size: bold;">`;
    
    document.getElementById('editInput').focus();
    const controls = document.getElementById('editControls');
    controls.style.setProperty('display', 'flex', 'important');
   
}

// --- UPDATED EXIT EDIT MODE ---
function exitEditMode(save) {
    const input = document.getElementById('editInput');
    if (!input) return;

    const parentSpan = input.parentElement;
    const fieldId = parentSpan.id;
    const newValue = input.value.trim();

    if (save && newValue !== "") {
        // Special case for Password
        if (fieldId === 'userPassword') {
            if (newValue.length < 8) {
                alert("Password must be at least 8 characters long.");
                return; // Don't exit edit mode if invalid
            }
            localStorage.setItem('userPassword', newValue);
            parentSpan.innerText = "••••••••"; // Keep it masked
        } else {
            // Standard Biometric Save
            localStorage.setItem(fieldId, newValue);
            parentSpan.innerText = newValue;
        }
        showSuccessFeedback();
    } else {
        // Revert if cancelled
        if (fieldId === 'userPassword') {
            parentSpan.innerText = "••••••••";
        } else {
            parentSpan.innerText = localStorage.getItem(fieldId) || "--";
        }
    }

    const controls = document.getElementById('editControls');
    controls.style.setProperty('display', 'none', 'important');
    isEditing = false;
}

// --- DELETE ACCOUNT LOGIC ---
function deleteAccount() {
    const confirmDelete = confirm("⚠️ WARNING: This will permanently delete your profile, progress, and settings. This cannot be undone. Proceed?");
    
    if (confirmDelete) {
        localStorage.clear();
        sessionStorage.clear();
        
        // Show a quick alert before leaving
        alert("Account deleted. Redirecting to home page...");
        window.location.href = "home.html";
    }
}

// --- FEEDBACK NOTIFICATION ---
function showSuccessFeedback() {
    const msg = document.createElement('div');
    msg.innerText = "✓ Changes saved successfully";
    msg.style = `
        position: fixed; 
        bottom: 30px; 
        left: 50%; 
        transform: translateX(-50%); 
        background: #16a34a; 
        color: white; 
        padding: 12px 24px; 
        border-radius: 30px; 
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
        font-weight: 500;
        transition: opacity 0.5s ease;
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 500);
    }, 2500);
}

// --------------------------- UserInfo & Profile Picture Logic ---------------------------
const dietaryForm = document.getElementById('dietary-form');
const fileInput = document.getElementById('hiddenFileInput') || document.getElementById('userAvatarInput');
const uploadTrigger = document.getElementById('uploadTrigger');
const removeBtn = document.getElementById('removePic');

// Handle Profile Picture Uploads/Previews
if (uploadTrigger && fileInput) {
    uploadTrigger.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const allPreviews = document.querySelectorAll('#profilePreview, #registrationPreview, .navAvatar');
                allPreviews.forEach(img => img.setAttribute('src', e.target.result));
                
                // Save to localStorage immediately
                localStorage.setItem('userAvatar', e.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Remove picture (Settings page only)
if (removeBtn) {
    removeBtn.addEventListener('click', () => {
        const defaultAvatar = 'images/defaultAvatar.jpg';
        const allPreviews = document.querySelectorAll('#profilePreview, .navAvatar');
        allPreviews.forEach(img => img.setAttribute('src', defaultAvatar));
        localStorage.removeItem('userAvatar');
        if (fileInput) fileInput.value = ""; 
    });
}

// Handle UserInfo Form Submission
if (dietaryForm) {
    dietaryForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // MANDATORY: Check if a profile picture was uploaded
        if (!localStorage.getItem('userAvatar')) {
            alert("Please upload a profile picture to complete your registration.");
            return;
        }

        const age = document.getElementById('userAgeDisplay').value;
        const weight = document.getElementById('userWeightDisplay').value;
        const height = document.getElementById('userHeightDisplay').value;
        const genderEl = document.querySelector('input[name="gender"]:checked');
        const gender = genderEl ? genderEl.value : 'Not Specified';

        // Save Biometrics
        localStorage.setItem('userAgeDisplay', age);
        localStorage.setItem('userGenderDisplay', gender);
        localStorage.setItem('userHeightDisplay', height);
        localStorage.setItem('userWeightDisplay', weight);
        
        
        
    });
}

function nextStep() {
    // 1. Manually grab the values since the submit listener might be skipped
    const age = document.getElementById('userAgeDisplay').value;
    const weight = document.getElementById('userWeightDisplay').value;
    const height = document.getElementById('userHeightDisplay').value;
    const genderEl = document.querySelector('input[name="gender"]:checked');
    const gender = genderEl ? genderEl.value : 'Not Specified';

    // 2. Mandatory Avatar Check
    if (!localStorage.getItem('userAvatar')) {
        alert("Please upload a profile picture to complete your registration.");
        return;
    }

    // 3. Save to localStorage
    localStorage.setItem('userAgeDisplay', age);
    localStorage.setItem('userWeightDisplay', weight);
    localStorage.setItem('userHeightDisplay', height);
    localStorage.setItem('userGenderDisplay', gender);

    // 4. Move to next page
    window.location.href = 'goals.html'; 
}


// --------------------------- Goals page JavaScript ---------------------------
let userGoalSelection = localStorage.getItem('userGoal') || '';

function selectGoal(element, goal) {
    const allCards = document.querySelectorAll('.goalCard');
    allCards.forEach(card => card.classList.remove('selected'));
    element.classList.add('selected');
    
    userGoalSelection = goal;
    localStorage.setItem('userGoal', goal);
}

function nextStep2() {
    if (!userGoalSelection) {
        alert("Please select a goal to proceed!");
        return;
    }
    window.location.href = 'dashboard.html';
}

// --------------------------- Restrictions page JavaScript ---------------------------
let selectedRestrictions = [];

function toggleTag(element, value) {
    const index = selectedRestrictions.indexOf(value);
    if (index > -1) {
        selectedRestrictions.splice(index, 1);
        element.classList.remove('tag-active');
    } else {
        selectedRestrictions.push(value);
        element.classList.add('tag-active');
    }
}

function finishOnboarding() {
    localStorage.setItem('userRestrictions', JSON.stringify(selectedRestrictions));
    window.location.href = 'dashboard.html';
}

/* ------------The following code is for food logging page ------------ */
function logFood() {
    const foodEl = document.getElementById('foodInput');
    const calEl = document.getElementById('calInput');
    
    const foodName = foodEl.value;
    const calories = parseInt(calEl.value);

    if (foodName && !isNaN(calories)) {
        const today = new Date().toDateString();
        
        // 1. Update Global Progress (for the plane)
        let currentProgress = parseInt(localStorage.getItem('savedProgress')) || 0;
        currentProgress += calories;
        localStorage.setItem('savedProgress', currentProgress);

        // 2. Save to Permanent History
        let history = JSON.parse(localStorage.getItem('foodHistory')) || [];
        history.push({
            date: today,
            name: foodName,
            kcal: calories,
            timestamp: new Date().getTime()
        });
        localStorage.setItem('foodHistory', JSON.stringify(history));

        // 3. Update UI Log
        const logEntry = document.createElement('li');
        logEntry.innerHTML = `<span>${foodName}</span> <strong>+${calories}</strong>`;
        document.getElementById('foodLog').prepend(logEntry);

        foodEl.value = "";
        calEl.value = "";
        showSuccessFeedback();
    } else {
        alert("Please enter both food name and calories.");
    }
}

/* ---------------------------------- History Page Logic ------------------------------------------------- */

let viewDate = new Date();

function changeMonth(offset) {
    viewDate.setMonth(viewDate.getMonth() + offset);
    renderCalendar();
}

function jumpToToday(){
    viewDate = new Date(); //Resets teh global viewDate to current day
    renderCalendar();
}

function clearFoodHistory() {
    if (confirm("⚠️ Are you sure? This will delete all your food logs permanently.")) {
        localStorage.removeItem('foodHistory');
        localStorage.setItem('savedProgress', 0); // Reset the dashboard plane progress too
        renderCalendar();
        if (typeof showSuccessFeedback === "function") showSuccessFeedback();
    }
}

function renderCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthLabel = document.getElementById('monthDisplay');

    if (!grid || !monthLabel) return;

    const history = JSON.parse(localStorage.getItem('foodHistory')) || [];
    const now = new Date();
    const displayMonth = viewDate.getMonth();
    const displayYear = viewDate.getFullYear();

    const dailyGoal = 2000; // This will change based on the selected goal

    // Display Month Name
    monthLabel.innerText = viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

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
    // Get total the days in a month
    const lastDayDate = new Date(displayYear, displayMonth + 1, 0).getDate();

    // 1. Add Empty Slots for previous month padding
    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'calendarDay empty';
        grid.appendChild(emptyDiv);
    }

    // 2. Add Actual Days
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

function showDayDetails(dateStr, logs) {
    document.getElementById('selectedDateHeader').innerText = dateStr;
    const list = document.getElementById('historyList');
    list.innerHTML = '';

    if (logs.length === 0) {
        list.innerHTML = '<li>No logs for this day</li>';
        return;
    }

    logs.reverse().forEach(log => {
        const item = document.createElement('div');
        item.className = "historyItem";
        item.innerHTML = `
            <span class="label"><strong>${log.name}</strong></span>
            <span class="value">${log.kcal} kcal</span>
        `;
        list.appendChild(item);
    });
}

/* --------------- progress bar and plane animation logic ----------- */
const tiers = [
    { name: "Cessna", icon: "🛩️", goal: 500 },
    { name: "Boeing 747", icon: "✈️", goal: 1500 },
    { name: "Supersonic Jet", icon: "🚀", goal: 2500 },
    { name: "UFO", icon: "🛸", goal: 5000 }
];

let currentProgress = 0;
let tierIndex = 0;

function updateUI(isUpgrade = false) {

    // Update Elements
    const bar = document.getElementById('dashProgressBar');
    const plane = document.getElementById('planeIcon');
    if (!bar|| !plane) return;

    // Find correct tier based on total progress
    let activeTier = tiers[0];
    for (let i = 0; i < tiers.length; i++) {
        if (currentProgress >= tiers[i].goal) {
            activeTier = tiers[i];
            tierIndex = i;
        }
    }

    const goal = activeTier.goal;
    const percent = Math.min((currentProgress / goal) * 100, 100);

    bar.style.width = percent + "%";
    plane.style.left = percent + "%";
    plane.innerText = activeTier.icon;
    
    document.getElementById('planeRank').innerText = activeTier.name;
    document.getElementById('currentTotal').innerText = currentProgress;
    document.getElementById('goalNum').innerText = goal;

    // Visual tilt during movement
    plane.style.transform = "translate(-50%, -50%) rotate(-10deg)";
    setTimeout(() => {
        plane.style.transform = "translate(-50%, -50%) rotate(0deg)";
    }, 800);
}

// 1. Initial Load
function loadAndRefresh() {
    currentProgress = parseInt(localStorage.getItem('savedProgress')) || 0;
    updateUI();
}

// 2. Listen for "New Day" reset
function checkDailyReset() {
    const today = new Date().toDateString();
    if (localStorage.getItem('lastDate') !== today) {
        localStorage.setItem('savedProgress', 0);
        localStorage.setItem('lastDate', today);
        currentProgress = 0;
    }
}

// 3. Real-time Listener (Triggers if the other tab saves data)
window.addEventListener('storage', (event) => {
    if (event.key === 'savedProgress') {
        currentProgress = parseInt(event.newValue) || 0;
        updateUI();
    }
});

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('dashProgressBar')) {
        checkDailyReset();
        loadAndRefresh();
		renderActivityChart();
    }
});

// ----------------------activity chart -------------
function renderActivityChart() {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;

    const history = JSON.parse(localStorage.getItem('foodHistory') || '[]');
    const daysToDisplay = 7;
    const labels = [];
    const dataPoints = [];

    // Generate labels for the last 7 days
    for (let i = daysToDisplay - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toDateString();
        
        // Format label as "Day Month" (e.g., "Mar 21")
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

        // Calculate total calories for that specific date string
        const dailyTotal = history
            .filter(item => item.date === dateStr)
            .reduce((sum, item) => sum + item.kcal, 0);
        
        dataPoints.push(dailyTotal);
    }
// updates calendar
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Calories',
                data: dataPoints,
                backgroundColor: 'rgba(22, 163, 74, 0.6)', // Matches your theme green
                borderColor: '#16a34a',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
			maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                },
                x: {
                    grid: { display: false }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

// --------------------------- Logout Logic ---------------------------
function redirectToHome() {
    setTimeout(function() {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "home.html";
    }, 5000);
}
