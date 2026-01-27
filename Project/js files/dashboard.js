document.addEventListener('DOMContentLoaded', () => {
    // 1. Pull data from LocalStorage
    const email = localStorage.getItem('userEmail') || 'Guest';
    const goal = localStorage.getItem('userGoal') || 'maintain';
    const restrictions = JSON.parse(localStorage.getItem('userRestrictions') || '[]');
    
    // 2. Display User Info
    document.getElementById('userDisplay').innerText = email.split('@')[0];

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