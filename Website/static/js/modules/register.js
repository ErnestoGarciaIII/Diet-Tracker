import { register } from '../api.js';
import { $, getInputValue, showError } from '../utils.js';

export function initSignup() {
    const form = $('credentialsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = getInputValue('fullName');
        const email = getInputValue('email');
        const password = getInputValue('password');
        const confirm = getInputValue('confirmPassword');

        if (!name || !email || !password || !confirm) {
            return showError("Please fill in all fields.");
        }

        if (password.length < 6) {
            return showError("Password must be at least 6 characters.");
        }

        if (password !== confirm) {
            return showError("Passwords do not match.");
        }

        try {
            const data = await register(name, email, password);

            localStorage.setItem('user_id', data.user_id);

            // go to onboarding
            window.location.href = 'userinfo.html';

        } catch (err) {
            showError(err.message);
        }
    });
}