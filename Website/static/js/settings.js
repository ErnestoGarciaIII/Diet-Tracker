document.addEventListener('DOMContentLoaded', () => {
    init();

    const saveBtn = document.getElementById('saveBtn');

    if (saveBtn) {
        saveBtn.addEventListener('click', saveSettings);
    }
});

async function init() {
    try {
        const user = await getUserInfo();
        populateForm(user);
        console.log("Sucessfully retrieved user info.")
    } catch (err) {
        console.error("Failed to load user:", err);
        alert("Could not load user data.");
    }
}

//leaving for debugging purposes
function printUser(user) {
    console.log(`User: ${user.name}\n`)
    console.log(`sex: ${user.sex}\n`)
    console.log(`age: ${user.age}\n`)
    console.log(`weight: ${user.weight_lbs}\n`)
    console.log(`height: ${user.height_in}\n`)
    console.log(`activity lvl: ${user.activity_level}\n`)
    console.log(`goal: ${user.goal}\n`)
    console.log(`email: ${user.email}\n`)
}

async function getUserInfo() {
    const user_id = localStorage.getItem('user_id');
    if (!user_id) {
        throw new Error("User not logged in");
    }

    try {
        const response = await fetch(`/api/get-user-info?user_id=${user_id}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Failed to fetch user");
        }

        return data;

    } catch (err) {
        console.error("Error fetching user:", err);
        throw err;
    }
}

function populateForm(user) {
    setValue('userName', user.name);
    setValue('userSex', user.sex ? user.sex.toString() : '');
    setValue('userAge', user.age);
    setValue('userWeight', user.weight_lbs);
    setValue('userHeight', user.height_in);
    setValue('activityLevel', user.activity_level ? user.activity_level.toString() : '');
    setValue('userGoal', user.goal ? user.goal.toString() : '');
    setValue('userEmail', user.email);
}

function setValue(id, value) {
    const element = document.getElementById(id);
    console.log(`Setting ${id} to`, value, "Element exists?", !!element);
    if (element && value !== null && value !== undefined) {
        element.value = value;
    }
}

async function saveSettings() {
    const user = collectFormData();

    if (!isValid(user)) {
        alert("Please fill in all required fields.");
        return;
    }

    try {
        await updateUser(user);
        alert("Settings saved!");
    } catch (err) {
        console.error(err);
        alert("Failed to save settings.");
    }
}

function collectFormData() {
    return {
        user_id: localStorage.getItem('user_id'),
        name: document.getElementById('userName').value,
        sex: document.getElementById('userSex').value,
        age: parseInt(document.getElementById('userAge').value),
        weight_lbs: parseFloat(document.getElementById('userWeight').value),
        height_in: parseFloat(document.getElementById('userHeight').value),
        activity_level: parseInt(document.getElementById('activityLevel').value),
        goal: parseInt(document.getElementById('userGoal').value),
        email: document.getElementById('userEmail').value
    };
}

function isValid(user) {
    return user.sex && user.age && user.weight_lbs && user.height_in;
}

async function updateUser(user) {
    try {
        const response = await fetch('/api/update_user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Update failed");
        }

        return data;

    } catch (err) {
        console.error("Error updating user:", err);
        throw err;
    }
}
