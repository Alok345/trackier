// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import {getAuth} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBqNH0Z4nkA8Rk1-bAo3Vk0OTIyrXcbIyg",
  authDomain: "trackier-85ecd.firebaseapp.com",
  projectId: "trackier-85ecd",
  storageBucket: "trackier-85ecd.firebasestorage.app",
  messagingSenderId: "99958353445",
  appId: "1:99958353445:web:0138af7a28fd1034ce19cc",
  measurementId: "G-HYY5P0K3GK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const firestore = getFirestore(app);
const auth = getAuth(app);
export {firestore, auth};