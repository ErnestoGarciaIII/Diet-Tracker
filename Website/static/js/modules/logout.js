import { clearUser } from '../utils.js';
import { resetState } from '../state.js';

export function initLogout() {
    const countdownEl = document.getElementById('logoutCountdown');
    if (!countdownEl) return;

    // Clear frontend state as soon as logout page loads.
    clearUser();
    resetState();

    let secondsRemaining = 5;
    countdownEl.textContent = String(secondsRemaining);

    const intervalId = setInterval(() => {
        secondsRemaining -= 1;
        countdownEl.textContent = String(secondsRemaining);

        if (secondsRemaining <= 0) {
            clearInterval(intervalId);
            window.location.href = '/';
        }
    }, 1000);
}

