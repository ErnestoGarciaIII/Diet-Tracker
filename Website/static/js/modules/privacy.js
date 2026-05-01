// ALL EDGAR'S CODE

import { getElement } from '../utils.js';

/**
 * Updates the "Login" link to "Back to Dashboard" if the user is authenticated.
 * Uses the 'data-dashboard-url' attribute from the HTML element.
 */
export function initDynamicAuthLink() {
    const authLink = getElement('dynamicAuthLink');
    const footerAuthLink = getElement('footerAuthLink');
    // Helper to update a link
    function updateLink(link, loggedIn, dashboardUrl, loginUrl) {
        if (!link) return;
        if (loggedIn && dashboardUrl) {
            link.href = dashboardUrl;
            link.textContent = "Back to Dashboard";
        } else {
            link.href = loginUrl || '/login.html';
            link.textContent = "Login";
        }
    }

    // Check server-side session
    fetch('/api/session')
        .then(res => res.json())
        .then(data => {
            const loggedIn = data.logged_in && data.user_id;
            if (authLink) {
                updateLink(authLink, loggedIn, authLink.dataset.dashboardUrl, authLink.getAttribute('data-login-url'));
            }
            if (footerAuthLink) {
                updateLink(footerAuthLink, loggedIn, footerAuthLink.dataset.dashboardUrl, footerAuthLink.getAttribute('data-login-url'));
            }
        })
        .catch(() => {
            if (authLink) {
                updateLink(authLink, false, null, authLink ? authLink.getAttribute('data-login-url') : null);
            }
            if (footerAuthLink) {
                updateLink(footerAuthLink, false, null, footerAuthLink ? footerAuthLink.getAttribute('data-login-url') : null);
            }
        });
}
