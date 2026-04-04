﻿// modules/settings.js

import { getUserInfo, updateUser } from '../api.js';
import { getUserId, getElement, showError, showSuccess } from '../utils.js';

let currentUser = null;

export function initSettings() {
    loadUser();
}

async function loadUser() {
    try {
        currentUser = await getUserInfo(getUserId());
        currentUser.user_id = getUserId();

        // Populate display elements
        getElement('userNameDisplay').textContent = currentUser.name || '';
        getElement('userGenderDisplay').textContent = currentUser.sex || '';
        getElement('userAgeDisplay').textContent = currentUser.age || '';
        getElement('userWeightDisplay').textContent = currentUser.weight_lbs || '';
        getElement('userHeightDisplay').textContent = currentUser.height_in || '';
        getElement('userEmailDisplay').textContent = currentUser.email || '';

        // Load profile picture
        if (currentUser.profile_picture) {
            const profileImages = document.querySelectorAll('#profilePreview');
            profileImages.forEach(img => {
                img.src = currentUser.profile_picture;
            });
        }

    } catch (err) {
        showError("Failed to load user.");
    }
}

// Make this function global so HTML can call it
window.enterEditMode = function(displayId, fieldName) {
    const displayElement = getElement(displayId);
    if (!displayElement) return;

    const currentValue = displayElement.textContent;
    const input = document.createElement('input');
    input.type = 'text';
    input.value = currentValue;
    input.className = 'editInput';

    // Replace the span with input
    displayElement.parentNode.replaceChild(input, displayElement);

    // Focus the input
    input.focus();

    // On blur or enter, save
    let isSaving = false;
    const revertToDisplay = () => {
        if (input.parentNode) {
            input.parentNode.replaceChild(displayElement, input);
        }
    };

    const save = async () => {
        if (isSaving) return;
        isSaving = true;

        const newValue = input.value.trim();
        if (newValue === currentValue) {
            revertToDisplay();
            isSaving = false;
            return;
        }

        // Update currentUser
        const fieldMap = {
            'fullName': 'name',
            'Weight': 'weight_lbs',
            'Height': 'height_in',
            'email': 'email'
        };
        const apiField = fieldMap[fieldName] || fieldName.toLowerCase();
        
        let parsedValue = newValue;
        if (['age', 'weight_lbs', 'height_in'].includes(apiField)) {
            parsedValue = parseFloat(newValue);
            if (isNaN(parsedValue)) {
                showError("Invalid number");
                revertToDisplay();
                isSaving = false;
                return;
            }
        }
        
        currentUser[apiField] = parsedValue;

        try {
            await updateUser(currentUser);
            displayElement.textContent = newValue;
            revertToDisplay();
            showSuccess("Updated successfully!");
        } catch (err) {
            showError("Failed to update: " + err.message);
            revertToDisplay();
        }
        isSaving = false;
    };

    input.addEventListener('blur', save);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            save();
        } else if (e.key === 'Escape') {
            revertToDisplay();
        }
    });
};