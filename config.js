import { initializeApp } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';

import { getAuth } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js';

import { getFirestore } from 'https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js';

    const firebaseConfig = {
  apiKey: "AIzaSyDhd0mV_Vrr5deOKfPexoY60QZzwnNJMgQ",
  authDomain: "airport-booking-system-78273.firebaseapp.com",
  projectId: "airport-booking-system-78273",
  storageBucket: "airport-booking-system-78273.firebasestorage.app",
  messagingSenderId: "624615530979",
  appId: "1:624615530979:web:0c9f46880ef6c793f780d6",
  measurementId: "G-VECQX34XFF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);