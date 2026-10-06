// firebase-init.js
//
// Shared Firebase setup. Every page that needs login or database
// access imports `auth` and `db` from this one file, so there's
// only a single place with the project config.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBWdAq63_L1BDaHS8jbyoxD5D21Ajn8Zp4",
    authDomain: "gardner-college-library-dev.firebaseapp.com",
    projectId: "gardner-college-library-dev",
    storageBucket: "gardner-college-library-dev.firebasestorage.app",
    messagingSenderId: "777331940220",
    appId: "1:777331940220:web:18a598379a9f6807ac22f9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
