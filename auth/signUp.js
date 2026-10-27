import { signUp } from "../auth/auth.js";

document.getElementById("signUp").addEventListener("click", async function () {
  const email = document.getElementById ("email").value;
  const password = document.getElementById("password").value;
  const confirmpassword = document.getElementById("confirm-password").value;

  if(!email || !password || !confirmpasswords){
    alert("Please fill all the fields(Email, Password and confirm Password).");
      return;
  }

  try {
    if (password === confirmpassword) {
      await signUp(email, password);
      console.log("Sign-up successful!");
      window.location.href = "./signIn.html";
    } else {
      alert("Password does not match");
    }
  } catch (error) {
    console.error("Sign-up failed:", error.message);
  }
});
