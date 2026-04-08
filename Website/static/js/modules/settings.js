﻿// modules/settings.js

import { getUserInfo, updateUser, uploadAvatar } from '../api.js';
import { getUserId, getElement, showError, showSuccess } from '../utils.js';

let currentUser = null;

function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return '';
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
}

export function initSettings() {
    loadUser();
    setupAvatarControls();
}

async function loadUser() {
    try {
        currentUser = await getUserInfo(getUserId());
        currentUser.user_id = getUserId();

        // Display elements
        getElement('userNameDisplay').textContent = currentUser.name || '';
        getElement('userGenderDisplay').textContent = currentUser.sex || '';
        getElement('userDobDisplay').textContent = currentUser.date_of_birth || '';
        getElement('userAgeDisplay').textContent = calculateAge(currentUser.date_of_birth);
        getElement('userWeightDisplay').textContent = currentUser.weight_lbs || '';
        getElement('userHeightDisplay').textContent = currentUser.height_in || '';
        getElement('userEmailDisplay').textContent = currentUser.email || '';

        // Loads the profile picture
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

            // Validates the file type
            if (!file.type.startsWith('image/')) {
                showError("Please select an image file.");
                return;
            }

            // Validates the file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                showError("File is too large. Maximum 5MB.");
                return;
            }

            try {
                const result = await uploadAvatar(getUserId(), file);
                currentUser.profile_picture = result.profile_picture;
                
                // Updates preview images
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
                // Updates user with null profile_picture
                currentUser.profile_picture = null;
                await updateUser(currentUser);

                // Resets to default avatar
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


// Makes this function global
window.enterEditMode = function(displayId, fieldName) {
    const displayElement = getElement(displayId);
    if (!displayElement) return;

    const currentValue = displayElement.textContent;
    const input = document.createElement('input');
    input.type = fieldName === 'date_of_birth' ? 'date' : 'text';
    input.value = currentValue;
    input.className = 'editInput';

    
    displayElement.parentNode.replaceChild(input, displayElement);

    
    input.focus();

    
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

        // If the DOB was updated, recalculates age and includes it in the save
        if (apiField === 'date_of_birth') {
            currentUser.age = calculateAge(newValue);
        }

        try {
            await updateUser(currentUser);
            displayElement.textContent = newValue;
            revertToDisplay();
            // If DOB is changed, refreshes the age display
            if (apiField === 'date_of_birth') {
                const ageDisplay = getElement('userAgeDisplay');
                if (ageDisplay) ageDisplay.textContent = currentUser.age;
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