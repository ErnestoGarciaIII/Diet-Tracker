import { updateGoal, calculateDRI } from '../api.js';
import { getUserId, showError, showSuccess } from '../utils.js';

let selectedGoal = null;

export function initGoals() {
    const cards = document.querySelectorAll('.goalCard');
    cards.forEach(card => {
        card.addEventListener('click', () => {
            selectGoal(card);
        });
    });

    const btn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');
    if (btn) btn.addEventListener('click', handleSubmit);
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
                return;
            }
            window.location.href = 'userInfo.html';
        });
    }
}

function selectGoal(card) {
    document.querySelectorAll('.goalCard').forEach(c => c.classList.remove('selected'));

    card.classList.add('selected');
    selectedGoal = parseInt(card.dataset.goalid);
}

async function handleSubmit(e) {
    e.preventDefault();

    if (!selectedGoal) {
        return showError("Please select a goal.");
    }

    const user_id = getUserId();

    try {
        await updateGoal(user_id, selectedGoal);
        await calculateDRI(user_id);

        showSuccess("Goal saved!");

        const btn = document.getElementById('continueBtn');
        window.location.href = btn.dataset.url;

    } catch (err) {
        showError(err.message);
    }
}