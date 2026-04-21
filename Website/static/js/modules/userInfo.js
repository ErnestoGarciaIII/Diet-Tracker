import { updateUser, uploadAvatar } from '../api.js';
import { getUserId, getInputValue, getCheckedValue, showError, showSuccess } from '../utils.js';

export function initUserInfo() {
    const btn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');
    const uploadTrigger = document.getElementById('uploadTrigger');
    const avatarInput = document.getElementById('userAvatarInput');
    const preview = document.getElementById('registrationPreview');
    const user_id = getUserId();
    const heightUnit = document.getElementById('heightUnit');
    const standardHeight = document.getElementById('userHeightDisplay');
    const ftInContainer = document.getElementById('ftInHeight');

    heightUnit.addEventListener('change', () => {
        if (heightUnit.value === 'ftin') {
            standardHeight.style.display = 'none';
            standardHeight.required = false;
            ftInContainer.style.display = 'flex';
        } else {
            standardHeight.style.display = 'block';
            standardHeight.required = true;
            ftInContainer.style.display = 'none';
        }
    });
    let selectedProfilePicture = null;

    if (!btn) return;

    if (uploadTrigger && avatarInput) {
        uploadTrigger.addEventListener('click', () => avatarInput.click());
    }

    if (avatarInput && preview) {
        avatarInput.addEventListener('change', async () => {
            const file = avatarInput.files[0];
            if (!file) {
                showError('No file selected.');
                return;
            }

            const url = URL.createObjectURL(file);
            preview.src = url;

            try {
                const response = await uploadAvatar(user_id, file);
                selectedProfilePicture = response.profile_picture;
                showSuccess('Profile picture uploaded successfully.');
            } catch (err) {
                showError(err.message);
            }
        });
    }

    btn.addEventListener('click', (e) => handleSubmit(e, selectedProfilePicture));

    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
                return;
            }
            window.location.href = 'register.html';
        });
    }

    window.toggleSexDisclaimer = toggleSexDisclaimer;
}

async function handleSubmit(e, selectedProfilePicture) {
    e.preventDefault();

    const user_id = getUserId();
    const dobValue = getInputValue('userDobDisplay');

    if (dobValue) {
        const dob = new Date(dobValue);
        const today = new Date();

        // Calculate age
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            age--;
        }

        // Validate range
        if (age < 18) {
            return showError("You must be at least 18 years old to use PlatePilot.");
        }
        if (age > 116) {
            return showError("Please enter a valid date of birth (maximum age is 116).");
        }
    }

    const avatarInput = document.getElementById('userAvatarInput');

    if (!avatarInput || !avatarInput.files || avatarInput.files.length === 0) {
        return showError('Please upload a profile picture before continuing.');
    }

    if (!selectedProfilePicture) {
        return showError('Waiting for profile picture upload. Please try again in a moment.');
    }

    let finalWeight = parseFloat(getInputValue('userWeightDisplay'));
    const weightUnit = document.getElementById('weightUnit').value;
    if (weightUnit === 'kg') {
        finalWeight = finalWeight * 2.20462; 
    }

    let finalHeight = 0;
    const hUnit = document.getElementById('heightUnit').value;
    if (hUnit === 'in') {
        finalHeight = parseFloat(getInputValue('userHeightDisplay'));
    } else if (hUnit === 'cm') {
        finalHeight = parseFloat(getInputValue('userHeightDisplay')) / 2.54;
    } else if (hUnit === 'm') {
        finalHeight = (parseFloat(getInputValue('userHeightDisplay')) * 100) / 2.54;
    } else if (hUnit === 'ftin') {
        const ft = parseFloat(document.getElementById('heightFt').value) || 0;
        const inch = parseFloat(document.getElementById('heightIn').value) || 0;
        finalHeight = (ft * 12) + inch;
    }

    const user = {
        user_id,
        DOB: dobValue,
        weight_lbs: parseFloat(finalWeight.toFixed(2)),
        height_in: parseFloat(finalHeight.toFixed(2)),
        sex: getCheckedValue('sex'),
        activity_level: getCheckedValue('activityLevel'), 
        goal: null,
        profile_picture: selectedProfilePicture
    };

    if (!user.DOB || isNaN(user.weight_lbs) || isNaN(user.height_in) || !user.sex || !user.activity_level) {
        return showError("Please fill in all fields correctly.");
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
function toggleSexDisclaimer(event) {
    event.preventDefault();
    const disclaimer = document.getElementById('sexDisclaimer');
    if (disclaimer.style.display === 'none') {
        disclaimer.style.display = 'block';
    } else {
        disclaimer.style.display = 'none';
    }
}
