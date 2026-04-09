import { register } from '../api.js';
import { getElement, getInputValue, showError } from '../utils.js';
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

function checkPasswordCriteria(password, confirm) {
    // Configurable rules
    const rules = {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumber: true,
        requireSymbol: true
    };

    let errors = [];

    // Length
    if (password.length < rules.minLength) {
        errors.push(`at least ${rules.minLength} characters`);
    }

    // Character checks
    if (rules.requireLowercase && !/[a-z]/.test(password)) {
        errors.push("one lowercase letter");
    }

    if (rules.requireUppercase && !/[A-Z]/.test(password)) {
        errors.push("one uppercase letter");
    }

    if (rules.requireNumber && !/\d/.test(password)) {
        errors.push("one number");
    }

    if (rules.requireSymbol && !/[^A-Za-z\d]/.test(password)) {
        errors.push("one symbol");
    }

    // Show all password issues at once
    if (errors.length > 0) {
        return showError(
            "Password must include: " + errors.join(", ") + "."
        );
    }

    // Match check
    if (password !== confirm) {
        return showError("Passwords do not match.");
    }

    return ("success");
}
