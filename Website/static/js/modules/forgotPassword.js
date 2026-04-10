import { forgot_password } from '../api.js';
import { getElement, getInputValue, showError, showMessage } from '../utils.js';

export function initForgotPassword() {
    const form = getElement('forgotForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = getInputValue('email');

        if (!email) {
            return showError("Please enter the email associated with your account.");
        }

        try {
            const data = await forgot_password(email);
            showMessage(data.message)
            // redirect to dashboard
            window.location.href = 'home.html';
        } catch (err) {
            showError(err.message);
        }
    });
}