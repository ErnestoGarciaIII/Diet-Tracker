// ---------------------- Authentication logic for Register/Login pages------------------
document.addEventListener('DOMContentLoaded', () => {
    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;

            if (email && pass.length >= 8) {
                localStorage.setItem('userEmail', email);
                localStorage.setItem('isLoggedIn', 'true');
                window.location.href = 'dashboard.html';
            } else {
                alert("Please enter a valid email and 8+ character password.");
            }
        });
    }

    // --- SIGNUP LOGIC ---
    const signupForm = document.getElementById('credentialsForm'); // Matches your signup ID
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName').value;
            const email = document.getElementById('email').value;
            const pass = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (pass !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            localStorage.setItem('userNameDisplay', fullName);
            localStorage.setItem('userEmailDisplay', email);
            localStorage.setItem('userPassword', password);
            localStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'userInfo.html';
        });
    }
});