import { getUserInfo, updateUserInDB, uploadAvatar, setRestrictions, delete_account } from '../api.js';
import { getUserId, getElement, showError, showSuccess } from '../utils.js';
import { updateUserObject } from '../state.js';

let currentUser = null;
let selected = [];
let isEditing = false;
let draftUser = null;

const activityOptions = [
    { value: 1, label: "Sedentary" },
    { value: 2, label: "Lightly Active" },
    { value: 3, label: "Moderately Active" },
    { value: 4, label: "Very Active" }
];

export function initSettings() {
    loadUser();
    setupAvatarControls();
    setupMoreInfoCollapse();
    setupEventListeners();
    restrictionsListener();

    const submitBtn = getElement('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', saveRestrictions);
}

function setupEventListeners() {
    const biometricsList = getElement('biometricsList');
    const emailElement = getElement('userEmailDisplay');

    if (biometricsList) {
        biometricsList.addEventListener('click', (e) => {
            const item = e.target.closest('.infoItem[data-edit]');
            if (!item || isEditing) return;

            enterEditMode();
        });
    }

    if (emailElement) {
        emailElement.addEventListener('click', (e) => {
            if ( isEditing) return;
            enterEditMode();
        });

    }

    getElement('cancelEdit')?.addEventListener('click', cancelEdit);
    getElement('saveEdit')?.addEventListener('click', saveAllEdits);

    getElement('deleteAccountBtn')?.addEventListener('click', deleteAccount);
    getElement('sexInfoBtn')?.addEventListener('click', toggleSexDisclaimer);
}

async function loadUser() {
    try {
        currentUser = await getUserInfo(getUserId());

        selected = [];
        currentUser.restrictions.forEach(loadUserRestrictions);

        renderUser(currentUser);
    } catch {
        showError("Failed to load user.");
    }
}

function renderUser(user) {
    const accountDate = new Date(user.account_creation_date_utc).toLocaleDateString();

    getElement('userNameDisplay').textContent = user.name || '';
    getElement('userGenderDisplay').textContent = user.sex || '';
    getElement('userDobDisplay').textContent = user.date_of_birth || '';
    getElement('userWeightDisplay').textContent = user.weight_lbs || '';
    getElement('userHeightDisplay').textContent = user.height_in || '';
    getElement('userEmailDisplay').textContent = user.email || '';
    getElement('userActivityDisplay').textContent = activityLevelToLabel(user.activity_level) || '';
    getElement('userGoalDisplay').textContent = goalIdToLabel(user.goal);
    getElement('userAccCreatedDisplay').textContent = accountDate || '';

    if (user.profile_picture) {
        ['profilePreviewNavBar', 'profilePreviewSettings'].forEach(id => {
            const el = getElement(id);
            if (el) el.src = user.profile_picture;
        });
    }
}

function enterEditMode() {
    if (isEditing) return;
    isEditing = true;

    if (!currentUser) return;
    draftUser = structuredClone(currentUser);
    draftUser.user_id = getUserId();

    document.querySelectorAll('.infoItem[data-edit]').forEach(item => {
        const field = item.dataset.edit;
        const targetId = item.dataset.target;

        const displayElement = getElement(targetId);
        if (!displayElement) return;

        const currentValue =
            field === 'activityLevel'
                ? Number(currentUser.activity_level)
                : currentUser[mapField(field)];

        const input = createInput(field, currentValue);
        input.classList.add('editInput');

        input.addEventListener('input', () => {
            const apiField = mapField(field);
            if (!draftUser) return;
            draftUser[apiField] = parseValue(apiField, input.value);
        });

        displayElement.replaceWith(input); 
    });

    showEditControls();
    document.addEventListener('keydown', handleEditKeys);
}

function exitEditMode() {
    isEditing = false;
    draftUser = null;

    document.removeEventListener('keydown', handleEditKeys);

    document.querySelectorAll('.editInput').forEach(input => {
        const parent = input.closest('.infoItem');

        const span = document.createElement('span');
        span.className = 'value';
        span.id = parent.dataset.target;

        const field = parent.dataset.edit;

        span.textContent = formatField(field, draftUser ?? currentUser);

        if (span.id === 'userEmailDisplay') {
            span.addEventListener('click', () => {
                if (!isEditing) enterEditMode();
            });
        }

        input.replaceWith(span);
    });

    hideEditControls();
}

function handleEditKeys(e) {
    if (!isEditing) return;

    if (e.key === 'Escape') {
        cancelEdit();
    }

    if (e.key === 'Enter') {
        e.preventDefault();
        saveAllEdits();
    }
}
function formatField(field, user) {
    switch (field) {
        case 'activityLevel':
            return activityLevelToLabel(user.activity_level);
        case 'goal':
            return goalIdToLabel(user.goal);
        default:
            return user[mapField(field)] ?? '';
    }
}

function cancelEdit() {
    exitEditMode();
}

async function saveAllEdits() {
    try {
        if (!draftUser) {
            showError("Nothing to save.");
            return;
        }

        const payload = {
            user_id: draftUser.user_id,
            name: draftUser.name,
            date_of_birth: draftUser.date_of_birth,
            weight_lbs: draftUser.weight_lbs,
            height_in: draftUser.height_in,
            sex: draftUser.sex,
            activity_level: draftUser.activity_level,
            goal: draftUser.goal,
            email: draftUser.email,
            profile_picture: draftUser.profile_picture,
            restrictions: selected
        };

        console.log("Sending to API:", payload);

        await updateUserInDB(payload);

        // update global state
        updateUserObject(payload);
        currentUser = structuredClone(draftUser);

        exitEditMode();
        showSuccess("Profile updated!");
    } catch (err) {
        showError(err.message);
    }
}

