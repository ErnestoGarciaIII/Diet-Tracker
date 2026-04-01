import * as API from './api.js';
import * as State from './state.js';
import * as Util from './utils.js';
import { initDashboard } from './modules/dashboard.js';
import { initFoodLog } from './modules/foodLog.js';
import { initRestrictions } from './modules/restrictions.js';
import { initGoals } from './modules/goals.js';
import { initUserInfo } from './modules/userInfo.js';
import { initSettings } from './modules/settings.js';
import { initLogin } from './modules/login.js';
import { initRegister } from './modules/register.js';

document.addEventListener('DOMContentLoaded', async () => {
    const userId = State.getUserId();
    // Protected pages require login
    const protectedPage =
        Util.getElement('dashboardPage') ||
        Util.getElement('foodLogPage') ||
        Util.getElement('settingsPage') ||
        Util.getElement('goalsPage') ||
        Util.getElement('restrictionsPage') ||
        Util.getElement('userInfoPage');

    // Page-specific initialization
    if (Util.getElement('homePage')); // Home page doesn't need init unless we add logic to it
    if (Util.getElement('registerPage')) initRegister();
    if (Util.getElement('loginPage')) initLogin();
    if (protectedPage && !userId) {
        window.location.href = 'home.html'
    }

    try {
        if (userId && protectedPage) {
            const user = await API.getUserInfo(userId);
            State.setUser(user);

            // Initialize feature modules based on page
            if (Util.getElement('dashboardPage')) initDashboard();
            if (Util.getElement('foodLogPage')) initFoodLog();
            if (Util.getElement('restrictionsPage')) initRestrictions();
            if (Util.getElement('goalsPage')) initGoals();
            if (Util.getElement('userInfoPage')) initUserInfo();
            if (Util.getElement('settingsPage')) initSettings();
        }
    } catch (err) {
        console.error("Failed to load user:", err);
        window.location.href = 'home.html';
    }
});
