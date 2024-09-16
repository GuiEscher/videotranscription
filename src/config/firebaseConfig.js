// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserSessionPersistence } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAoBtfdXb_o0OsogfZqS3q5gin__-jooPo",
  authDomain: "videotranscription-e2f65.firebaseapp.com",
  projectId: "videotranscription-e2f65",
  storageBucket: "videotranscription-e2f65.appspot.com",
  messagingSenderId: "364100836668",
  appId: "1:364100836668:web:6bfce56b97a4885f3fd239",
  measurementId: "G-DRWT90LETD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configurar persistência para a sessão atual
setPersistence(auth, browserSessionPersistence)
  .then(() => {
    // O Firebase agora manterá a sessão de autenticação durante a sessão do navegador
  })
  .catch((error) => {
    // Tratar erros de configuração de persistência
    console.error(error);
  });

export { auth };