function createInput(fieldName, currentValue) {
    let input;

    if (fieldName === 'activityLevel') {
        input = document.createElement('select');

        activityOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = String(opt.value);
            option.textContent = opt.label;

            if (Number(currentValue) === opt.value) {
                option.selected = true;
            }

            input.appendChild(option);
        });

        return input;
    }

    if (fieldName === 'goal') {
        input = document.createElement('select');

        [
            { value: '1', label: 'Weight Loss' },
            { value: '2', label: 'Maintain' },
            { value: '3', label: 'Muscle Build' }
        ].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.label;

            const source = isEditing ? draftUser : currentUser;
            if (!source) return input; 

            if (String(currentValue) === opt.value) {
                option.selected = true;
            }

            input.appendChild(option);
        });

        return input;
    }

    input = document.createElement('input');
    input.classList.add('editInput');
    input.type = fieldName === 'date_of_birth' ? 'date' : 'text';
    input.value = currentValue;

    return input;
}

function mapField(field) {
    const map = {
        fullName: 'name',
        Weight: 'weight_lbs',
        Height: 'height_in',
        email: 'email',
        activityLevel: 'activity_level',
        goal: 'goal',
        date_of_birth: 'date_of_birth',
        sex: 'sex'
    };
    return map[field] || field;
}

function parseValue(field, value) {
    if (field === 'activity_level') {
        return Number(value); 
    }

    if (['weight_lbs', 'height_in'].includes(field)) {
        const num = parseFloat(value);
        if (isNaN(num)) return null;
        return num;
    }

    if (field === 'goal') {
        return parseInt(value, 10);
    }

    return value;
}

function showEditControls() {
    getElement('editControls')?.classList.add('visible');
    getElement('deleteAccountBtn')?.classList.add('hidden');
}

function hideEditControls() {
    getElement('editControls')?.classList.remove('visible');
    getElement('deleteAccountBtn')?.classList.remove('hidden');
}

function restrictionsListener() {
    const tagsContainer = document.querySelector('.tagsGrid');
    if (!tagsContainer) return;

    tagsContainer.addEventListener('click', (e) => {
        const tag = e.target.closest('.tag');
        if (!tag || !tagsContainer.contains(tag)) return;

        toggleTag(tag, tagsContainer);
    });
}

function loadUserRestrictions(restriction) {
    const el = getElement(restriction);
    if (!el) return;

    selected.push(restriction);
    el.classList.add('tag-active');
}

async function saveRestrictions() {
    const user_id = getUserId();
    if (!user_id) return showError("User not found.");
    if (selected.length === 0) return showError("Please select 'none'.");

    try {
        await setRestrictions(user_id, selected);
        showSuccess("Restrictions saved!");
    } catch (err) {
        showError(err.message);
    }
}

function goalIdToLabel(goalId) {
    return {
        1: 'Weight Loss',
        2: 'Maintain',
        3: 'Muscle Build'
    }[goalId] || '';
}

function toggleSexDisclaimer(e) {
    e.preventDefault();
    const el = getElement('sexDisclaimer');
    if (el) el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

function activityLevelToLabel(value) {
    const option = activityOptions.find(o => o.value === Number(value));
    return option ? option.label : '';
}

function deleteAccount() {
    const modal = getElement('deleteModal');
    modal.classList.remove('hidden');

    const cancelBtn = getElement('cancelDelete');
    const confirmBtn = getElement('confirmDelete');

    cancelBtn.onclick = () => {
        modal.classList.add('hidden');
    };

    confirmBtn.onclick = async () => {
        try {
            const userId = getUserId();

            const del = await delete_account(userId);
            if (del.message) {
                showSuccess("Account deleted.");
                window.location.href = "/logout.html";
            }
            else {
                showError("No user Id could be found. Please log out and log back in to try again.")
            }
        } catch (err) {
            showError(err.message);
        }
    };
}

function setupAvatarControls() {
    const uploadTrigger = getElement('uploadTrigger');
    const fileInput = getElement('hiddenFileInput');
    const removePic = getElement('removePic');

    if (uploadTrigger && fileInput) {
        uploadTrigger.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                return showError("Please select an image file.");
            }

            if (file.size > 5 * 1024 * 1024) {
                return showError("Max size is 5MB.");
            }

            try {
                const result = await uploadAvatar(getUserId(), file);
                currentUser.profile_picture = result.profile_picture;

                document.querySelectorAll('#profilePreview').forEach(img => {
                    img.src = result.profile_picture;
                });

                showSuccess("Profile picture updated!");
            } catch (err) {
                showError(err.message);
            }

            fileInput.value = '';
        });
    }

    removePic?.addEventListener('click', async () => {
        try {
            currentUser.profile_picture = null;
            await updateUserInDB(currentUser);

            const defaultAvatar = '/static/images/avatar.jpg';

            document.querySelectorAll('#profilePreview').forEach(img => {
                img.src = defaultAvatar;
            });

            showSuccess("Profile picture removed!");
        } catch (err) {
            showError(err.message);
        }
    });
}

function setupMoreInfoCollapse() {
    const toggleBtn = getElement('moreInfoToggle');
    const infoBody = getElement('moreInfoBody');

    if (!toggleBtn || !infoBody) return;

    toggleBtn.addEventListener('click', () => {
        const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        const next = !expanded;

        toggleBtn.setAttribute('aria-expanded', String(next));

        const label = toggleBtn.querySelector('.label');
        if (label) label.textContent = next ? 'Hide' : 'Show';

        infoBody.classList.toggle('is-collapsed', !next);
    });
}