import { logFood } from '../api.js';
import { getUserId, getInputValue, showError } from '../utils.js';
import { updateProgress } from '../state.js';

export function initFoodLog() {
    const btn = document.getElementById('logButton');
    if (!btn) return;

    btn.addEventListener('click', handleLogFood);
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