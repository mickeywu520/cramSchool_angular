export const environment = {};
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWHj8Ia3kcJpzI-383guRYVEt4BlEWOfc",
  authDomain: "cramschool-b4d52.firebaseapp.com",
  projectId: "cramschool-b4d52",
  storageBucket: "cramschool-b4d52.firebasestorage.app",
  messagingSenderId: "81636913641",
  appId: "1:81636913641:web:ca0c030f4bf5a7608a5b78"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);