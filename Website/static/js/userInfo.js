document.addEventListener('DOMContentLoaded', () => {
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', setUserInfo);
    }
    // navigate to the history page when back button is clicked
    const backButton = document.getElementById('backBtn').addEventListener('click', function () {
        history.back();
    });
});

async function setUserInfo(event) {
    event.preventDefault();

    const age = parseInt(document.getElementById('userAgeDisplay').value);
    const weightLbs = parseFloat(document.getElementById('userWeightDisplay').value);
    const heightIn = parseFloat(document.getElementById('userHeightDisplay').value);
    const sex = document.querySelector('input[name="sex"]:checked')?.value;
    const activityLevel = document.querySelector('input[name="activityLevel"]:checked')?.value;

    if (!age || !weightLbs || !heightIn || !sex || !activityLevel) {
        alert("Please fill in all fields.");
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
        const updateResponse = await fetch('/api/update_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user_id,
                age: age,
                weight_lbs: weightLbs,
                height_in: heightIn,
                sex: sex,
                goal: null, // user sets their goal on the next page in the registration process
                activity_level: activityLevel
            })
        });
        const data = await updateResponse.json();

        if (!updateResponse.ok) {
            throw new Error(data.error || "Failed to update database");
        }

        alert("User profile updated successfully!");
        // navigate to the goals
        window.location.href = this.dataset.url;

    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

