document.addEventListener('DOMContentLoaded', () => {
    // 1. Pull data from LocalStorage
    const email = localStorage.getItem('userEmailDisplay') || 'Guest';
    const password = localStorage.getItem('userPassword') || 'N/A';
    const fullName = localStorage.getItem('userNameDisplay') || 'Guest User';
    const goal = localStorage.getItem('userGoal') || 'maintain';
    const restrictions = JSON.parse(localStorage.getItem('userRestrictions') || '[]');
    
    // 2. Display User Info
    document.getElementById('userNameDisplay').innerText = fullName;
    document.getElementById('userGenderDisplay').innerText = gender;
    document.getElementById('userAgeDisplay').innerText = age;
    document.getElementById('userWeightDisplay').innerText = weight;
    document.getElementById('userHeightDisplay').innerText = height;


    document.getElementById('userEmailDisplay').innerText = email.split('@')[0];
    document.getElementById('userPassword').innerText = password;

    // 3. Simple Calorie Logic based on Goal
    let baseCals = 2000;
    if (goal === 'lose') baseCals = 1600;
    if (goal === 'gain') baseCals = 2600;
    
    document.getElementById('calorieTarget').innerText = `${baseCals} kcal`;

    // 4. Show Restrictions in the sidebar
    const list = document.getElementById('profileList');
    restrictions.forEach(res => {
        let li = document.createElement('li');
        li.innerText = `🚫 ${res}`;
        list.appendChild(li);
    });

    // 5. Mock AI Meal Generation
    generateMeals(goal);
});

// --------------- Meal Generation Logic (Mock) ---------------
function generateMeals(goal) {
    const mealGrid = document.getElementById('mealGrid');
    mealGrid.innerHTML = ''; // Clear loading state

    const meals = [
        { name: "Power Breakfast", desc: "Oatmeal with fresh berries" },
        { name: "Lean Lunch", desc: "Grilled chicken or Tofu salad" },
        { name: "Fuel Dinner", desc: "Quinoa and roasted veggies" }
    ];

    meals.forEach(meal => {
        mealGrid.innerHTML += `
            <div class="feature-card" style="text-align: left;">
                <h3>${meal.name}</h3>
                <p>${meal.desc}</p>
                <button class="btn btn-secondary full-width" style="margin-top:15px; font-size: 0.8rem;">View Recipe</button>
            </div>
        `;
    });
}
/* ------------The following code is for food logging page ------------ */
function logFood() {
    const foodEl = document.getElementById('foodInput');
    const calEl = document.getElementById('calInput');
    
    const foodName = foodEl.value;
    const calories = parseInt(calEl.value);

    if (foodName && !isNaN(calories)) {
        // 1. Update Global Progress in LocalStorage
        let currentProgress = parseInt(localStorage.getItem('savedProgress')) || 0;
        currentProgress += calories;
        localStorage.setItem('savedProgress', currentProgress);

        // 2. Add to Local Log (UI only for this session)
        const logEntry = document.createElement('li');
        logEntry.innerHTML = `<span>${foodName}</span> <strong>+${calories}</strong>`;
        document.getElementById('foodLog').prepend(logEntry);

        // 3. Clear Inputs
        foodEl.value = "";
        calEl.value = "";
        
        // Optional: Small confirmation animation
        console.log("Fuel added! Total today: " + currentProgress);
    } else {
        alert("Please enter both food name and calories.");
    }
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
    // Find correct tier based on total progress
    // Note: This logic keeps the plane at the highest earned tier
    let activeTier = tiers[0];
    for (let i = 0; i < tiers.length; i++) {
        if (currentProgress >= (tiers[i-1]?.goal || 0)) {
            activeTier = tiers[i];
            tierIndex = i;
        }
    }

    const goal = activeTier.goal;
    const percent = Math.min((currentProgress / goal) * 100, 100);

    // Update Elements
    const bar = document.getElementById('dashProgressBar');
    const plane = document.getElementById('planeIcon');
    
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
checkDailyReset();
loadAndRefresh();