import { reset_password } from '../api.js';
import { getElement, getInputValue, showError, showMessage, checkPasswordCriteria } from '../utils.js';

export function initResetPassword() {
    const form = getElement('resetForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const password = getInputValue('password');
        const confirm = getInputValue('confirmPassword');

        if (!password || !confirm) {
            return showError("Please enter a password and confirm your password.");
        }

        const validationMsg = checkPasswordCriteria(password, confirm);
        if (!validationMsg.includes("success")) {
            showError(validationMsg);
            return;
        }

        try {
            const params = new URLSearchParams(window.location.search);
            const token = params.get('token');
            if (!token) {
                return showError("No valid token or link. Request a new 'reset password' email.");
            }
            const data = await reset_password(token, password);

            showMessage("Password successfully reset! Please login again!")
            window.location.href = 'login.html';
        } catch (err) {
            showError(err.message);
        }
    });
}