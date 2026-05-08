import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD7DsQVnnEMejiD-3fIFqy0eAO7NfGjMBA",
  authDomain: "froostro-32794.firebaseapp.com",
  projectId: "froostro-32794",
  storageBucket: "froostro-32794.firebasestorage.app",
  messagingSenderId: "810097599219",
  appId: "1:810097599219:web:4cc73267d425cf92aa4d86"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);