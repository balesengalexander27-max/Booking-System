import { signUp } from "./auth/auth.js";
 
const signupForm = document.getElementById("signupForm");
 
signupForm.addEventListener("submit", async function(event) {
    event.preventDefault();
 
    const firstName = document.getElementById("fname").value.trim();
    const lastName = document.getElementById("lname").value.trim();
    const email = document.getElementById("email").value.trim();
    const phone = document.getElementById("pnumber").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm").value;
    const terms = document.getElementById("terms").checked;
 
    // Check that all fields are filled
    if (
        firstName === "" ||
        lastName === "" ||
        email === "" ||
        phone === "" ||
        password === "" ||
        confirmPassword === ""
    ) {
        alert("Please fill in all fields.");
        return;
    }
 
    // Check password confirmation
    if (password !== confirmPassword) {
        alert("Passwords do not match.");
        return;
    }
 
    // Check terms and conditions
    if (!terms) {
        alert("Please agree to the Terms of Carriage and Privacy Policy.");
        return;
    }
 
    try {
        // Create the account and save the details to Firebase
        await signUp(email, password, firstName + " " + lastName, "", {
            firstName: firstName,
            lastName: lastName,
            phone: phone
        });
 
        alert("Account created successfully!");
 
        // Send user to login page (only after the save has finished)
        window.location.href = "logIn.html";
    } catch (error) {
        console.error("Sign-up failed:", error);
        alert("Sign-up failed: " + error.message);
    }
});