import { getUserId, getElement } from '../utils.js';

/**
 * Updates the "Login" link to "Back to Dashboard" if the user is authenticated.
 * Uses the 'data-dashboard-url' attribute from the HTML element.
 */
export function initDynamicAuthLink() {
    const authLink = getElement('dynamicAuthLink');
    const userId = getUserId();

    if (userId && authLink && authLink.dataset.dashboardUrl) {
        authLink.href = authLink.dataset.dashboardUrl;
        authLink.textContent = "Back to Dashboard";
    }
}
