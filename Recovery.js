const resetForm = document.getElementById("resetForm");

resetForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("reset-email").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    // Get the saved account
    const savedUser = localStorage.getItem("aerolinkUser");

    // Check if an account exists
    if (!savedUser) {
        alert("No account has been registered yet.");
        return;
    }

    // Convert saved data back into an object
    const user = JSON.parse(savedUser);

    // Check if email matches
    if (email !== user.email) {
        alert("No account was found with this email address.");
        return;
    }

    // Check that password fields are not empty
    if (newPassword === "" || confirmPassword === "") {
        alert("Please enter and confirm your new password.");
        return;
    }

    // Check that passwords match
    if (newPassword !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }

    // Update the password
    user.password = newPassword;

    // Save updated account
    localStorage.setItem("aerolinkUser", JSON.stringify(user));

    alert("Password reset successfully!");

    // Return to login
    window.location.href = "logIn.html";
});