import { resetPassword } from "./auth/auth.js";
 
const resetForm = document.getElementById("resetForm");
 
resetForm.addEventListener("submit", async function(event) {
    event.preventDefault();
 
    const email = document.getElementById("reset-email").value.trim();
 
    // Check that the email is filled
    if (email === "") {
        alert("Please enter your registered email address.");
        return;
    }
 
    try {
        // Firebase emails the user a link to set a new password
        await resetPassword(email);
 
        alert("Password reset link sent! Check your email inbox (and spam folder).");
 
        // Return to login
        window.location.href = "logIn.html";
    } catch (error) {
        console.error("Password reset failed:", error);
 
        if (error.code === "auth/user-not-found") {
            alert("No account was found with this email address.");
        } else if (error.code === "auth/invalid-email") {
            alert("Please enter a valid email address.");
        } else {
            alert("Could not send the reset email: " + error.message);
        }
    }
});