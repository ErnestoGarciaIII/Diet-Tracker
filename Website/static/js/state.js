import { showMessage } from './utils.js';
// ==========================
// PRIVATE STATE
// ==========================
let user = null;
let userId = null;

let progress = {
    calories: 0,
    macros: 0,
    micros: 0
};

let ui = {
    loading: false
};

// ==========================
// USER STATE
// ==========================
export function setUserId(user_id) {
    localStorage.setItem('user_id', user_id);
    userId = user_id;
}
export function getUserId() {
    if (!userId)
        userId = localStorage.getItem('user_id'); //try to get a user id
    return userId;  //userId can be null
}
export function setUser(userData) {
    user = userData;
}

export function getUser() {
    return user;
}

export function updateUser(updates) {
    user = { ...user, ...updates };
}

export function setBadge(badge = null) {
    switch (badge) {
        case "FirstLog":
            localStorage.setItem('FirstLog', 'true');
            showMessage("Congratulations!! You received your first award: 'First Logged Item'");
            break;

        case "ThreeDayLog":
            localStorage.setItem('ThreeDayLog', 'true');
            showMessage("Congratulations!! You received your second award: 'Three days logged'");
            break;

        case "FiveDayLog":
            localStorage.setItem('FiveDayLog', 'true');
            showMessage("Congratulations!! You received your third award: 'Five days logged'");
            break;
    }
}

export function getBadge() {
    if (localStorage.getItem('FiveDayLog') === 'true') {
        return 'FiveDayLog';
    }
    if (localStorage.getItem('ThreeDayLog') === 'true') {
        return 'ThreeDayLog';
    }
    if (localStorage.getItem('FirstLog') === 'true') {
        return 'FirstLog';
    }
    return null;
}

// ==========================
// PROGRESS STATE
// ==========================
export function setProgress(progressData) {
    progress = { ...progress, ...progressData };
}

export function getProgress() {
    return progress;
}

export function updateProgress(updates) {
    progress = { ...progress, ...updates };
}

// ==========================
// UI STATE (optional)
// ==========================
export function setLoading(isLoading) {
    ui.loading = isLoading;
}

export function isLoading() {
    return ui.loading;
}

// ==========================
// RESET (useful for logout)
// ==========================
export function resetState() {
    user = null;
    progress = {
        calories: 0,
        macros: 0,
        micros: 0
    };
    ui = {
        loading: false
    };
    localStorage.clear();
}