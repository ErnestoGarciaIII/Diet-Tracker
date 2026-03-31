import * as State from '../state.js';
import * as API from '../api.js';
import { getElement, clearElement, createElement, formatDate } from '../utils.js';

// ==========================
// INIT
// ==========================
export async function initDashboard() {
    try {
        const user = State.getUser();
        if (!user) throw new Error("User not loaded");

        renderUserInfo(user);
        renderRestrictions(user.restrictions || []);

        await loadProgress();
        await renderActivityChart();
        await updateDailyQuote();

    } catch (err) {
        console.error("Dashboard init failed:", err);
        alert("Failed to load dashboard.");
    }
}

// ==========================
// USER INFO
// ==========================
function renderUserInfo(user) {
    if (getElement('userNameDisplay')) {
        getElement('userNameDisplay').innerText = user.name || 'Guest User';
    }

    const calorieTarget = calculateCalories(user.goal);

    if (getElement('calorieTarget')) {
        getElement('calorieTarget').innerText = `${calorieTarget} kcal`;
    }
}

function calculateCalories(goal) {
    switch (goal) {
        case 'lose': return 1600;
        case 'gain': return 2600;
        default: return 2000;
    }
}

// ==========================
// RESTRICTIONS
// ==========================
function renderRestrictions(restrictions) {
    const list = getElement('profileList');
    if (!list) return;

    clearElement(list);

    restrictions.forEach(res => {
        const li = createElement('li', `🚫 ${res}`);
        list.appendChild(li);
    });
}

// ==========================
// PROGRESS
// ==========================
async function loadProgress() {
    try {
        const userId = State.getUser().user_id;
        const progress = await API.getProgress(userId);

        State.setProgress(progress);
        updateProgressUI(progress);

    } catch (err) {
        console.error("Failed to load progress:", err);
    }
}

function updateProgressUI(progress) {
    const calories = progress.calories || 0;

    const tiers = [
        { name: "Cessna", icon: "🛩️", goal: 500 },
        { name: "Boeing 747", icon: "✈️", goal: 1500 },
        { name: "Supersonic Jet", icon: "🚀", goal: 2500 },
        { name: "UFO", icon: "🛸", goal: 5000 }
    ];

    let activeTier = tiers[0];
    for (let i = 0; i < tiers.length; i++) {
        if (calories >= tiers[i].goal) {
            activeTier = tiers[i];
        }
    }

    const percent = Math.min((calories / activeTier.goal) * 100, 100);

    const bar = getElement('dashProgressBar');
    const plane = getElement('planeIcon');

    if (bar) bar.style.width = percent + "%";

    if (plane) {
        plane.style.left = percent + "%";
        plane.innerText = activeTier.icon;

        // animation
        plane.style.transform = "translate(-50%, -50%) rotate(-10deg)";
        setTimeout(() => {
            plane.style.transform = "translate(-50%, -50%) rotate(0deg)";
        }, 800);
    }

    if (getElement('planeRank')) getElement('planeRank').innerText = activeTier.name;
    if (getElement('currentTotal')) getElement('currentTotal').innerText = calories;
    if (getElement('goalNum')) getElement('goalNum').innerText = activeTier.goal;
}

// ==========================
// MOTIVATIONAL QUOTE
// ==========================
async function updateDailyQuote() {
    const el = document.getElementById('motivational');
    if (!el) return;

    el.innerText = "Loading...";

    try {
        const res = await fetch('https://api.allorigins.win/get?url=' +
            encodeURIComponent('https://zenquotes.io/api/random'));
        const data = await res.json();
        const quote = JSON.parse(data.contents)[0];

        el.innerText = `"${quote.q}" — ${quote.a}`;
    } catch {
        el.innerText = `"Small steps lead to big changes."`;
    }
}

// ==========================
// ACTIVITY CHART
// ==========================
export async function renderActivityChart() {
    const ctx = getElement('activityChart');
    if (!ctx) return;

    try {
        const userId = State.getUser().user_id;
        const history = await API.getFoodHistory(userId);

        const days = 7;
        const labels = [];
        const caloriesData = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const label = formatDate(d);
            labels.push(label);

            const dateStr = d.toDateString();
            const dayLogs = history.filter(item => item.date === dateStr);

            const total = dayLogs.reduce((sum, item) => sum + item.kcal, 0);
            caloriesData.push(total);
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Calories (kcal)',
                    data: caloriesData,
                    backgroundColor: 'rgba(22, 163, 74, 0.6)',
                    borderColor: '#16a34a',
                    borderWidth: 2,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

    } catch (err) {
        console.error("Chart failed:", err);
    }
}
