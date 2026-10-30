import { auth,db } from "../config.js";
 
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
 
/**
 * Registers a new user.
 * Creates an account in Firebase Authentication using the email and password,
 * then saves the user's profile (uid, email, name, any extra details, and a
 * creation timestamp) as a document in the "users" Firestore collection,
 * using the user's uid as the document ID.
 * Returns the newly created Firebase user object.
 * Logs and rethrows any error so the caller can handle it.
 */
export async function signUp(email, password, name, gender, details = {}) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
 
    const user = userCredential.user;
 
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      email: email,
      name: name ?? "",
      ...details,
      createdAt: serverTimestamp(),
    });
 
    return user;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}
 
/**
 * Logs in an existing user.
 * Authenticates with Firebase using the provided email and password
 * and returns the signed-in Firebase user object.
 * Logs and rethrows any error (e.g. wrong password) so the caller can handle it.
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
 
    const user = userCredential.user;
    return user;
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}
 
/**
 * Sends a password reset email to the given address via Firebase Authentication.
 * Logs a success message when the email is sent.
 * Logs and rethrows any error so the caller can handle it.
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
 
    console.log("Password reset email sent successfully!");
  } catch (error) {
    console.log(error.message);
    throw error;
  }
}