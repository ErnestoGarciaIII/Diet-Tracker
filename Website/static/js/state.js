// ==========================
// PRIVATE STATE
// ==========================
let user = null;
let localUserId = null;

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
export function setLocalUserId(user_id) {
    localUserId = localStorage.setItem('user_id', user_id);
}
export function getLocalUserId() {
    return localUserId;
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
}