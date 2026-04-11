﻿// modules/settings.js

import { getUserInfo, updateUser, uploadAvatar, updateGoal, calculateDRI } from '../api.js';
import { getUserId, getElement, showError, showSuccess } from '../utils.js';

let currentUser = null;

export function initSettings() {
    loadUser();
    setupAvatarControls();
}

//grabs goal value
function goalIdToLabel(goalId) {
    const map = {
        1: 'Weight Loss',
        2: 'Maintain',
        3: 'Muscle Build'
    };
    return map[Number(goalId)] || '';
}

//Auto calculates age
function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';

    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDelta = today.getMonth() - birth.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
}

//loads the user
async function loadUser() {
    try {
        currentUser = await getUserInfo(getUserId());
        currentUser.user_id = getUserId();

        // display elements
        getElement('userNameDisplay').textContent = currentUser.name || '';
        getElement('userGenderDisplay').textContent = currentUser.sex || '';
        getElement('userDobDisplay').textContent = currentUser.date_of_birth || '';
        getElement('userAgeDisplay').textContent = calculateAge(currentUser.date_of_birth);
        getElement('userWeightDisplay').textContent = currentUser.weight_lbs || '';
        getElement('userHeightDisplay').textContent = currentUser.height_in || '';
        getElement('userEmailDisplay').textContent = currentUser.email || '';
        getElement('userActivityDisplay').textContent = currentUser.activity_level || '';
        getElement('userGoalDisplay').textContent = goalIdToLabel(currentUser.goal);

        // Loads profile picture
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

//Avatar controls
function setupAvatarControls() {
    const uploadTrigger = getElement('uploadTrigger');
    const fileInput = getElement('hiddenFileInput');
    const removePic = getElement('removePic');

    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate file type
            if (!file.type.startsWith('image/')) {
                showError("Please select an image file.");
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError("File is too large. Maximum 5MB.");
                return;
            }

            try {
                const result = await uploadAvatar(getUserId(), file);
                currentUser.profile_picture = result.profile_picture;
                
                // Update preview images
                const profileImages = document.querySelectorAll('#profilePreview');
                profileImages.forEach(img => {
                    img.src = result.profile_picture;
                });

                showSuccess("Profile picture updated!");
            } catch (err) {
                showError("Failed to upload image: " + err.message);
            }

            // Reset file input
            fileInput.value = '';
        });
    }

    if (removePic) {
        removePic.addEventListener('click', async () => {
            if (!currentUser.profile_picture) {
                showError("No picture to remove.");
                return;
            }

            try {
                // Update user with null profile_picture
                currentUser.profile_picture = null;
                await updateUser(currentUser);

                // Reset to default avatar
                const defaultAvatar = '/static/images/avatar.jpg';
                const profileImages = document.querySelectorAll('#profilePreview');
                profileImages.forEach(img => {
                    img.src = defaultAvatar;
                });

                showSuccess("Profile picture removed!");
            } catch (err) {
                showError("Failed to remove picture: " + err.message);
            }
        });
    }
}

// Enables editing of user profile fields
window.enterEditMode = function(displayId, fieldName) {
    const displayElement = getElement(displayId);
    if (!displayElement) return;

    const currentValue = displayElement.textContent;
    let input;
    if (fieldName === 'activityLevel') {
        input = document.createElement('select');
        input.className = 'editInput';
        [
            { value: 'Sedentary', label: 'Sedentary' },
            { value: 'Light', label: 'Lightly Active' },
            { value: 'Moderate', label: 'Moderately Active' },
            { value: 'Very', label: 'Very Active' }
        ].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (opt.value === currentValue) option.selected = true;
            input.appendChild(option);
        });
    } else if (fieldName === 'goal') {
        input = document.createElement('select');
        input.className = 'editInput';
        [
            { value: '1', label: 'Weight Loss' },
            { value: '2', label: 'Maintain' },
            { value: '3', label: 'Muscle Build' }
        ].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;
            if (String(currentUser.goal || '') === opt.value) option.selected = true;
            input.appendChild(option);
        });
    } else {
        input = document.createElement('input');
        input.type = fieldName === 'date_of_birth' ? 'date' : 'text';
        input.value = currentValue;
        input.className = 'editInput';
    }

    // Replaces the span with an input
    displayElement.parentNode.replaceChild(input, displayElement);

    // Focuses the input
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
        const originalComparableValue = fieldName === 'goal' ? String(currentUser.goal || '') : currentValue;
        if (newValue === originalComparableValue) {
            revertToDisplay();
            isSaving = false;
            return;
        }

        // Updates the currentUser
        const fieldMap = {
            'fullName': 'name',
            'Weight': 'weight_lbs',
            'Height': 'height_in',
            'email': 'email',
            'activityLevel': 'activity_level',
            'goal': 'goal'
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
        
        try {
            if (apiField === 'goal') {
                const goalId = parseInt(newValue, 10);
                if (![1, 2, 3].includes(goalId)) {
                    showError('Invalid goal selected');
                    revertToDisplay();
                    isSaving = false;
                    return;
                }

                await updateGoal(getUserId(), goalId);
                await calculateDRI(getUserId());
                currentUser.goal = goalId;
                displayElement.textContent = goalIdToLabel(goalId);
            } else {
                currentUser[apiField] = parsedValue;
                if (apiField === 'date_of_birth') {
                    currentUser.age = calculateAge(newValue);
                }

                await updateUser(currentUser);
                displayElement.textContent = newValue;
            }

            revertToDisplay();

        if (apiField === 'date_of_birth') {
                const ageDisplay = getElement('userAgeDisplay');
                if (ageDisplay) {
                    ageDisplay.textContent = currentUser.age;
                }
            }

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
