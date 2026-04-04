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