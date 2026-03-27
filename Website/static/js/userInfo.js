async function setUserInfo(event) {
    event.preventDefault();

    const age = parseInt(document.getElementById('userAgeDisplay').value);
    const weightLbs = parseFloat(document.getElementById('userWeightDisplay').value);
    const heightIn = parseFloat(document.getElementById('userHeightDisplay').value);
    const sex = document.querySelector('input[name="gender"]:checked')?.value;

    if (!age || !weightLbs || !heightIn || !sex) {
        alert("Please fill in all fields.");
        return;
    }

    // Convert to metric
    const weightKg = (weightLbs * 0.453592).toFixed(2);
    const heightCm = (heightIn * 2.54).toFixed(2);

    // Get user_id from localStorage
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
        alert("User not identified. Please log in again.");
        return;
    }

    try {
        // 1️⃣ Update the database
        const updateResponse = await fetch('/api/update_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user_id,
                age: age,
                weight_lbs: weightLbs,
                height_in: heightIn,
                sex: sex,
                goal: 1,
                activity_level: 1
            })
        });
        const data = await updateResponse.json();

        if (!updateResponse.ok) {
            throw new Error(data.error || "Failed to update database");
        }

        // 2️⃣ Calculate DRI
        const driResponse = await fetch('/api/dri', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                age: age,
                weight: weightKg,
                height: heightCm,
                sex: sex,
                activity_level: 1,
                goal: 1
            })
        });
        const driResult = await driResponse.json();

        if (!driResponse.ok) {
            throw new Error(driResult.error || "Failed to calculate DRI");
        }

        // Save DRI to localStorage
        localStorage.setItem('userProfile', JSON.stringify(driResult));

        alert("User profile updated successfully!");
        window.location.href = 'goals.html';

    } catch (error) {
        console.error("Error:", error);
        alert(error.message);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const userForm = document.getElementById('dietary-form');
    if (userForm) {
        userForm.addEventListener('submit', setUserInfo);
    }
});