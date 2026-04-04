import { logFood, getUserInfo } from '../api.js';
import { getUserId, getElement, getInputValue, showError, showSuccess } from '../utils.js';
import { updateProgress } from '../state.js';

let foodCart = []; // Array to store selected foods before logging

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
            await logFood(getUserId(), { name: food.name, kcal: food.calories });
            totalCalories += food.calories;
        }

        updateProgress({ calories: totalCalories });

        // Clear cart
        foodCart = [];
        displayCart();

        // Clear search results
        getElement('resultsList').innerHTML = '';

        showSuccess(`${foodCart.length} food(s) logged successfully!`);

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
        
        //const calories = data.calories ? Math.round(data.calories) : 0;
        
        // Add to cart
        foodCart.push({
            name: foodName,
            //calories: calories,
            fdcId: fdcId
        });
        
        displayCart();
        
        // Clear search results
        getElement('resultsList').innerHTML = '';
        
        showSuccess(`Added ${foodName} to cart!`);
    } catch (err) {
        console.warn("Could not fetch calories for selected food:", err);
        // Add to cart with 0 calories
        foodCart.push({
            name: foodName,
            calories: 0,
            fdcId: fdcId
        });
        displayCart();
        getElement('resultsList').innerHTML = '';
        showSuccess(`Added ${foodName} to cart! (calories unknown)`);
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
                
            </div>
            <button class="removeBtn" onclick="removeFromCart(${index})">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        historyList.appendChild(cartItem);
    });
}

// Global function for HTML onclick
window.removeFromCart = function(index) {
    if (index >= 0 && index < foodCart.length) {
        const removedFood = foodCart.splice(index, 1)[0];
        displayCart();
        showSuccess(`Removed ${removedFood.name} from cart.`);
    }
};
