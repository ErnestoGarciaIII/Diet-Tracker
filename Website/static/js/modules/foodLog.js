import { logFood, getUserInfo } from '../api.js';
import { getUserId, getElement, getInputValue, showError } from '../utils.js';
import { updateProgress } from '../state.js';

export function initFoodLog() {
    loadProfilePicture();

    const btn = document.getElementById('logButton');
    if (!btn) return;

    btn.addEventListener('click', handleLogFood);
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

        console.log("Food logged!");

    } catch (err) {
        showError(err.message);
    }
}