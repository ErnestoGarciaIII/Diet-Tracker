// =================================
// utils.js will hold helper methods 
// =================================

// ==========================
// DATE HELPERS
// ==========================
export function formatDate(date) {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
    });
}

export function getTodayString() {
    return new Date().toDateString();
}

// ==========================
// DOM HELPERS
// ==========================
export function getElement(id) {
    return document.getElementById(id);
}

export function createElement(tag, text = '', className = '') {
    const el = document.createElement(tag);
    if (text) el.innerText = text;
    if (className) el.className = className;
    return el;
}

export function clearElement(el) {
    if (el) el.innerHTML = '';
}

// ==========================
// VALIDATION HELPERS
// ==========================
export function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

export function isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

// ==========================
// FORM HELPERS
// ==========================
export function getInputValue(id) {
    const el = getElement(id);
    return el ? el.value.trim() : '';
}

export function getCheckedValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
}

// ==========================
// UI HELPERS
// ==========================
export function showLoading(el, text = "Loading...") {
    if (el) el.innerText = text;
}

export function showError(message) {
    alert(message); // later you can replace with toast UI
}

export function showSuccess(message) {
    alert(message);
}

export function showMessage(message) {
    alert(message)
}

// ==========================
// LOCAL STORAGE (LIMITED USE)
// ==========================
export function getUserId() {
    return localStorage.getItem('user_id');
}

export function setUserId(id) {
    localStorage.setItem('user_id', id);
}

export function clearUser() {
    localStorage.removeItem('user_id');
}

// =========================
// Password Rules
// =========================
export function checkPasswordCriteria(password, confirm) {
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

