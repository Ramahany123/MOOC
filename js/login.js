import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

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

const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  const email = `${phone.replace(/\D/g, '')}@fakeuser.com`;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Login successful!");
    window.location.href = "./home.html"; 
  } catch (error) {
    alert(error.message);
  }
});
