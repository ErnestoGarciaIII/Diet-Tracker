import { getUserInfo, updateUser, uploadAvatar, setRestrictions } from '../api.js';
import { getUserId, getElement, showError, showSuccess, showMessage } from '../utils.js';

let currentUser = null;
let selected = [];
export function initSettings() {
    loadUser();
    setupAvatarControls();

    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => toggleTag(tag));
    });

    const submitBtn = getElement('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', saveRestrictions);
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

async function loadUser() {
    try {
        currentUser = await getUserInfo(getUserId());
        currentUser.restrictions.forEach(loadUserRestrictions)
        // Populate display elements
        getElement('userNameDisplay').textContent = currentUser.name || '';
        getElement('userGenderDisplay').textContent = currentUser.sex || '';
        getElement('userAgeDisplay').textContent = currentUser.age || '';
        getElement('userWeightDisplay').textContent = currentUser.weight_lbs || '';
        getElement('userHeightDisplay').textContent = currentUser.height_in || '';
        getElement('userEmailDisplay').textContent = currentUser.email || '';
        getElement('userActivityDisplay').textContent = currentUser.activity_level || '';
        getElement('userGoalDisplay').textContent = goalIdToLabel(currentUser.goal);
        
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

function loadUserRestrictions(restriction) {
    switch (restriction) {
        case "None":
            selected.push(restriction);
            getElement('None').classList.add('tag-active');
            break;
        case "Vegetarian":
            selected.push(restriction);
            getElement('Vegetarian').classList.add('tag-active');
            break;
        case "Vegan":
            selected.push(restriction);
            getElement('Vegan').classList.add('tag-active');
            break;
        case "Nut-Allergy":
            selected.push(restriction);
            getElement('Nut-Allergy').classList.add('tag-active');
            break;
        case "Egg-Allergy":
            selected.push(restriction);
            getElement('Egg-Allergy').classList.add('tag-active');
            break;
        case "Shellfish-Allergy":
            selected.push(restriction);
            getElement('Shellfish-Allergy').classList.add('tag-active');
            break;
        case "Soy-Allergy":
            selected.push(restriction);
            getElement('Soy-Allergy').classList.add('tag-active');
            break;
        case "Dairy-Free":
            selected.push(restriction);
            getElement('Dairy-Free').classList.add('tag-active');
            break;
        case "Pescatarian":
            selected.push(restriction);
            getElement('Pescatarian').classList.add('tag-active');
            break;
        case "Keto":
            selected.push(restriction);
            getElement('Keto').classList.add('tag-active');
            break;

        default:
            return showError("Failed to load user restrictions.")
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

function toggleTag(tag) {
    const value = tag.dataset.value;

    if (value === 'None') {
        // If "None" is selected, clear all other selections
        if (!selected.includes(value)) {
            // Clear all other tags
            document.querySelectorAll('.tag').forEach(t => {
                if (t !== tag) {
                    t.classList.remove('tag-active');
                }
            });
            selected = ['None'];
            tag.classList.add('tag-active');
        } else {
            // Deselecting "None"
            selected = selected.filter(v => v !== value);
            tag.classList.remove('tag-active');
        }
    } else {
        // For other restrictions, if "None" is selected, deselect it first
        if (selected.includes('None')) {
            const noneTag = document.querySelector('.tag[data-value="None"]');
            if (noneTag) {
                noneTag.classList.remove('tag-active');
            }
            selected = selected.filter(v => v !== 'None');
        }

        // Toggle the current tag
        if (selected.includes(value)) {
            selected = selected.filter(v => v !== value);
            tag.classList.remove('tag-active');
        } else {
            selected.push(value);
            tag.classList.add('tag-active');
        }
    }
}

async function saveRestrictions() {
    const user_id = getUserId();
    if (!user_id) return showError("User not found.");
    if (!selected) return showError("If you do not want any restrictions, please select 'none'.");
    try {
        await setRestrictions(user_id, selected);
        showSuccess("Restrictions saved!");
        const submitBtnData = getElement("submitBtn").dataset;
    } catch (err) {
        showError(err.message);
    }
}

// Make this function global so HTML can call it
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
