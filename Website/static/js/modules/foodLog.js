import { logFood, getUserInfo, apply_Filter, searchFood } from '../api.js';
import { getUserId, getElement, getInputValue, showError, showSuccess } from '../utils.js';
import { updateProgress } from '../state.js';

let foodCart = []; 
const SERVING_UNITS = ['Serving', 'cup', 'oz', 'tbsp', 'tsp', 'g', 'ml'];

export function initFoodLog() {
    console.log("Hello there!");
    loadProfilePicture();

    const btn = getElement('logButton');
    if (btn) {
    	btn.addEventListener('click', handleLogCart);
    }

    const addFoodBtn = getElement('addFoodBtn');
    if (addFoodBtn) {
	addFoodBtn.addEventListener('click', foodSearch);
    }
    
    // Display initial empty cart
    displayCart();

    const foodInput = getElement('foodInput');
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
            const portion = Number(food.portion) > 0 ? Number(food.portion) : 1;
            const kcal = Math.round(food.calories * portion);
            const servingLabel = `${portion} ${food.unit || 'Serving'}${portion === 1 ? '' : 's'}`;
            await logFood(getUserId(), {
                name: `${food.name} (${servingLabel})`,
                kcal: kcal,
                portion: portion
            });
            totalCalories += kcal;
        }

        updateProgress({ calories: totalCalories });

        // Clears the cart
        foodCart = [];
        displayCart();
        showSuccess('Foods logged successfully.');


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

function displayRecommendations(recResults) {
    const recommendList = getElement('recommendList');
    if (!recommendList) return;

    // clears previous results
    recommendList.innerHTML = '';

    if (recResults.length === 0) {
        recommendList.innerHTML = '<p>No recommendations available.</p>';
        return;
    }

    //* create recommendation items
    recResults.forEach(result => {
        const [fdcId, productName, categoryName] = result;
        const recItem = document.createElement('div');
        recItem.className = 'recItem';
        recItem.innerHTML = `
            <div class="recName">${productName}</div>
            <div class="recCategory">${categoryName}</div>
        `;

        recommendList.appendChild(recItem);
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
            unit: 'Serving',
            fdcId: fdcId
        });
        displayCart();
    } catch (err) {
        // Add to cart with 0 calories
        foodCart.push({
            name: foodName,
            calories: 0,
            portion: 1,
            unit: 'Serving',
            fdcId: fdcId
        });
        displayCart();
    }
}

function removeFromCart(index) {
    if (Number.isNaN(index) || index < 0 || index >= foodCart.length) {
        return;
    }

    foodCart.splice(index, 1);
    displayCart();
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
        const portionValue = Number(food.portion) > 0 ? Number(food.portion) : 1;
        const kcalTotal = Math.round((food.calories || 0) * portionValue);

        const unitOptions = SERVING_UNITS.map((unit) => {
            const selected = (food.unit || 'Serving') === unit ? 'selected' : '';
            return `<option value="${unit}" ${selected}>${unit}</option>`;
        }).join('');

        cartItem.innerHTML = `
            <div class="cartItemContent">
                <span class="cartItemName">${food.name}</span>
                <span class="cartItemCalories">${kcalTotal} kcal</span>
                <div class="servingControls">
                    <label class="servingLabel" for="portion-${index}">Serving size:</label>
                    <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value="${portionValue}"
                        id="portion-${index}"
                        class="portionInput"
                        data-index="${index}"
                    >
                    <select class="unitSelect" data-index="${index}" aria-label="Serving unit">
                        ${unitOptions}
                    </select>
                </div>
            </div>
            <button class="removeBtn" data-index="${index}" aria-label="Remove food">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        historyList.appendChild(cartItem);
    });

    const portionInputs = historyList.querySelectorAll('.portionInput');
    portionInputs.forEach(input => {
        input.addEventListener('change', (e) => {
            const idx = parseInt(input.dataset.index);
            let val = parseFloat(input.value);
            if (isNaN(val) || val <= 0) val = 1;
            foodCart[idx].portion = val;
            displayCart();
        });
    });

    const unitSelects = historyList.querySelectorAll('.unitSelect');
    unitSelects.forEach(select => {
        select.addEventListener('change', () => {
            const idx = parseInt(select.dataset.index);
            if (!foodCart[idx]) return;
            foodCart[idx].unit = select.value;
        });
    });

    const removeButtons = historyList.querySelectorAll('.removeBtn');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const idx = parseInt(button.dataset.index);
            removeFromCart(idx);
        });
    });
}

async function applyFilter(restrictionId) {
    const userId = getUserId();
    if (!userId) {
        const message = "No userId found. Cannot set filter.";
        console.error("[ERROR]" + message);
        alert(message);
    }

    const message = `Applying filter: ${restrictionId}`;
    console.log(message);
    alert(message);

    try {
        const response = await apply_Filter(userId, restrictionId);
        const data = await response.json();
        console.log(data);
    } catch (err) {
        console.error("Post error: " + err);
    }
}


