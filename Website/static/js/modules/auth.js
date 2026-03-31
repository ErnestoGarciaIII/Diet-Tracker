// ---------------------- Authentication logic for Register/Login pages------------------
document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIN LOGIC ---
    const loginForm = document.getElementById('loginForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('loginEmail').value;
            const pass = document.getElementById('loginPassword').value;

            try {
                const response = await fetch("/api/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email, password: pass })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Login failed");
                }

                localStorage.setItem('userEmail', email);
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('user_id', data.user_id); // store user_id from login

                window.location.href = 'dashboard.html';

            } catch (error) {
                alert(error.message);
            }
        });
    }

    // --- SIGNUP LOGIC ---
    const signupForm = document.getElementById('credentialsForm');

    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('password').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (!fullName || !email || !pass || !confirm) {
                alert("Please fill in all fields.");
                return;
            }

            if (pass.length < 6) {
                alert("Password must be at least 6 characters.");
                return;
            }

            if (pass !== confirm) {
                alert("Passwords do not match!");
                return;
            }

            try {
                const response = await fetch("/api/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: fullName, email: email, password: pass })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Registration failed");
                }

                // Save important info to localStorage
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userNameDisplay', fullName);
                localStorage.setItem('user_id', data.user_id); // <-- store the user_id here
                localStorage.setItem('isLoggedIn', 'true');

                alert("Account created successfully!");

                // Redirect to user info page
                window.location.href = 'userinfo.html';

            } catch (error) {
                alert(error.message);
            }
        });
    }

});