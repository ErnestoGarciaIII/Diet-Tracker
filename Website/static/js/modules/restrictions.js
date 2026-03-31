document.addEventListener('DOMContentLoaded', () => {
    const tags = document.querySelectorAll('.tag');
    let selectedRestrictions = [];

    tags.forEach(tag => {
        tag.addEventListener('click', () => {
            const value = tag.dataset.value;

            // Toggle selection
            const index = selectedRestrictions.indexOf(value);
            if (index > -1) {
                selectedRestrictions.splice(index, 1);
                tag.classList.remove('tag-active');
            } else {
                selectedRestrictions.push(value);
                tag.classList.add('tag-active');
            }

            console.log("Current Restrictions:", selectedRestrictions);
        });
    });

    const finishBtn = document.getElementById('finishBtn');
    finishBtn.addEventListener('click', async () => {
        const user_id = localStorage.getItem('user_id');
        if (!user_id) {
            alert("User not identified. Please log in again.");
            return;
        }

        try {
            const updateResponse = await fetch("/set-restrictions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: user_id,
                    restrictions: selectedRestrictions
                })
            });

            const updateResult = await updateResponse.json();

            if (!updateResponse.ok) {
                throw new Error(updateResult.error || "Failed to update database");
            }

            localStorage.setItem('userRestrictions', JSON.stringify(selectedRestrictions));
            alert("User restrictions saved successfully!");
            window.location.href = 'dashboard.html';
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        }
    });

    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', () => {
        history.back();
    });
});