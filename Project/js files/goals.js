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

/**
 * Validates selection and navigates to the next page
 */
function nextStep() {
    if (!selectedGoal) {
        alert("Please select a goal to proceed!");
        return;
    }
    // Redirect to the final onboarding step
    window.location.href = 'restrictions.html';
}