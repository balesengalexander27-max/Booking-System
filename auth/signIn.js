import { signIn } from "./auth.js";

document.getElementById("signIn").addEventListener("click", async function () {
  try {
    await signIn("youbetterwork@gmail.com", "zandie");
    console.log("Sign-in successful!");
  } catch (error) {
    console.error("Sign-in failed:", error.message);
  }
});