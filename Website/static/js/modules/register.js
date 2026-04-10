import { register } from '../api.js';
import { getElement, getInputValue, showError } from '../utils.js';
import { getElement, getInputValue, showError, checkPasswordCriteria } from '../utils.js';
import * as State from '../state.js';

export function initRegister() {
    const form = getElement('credentialsForm');
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


	const validationMsg = checkPasswordCriteria(password, confirm);
        if (!validationMsg.includes("success")) {
            showError(validationMsg);
            return;
	}
        try {
            const data = await register(name, email, password);
            State.setUserId(data.user_id);
            // go to userInfo page
            const sumbitBtnData = getElement('submitBtn').dataset;
            window.location.href = sumbitBtnData.url;
        } catch (err) {
            showError(err.message);
        }
    });
}
