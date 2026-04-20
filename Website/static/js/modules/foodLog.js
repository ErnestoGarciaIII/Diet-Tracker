import { logFood, getUserInfo, apply_Filter, searchFood, getNutrients, getModifiers, get_Filters, getRecommendations, getConsumed, getGenericProgress,getNutrientProgress, numberOfDaysFoodLogged } from '../api.js';
import { getUserId, getElement, getInputValue, showError, showSuccess, getActiveFilters, addFilterToActiveFilters, removeActiveFilter } from '../utils.js';
import { getUser, updateProgress, getBadge, setBadge } from '../state.js';

const SERVING_UNITS = ['Serving', 'cup', 'oz', 'tbsp', 'tsp', 'g', 'ml'];
const MEAL_TAGS = ['Snack', 'Breakfast', 'Lunch', 'Dinner']
let foodCart = [];

export function initFoodLog() {
    loadProfilePicture();
    loadUserRestrictions();
    loadProgressPreview();
    loadMoreNutrients();

    const btn = getElement('logButton');
    if (btn) {
        btn.addEventListener('click', handleLogCart);
    }

    const addFoodBtn = getElement('addFoodBtn');
    if (addFoodBtn) {
	addFoodBtn.addEventListener('click', foodSearch);
    }

    const filtersContainer = document.querySelector('.filterButtons');
    const activeFilters = getActiveFilters();
    filtersContainer.addEventListener('click', (e) => {
        const filterBtn = e.target.closest('.filterBtn');
        if (!filterBtn) return;
        const filter = filterBtn.dataset.value;
        applyFilter(filter).then(response => {
            if (response?.result?.includes("success")) {
                console.log(`[INFO] Filter (${filter}) was applied successfully.`)

                if (activeFilters.includes(filter)) {
                    removeActiveFilter(filter);
                } else {
                    addFilterToActiveFilters(filter);
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

    // Load recommendations on page load
    loadRecommendations();
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
        if (currentUser.restrictions.includes('None')) { return; }
        const activeFilters = getActiveFilters();
        if (activeFilters.length === 0) {
            currentUser.restrictions.forEach(res => {
                setUserRestrictions(res, true);
            });
            console.log("[INFO] User predefined filters successfully applied for food search.");
        }
        else {
            activeFilters.forEach(res => setUserRestrictions(res, false));
            console.log("[INFO] User predefined filters are sustained for food search.");
        }
    } catch (err) {
        console.warn("Failed to load user filters: ", err);
    }
}

async function setUserRestrictions(restriction, callApplyFilterAPI) {
    if (callApplyFilterAPI) {
        try {
            await applyFilter(restriction);
            addFilterToActiveFilters(restriction);
        } catch (err) {
            console.error("[ERROR] Could not load user restrictions");
            return showError("Could not load user restrictions.");
        }
    }

    switch (restriction) {
        case "None":
            console.log("[INFO] User selected 'None' as their restriction.");
            break;
        case "Vegan":
            getElement('VeganFilBtn').classList.toggle('active');
            break;
        case "Vegetarian":
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
    alert(`activated btn for restriction: ${restriction}`);
}

async function handleLogCart() {
	const userId = getUserId();
        if (foodCart.length === 0) {
            showError("No foods selected to log.");
            return;
        }

        try {
            const payload = {
                user_id: userId,
                items: foodCart.map(item => ({
                    fdc_id: item.fdc_id,
                    name: item.name,
                    portion: item.portion,
                    unit: item.unit,
                    gram_weight: item.gram_weight,
                    meal_tag: item.meal
                }))
            };
            const response = await logFood(payload);
            foodCart = [];
            document.querySelectorAll('.resultItem.selected').forEach(item => {
                item.classList.remove('selected');
            });
            displayCart();
            await loadProgressPreview();
            showSuccess('Foods logged successfully.');

            checkUserBadgeAwards(userId);

            // Display recommendations if present
            if (response && response.recommendations) {
                displayRecommendations(response.recommendations);
            }
        } catch (err) {
            console.error("Logging error:", err);
            showError(err.message);
        }
}

function checkUserBadgeAwards(userId) {
    numberOfDaysFoodLogged(getUserId()).then(response => {
        const days = response.days;
        console.log(days);
        const badge = getBadge();

        if (days == 1 && badge != 'FirstLog') {
            //first log
            setBadge("FirstLog");
        }
        else if (days == 3 && badge != 'ThreeDayLog') {
            //3 days
            setBadge("ThreeDayLog");
        }
        else if (days == 5 && badge != 'FiveDayLog') {
            //5 days
            setBadge("FiveDayLog");
        }
    });
}

// all this for progress bars
function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

function progressMetrics(progress) {
    const calories = toNumber(progress?.calories ?? progress?.Energy ?? 0);

    const protein = toNumber(progress?.Protein ?? progress?.protein ?? 0);
    const carbs = toNumber(
        progress?.Carbs ?? progress?.carbs ?? progress?.Carbohydrate ?? progress?.['Carbohydrate, by difference'] ?? 0
    );
    const fats = toNumber(
        progress?.Fats ?? progress?.fats ?? progress?.Fat ?? progress?.['Total lipid (fat)'] ?? 0
    );

    const macros = toNumber(progress?.macros ?? (protein + carbs + fats));

    let micros = toNumber(progress?.micros ?? 0);
    if (!micros) {
        const excludedKeys = new Set([
            'calories', 'energy', 'protein', 'carbs', 'carbohydrate', 'carbohydrate, by difference',
            'fats', 'fat', 'total lipid (fat)', 'macros', 'micros'
        ]);

        micros = Object.entries(progress || {}).reduce((sum, [key, value]) => {
            if (excludedKeys.has(String(key).toLowerCase())) return sum;
            return sum + toNumber(value);
        }, 0);
    }

    return { calories, macros, micros };
}

function getProgressIcon(percent) {
    if (percent >= 100) return '🛸';
    if (percent >= 70) return '🚀';
    if (percent >= 35) return '✈️';
    return '🛩️';
}

function parseGenericProgress(genericProgress) {
    if (Array.isArray(genericProgress)) {
        return {
            microPercent: toNumber(genericProgress[0]),
            macroPercent: toNumber(genericProgress[1]),
            caloriePercent: toNumber(genericProgress[2])
        };
    }

    return {
        microPercent: toNumber(genericProgress?.micros ?? genericProgress?.micro ?? 0),
        macroPercent: toNumber(genericProgress?.macros ?? genericProgress?.macro ?? 0),
        caloriePercent: toNumber(genericProgress?.calories ?? genericProgress?.energy ?? 0)
    };
}

function formatPercent(value) {
    return `${Math.round(toNumber(value) * 10) / 10}%`;
}

function createNutrientBarRow(nutrient, pct, consumed, recommended) {
    const clampedPct = Math.min(Math.max(pct, 0), 100);
    const row = document.createElement('div');
    row.className = 'nutrientBarRow';
    row.innerHTML = `
        <span class="nutrientBarLabel">${nutrient}</span>
        <div class="nutrientMiniBarWrap">
            <div class="nutrientMiniBar" style="width: ${clampedPct}%"></div>
            <span class="nutrientBarPct">${pct}%</span>
            <div class="nutrientHoverTooltip">
                <p><strong>Consumed:</strong> ${consumed}</p>
                <p><strong>Recommended:</strong> ${recommended}</p>
            </div>
        </div>
    `;

    return row;
}

async function loadMoreNutrients() {
    const graphContainer = getElement('moreNutrientsGraph');
    if (!graphContainer) return;

    try {
        const userId = getUserId();
        if (!userId) return;

        const nutrientProgress = await getNutrientProgress(userId, new Date().toDateString());
        const actualConsumed = nutrientProgress?.[0] || {};
        const percentConsumed = nutrientProgress?.[1] || {};
        const dailyRecommended = nutrientProgress?.[2] || {};

        graphContainer.innerHTML = '';

        Object.keys(actualConsumed).forEach((nutrient) => {
            const pct = Math.round(parseFloat(percentConsumed[nutrient]) * 1000) / 10;
            const consumed = Math.round(toNumber(actualConsumed[nutrient]) * 10) / 10;
            const recommended = Math.round(toNumber(dailyRecommended[nutrient]) * 10) / 10;
            graphContainer.appendChild(createNutrientBarRow(nutrient, pct, consumed, recommended));
        });

        if (!graphContainer.children.length) {
            graphContainer.innerHTML = '<p class="text-muted">No nutrient details available yet.</p>';
        }
    } catch (err) {
        console.warn('Failed to load more nutrients:', err);
        graphContainer.innerHTML = '<p class="text-muted">Unable to load nutrient details.</p>';
    }
}

function applyProgressToPreview(metrics, genericProgress) {
    const { calories, macros, micros } = metrics;
    const { caloriePercent, macroPercent, microPercent } = parseGenericProgress(genericProgress);

    const tiers = [
        { icon: '🛩️', goal: 500 },
        { icon: '✈️', goal: 1500 },
        { icon: '🚀', goal: 2500 },
        { icon: '🛸', goal: 5000 }
    ];

    let activeTier = tiers[0];
    for (let i = 0; i < tiers.length; i++) {
        if (calories >= tiers[i].goal) {
            activeTier = tiers[i];
        }
    }

    const calorieBarPercent = Math.min(Math.max(caloriePercent, 0), 100);
    const kcalBar = getElement('kcalProgressPreview');
    const kcalPlane = getElement('planeIcon');
    const macroBar = getElement('gProgressPreview');
    const macroPlane = getElement('planeIcon1');
    const microBar = getElement('mgProgressPreview');
    const microPlane = getElement('planeIcon2');
    const kcalPercentLabel = getElement('kcalPreviewPercent');
    const macroPercentLabel = getElement('gPreviewPercent');
    const microPercentLabel = getElement('mgPreviewPercent');

    if (kcalBar) {
        kcalBar.style.width = `${calorieBarPercent}%`;
    }
    if (kcalPercentLabel) {
        kcalPercentLabel.innerText = formatPercent(caloriePercent);
    }

    if (kcalPlane) {
        kcalPlane.style.left = `${calorieBarPercent}%`;
        kcalPlane.innerText = activeTier.icon;
    }

    const safeMacroPercent = Math.min(Math.max(macroPercent, 0), 100);
    if (macroBar) {
        macroBar.style.width = `${safeMacroPercent}%`;
    }
    if (macroPercentLabel) {
        macroPercentLabel.innerText = formatPercent(macroPercent);
    }
    if (macroPlane) {
        macroPlane.style.left = `${safeMacroPercent}%`;
        macroPlane.innerText = getProgressIcon(macroPercent);
    }

    const safeMicroPercent = Math.min(Math.max(microPercent, 0), 100);
    if (microBar) {
        microBar.style.width = `${safeMicroPercent}%`;
    }
    if (microPercentLabel) {
        microPercentLabel.innerText = formatPercent(microPercent);
    }
    if (microPlane) {
        microPlane.style.left = `${safeMicroPercent}%`;
        microPlane.innerText = getProgressIcon(microPercent);
    }
}

async function loadProgressPreview() {
    try {
        const userId = getUserId();
        if (!userId) return;

        const [progressData, genericProgress] = await Promise.all([
            getConsumed(userId),
            getGenericProgress(userId)
        ]);
        const metrics = progressMetrics(progressData);

        updateProgress(metrics);
        applyProgressToPreview(metrics, genericProgress);
        await loadMoreNutrients();
    } catch (err) {
        console.warn('Failed to load progress preview:', err);
    }
}
// end of progress bars

//food search
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

//display search results
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

//display recommendations

function displayRecommendations(recResults) {
    const recommendList = getElement('recommendList');
    if (!recommendList) return;
    recommendList.innerHTML = '';

    if (!Array.isArray(recResults) || recResults.length === 0) {
        recommendList.innerHTML = '<p>No recommendations available for today.</p>';
        return;
    }

    // Group by round
    const rounds = {};
    recResults.forEach(result => {
        const round = result.round || 1;
        if (!rounds[round]) rounds[round] = [];
        rounds[round].push(result);
    });

    Object.entries(rounds).forEach(([roundNum, options]) => {
        // Round header
        const header = document.createElement('p');
        header.className = 'recRoundHeader';
        header.textContent = `Option ${roundNum}`;
        recommendList.appendChild(header);

        // Options within this round
        options.forEach((result, idx) => {
            const recItem = document.createElement('div');
            recItem.className = `resultItem ${idx === 0 ? 'recTop' : 'recAlternate'}`;
            recItem.dataset.fdcId = String(result.fdc_id);
            recItem.innerHTML = `
                <div class="resultTopRow">
                    <div class="resultName">${result.name}</div>
                    ${result.suggested_serving_oz ? `<span class="servingSize"><strong>Suggested:</strong> ${result.suggested_serving_oz} oz</span>` : ''}
                </div>
                <div class="resultCategory">${idx === 0 ? '⭐ Best pick' : `Alternative ${idx}`}</div>
            `;
            recItem.addEventListener('click', () => selectFood(result.name, result.fdc_id));
            recommendList.appendChild(recItem);
        });
    });
}

function displayRecommendations2(recResults) {
    const recommendList = getElement('recommendList');
    if (!recommendList) return;

    // clears previous results
    recommendList.innerHTML = '';

    if (!Array.isArray(recResults) || recResults.length === 0) {
        recommendList.innerHTML = '<p>No recommendations available for today.</p>';
        return;
    }

    // create recommendation items
        recResults.forEach(result => {
            let fdcId, productName, categoryName, servingSize;
            if (Array.isArray(result)) {
                [fdcId, productName, categoryName, servingSize] = result;
            } else if (typeof result === 'object' && result !== null) {
                fdcId = result.fdc_id || result.fdcId || result.id || '';
                productName = result.name || result.productName || '';
                categoryName = result.category || result.categoryName || '';
                servingSize = result.suggested_serving_oz || result.servingSize || result.suggestedServing || '';
            } else {
                fdcId = '';
                productName = String(result);
                categoryName = '';
                servingSize = '';
            }
            const recItem = document.createElement('div');
            recItem.className = 'resultItem'; 
            recItem.dataset.fdcId = String(fdcId);
            recItem.innerHTML = `
                <div class="resultTopRow">
                    <div class="resultName">${productName}</div>
                    ${servingSize ? `<span class="servingSize"><strong>Suggested:</strong> ${servingSize} oz</span>` : ''}
                </div>
                <div class="resultCategory">${categoryName}</div>
            `;
            recItem.addEventListener('click', () => selectFood(productName, fdcId));
            recommendList.appendChild(recItem);
        });
}

function getDefaultMeal() {
    const hour = new Date().getHours();

    if (hour < 11) return 'Breakfast';
    if (hour < 16) return 'Lunch';
    if (hour < 21) return 'Dinner';
    return 'Snack';
}

// Select a food item and add it to the cart
async function selectFood(foodName, fdcId) {
    const existingIndex = foodCart.findIndex(item => String(item.fdc_id) === String(fdcId));
    if (existingIndex !== -1) {
        removeFromCart(existingIndex);
        return;
    }

    try {
        const data = await getModifiers(fdcId);
	      console.log(data);
        const defaultModifiers = [
            { modifier: 'g', gram_weight: 1.0 },
            { modifier: 'oz', gram_weight: 28.35 }
        ];
        const dbModifiers = (data.modifiers || []).map(m => ({
	      gram_weight: m[0],
	      modifier: m[1]
	}));
        const modifierList = [...dbModifiers];
	console.log("Made it passed dbModifiers and modifierList instantiation...");
        defaultModifiers.forEach(def => {
            if (!modifierList.some(m => m.modifier === def.modifier)) {
                modifierList.push(def);
            }
        });
	console.log("dbModifiers after map:", dbModifiers);
	console.log("modifiers raw:", data.modifiers);
        foodCart.push({
            name: foodName,
            fdc_id: fdcId,
            portion: 1,
            unit: modifierList[0].modifier,
            gram_weight: modifierList[0].gram_weight,
            modifier_map: modifierList,
            meal: getDefaultMeal()
        });
	console.log("Just successfully pushed foodCart");
        setSearchResultSelectedState(fdcId, true);
        displayCart();

    } catch (err) {
        console.error("Failed to fetch modifiers:", err);
        foodCart.push({
            name: foodName,
            fdc_id: fdcId,
            portion: 1,
            unit: 'g',
            gram_weight: 1.0,
            modifier_map: [
                { modifier: 'g', gram_weight: 1.0 },
                { modifier: 'oz', gram_weight: 28.35 }
            ],
            meal: getDefaultMeal()
        });
        setSearchResultSelectedState(fdcId, true);
        displayCart();
    }
}

// Set the selected state of a search result item
function setSearchResultSelectedState(fdcId, isSelected) {
    const matches = document.querySelectorAll(`.resultItem[data-fdc-id="${String(fdcId)}"]`);
    matches.forEach(item => item.classList.toggle('selected', isSelected));
}

// Remove a food item from the cart
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

// Display the food cart
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

	const SERVING_UNITS = (food.modifier_map && food.modifier_map.length > 0) ? food.modifier_map.map(m => m.modifier) : ['Serving'];
        const unitOptions = SERVING_UNITS.map((unit) => {
            const selected = (food.unit || 'Serving') === unit ? 'selected' : '';
            return `<option value="${unit}" ${selected}>${unit}</option>`;
	}).join('');
        const MEAL_TAGS = (food.meal_tags && food.meal_tags.length > 0) ? food.meal_tags : ['Snack', 'Breakfast', 'Lunch', 'Dinner'];
        const mealTagOptions = MEAL_TAGS.map((meal) => {
            const selected = (food.meal || 'Snack') === meal ? 'selected' : '';
            return `<option value="${meal}" ${selected}>${meal}</option>`;
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
                    <select class="mealSelect" data-index="${index}" aria-label="Meal Tag">
                        ${mealTagOptions}
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
        const selectedUnit = select.value;
        const item = foodCart[idx];

        item.unit = selectedUnit;

        const lookup = item.modifier_map.find(m => m.modifier === selectedUnit);
        if (lookup) {
            item.gram_weight = lookup.gram_weight;
        }
        
        console.log(`Updated ${item.name} to ${selectedUnit}. Background weight is now: ${item.gram_weight}`);
        });
    });

    historyList.querySelectorAll('.mealSelect').forEach(select => {
        select.addEventListener('change', () => {
            const idx = parseInt(select.dataset.index);
            foodCart[idx].meal = select.value;
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

// Apply a filter to the user's food search
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

// Load food recommendations for the user
async function loadRecommendations() {
    try {
        const userId = getUserId();
        if (!userId) return;
        const data = await getRecommendations(userId);
        if (data && data.recommendations) {
            displayRecommendations(data.recommendations);
        } else {
            displayRecommendations([]);
        }
    } catch (err) {
        displayRecommendations([]);
    }
}
