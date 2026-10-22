const signupForm = document.getElementById("signupForm");

signupForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const firstName = document.getElementById("fname").value;
    const lastName = document.getElementById("lname").value;
    const email = document.getElementById("email").value;
    const phone = document.getElementById("pnumber").value;
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

    // Create the user
    const user = {
        firstName: firstName,
        lastName: lastName,
        email: email,
        phone: phone,
        password: password
    };

    // Save the user in the browser
    localStorage.setItem("aerolinkUser", JSON.stringify(user));

    alert("Account created successfully!");

    // Send user to login page
    window.location.href = "logIn.html";
});