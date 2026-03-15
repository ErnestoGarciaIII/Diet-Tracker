
// ----------------- UserInfo page JavaScript -----------------
document.getElementById('dietary-form').addEventListener('submit', function(e) {
    e.preventDefault(); // Prevents the page from refreshing

    // 1. Grab the values from the inputs
    const age = parseFloat(document.getElementById('userAgeDisplay').value);
    const weight = parseFloat(document.getElementById('userWeightDisplay').value);
    const gender = document.getElementById('userGenderDisplay').value;
    const height = parseFloat(document.getElementById('userHeightDisplay').value);
    

    // 2. Calculate Basal Metabolic Rate (BMR) 
    // This formula is for a general average; you can add gender toggle later for 100% accuracy
    // Formula: (10 * weight) + (6.25 * height) - (5 * age) + 5
    const bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;

    // 3. Store the data locally so the AI can use it on the next page
    localStorage.setItem('userBMR', bmr);
    localStorage.setItem('userAgeDisplay', age);
    localStorage.setItem('userGenderDisplay', gender);
    localStorage.setItem('userHeightDisplay', height);
    localStorage.setItem('userWeightDisplay', weight);
    
    console.log("Calculated BMR:", bmr);

    // 4. Move to the next step (e.g., Goals or Restrictions)

    
});

function nextStep1() {
    window.location.href = 'goals.html';
}