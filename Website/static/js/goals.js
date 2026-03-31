// Initialize the selected goal variable
let selectedGoal = '';

document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.goalCard');
    cards.forEach(card => {
        card.addEventListener('click', function () {
            const goalId = parseInt(this.dataset.goalid);
            selectGoal(this, goalId);
        });
    });

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', async (event) => {
            event.preventDefault();
            await updateGoal();
        });
    }
    // navigate to the history page when back button is clicked
    const backButton = document.getElementById('backBtn').addEventListener('click', function () {
        history.back();
    });
});
/**
 * Handles the selection of a goal card
 * @param {HTMLElement} element - The card element that was clicked
 * @param {string} goal - The value of the goal (e.g., 'lose', 'gain')
 */
function selectGoal(element, goalId) {
    const allCards = document.querySelectorAll('.goalCard');

    allCards.forEach(card => {
        card.classList.remove('selected');
    });

    element.classList.add('selected');
    selectedGoal = goalId;
    console.log("Goal ID selected:", goalId);
}
/**
 * Validates selection and navigates to the next page
 */
async function updateGoal() {
    if (!selectedGoal) {
        alert("Please select a goal to proceed!");
        return;
    }
    // Get user_id from localStorage
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
        alert("User not identified. Please log in again.");
        return;
    }

    try {
        // Update the database
        const updateResponse = await fetch('/api/update_goal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user_id,
                goal_id: selectedGoal
            })
        });
        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
            throw new Error(updateResult.error || "Failed to update database");
        }

        alert("User goal saved successfully!");
        // Calculate DRI
        const driResponse = await fetch('/api/dri', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user_id
            })
        });

        const driResult = await driResponse.json();

        if (!driResponse.ok) {
            throw new Error(driResult.error || "Failed to calculate DRI");
        }

        // Save DRI to localStorage -- leaving this for now, but this will be saved in the database in the future
        localStorage.setItem('userProfile', JSON.stringify(driResult));
        console.log(`DRI calculated:\n${driResult}`);
        // navigate to the restrictions page
        const continueBtn = document.getElementById('continueBtn')
        window.location.href = continueBtn.dataset.url;
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}