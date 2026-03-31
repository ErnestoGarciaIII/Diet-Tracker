import { clearUser } from '../utils.js';
import { resetState } from '../state.js';

export function logout() {
    // clear frontend state
    clearUser();
    resetState();

    // redirect to login
    window.location.href = 'login.html';
}