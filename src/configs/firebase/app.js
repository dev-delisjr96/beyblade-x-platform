// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAEutzJMxny8tstu6ZA-FbRhenk2AZSqnQ",
  authDomain: "beyblade-x-deck-builder.firebaseapp.com",
  databaseURL: "https://beyblade-x-deck-builder-default-rtdb.firebaseio.com",
  projectId: "beyblade-x-deck-builder",
  storageBucket: "beyblade-x-deck-builder.firebasestorage.app",
  messagingSenderId: "1011652727435",
  appId: "1:1011652727435:web:ebd117783c721788a07a8e",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export default app;
