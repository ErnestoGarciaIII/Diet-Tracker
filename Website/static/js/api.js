import * as State from './state.js';
// ==========================
// GENERIC REQUEST HANDLER
// ==========================
async function request(url, options = {}) {
    try {
        const res = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;

    } catch (err) {
        console.error(`API Error (${url}):`, err);
        throw err;
    }
}

// ==========================
// AUTH
// ==========================
export async function login(email, password) {
    return request('/api/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
    });
}

export async function register(name, email, password) {
    return request('/api/register', {
        method: 'POST',
        body: JSON.stringify({ name: name, email: email, password: password })
    });
}

// ==========================
// USER
// ==========================
export async function getUserInfo(userId) {
    if (!userId) {
        return console.warn("No valid userId!")
    }
    return request(`/api/get-user-info?user_id=${userId}`);
}

export async function updateUser(user) {
    return request('/api/update_user', {
        method: 'POST',
        body: JSON.stringify(user)
    });
}

export async function uploadAvatar(userId, file) {
    const formData = new FormData();
    formData.append('user_id', userId);
    formData.append('avatar', file);

    const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Image upload failed');
    }
    return data;
}

// ==========================
// GOALS
// ==========================
export async function updateGoal(userId, goalId) {
    return request('/api/update_goal', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            goal_id: goalId
        })
    });
}

// ==========================
// RESTRICTIONS
// ==========================
export async function setRestrictions(userId, restrictions) {
    return request('/set-restrictions', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            restrictions
        })
    });
}

// ==========================
// DRI (Nutrition Targets)
// ==========================
export async function calculateDRI(userId) {
    return request('/api/dri', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
    });
}

// ==========================
// FOOD LOGGING
// ==========================
export async function logFood(userId, food) {
    return request('/api/log-food', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            ...food
        })
    });
}

// ==========================
// PROGRESS
// ==========================
export async function getProgress(userId) {
    return request(`/api/progress/${userId}`);
}

// ==========================
// FOOD HISTORY (for charts)
// ==========================
export async function getFoodHistory(userId) {
    return request(`/api/food-history/${userId}`);
}