import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCOyQRWXIP3OOsVPnUOQyHYRi6HswV6pwo",
  authDomain: "jiraclone-beb80.firebaseapp.com",
  projectId: "jiraclone-beb80",
  storageBucket: "jiraclone-beb80.firebasestorage.app",
  messagingSenderId: "680303413245",
  appId: "1:680303413245:web:3d7700138044691216fb94"
};


const app = initializeApp(firebaseConfig);


export const auth = getAuth(app);


export const db = getFirestore(app);