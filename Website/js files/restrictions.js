// Initialize an array to hold multiple selections
let selectedRestrictions = [];

/**
 * Toggles a restriction tag on or off
 * @param {HTMLElement} element - The tag element clicked
 * @param {string} value - The restriction value (e.g., 'vegan', 'nuts')
 */
function toggleTag(element, value) {
    // Check if the item is already in our array
    const index = selectedRestrictions.indexOf(value);

    if (index > -1) {
        // If it exists, remove it (Deselect)
        selectedRestrictions.splice(index, 1);
        element.classList.remove('tag-active');
    } else {
        // If it doesn't exist, add it (Select)
        selectedRestrictions.push(value);
        element.classList.add('tag-active');
    }

    console.log("Current Restrictions:", selectedRestrictions);
}

/**
 * Saves selections and completes the onboarding
 */
function finishOnboarding() {
    // We save the array as a JSON string so LocalStorage can store it properly
    localStorage.setItem('userRestrictions', JSON.stringify(selectedRestrictions));
    
    // Redirect to the final Dashboard
    window.location.href = 'dashboard.html';
}