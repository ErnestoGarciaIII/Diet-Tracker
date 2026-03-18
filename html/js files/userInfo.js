sync function setUserInfo() {
	event.preventDefault();

	const age = document.getElementById('userAgeDisplay').value;
	const weightLbs = document.getElementById('userWeightDisplay').value;
	const heightIn = document.getElementById('userHeightDisplay').value
	const sex = document.querySelector('input[name="gender"]:checked')?.value

	const weightKg = (weightLbs * 0.45392).toFixed(2);
	const heightCm = (heightIn * 2.54).toFixed(2);

	const userData = {
		age: age,
		weight: weightKg,
		height: heightCM,
		sex: sex,
		activity_level: 0, 
		goal: 0
	};

	try {
		const reponse = await fetch('/api/dri', {
		method: 'POST'
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(userData)
		});

		const result = awai response.json();

		if (response.ok) {
			console.log("Data saved successfully:", result);

			localStorage.setItem('userProfile', JSON.stringify(result));

			window.location.href = '/dashboard';
		} else {
			alert("Error: " + result.error);
		}
	} catch (error) {
		console.error("Failed to send data: ", error);
	}
}
