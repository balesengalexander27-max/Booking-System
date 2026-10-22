const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    // Get the saved user from localStorage
    const savedUser = localStorage.getItem("aerolinkUser");

    // Check if an account exists
    if (!savedUser) {
        alert("No account found. Please sign up first.");
        return;
    }

    // Convert the saved information back into an object
    const user = JSON.parse(savedUser);

    // Check email and password
    if (email === user.email && password === user.password) {

        // Remember that the user is logged in
        localStorage.setItem("isLoggedIn", "true");

        // Go to dashboard
        window.location.href = "dashboard.html";

    } else {
        alert("Incorrect email or password.");
    }
});