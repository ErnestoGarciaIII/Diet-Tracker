
//--------------- Goals page JavaScript -----------------

// Initialize the selected goal variable
let selectedGoal = '';

/**
 * Handles the selection of a goal card
 * @param {HTMLElement} element - The card element that was clicked
 * @param {string} goal - The value of the goal (e.g., 'lose', 'gain')
 */

function selectGoal(element, goal) {
    // 1. Remove 'selected' class from all cards to reset the UI
    const allCards = document.querySelectorAll('.goalCard');
    allCards.forEach(card => {
        card.classList.remove('selected');
    });

    // 2. Add 'selected' class to the clicked card for the visual highlight
    element.classList.add('selected');
    
    // 3. Store the selection in memory and LocalStorage for the AI to use later
    selectedGoal = goal;
    localStorage.setItem('userGoal', goal);
    
    console.log("Goal saved to LocalStorage:", goal);
}

document.addEventListener('DOMContentLoaded', () => {
    const goalForm = document.getElementById('goalForm');
    if (goalForm) {
        goalForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            await nextStep();
        });
    }
});

/**
 * Validates selection and navigates to the next page
 */
async function nextStep() {
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
                goal: selectedGoal
            })
        });
        const updateResult = await updateResponse.json();

        if (!updateResponse.ok) {
            throw new Error(updateResult.error || "Failed to update database");
        }

        // Save goal to localStorage
        localStorage.setItem('goal', JSON.stringify(updateResult));

        alert("User goal saved successfully!");

        // Redirect to the final onboarding step
        window.location.href = 'restrictions.html';
    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}