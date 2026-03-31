// modules/settings.js

import { getUserInfo, updateUser } from '../api.js';
import { getUserId, getElement, showError, showSuccess } from '../utils.js';

export function initSettings() {
    loadUser();

    const btn = getElement('saveBtn');
    if (btn) btn.addEventListener('click', saveSettings);
}

async function loadUser() {
    try {
        const user = await getUserInfo(getUserId());

        getElement('userName').value = user.name || '';
        getElement('userSex').value = user.sex || '';
        getElement('userAge').value = user.age || '';
        getElement('userWeight').value = user.weight_lbs || '';
        getElement('userHeight').value = user.height_in || '';
        getElement('activityLevel').value = user.activity_level || '';
        getElement('userGoal').value = user.goal || '';
        getElement('userEmail').value = user.email || '';

    } catch (err) {
        showError("Failed to load user.");
    }
}

async function saveSettings() {
    const user = {
        user_id: getUserId(),
        name: getElement('userName').value,
        sex: getElement('userSex').value,
        age: parseInt(getElement('userAge').value),
        weight_lbs: parseFloat(getElement('userWeight').value),
        height_in: parseFloat(getElement('userHeight').value),
        activity_level: parseInt(getElement('activityLevel').value),
        goal: parseInt(getElement('userGoal').value),
        email: getElement('userEmail').value
    };

    try {
        await updateUser(user);
        showSuccess("Settings updated!");
    } catch (err) {
        showError(err.message);
    }
}
