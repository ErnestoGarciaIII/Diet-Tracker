import { setRestrictions } from '../api.js';
import { getElement, getUserId, showError, showSuccess } from '../utils.js';

let selected = [];

export function initRestrictions() {
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', () => toggleTag(tag));
    });

    const finishBtn = getElement('finishBtn');
    const backBtn = getElement('backBtn');
    if (finishBtn) finishBtn.addEventListener('click', saveRestrictions);
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.history.length > 1) {
                window.history.back();
                return;
            }
            window.location.href = 'goals.html';
        });
    }
}

function toggleTag(tag) {
    const value = tag.dataset.value;

    if (value === 'None') {
        // If "None" is selected, clear all other selections
        if (!selected.includes(value)) {
            // Clear all other tags
            document.querySelectorAll('.tag').forEach(t => {
                if (t !== tag) {
                    t.classList.remove('tag-active');
                }
            });
            selected = ['None'];
            tag.classList.add('tag-active');
        } else {
            // Deselecting "None"
            selected = selected.filter(v => v !== value);
            tag.classList.remove('tag-active');
        }
    } else {
        // For other restrictions, if "None" is selected, deselect it first
        if (selected.includes('None')) {
            const noneTag = document.querySelector('.tag[data-value="None"]');
            if (noneTag) {
                noneTag.classList.remove('tag-active');
            }
            selected = selected.filter(v => v !== 'None');
        }

        // Toggle the current tag
        if (selected.includes(value)) {
            selected = selected.filter(v => v !== value);
            tag.classList.remove('tag-active');
        } else {
            selected.push(value);
            tag.classList.add('tag-active');
        }
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