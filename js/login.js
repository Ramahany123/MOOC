import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";

// --- Utility for Hashing Passwords (Client-Side SHA-256) ---
// This function must match the one in register.js exactly.
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}


// --- 1. CONFIGURATION ---
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

// Function to ensure the base /roles node exists (used for later admin setup)
async function ensureRolesNodeExists() {
    try {
        const rolesSnapshot = await get(ref(db, 'roles'));
        if (!rolesSnapshot.exists()) {
            // Write an empty object to create the node if it's missing
            await set(ref(db, 'roles'), {});
            console.log("Created missing /roles node.");
        }
    } catch (error) {
        // This will often fail initially due to missing write rules, but we include it.
        console.warn("Could not ensure /roles node exists. Check write permissions:", error);
    }
}

// 🔑 NEW FUNCTION: Fetches the list of UIDs authorized as Admin
async function getAdminUIDs() {
    try {
        const snapshot = await get(ref(db, 'roles/admin'));
        // The data is returned as an object { UID1: true, UID2: true }
        const adminMap = snapshot.val() || {};
        // Return an array of keys (the UIDs/phone numbers) where the value is true
        return Object.keys(adminMap).filter(uid => adminMap[uid] === true);
    } catch (error) {
        console.error("Failed to fetch admin roles:", error);
        return []; 
    }
}

// 🔑 TEMPORARY SETUP FUNCTION: Creates the Admin account in /users and role in /roles/admin
async function ensureAdminUserSetup(uid, password, name) {
    const adminUserRef = ref(db, 'users/' + uid);
    const adminRoleRef = ref(db, 'roles/admin/' + uid);

    // 1. Create User in /users
    const passwordHash = await hashPassword(password);
    await set(adminUserRef, {
        name: name,
        email: `${uid}@fakeuser.com`,
        phone: uid,
        passwordHash: passwordHash
    });
    console.log(`Admin user ${uid} profile created in /users.`);

    // 2. Create Role in /roles/admin
    await set(adminRoleRef, true);
    console.log(`Admin user ${uid} role assigned in /roles/admin.`);
}


// --- 2. CONSTANTS & DOM ELEMENTS ---
const ADMIN_DASHBOARD = 'admin.html';
const USER_HOME = 'home.html'; 
const INITIAL_ADMIN_PHONE = '01000000000'; // Define the admin key here
const INITIAL_ADMIN_PASSWORD = 'admin123'; // Define the plaintext password here

document.addEventListener('DOMContentLoaded', () => {
    // Attempt to create the /roles node if it's missing
    ensureRolesNodeExists(); 
    
    const loginForm = document.getElementById('loginForm'); 
    const errorEl = document.getElementById('error-message');
    const loginBtn = document.getElementById('login-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => handleLogin(e, errorEl, loginBtn));
    } else {
        console.error("Login form with ID ''loginForm'' not found.");
    }
});


// --- 3. LOGIN HANDLER ---
async function handleLogin(e, errorEl, loginBtn) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const phoneInput = formData.get('phone').trim();
    const passwordInput = formData.get('password').trim();

    // Reset UI state
    errorEl.classList.add('hidden');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing In...';

    // Normalize phone (which is the UID/Key in the /users table)
    const cleanedPhone = phoneInput.replace(/\D/g, '');
    const uid = cleanedPhone;
    const email = `${cleanedPhone}@fakeuser.com`; 
    
    // Fetch the list of admin UIDs for the role check
    const adminUIDs = await getAdminUIDs();


    try {
        // 1. AUTHENTICATE VIA REALTIME DATABASE: Fetch user record using phone number (UID)
        const userSnapshot = await get(ref(db, 'users/' + uid));
        
        if (!userSnapshot.exists()) {
            // 🔑 TEMPORARY SETUP CHECK: If the user is the admin and they are missing, create them.
            if (uid === INITIAL_ADMIN_PHONE && passwordInput === INITIAL_ADMIN_PASSWORD) {
                console.log("Initial admin account missing. Running one-time setup...");
                // Set the user in /users and their role in /roles/admin
                await ensureAdminUserSetup(uid, passwordInput, "Super Admin");
                // Login will proceed, but to ensure the newly created user data is fetched, 
                // we throw a temporary error to force the user to click login again.
                // This is the simplest way to get the data without recursive calls.
                throw { code: 'admin-setup', message: 'Admin account created. Please click Sign In again.' }; 
            }
            throw { code: 'user-not-found', message: 'Invalid phone number or password. Please check your credentials.' };
        }

        const userData = userSnapshot.val();
        
        // 2. HASH AND COMPARE PASSWORD
        const inputPasswordHash = await hashPassword(passwordInput);
        
        if (inputPasswordHash !== userData.passwordHash) {
             throw { code: 'wrong-password', message: 'Invalid password.' };
        }

        // 3. Session Management (Store logged user details)
        const userName = userData.name || ""; 

        localStorage.setItem('loggedUser', JSON.stringify({
            name: userName, 
            phone: cleanedPhone,
            email: email,
            uid: uid 
        }));
        
        console.log("Login successful via RTDB."); 

        // 4. 🔑 ADMIN ROLE REDIRECTION CHECK
        if (adminUIDs.includes(uid)) {
            console.log('Admin user detected. Redirecting to dashboard.');
            window.location.href = ADMIN_DASHBOARD;
        } else {
            console.log('Standard user. Redirecting to home.');
            window.location.href = USER_HOME;
        }
        
    } catch (error) {
        // 5. Handle Errors
        let errorMessage = "An unexpected error occurred. Please try again.";
        
        // Handle the specific one-time setup message
        if (error.code === 'admin-setup') {
            errorMessage = error.message;
        }
        else if (error.code === 'user-not-found' || error.code === 'wrong-password') {
            errorMessage = "Invalid phone number or password. Please check your credentials.";
        } else {
            console.error("RTDB Login Error:", error.message);
        }

        errorEl.textContent = errorMessage;
        errorEl.classList.remove('hidden');

        loginBtn.disabled = false;
        loginBtn.textContent = 'Sign In';
    }
}
