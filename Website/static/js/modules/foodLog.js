import { logFood, getUserInfo, apply_Filter, searchFood, getNutrients } from '../api.js';
import { getUserId, getElement, getInputValue, showError, showSuccess } from '../utils.js';
import { getUser, updateProgress } from '../state.js';

let foodCart = []; 
const SERVING_UNITS = ['Serving', 'cup', 'oz', 'tbsp', 'tsp', 'g', 'ml'];

export function initFoodLog() {
    console.log("Hello there!");
    loadProfilePicture();
    loadUserRestrictions();

    const btn = getElement('logButton');
    if (btn) {
    	btn.addEventListener('click', handleLogCart);
    }

    const addFoodBtn = getElement('addFoodBtn');
    if (addFoodBtn) {
	addFoodBtn.addEventListener('click', foodSearch);
    }

    const filtersContainer = document.querySelector('.filterButtons');
    const activeFilters = new Set();
    filtersContainer.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filterBtn');
        if (!filterBtn) return;
        const filter = filterBtn.dataset.value;
        applyFilter(filter).then(response => {
            if (response?.result?.includes("success")) {
                console.log(`[INFO] Filter (${filter}) was applied successfully.`)
                if (activeFilters.has(filter)) {
                    activeFilters.delete(filter);
                } else {
                    activeFilters.add(filter);
                }
                filterBtn.classList.toggle('active');
            }
        });
    });

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

async function loadUserRestrictions() {
    try {
        const currentUser = await getUserInfo(getUserId());
        currentUser.restrictions.forEach(setUserRestrictions);
        console.message("[INFO] User predefined filters successfully applied for food search.");
    } catch (err) {
        console.warn("Failed to load user filters: ", err);
    }
}

async function setUserRestrictions(restriction) {
    try {
        await applyFilter(restriction);
    } catch (err) {
        console.error("[ERROR] Could not load user restrictions");
        return showError("Could not load user restrictions.");
    }

    switch (restriction) {
        case "None":
            console.message("[INFO] User selected 'None' as their restriction.");
            break;
        case "Vegetarian":
            getElement('VeganFilBtn').classList.toggle('active');
            break;
        case "Vegan":
            getElement('vegFilBtn').classList.toggle('active');
            break;
        case "Nut-Allergy":
            getElement('nutsFilBtn').classList.toggle('active');
            break;
        case "Egg-Allergy":
            getElement('eggFilBtn').classList.toggle('active');
            break;
        case "Shellfish-Allergy":
            getElement('shellFilBtn').classList.toggle('active');
            break;
        case "Soy-Allergy":
            getElement('soyFilBtn').classList.toggle('active');
            break;
        case "Dairy-Free":
            getElement('dairyFilBtn').classList.toggle('active');
            break;
        case "Pescatarian":
            getElement('pescFilBtn').classList.toggle('active');
            break;
        case "Keto":
            getElement('ketoFilBtn').classList.toggle('active');
            break;

        default:
            return showError("Failed to load user restrictions.")
    }
}

async function handleLogCart() {
	const userId = getUserId();
    	if (foodCart.length === 0) {
        	showError("No foods selected to log.");
        	return;
    	}

    	try {
        	const logPromises = foodCart.map(item => {
            		return logFood({
                		user_id: userId,
                		fdc_id: item.fdc_id,
                		name: item.name,
                		portion: item.portion
            		});
        	});

        await Promise.all(logPromises);

        foodCart = [];
        document.querySelectorAll('.resultItem.selected').forEach(item => {
            item.classList.remove('selected');
        });
        displayCart();
        updateProgress();
        showSuccess('Foods logged successfully.');

    } catch (err) {
        console.error("Logging error:", err);
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
        const data = await searchFood(userId, foodName);;
        
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
        resultItem.dataset.fdcId = String(fdcId);
        if (foodCart.some(item => String(item.fdc_id) === String(fdcId))) {
            resultItem.classList.add('selected');
        }
        resultItem.innerHTML = `
            <div class="resultTopRow">
                <div class="resultName">${productName}</div>
                <span class="selectedBadge">Selected</span>
            </div>
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
    const existingIndex = foodCart.findIndex(item => String(item.fdc_id) === String(fdcId));
    if (existingIndex !== -1) {
        removeFromCart(existingIndex);
        return;
    }

    try {
        const data = await getNutrients(fdcId);
        const calories = data.calories ? Math.round(data.calories) : 0;
        // Add to cart
        foodCart.push({
            name: foodName,
            calories: calories,
            portion: 1,
            unit: 'Serving',
            fdc_id: fdcId
        });
        setSearchResultSelectedState(fdcId, true);
        displayCart();
    } catch (err) {
        // Add to cart with 0 calories
        foodCart.push({
            name: foodName,
            calories: 0,
            portion: 1,
            unit: 'Serving',
            fdc_id: fdcId
        });
        setSearchResultSelectedState(fdcId, true);
        displayCart();
    }
}

function setSearchResultSelectedState(fdcId, isSelected) {
    const matches = document.querySelectorAll(`.resultItem[data-fdc-id="${String(fdcId)}"]`);
    matches.forEach(item => item.classList.toggle('selected', isSelected));
}

function removeFromCart(index) {
    if (Number.isNaN(index) || index < 0 || index >= foodCart.length) {
        return;
    }

    const removed = foodCart[index];
    foodCart.splice(index, 1);
    if (removed && removed.fdc_id !== undefined) {
        setSearchResultSelectedState(removed.fdc_id, false);
    }
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

        const unitOptions = SERVING_UNITS.map((unit) => {
            const selected = (food.unit || 'Serving') === unit ? 'selected' : '';
            return `<option value="${unit}" ${selected}>${unit}</option>`;
	}).join('');
        cartItem.innerHTML = `
            <div class="cartItemContent">
                <span class="cartItemName">${food.name}</span>
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

async function applyFilter(filter) {
    const userId = getUserId();
    if (!userId) {
        const message = "No userId found. Cannot set filter.";
        console.error("[ERROR]", message);
        alert(message);
    }

    const message = `Applying filter: ${filter}`;
    console.log(message);
    alert(message);

    try {
        return await apply_Filter(userId, filter);
    } catch (err) {
        console.error("Post error: ", err);
    }
}
