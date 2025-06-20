// ✅ CONFIGURACIÓN E IMPORTACIONES
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion, collection, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getDatabase,
  ref as dbRef,
  push as dbPush,
  onChildChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA1qb1Aw2I4U-3nn3Iazrsw_RxoE2ZxvUE",
  authDomain: "ia-alfa.firebaseapp.com",
  databaseURL: "https://ia-alfa-default-rtdb.firebaseio.com/",
  projectId: "ia-alfa",
  storageBucket: "ia-alfa.appspot.com",
  messagingSenderId: "30859561655",
  appId: "1:30859561655:web:714ab0eb70fd22d9f85b32",
  measurementId: "G-5TG3F54YD7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const auth = getAuth(app);

const chat = document.getElementById('chat');
const input = document.getElementById('inputMensaje');
const goToBottomBtn = document.getElementById('goToBottomBtn');
const listaChats = document.getElementById('lista-chats');

let currentUser = null;
let giroUsuario = null;
let currentChat = [];
let historialChats = [];

// Animación inicial del avatar principal
lottie.loadAnimation({
  container: document.getElementById('avatarAlfa'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: "avatar.json"
});

// Autenticación del usuario y recuperación de datos

function limpiarYFiltrarChats(chats) {
  const titulosUnicos = new Set();
  return chats.filter(chat => {
    const titulo = (chat.titulo || '').trim();
    const esValido = titulo.length > 10 && !titulo.match(/^(hola|si|ok|gracias|ya|hazme|puedes)/i);
    if (esValido && !titulosUnicos.has(titulo)) {
      titulosUnicos.add(titulo);
      return true;
    }
    return false;
  });
}

function agregarMensaje(texto, tipo) {
  const div = document.createElement('div');
  div.classList.add('message', tipo);
  if (tipo === 'alfa') {
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'avatar-lottie';
    div.appendChild(avatarDiv);
    const textoDiv = document.createElement('div');
    textoDiv.innerHTML = texto.replace(/\n/g, '<br>');
    div.appendChild(textoDiv);
    lottie.loadAnimation({
      container: avatarDiv,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: "avatar.json"
    });
  } else {
    div.textContent = texto;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  currentChat.push({ tipo, texto });
}

function hablar(texto) {
  const voz = new SpeechSynthesisUtterance();
  voz.text = texto;
  voz.lang = "es-MX";
  voz.pitch = 1;
  voz.rate = 1;
  speechSynthesis.speak(voz);
}

async function enviarMensaje() {
  const texto = input.value.trim();
  if (!texto || !currentUser) return;

  // Mostrar mensaje del usuario en pantalla
  agregarMensaje(texto, 'user');
  input.value = '';

  // Enviar mensaje a la RTDB en el nodo /comandos
  const comandosRef = dbRef(rtdb, "comandos");
  await dbPush(comandosRef, {
    uid: currentUser.uid,
    mensaje: texto,
    estado: "pendiente",
    respuesta: null,
    timestamp: Date.now()
  });

  // 🧠 Guardar automáticamente el texto del usuario en la colmena
  guardarAprendizajeEnColmena("Alfa_Empresarial", "entrada_usuario", texto);

  // Si el usuario dice una frase tipo "aprendiste que", la tratamos como aprendizaje manual
  if (texto.toLowerCase().includes("aprendiste que")) {
    const tema = "aprendizaje espontáneo";
    const contenido = texto;
    guardarAprendizajeEnColmena("Alfa_Empresarial", tema, contenido);
  }

  // Mostrar animación de "escribiendo"
  const typing = document.createElement('div');
  typing.classList.add('typing');
  const anim = document.createElement('div');
  anim.className = 'animation';
  typing.appendChild(anim);
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;

  lottie.loadAnimation({
    container: anim,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: 'Animation - 1746755395319.json'
  });
}

// ✅ Sincronizar aprendizajes desde la colmena
async function sincronizarDesdeColmena() {
  const url = `https://ia-alfa-default-rtdb.firebaseio.com/colmena.json`;

  // Lista de temas prohibidos
  const temasProhibidos = [
    "violencia", "odio", "engaño", "armas", "manipulación", "daño", "delito",
    "hackeo", "desinformación", "narcotráfico", "suicidio", "acoso", "autodestrucción",
    "contaminación", "invasión de privacidad", "contenido tóxico", "ataque a personas",
    "destrucción", "racismo", "machismo", "explotación", "estafa"
  ];

  try {
    const respuesta = await fetch(url);
    const datos = await respuesta.json();

    if (datos) {
      const aprendizajes = [];

      for (const extension in datos) {
        const entradas = datos[extension].aprendizajes || {};

        for (const fecha in entradas) {
          const entrada = entradas[fecha];
          const contenido = `${entrada.tema} ${entrada.contenido}`.toLowerCase();

          // Verificar que el contenido NO contenga temas prohibidos
          const esValido = !temasProhibidos.some(palabra => contenido.includes(palabra));

          if (
            esValido &&
            !aprendizajes.some(a => a.contenido === entrada.contenido)
          ) {
            aprendizajes.push(entrada);
          }
        }
      }

      localStorage.setItem("aprendizajes_colmena", JSON.stringify(aprendizajes));
      console.log("🧠 Aprendizajes sincronizados desde la colmena:", aprendizajes);
    }
  } catch (err) {
    console.error("🚨 Error al sincronizar aprendizajes:", err);
  }
}

// ✅ Al iniciar sesión
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const uid = user.uid;

    const docRef = doc(db, "usuarios", uid);
    const snap = await getDoc(docRef);

    const empresaRef = doc(db, "empresas", uid);
    const empresaSnap = await getDoc(empresaRef);
    window.datosEmpresa = empresaSnap.exists() ? empresaSnap.data() : null;

    if (snap.exists()) {
      const userData = snap.data();
      giroUsuario = userData.giro || null;
      historialChats = limpiarYFiltrarChats(userData.chats || []);
      mostrarHistorialChats();
      escucharRespuestas(uid);
    }

    // 🧠 Al iniciar sesión, sincronizar con la colmena
    sincronizarDesdeColmena();
  }
});

