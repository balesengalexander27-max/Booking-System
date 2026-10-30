import { signIn } from "./auth/auth.js";

// Accounts that go straight to the admin page after logging in
const ADMIN_EMAILS = ["admin@gmail.com"];

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    // Check that both fields are filled
    if (email === "" || password === "") {
        alert("Please enter your email and password.");
        return;
    }

    try {
        // Log in with Firebase
        const user = await signIn(email, password);

        // Remember that the user is logged in
        localStorage.setItem("isLoggedIn", "true");

        // Admin goes to the admin page, everyone else to the dashboard
        const loggedInEmail = String(user.email || "").toLowerCase();
        if (ADMIN_EMAILS.includes(loggedInEmail)) {
            window.location.href = "Admin.html";
        } else {
            window.location.href = "dashboard.html";
        }

    } catch (error) {
        console.error("Login failed:", error);
        alert("Incorrect email or password.");
    }
});