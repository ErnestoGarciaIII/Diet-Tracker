import { logFood, getUserInfo } from '../api.js';
import { getUserId, getElement, getInputValue, showError, showSuccess } from '../utils.js';
import { updateProgress } from '../state.js';

let foodCart = []; 

export function initFoodLog() {
    console.log("Hello there!");
    loadProfilePicture();

    const btn = document.getElementById('logButton');
    const addFoodBtn = document.getElementById('addFoodBtn');
    if (btn) {
    	btn.addEventListener('click', handleLogCart);
    }
    if (addFoodBtn) {
	addFoodBtn.addEventListener('click', foodSearch);
    }
    
    // Display initial empty cart
    displayCart();

    const foodInput = document.getElementById('foodInput');
    if (foodInput) {
        foodInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                foodSearch();
            }
        });
    }
}

async function loadProfilePicture() {
    try {
        const user = await getUserInfo(getUserId());
        if (getElement('profilePreview') && user.profile_picture) {
            getElement('profilePreview').src = user.profile_picture;
        }
    } catch (err) {
        console.warn("Failed to load profile picture:", err);
    }
}

async function handleLogCart() {
    if (foodCart.length === 0) {
        showError("No foods selected to log.");
        return;
    }

    try {
        let totalCalories = 0;
        for (const food of foodCart) {
            const portion = food.portion || 1;
            const kcal = Math.round(food.calories * portion);
            await logFood(getUserId(), { name: food.name, kcal: kcal, portion: food.portion || 1 });
            totalCalories += kcal;
        }

        updateProgress({ calories: totalCalories });

        // Clears the cart
        foodCart = [];
        displayCart();


    } catch (err) {
        showError(err.message);
    }
}

async function foodSearch() {
    const foodName = getInputValue('foodInput');
    const userId = getUserId();
    if (!foodName) {
        console.log("No search criteria entered.");
        return;
    }
    const message = `Searching for: ${foodName}`;
    console.log(message);
    alert(message);
    
    try {
        let url = `/api/search-engine?name=${encodeURIComponent(foodName)}&user_id=${userId}`;

        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            showError(data.error);
            return;
        }
        
        displaySearchResults(data);
    } catch (err) {
        console.error("Fetch error:", err);
        showError("Search failed");
    }
}

function displaySearchResults(results) {
    const resultsList = getElement('resultsList');
    if (!resultsList) return;
    
    // Clear previous results
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
        resultsList.innerHTML = '<p>No results found.</p>';
        return;
    }
    
    // Create result items
    results.forEach(result => {
        const [fdcId, productName, categoryName] = result;
        
        const resultItem = document.createElement('div');
        resultItem.className = 'resultItem';
        resultItem.innerHTML = `
            <div class="resultName">${productName}</div>
            <div class="resultCategory">${categoryName}</div>
        `;
        
        // Make it clickable to select the food
        resultItem.addEventListener('click', () => selectFood(productName, fdcId));
        
        resultsList.appendChild(resultItem);
    });
}

async function selectFood(foodName, fdcId) {
    try {
        const response = await fetch(`/api/get-nutrients?fdc_id=${fdcId}`);
        const data = await response.json();
        const calories = data.calories ? Math.round(data.calories) : 0;
        // Add to cart
        foodCart.push({
            name: foodName,
            calories: calories,
            portion: 1,
            fdcId: fdcId
        });
        displayCart();
    } catch (err) {
        // Add to cart with 0 calories
        foodCart.push({
            name: foodName,
            calories: 0,
            portion: 1,
            fdcId: fdcId
        });
        displayCart();
    }
}

function displayCart() {
    const historyList = getElement('historyList');
    if (!historyList) return;
    
    historyList.innerHTML = '';
    
    if (foodCart.length === 0) {
        historyList.innerHTML = '<p style="color: #666; font-style: italic;">No foods selected yet. Search and add foods above.</p>';
        return;
    }
    
    foodCart.forEach((food, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cartItem';
        cartItem.innerHTML = `
            <div class="cartItemContent">
                <span class="cartItemName">${food.name}</span>
                <label style="margin-left:10px;font-size:0.95em;">Portion: </label>
                <input type="number" min="0.1" step="0.1" value="${food.portion || 1}" class="portionInput" data-index="${index}" style="width:50px;margin-left:4px;">
            </div>
            <button class="removeBtn" onclick="removeFromCart(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        historyList.appendChild(cartItem);
    });
    // Added event listeners for portion inputs
    const portionInputs = historyList.querySelectorAll('.portionInput');
    portionInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(input.dataset.index);
            let val = parseFloat(input.value);
            if (isNaN(val) || val <= 0) val = 1;
            foodCart[idx].portion = val;
            displayCart(); // re-render to update kcal
        });
    });
}

