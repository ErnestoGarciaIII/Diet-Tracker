import { updateUser, uploadAvatar } from '../api.js';
import { getUserId, getInputValue, getCheckedValue, showError, showSuccess } from '../utils.js';

export function initUserInfo() {
    const btn = document.getElementById('continueBtn');
    const uploadTrigger = document.getElementById('uploadTrigger');
    const avatarInput = document.getElementById('userAvatarInput');
    const preview = document.getElementById('registrationPreview');
    const user_id = getUserId();
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
}

async function handleSubmit(e, selectedProfilePicture) {
    e.preventDefault();

    const user_id = getUserId();
    const avatarInput = document.getElementById('userAvatarInput');

    if (!avatarInput || !avatarInput.files || avatarInput.files.length === 0) {
        return showError('Please upload a profile picture before continuing.');
    }

    if (!selectedProfilePicture) {
        return showError('Waiting for profile picture upload. Please try again in a moment.');
    }

    const user = {
        user_id,
        age: parseInt(getInputValue('userAgeDisplay')),
        weight_lbs: parseFloat(getInputValue('userWeightDisplay')),
        height_in: parseFloat(getInputValue('userHeightDisplay')),
        sex: getCheckedValue('sex'),
        activity_level: getCheckedValue('activityLevel'),
        goal: null,
        profile_picture: selectedProfilePicture
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