// ✅ Sincronización automática cada 10 minutos
setInterval(sincronizarDesdeColmena, 10 * 60 * 1000);

// Ejemplo: sugerencias basadas en aprendizajes sincronizados
function sugerirDesdeAprendizaje() {
  const aprendizajes = JSON.parse(localStorage.getItem("aprendizajes_colmena") || "[]");

  if (aprendizajes.length > 0) {
    const sugerencias = aprendizajes
      .filter(a => a.tema !== "entrada_usuario")
      .slice(-3) // las 3 más recientes
      .map(a => `¿Quieres saber más sobre: <strong>${a.tema}</strong>?`);

    if (sugerencias.length) {
      sugerencias.forEach(s => agregarMensaje(s, "alfa"));
    }
  }
}

function escucharRespuestas(uid) {
  const comandosRef = dbRef(rtdb, "comandos");

  onChildChanged(comandosRef, (snapshot) => {
    const data = snapshot.val();
    const key = snapshot.key;

    if (data.uid === uid && data.estado === "respondido" && data.respuesta) {
      // Eliminar animación de carga
      const typingDiv = document.querySelector(".typing");
      if (typingDiv) typingDiv.remove();

      agregarMensaje(data.respuesta, "alfa");
      hablar(data.respuesta);
    }
  });
}

input.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    enviarMensaje();
  }
});

document.getElementById("goToBottomBtn").addEventListener("click", () => {
  chat.scrollTop = chat.scrollHeight;
});

chat.addEventListener("scroll", () => {
  const nearBottom = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 200;
  goToBottomBtn.style.display = nearBottom ? "none" : "block";
});


// ✅ Esta función va FUERA de enviarMensaje()
async function guardarAprendizajeEnColmena(extension, tema, contenido) {
  const fecha = new Date().toISOString().replace(/[:.]/g, "-");

  const aprendizaje = {
    extension: extension,
    tema: tema,
    contenido: contenido,
    fecha: fecha
  };

  const url = `https://ia-alfa-default-rtdb.firebaseio.com/colmena/${extension}/aprendizajes/${fecha}.json`;

  try {
    const respuesta = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(aprendizaje)
    });

    if (respuesta.ok) {
      console.log("✅ Aprendizaje enviado a la colmena.");
      agregarMensaje(`Listo, ya he guardado este aprendizaje bajo el tema <strong>${tema}</strong>. Gracias por compartirlo 🧠.`, "alfa");
      hablar(`Listo, ya he guardado este aprendizaje bajo el tema ${tema}. Gracias por compartirlo.`);
    } else {
      console.error("❌ Error al guardar en la colmena:", await respuesta.text());
    }
  } catch (err) {
    console.error("🚨 Error al conectar con Firebase:", err);
  }
}


function crearNuevoChat() {
  currentChat = [];
  chat.innerHTML = '';
  agregarMensaje("Hola, soy Alfa 🤖. ¿Qué giro tiene tu negocio o idea?", 'alfa');
}

function mostrarHistorialChats() {
  listaChats.innerHTML = '';
  historialChats.forEach((chatData, index) => {
    const titulo = chatData.titulo || `Chat ${index + 1}`;
    const contenedor = document.createElement('div');
    contenedor.className = 'chat-item';

    const btn = document.createElement('button');
    btn.textContent = titulo;
    btn.onclick = () => cargarChatAnterior(chatData);

    const eliminarBtn = document.createElement('span');
    eliminarBtn.textContent = '🗑️';
    eliminarBtn.style.marginLeft = '10px';
    eliminarBtn.style.cursor = 'pointer';
    eliminarBtn.onclick = () => eliminarChat(index);

    contenedor.appendChild(btn);
    contenedor.appendChild(eliminarBtn);
    listaChats.appendChild(contenedor);
  });
}

function cargarChatAnterior(chatData) {
  currentChat = chatData.mensajes || [];
  chat.innerHTML = '';
  currentChat.forEach(msg => agregarMensaje(msg.texto, msg.tipo));
}

async function eliminarChat(index) {
  if (!currentUser) return;
  historialChats.splice(index, 1);
  await updateDoc(doc(db, "usuarios", currentUser.uid), {
    chats: historialChats
  });
  mostrarHistorialChats();
}


