import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import lottie from "https://cdn.skypack.dev/lottie-web";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA1qb1Aw2I4U-3nn3Iazrsw_RxoE2ZxvUE",
  authDomain: "ia-alfa.firebaseapp.com",
  projectId: "ia-alfa",
  storageBucket: "ia-alfa.appspot.com",
  messagingSenderId: "30859561655",
  appId: "1:30859561655:web:714ab0eb70fd22d9f85b32",
  measurementId: "G-5TG3F54YD7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Animación Alfa
lottie.loadAnimation({
  container: document.getElementById("avatarAnimacion"),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: "Animation - 1746668881094 (1).json"
});

// Voz
function hablar(texto) {
  const voz = new SpeechSynthesisUtterance();
  voz.text = texto;
  voz.lang = "es-MX";
  voz.pitch = 1;
  voz.rate = 1;
  speechSynthesis.speak(voz);
}

// Mapa de giros compatibles
const girosCompatibles = {
  "aceites": ["envases", "etiquetado", "distribución", "logística"],
  "envases": ["aceites", "cosméticos", "productos alimenticios"],
  "comida": ["ingredientes", "envases", "empaque", "logística"],
  "ropa": ["textiles", "moda", "tiendas"],
  "tecnología": ["software", "hardware", "soporte"],
  "software": ["tecnología", "marketing digital", "desarrollo web"],
  "cosméticos": ["envases", "distribución", "belleza"]
};

// Validar compatibilidad
function esCompatible(baseGiro, otroGiro) {
  const base = baseGiro.toLowerCase();
  const otro = otroGiro.toLowerCase();
  if (base === otro) return true;
  const relacionados = girosCompatibles[base] || [];
  return relacionados.includes(otro);
}

// Funcíon principal
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  const uid = user.uid;
  const empresaRef = doc(db, "empresas", uid);
  const empresaSnap = await getDoc(empresaRef);
  const contenedor = document.getElementById("listaConexiones");

  if (!empresaSnap.exists()) {
    contenedor.innerHTML = "<p>❌ No se encontró información de tu empresa. Llena tu perfil empresarial primero.</p>";
    hablar("No encontré información de tu empresa. Por favor, completa tus datos empresariales.");
    return;
  }

  const empresa = empresaSnap.data();
  const giroEmpresa = empresa.giro?.toLowerCase() || null;
  const nombreEmpresa = empresa.nombreEmpresa || "Tu empresa";

  if (!giroEmpresa) {
    contenedor.innerHTML = "<p>🚫 No has especificado el giro de tu empresa.</p>";
    return;
  }

  const empresasSnap = await getDocs(collection(db, "empresas"));
  const conexiones = [];

  empresasSnap.forEach(docSnap => {
    const data = docSnap.data();
    const giroOtro = data.giro?.toLowerCase();
    if (
      docSnap.id !== uid &&
      giroOtro &&
      esCompatible(giroEmpresa, giroOtro)
    ) {
      conexiones.push({
        nombre: data.nombreEmpresa || "Empresa sin nombre",
        tipo: data.tipo || "No especificado",
        email: data.email || "Sin email",
        enlace: data.enlace || null
      });
    }
  });

  if (conexiones.length === 0) {
    contenedor.innerHTML = "<p>😕 No hay conexiones aún con un giro compatible. Invita a más personas para hacer crecer tu red.</p>";
    hablar("No encontré conexiones con giros compatibles, pero puedes invitar a más usuarios para fortalecer tu red.");
  } else {
    conexiones.forEach((con) => {
      const div = document.createElement("div");
      div.className = "conexion";
      div.innerHTML = `
        <strong>🏢 Empresa:</strong> ${con.nombre}<br>
        <strong>🔖 Tipo:</strong> ${con.tipo.charAt(0).toUpperCase() + con.tipo.slice(1)}<br>
        <strong>📧 Correo:</strong> ${con.email}<br>
        ${con.enlace ? `<strong>🔗 Enlace:</strong> <a href="${con.enlace}" target="_blank">Ver perfil</a><br>` : ""}
      `;
      contenedor.appendChild(div);
    });

    document.getElementById("mensajeAlfa").textContent = `🔗 Encontré ${conexiones.length} conexión(es) con giros complementarios.`;
    hablar(`Encontré ${conexiones.length} conexión${conexiones.length === 1 ? '' : 'es'} con giros compatibles con el tuyo.`);
  }

  // Botón de WhatsApp
  const btnInvitar = document.createElement("button");
  btnInvitar.textContent = "📲 Invitar por WhatsApp";
  btnInvitar.style = `
    background: #25D366;
    color: white;
    padding: 10px 20px;
    margin-top: 20px;
    border: none;
    border-radius: 20px;
    cursor: pointer;
    font-size: 16px;
  `;
  btnInvitar.onclick = () => {
    const mensaje = encodeURIComponent(
      `Hola 👋 soy ${nombreEmpresa}. Estoy usando IA Alfa, una plataforma para emprendedores que te ayuda a conectar con clientes, proveedores e inversionistas. ¡Regístrate gratis en https://ctalexander.github.io/ALFA-4-Innovaci-n-/ y forma parte de nuestra red! 🚀`
    );
    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
  };

  contenedor.appendChild(btnInvitar);
});