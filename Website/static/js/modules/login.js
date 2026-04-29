import { login } from '../api.js';
import { getElement, getInputValue, showError } from '../utils.js';
import { setUserId, getUserId } from '../state.js';

export function initLogin() {
    const form = getElement('loginForm');
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
            setUserId(data.user_id);

            // redirect to dashboard
            const loginButtonData = getElement('loginButton').dataset;
            window.location.href = loginButtonData.url;

        } catch (err) {
            showError(err.message);
        }
    });
}