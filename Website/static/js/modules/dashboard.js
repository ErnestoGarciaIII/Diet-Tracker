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

    // Load saved profile picture
    if (getElement('profilePreview') && user.profile_picture) {
        getElement('profilePreview').src = user.profile_picture;
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
        const userId = State.getUserId();
        const [progress, genericProgress, dri] = await Promise.all([
            API.getConsumed(userId),
            API.getGenericProgress(userId),
            API.calculateDRI(userId)
        ]);

        State.setProgress(progress);
        updateProgressUI(progress, genericProgress, dri);

    } catch (err) {
        console.error("Failed to load progress:", err);
    }
}

//all for progress bars and activity chart
function toNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
}

//
function progressMetrics(progress) {
    const calories = toNumber(progress?.calories ?? progress?.Energy ?? 0);
    const protein = toNumber(progress?.Protein ?? progress?.protein ?? 0);
    const carbs = toNumber(
        progress?.Carbs ?? progress?.carbs ?? progress?.Carbohydrate ?? progress?.['Carbohydrate, by difference'] ?? 0
    );
    const fats = toNumber(
        progress?.Fats ?? progress?.fats ?? progress?.Fat ?? progress?.['Total lipid (fat)'] ?? 0
    );
    const macros = toNumber(progress?.macros ?? (protein + carbs + fats));

    let micros = toNumber(progress?.micros ?? 0);
    if (!micros) {
        const excludedKeys = new Set([
            'calories', 'energy', 'protein', 'carbs', 'carbohydrate', 'carbohydrate, by difference',
            'fats', 'fat', 'total lipid (fat)', 'macros', 'micros'
        ]);

        micros = Object.entries(progress || {}).reduce((sum, [key, value]) => {
            if (excludedKeys.has(String(key).toLowerCase())) return sum;
            return sum + toNumber(value);
        }, 0);
    }

    return { calories, macros, micros };
}

// Determine the appropriate icon based on progress percentage
function getProgressIcon(percent) {
    if (percent >= 100) return '🛸';
    if (percent >= 70) return '🚀';
    if (percent >= 35) return '✈️';
    return '🛩️';
}

function parseGenericProgress(genericProgress) {
    if (Array.isArray(genericProgress)) {
        return {
            microPercent: toNumber(genericProgress[0]),
            macroPercent: toNumber(genericProgress[1]),
            caloriePercent: toNumber(genericProgress[2])
        };
    }

    return {
        microPercent: toNumber(genericProgress?.micros ?? genericProgress?.micro ?? 0),
        macroPercent: toNumber(genericProgress?.macros ?? genericProgress?.macro ?? 0),
        caloriePercent: toNumber(genericProgress?.calories ?? genericProgress?.energy ?? 0)
    };
}

function formatPercent(value) {
    return `${Math.round(toNumber(value) * 10) / 10}%`;
}

