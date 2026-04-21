import { clearUserSessionData } from '../utils.js';
import { resetState } from '../state.js';
import { logout } from '../api.js';

export function initLogout() {
    const countdownEl = document.getElementById('logoutCountdown');
    if (!countdownEl) return;

    let secondsRemaining = 5;
    countdownEl.textContent = secondsRemaining;

    const intervalId = setInterval(() => {
        secondsRemaining -= 1;
        countdownEl.textContent = secondsRemaining;

        if (secondsRemaining <= 0) {
            clearInterval(intervalId);
            // Clear server-side session
            logout()
                .finally(() => {
                    clearUserSessionData();
                    resetState();
                    window.location.href = 'home.html';
                });
        }
    }, 1000);
}
