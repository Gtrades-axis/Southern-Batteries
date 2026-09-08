// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBXbxz4MW7yHu1sOEcURRDq36KVg3fbSfA",
  authDomain: "southern-batteries.firebaseapp.com",
  databaseURL: "https://southern-batteries-default-rtdb.firebaseio.com",
  projectId: "southern-batteries",
  storageBucket: "southern-batteries.firebasestorage.app",
  messagingSenderId: "651673835340",
  appId: "1:651673835340:web:6e1ae31aab45e4b568e1e9",
  measurementId: "G-DZEJ8XZN0D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
