import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
// import { getAnalytics } from "firebase/analytics";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/setup#config-object
const firebaseConfig = {
    apiKey: "AIzaSyBaViA9bRZk65t0RjcxodCGiIUByPALQP8",
    authDomain: "queuemanager-a7525.firebaseapp.com",
    databaseURL: "https://queuemanager-a7525-default-rtdb.firebaseio.com",
    projectId: "queuemanager-a7525",
    storageBucket: "queuemanager-a7525.firebasestorage.app",
    messagingSenderId: "824334075732",
    appId: "1:824334075732:web:ccd2f543db8e278fa12ac1",
    measurementId: "G-7THDTXSE52"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
// const analytics = getAnalytics(app);

export { app, database };
