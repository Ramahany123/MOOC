
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCnCovkec0YaXmgpcnNLx1qiCpGG7-iipU",
  authDomain: "educational-site-f1fac.firebaseapp.com",
  projectId: "educational-site-f1fac",
  storageBucket: "educational-site-f1fac.firebasestorage.app",
  messagingSenderId: "868437050505",
  appId: "1:868437050505:web:8ca5d61feee67a67647258"
};


const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value;
  const phone = document.getElementById('phone').value;
  const password = document.getElementById('password').value;

  
  const email = `${phone.replace(/\D/g, '')}@fakeuser.com`;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });

    alert('Registration successful!');
    navigation(); 
  } catch (error) {
    alert(error.message);
  }
});


function navigation() {
  window.location.href = "./index.html"; 
}
