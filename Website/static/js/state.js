// This is all Jayce's code

import { showMessage } from './utils.js';
// ==========================
// PRIVATE STATE
// ==========================
let user = {
    user_id: null,
    DOB: null,
    weight_lbs: null,
    height_in: null,
    sex: null,
    activity_level: null,
    goal: null,
    profile_picture: null
};

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
export function getUserId() {
    const localUserId = localStorage.getItem('user_id');
    if (user.user_id) {
        return user.user_id;
    }

    if (localUserId) {
        user.user_id = localUserId;
        return localUserId;
    }

    return null;
}

export function setUserId(id) {
    localStorage.setItem('user_id', id);
    user.user_id = id;
}
export function setUser(userData) {
    user = { ...userData };
}

export function getUser() {
    return user;
}

export function updateUserObject(updates) {
    user = { ...user, ...updates };
}

export function clearUser() {
    localStorage.removeItem('user_id');
    user = {
        user_id: null,
        DOB: null,
        weight_lbs: null,
        height_in: null,
        sex: null,
        activity_level: null,
        goal: null,
        profile_picture: null
    };
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