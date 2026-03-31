import { login } from '../api.js';
import { $, getInputValue, showError } from '../utils.js';

export function initLogin() {
    const form = $('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = getInputValue('loginEmail');
        const password = getInputValue('loginPassword');

        if (!email || !password) {
            return showError("Please enter email and password.");
        }

        try {
            const data = await login(email, password);

            // store ONLY user_id
            localStorage.setItem('user_id', data.user_id);

            // redirect to dashboard
            window.location.href = 'dashboard.html';

        } catch (err) {
            showError(err.message);
        }
    });
}