import { logFood, getUserInfo } from '../api.js';
import { getUserId, getElement, getInputValue, showError, showSuccess } from '../utils.js';
import { updateProgress } from '../state.js';

export function initFoodLog() {
    console.log("Hello there!");
    loadProfilePicture();

    const btn = document.getElementById('logButton');
    const addFoodBtn = document.getElementById('addFoodBtn');
    if (btn) {
    	btn.addEventListener('click', handleLogFood);
    }
    if (addFoodBtn) {
	addFoodBtn.addEventListener('click', foodSearch);
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

async function handleLogFood() {
    const food = getInputValue('foodInput');
    const calories = parseInt(getInputValue('calInput'));

    if (!food || !calories) {
        return showError("Enter food and calories.");
    }
    try {
        const result = await logFood(getUserId(), { name: food, kcal: calories });

        updateProgress({ calories: result.totalCalories });

        // Clear input fields
        getElement('foodInput').value = '';
        getElement('calInput').value = '';

        showSuccess("Food logged successfully!");
        console.log("Food logged!");

    } catch (err) {
        showError(err.message);
    }
}

async function foodSearch() {
    const foodName = getInputValue('foodInput');
    const userId = getUserId();
    if (!foodName) {
        console.log("No search criteria entered.");
    }
    const message = `Searching for: ${foodName}`;
    console.log(message);
    alert(message);
    
    try {
	const response = await fetch(`/api/search-engine?name=${encodeURIComponent(foodName)}&user_id=${userId}`);
	const data = await response.json();
	console.log(data);
    } catch (err) {
	console.error("Fetch error:", err);
    }


}
