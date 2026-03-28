// ---------------------- Configuration & Helpers ------------------
const API_BASE = 'http://127.0.0.1:5000';

// Helper to get current user ID
const getUserId = () => localStorage.getItem('currentUserId');

// Helper to map activity strings to your Python integers
function mapActivity(val) {
    const m = { 'sedentary': 1, 'light': 2, 'moderate': 3, 'very': 4 };
    return m[val] || 1;
}

// ---------------------- 1. Authentication (register.html) ------------------
const signupForm = document.getElementById('credentialsForm');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const pass = document.getElementById('password').value;
        const confirm = document.getElementById('confirmPassword').value;

        if (pass !== confirm) {
            alert("Passwords do not match!");
            return;
        }

        const payload = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            password: pass
        };

        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            
            if (data.user_id) {
                localStorage.setItem('currentUserId', data.user_id);
                window.location.href = 'userInfo.html';
            }
        } catch (err) {
            console.error("Signup failed:", err);
        }
    });
}

// ---------------------- 2. Biometrics (userInfo.html) ------------------
async function nextStep() {
    const userId = getUserId();
    if (!userId) return;

    const payload = {
        age: document.getElementById('userAgeDisplay').value,
        weight: document.getElementById('userWeightDisplay').value,
        height: document.getElementById('userHeightDisplay').value,
        sex: document.querySelector('input[name="gender"]:checked').value,
        activity: mapActivity(document.querySelector('input[name="activityLevel"]:checked').value)
    };

    try {
        const res = await fetch(`${API_BASE}/update-profile/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            window.location.href = 'goals.html';
        }
    } catch (err) {
        console.error("Profile update failed:", err);
    }
}

// ---------------------- 3. Goals (goals.html) ------------------
function selectGoal(element, goalType) {
    // 1. Remove 'active' class from all cards
    const cards = document.querySelectorAll('.goalCard');
    cards.forEach(card => card.classList.remove('active'));
    
    // 2. Add 'active' class to the clicked card
    element.classList.add('active');
    
    // 3. Save the choice
    localStorage.setItem('selectedGoal', goalType);
}

async function nextStep2() {
    const userId = getUserId();
    const goalStr = localStorage.getItem('selectedGoal'); // This is set by selectGoal()
    
    // STOP the user if they haven't clicked a card
    if (!goalStr) {
        alert("Please select a goal before continuing!");
        return; 
    }

    const goalMap = { 'lose': 2, 'maintain': 1, 'gain': 3 };

    try {
        const res = await fetch(`${API_BASE}/update-goal/${userId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ goal: goalMap[goalStr] })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('dailyCalorieGoal', data.daily_calories);
            window.location.href = 'settings.html';
        }
    } catch (err) {
        console.error("Goal update failed:", err);
    }
}

// ---------------------- 4. Dashboard & Airplane Logic ------------------
let currentProgress = 0;

function updateUI() {
    const goal = parseInt(localStorage.getItem('dailyCalorieGoal')) || 2000;
    const progressPercent = Math.min((currentProgress / goal) * 100, 100);
    
    const plane = document.getElementById('planeIcon');
    const bar = document.getElementById('dashProgressBar');

    if (plane && bar) {
        bar.style.width = progressPercent + "%";
        plane.style.left = progressPercent + "%";
        
        document.getElementById('currentTotal').innerText = currentProgress;
        document.getElementById('goalNum').innerText = goal;
    }
}

async function loadDashboardData() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_BASE}/get-today-total/${userId}`);
        const data = await res.json();
        
        currentProgress = data.total_kcal;
        localStorage.setItem('dailyCalorieGoal', data.goal);
        updateUI();
    } catch (err) {
        console.log("Using cached dashboard data");
        updateUI();
    }
}

async function loadSettings() {
    const userId = getUserId();
    if (!userId) return;

    try {
        const res = await fetch(`${API_BASE}/get-user/${userId}`);
        const user = await res.json();

        // Update the HTML elements in settings.html
        // Ensure these IDs match what is in your settings.html file!
        if (document.getElementById('displayFullName')) {
            document.getElementById('displayFullName').innerText = user.fullName;
            document.getElementById('displayEmail').innerText = user.email;
            document.getElementById('displayAge').innerText = user.age;
            document.getElementById('displayWeight').innerText = user.weight + " lbs";
        }
    } catch (err) {
        console.error("Failed to load user settings:", err);
    }
}

// Update your Initialization listener to include settings
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('dashProgressBar')) {
        loadDashboardData();
    }
    // If we are on the settings page
    if (window.location.pathname.includes('settings.html')) {
        loadSettings();
    }
});

// ---------------------- 5. Food Logging (foodLog.html) ------------------
async function logFood() {
    const userId = getUserId();
    const foodName = document.getElementById('foodInput').value;
    const calories = document.getElementById('calInput').value;

    if (!foodName || !calories) return;

    const payload = {
        user_id: userId,
        name: foodName,
        kcal: parseInt(calories)
    };

    try {
        const res = await fetch(`${API_BASE}/add-food`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert("Food logged!");
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        console.error("Logging failed:", err);
    }
}

// ---------------------- Initialization ------------------
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById('dashProgressBar')) {
        loadDashboardData();
    }
});