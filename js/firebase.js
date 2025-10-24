import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Utility for Hashing Passwords (Client-Side SHA-256) ---
// This is used to securely store the password in the database.
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convert bytes to hex string
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

const firebaseConfig = {
    apiKey: "AIzaSyCnCovkec0YaXmgpcnNLx1qiCpGG7-iipU",
    authDomain: "educational-site-f1fac.firebaseapp.com",
    projectId: "educational-site-f1fac",
    storageBucket: "educational-site-f1fac.firebasestorage.app",
    messagingSenderId: "868437050505",
    appId: "1:868437050505:web:8ca5d61feee67a67647258"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app); 

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();
    const cleanedPhone = phone.replace(/\D/g, '');
    const email = `${cleanedPhone}@fakeuser.com`; 

    const errorEl = document.getElementById('register-error-message');
    if(errorEl) errorEl.classList.add('hidden');

    try {
        // --- 1. CHECK FOR EXISTING USER ---
        const uid = cleanedPhone; 
        const usersSnapshot = await get(ref(db, 'users/' + uid));
        
        if (usersSnapshot.exists()) {
            throw new Error('This phone number is already registered.');
        }

        // --- 2. HASH PASSWORD ---
        const hashedPassword = await hashPassword(password);
        
        // --- 3. CREATE USER DATA IN REALTIME DATABASE ---
        await set(ref(db, 'users/' + uid), {
            name: name,
            email: email, 
            phone: cleanedPhone,
            passwordHash: hashedPassword 
        });
        
        alert('Registration successful!');
        navigation(name, cleanedPhone, uid); 
    } catch (error) {
        let errorMessage = error.message;
        alert(errorMessage);
    }
});

function navigation(name, phone, uid) {
    const email = `${phone}@fakeuser.com`;

    localStorage.setItem('loggedUser', JSON.stringify({
        name: name,
        phone: phone,
        email: email,
        uid: uid 
    }));

    window.location.href = "./index.html"; 
}
