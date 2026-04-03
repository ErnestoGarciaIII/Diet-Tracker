﻿// modules/settings.js

import { getUserInfo, updateUser } from '../api.js';
import { getUserId, getElement, showError, showSuccess } from '../utils.js';

export function initSettings() {
    loadUser();

    // Note: Save functionality disabled until edit mode is implemented
    // const btn = getElement('saveBtn');
    // if (btn) btn.addEventListener('click', saveSettings);
}

async function loadUser() {
    try {
        const user = await getUserInfo(getUserId());

        // Populate display elements (not input fields)
        getElement('userNameDisplay').textContent = user.name || '';
        getElement('userGenderDisplay').textContent = user.sex || '';
        getElement('userAgeDisplay').textContent = user.age || '';
        getElement('userWeightDisplay').textContent = user.weight_lbs || '';
        getElement('userHeightDisplay').textContent = user.height_in || '';
        getElement('userEmailDisplay').textContent = user.email || '';

        // Load saved profile picture on all elements with this ID
        if (user.profile_picture) {
            const profileImages = document.querySelectorAll('#profilePreview');
            profileImages.forEach(img => {
                img.src = user.profile_picture;
            });
        }

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