// Update the progress bars and icons in the UI based on the user's progress
function updateProgressUI(progress, genericProgress, dri) {
    const { calories, macros, micros } = progressMetrics(progress);
    const { caloriePercent, macroPercent, microPercent } = parseGenericProgress(genericProgress);

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

    const calorieBarPercent = Math.min(Math.max(caloriePercent, 0), 100);

    const bar = getElement('kcalProgressBar');
    const plane = getElement('planeIcon');
    const kcalPercentLabel = getElement('kcalBarPercent');
    const macroBar = getElement('gProgressBar');
    const macroPlane = getElement('planeIcon1');
    const macroPercentLabel = getElement('gBarPercent');
    const microBar = getElement('mgProgressBar');
    const microPlane = getElement('planeIcon2');
    const microPercentLabel = getElement('mgBarPercent');

    if (bar) bar.style.width = `${calorieBarPercent}%`;
    if (kcalPercentLabel) kcalPercentLabel.innerText = formatPercent(caloriePercent);
    if (macroBar) {
        const safeMacroPercent = Math.min(Math.max(macroPercent, 0), 100);
        macroBar.style.width = `${safeMacroPercent}%`;
        if (macroPercentLabel) macroPercentLabel.innerText = formatPercent(macroPercent);
        if (macroPlane) {
            macroPlane.style.left = `${safeMacroPercent}%`;
            macroPlane.innerText = getProgressIcon(macroPercent);
        }
    }

    if (microBar) {
        const safeMicroPercent = Math.min(Math.max(microPercent, 0), 100);
        microBar.style.width = `${safeMicroPercent}%`;
        if (microPercentLabel) microPercentLabel.innerText = formatPercent(microPercent);
        if (microPlane) {
            microPlane.style.left = `${safeMicroPercent}%`;
            microPlane.innerText = getProgressIcon(microPercent);
        }
    }

    if (plane) {
        plane.style.left = `${calorieBarPercent}%`;
        plane.innerText = activeTier.icon;

        // animation
        plane.style.transform = "translate(-50%, -50%) rotate(-10deg)";
        setTimeout(() => {
            plane.style.transform = "translate(-50%, -50%) rotate(0deg)";
        }, 800);
    }

    const recommendedKcal = dri && dri.TDEE ? Math.round(dri.TDEE) : activeTier.goal;
    if (getElement('planeRank')) getElement('planeRank').innerText = activeTier.name;
    if (getElement('currentTotal')) getElement('currentTotal').innerText = Math.round(calories);
    if (getElement('goalNum')) getElement('goalNum').innerText = recommendedKcal;
}

// ==========================
// MOTIVATIONAL QUOTE
// ==========================
async function updateDailyQuote() {
    const el = document.getElementById('motivational');
    if (!el) return;

    el.innerText = "Loading today's inspiration...";

    try {
        const res = await fetch('/api/daily-quote');
        if (!res.ok) {
            throw new Error(`Quote API failed: ${res.status}`);
        }

        const data = await res.json();
        const author = data.author ? ` — ${data.author}` : '';
        if (data?.quote) {
            el.innerText = `"${data.quote}"${author}`;
            return;
        }

        throw new Error('Invalid quote payload');
    } catch {
        el.innerText = 'Quote unavailable right now.';
    }
}

// ==========================
// ACTIVITY CHART
// ==========================
export async function renderActivityChart() {
    const ctx = getElement('activityChart');
    if (!ctx) return;

    try {
        const userId = State.getUserId();

        const days = 7;
        const labels = [];
        const caloriesPercentData = [];
        const macrosPercentData = [];
        const microsPercentData = [];
        const dateStrings = [];

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);

            const label = formatDate(d);
            labels.push(label);
            dateStrings.push(d.toDateString());
        }

        const dailyProgressList = await Promise.all(
            dateStrings.map(dateStr => API.getGenericProgress(userId, dateStr))
        );

        dailyProgressList.forEach(progress => {
            const { caloriePercent, macroPercent, microPercent } = parseGenericProgress(progress || {});
            caloriesPercentData.push(Math.round(caloriePercent * 10) / 10);
            macrosPercentData.push(Math.round(macroPercent * 10) / 10);
            microsPercentData.push(Math.round(microPercent * 10) / 10);
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Calories (%)',
                    data: caloriesPercentData,
                    backgroundColor: 'rgba(22, 163, 74, 0.6)',
                    borderColor: '#16a34a',
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Macros (%)',
                    data: macrosPercentData,
                    backgroundColor: '#3498db',
                    borderColor: '#3498db',
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                },
                {
                    label: 'Micros (%)',
                    data: microsPercentData,
                    backgroundColor: '#f1c40f',
                    borderColor: '#f1c40f',
                    borderWidth: 2,
                    borderRadius: 4,
                    barPercentage: 0.8,
                    categoryPercentage: 0.7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: (value) => `${value}%`
                        },
                        grid: {color: 'rgba(0,0,0,0.05)'}
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: true,
                        position: 'top',
                        labels: {boxWidth: 12, font: {size: 11}}
                    }
                }
            }
        });

    } catch (err) {
        console.error("Chart failed:", err);
    }
}