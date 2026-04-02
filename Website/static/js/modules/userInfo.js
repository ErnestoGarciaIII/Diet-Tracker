import { updateUser } from '../api.js';
import { getUserId, getInputValue, getCheckedValue, showError, showSuccess } from '../utils.js';

export function initUserInfo() {
    const btn = document.getElementById('continueBtn');
    if (!btn) return;

    btn.addEventListener('click', handleSubmit);
}

async function handleSubmit(e) {
    e.preventDefault();

    const user_id = getUserId();

    const user = {
        user_id,
        age: parseInt(getInputValue('userAgeDisplay')),
        weight_lbs: parseFloat(getInputValue('userWeightDisplay')),
        height_in: parseFloat(getInputValue('userHeightDisplay')),
        sex: getCheckedValue('sex'),
        activity_level: getCheckedValue('activityLevel'),
        goal: null
    };

    if (!user.age || !user.weight_lbs || !user.height_in || !user.sex || !user.activity_level) {
        return showError("Please fill in all fields.");
    }

    try {
        await updateUser(user);
        showSuccess("Profile saved!");

        const btn = document.getElementById('continueBtn');
        window.location.href = btn.dataset.url;

    } catch (err) {
        showError(err.message);
    }
}