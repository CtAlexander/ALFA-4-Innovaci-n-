import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import lottie from "https://cdn.skypack.dev/lottie-web";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA1qb1Aw2I4U-3nn3Iazrsw_RxoE2ZxvUE",
  authDomain: "ia-alfa.firebaseapp.com",
  projectId: "ia-alfa",
  storageBucket: "ia-alfa.appspot.com",
  messagingSenderId: "30859561655",
  appId: "1:30859561655:web:714ab0eb70fd22d9f85b32",
  measurementId: "G-5TG3F54YD7"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Cargar animación del avatar Alfa
lottie.loadAnimation({
  container: document.getElementById("avatarAnimacion"),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: "Animation - 1746668881094 (1).json"
});

// Función para que Alfa hable
function hablar(texto) {
  const voz = new SpeechSynthesisUtterance();
  voz.text = texto;
  voz.lang = "es-MX";
  voz.pitch = 1;
  voz.rate = 1;
  speechSynthesis.speak(voz);
}

// Al cargar la página: verificar si el usuario ya tiene empresa registrada
window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      const empresaRef = doc(db, "empresas", uid);
      const empresaSnap = await getDoc(empresaRef);

      if (empresaSnap.exists()) {
        // Si ya hay datos, redirigir automáticamente al resumen
        window.location.href = "empresa-resumen.html";
        return;
      }

      // Si no tiene empresa registrada
      hablar("Llena la información de tu empresa para que pueda ayudarte mejor.");
    } else {
      window.location.href = "index.html";
    }
  });
});

// Función para guardar la información de empresa en Firestore
window.guardarEmpresa = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;

      // Captura de datos del formulario
      const nombreEmpresa = document.getElementById("nombreEmpresa").value.trim();
      const tipoEmpresa = document.getElementById("tipoEmpresa").value.trim();
      const giro = document.getElementById("giro").value.trim();
      const fundador = document.getElementById("fundador").value.trim();
      const tamanio = document.getElementById("tamanio").value.trim();
      const anio = document.getElementById("anio").value.trim();
      const empleados = document.getElementById("empleados").value.trim();
      const ubicacion = document.getElementById("ubicacion").value.trim();
      const descripcion = document.getElementById("descripcion").value.trim();

      // Validación básica
      if (!nombreEmpresa || !giro || !fundador || !tamanio) {
        alert("⚠️ Completa los campos requeridos.");
        return;
      }

      try {
        // Guardar la información en la colección "empresas"
        await setDoc(doc(db, "empresas", uid), {
          uid,
          nombreEmpresa,
          tipoEmpresa,
          giro,
          fundador,
          tamanio,
          anioFundacion: anio,
          empleados,
          ubicacion,
          descripcion,
          fechaRegistro: new Date()
        });

        hablar("Tu información empresarial ha sido guardada con éxito.");
        window.location.href = "loadingg.html";
      } catch (error) {
        alert("❌ Error al guardar la información: " + error.message);
      }

    } else {
      window.location.href = "index.html";
    }
  });
};
