import { setRestrictions } from '../api.js';
import { getElement, getUserId, showError, showSuccess } from '../utils.js';

let selected = [];

export function initRestrictions() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => toggleTag(tag));
    });

    const finishBtn = getElement('finishBtn');
    if (finishBtn) finishBtn.addEventListener('click', saveRestrictions);
}

function toggleTag(tag) {
    const value = tag.dataset.value;

    if (selected.includes(value)) {
        selected = selected.filter(v => v !== value);
        tag.classList.remove('tag-active');
    } else {
        selected.push(value);
        tag.classList.add('tag-active');
    }
}

async function saveRestrictions() {
    const user_id = getUserId();
    if (!user_id) return showError("User not found.");

    try {
        await setRestrictions(user_id, selected);
        showSuccess("Restrictions saved!");
        const finishBtnData = getElement("finishBtn").dataset;
        window.location.href = finishBtnData.url; // goes to dashboard page

    } catch (err) {
        showError(err.message);
    }
}