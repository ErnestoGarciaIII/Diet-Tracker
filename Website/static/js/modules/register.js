import { register } from '../api.js';
import { getElement, getInputValue, showError } from '../utils.js';
import * as State from '../state.js';

export function initRegister() {
    alert("you've entered the init method!")
    const form = getElement('credentialsForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = getInputValue('fullName');
        const email = getInputValue('email');
        const password = getInputValue('password');
        const confirm = getInputValue('confirmPassword');
        alert("you made it past the getInputValueMethods!")
        if (!name || !email || !password || !confirm) {
            return showError("Please fill in all fields.");
        }

        if (password.length < 8) {
            return showError("Password must be at least 8 characters.");
        }

        if (password !== confirm) {
            return showError("Passwords do not match.");
        }

        alert(`${name} ; ${email} ; ${password}` )

        try {
            const data = await register(name, email, password);
            alert(data.user_id);
            // go to userInfo page
            State.setLocalUserId(data.user_id);
            alert(State.getLocalUserId());
            const sumbitBtnData = getElement('submitBtn').dataset;
            window.location.href = sumbitBtnData.url;

        } catch (err) {
            showError("hello" + err.message);
        }
    });
}