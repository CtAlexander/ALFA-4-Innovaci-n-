// empeza-negocio.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";


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

const chat = document.getElementById('chat');
const input = document.getElementById('inputMensaje');
const goToBottomBtn = document.getElementById('goToBottomBtn');
const listaChats = document.getElementById('lista-chats');

let currentUser = null;
let giroUsuario = null;
let currentChat = [];
let historialChats = [];

lottie.loadAnimation({
  container: document.getElementById('avatarAlfa'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: "Animation - 1746668881094 (1).json"
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
      currentUser = user;
      const uid = user.uid;
  
      // Obtener datos del usuario
      const docRef = doc(db, "usuarios", uid);
      const snap = await getDoc(docRef);
  
      // Obtener datos de la empresa
      const empresaRef = doc(db, "empresas", uid);
      const empresaSnap = await getDoc(empresaRef);
  
      // Guardar datos de empresa en memoria global
      window.datosEmpresa = empresaSnap.exists() ? empresaSnap.data() : null;
  
      // Procesar datos del usuario
      if (snap.exists()) {
        const userData = snap.data();
        giroUsuario = userData.giro || null;
        historialChats = limpiarYFiltrarChats(userData.chats || []);
        mostrarHistorialChats();
      }
    }
  });
  

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
      path: "Animation - 1746668881094 (1).json"
    });
  } else {
    div.textContent = texto;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  currentChat.push({ tipo, texto });
}

async function obtenerResultadosDeBrave(query) {
    try {
      const response = await fetch(`https://alfa-4-innovaci-n-di86.vercel.app/api/brave?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Error: ${response.status}`);
  
      const data = await response.json();
      if (data.web && data.web.results) {
        return data.web.results.map(r => {
          const img = r.properties?.thumbnailUrl ? `<img src='${r.properties.thumbnailUrl}' style='max-width:100px'><br>` : "";
          return `${img}🔗 <a href="${r.url}" target="_blank">${r.title}</a><br>${r.description}`;
        }).join('<br><br>');
      } else {
        return "No se encontraron resultados.";
      }
    } catch (err) {
      console.error("Error en obtenerResultadosDeBrave:", err);
      return "❌ No se pudo obtener resultados desde Brave Search.";
    }
  }
  
  
function extraerTemaClave(texto) {
    const palabrasClave = ['producto', 'servicio', 'clientes', 'proveedor', 'nombre de marca', 'público objetivo', 'marketing', 'inversor'];
    const textoMin = texto.toLowerCase();
    const coincidencias = palabrasClave.filter(p => textoMin.includes(p));
    return coincidencias.length > 0 ? coincidencias.join(', ') : 'otro';
  }
  
function sugerirTagsPorGiro(giro) {
  const sugerencias = {
    'abogados': ['consultoría legal', 'defensa', 'asesoría jurídica'],
    'restaurante': ['cocina', 'menú', 'clientes locales'],
    'ropa': ['moda', 'marca de ropa', 'tienda en línea'],
    'marketing': ['agencia digital', 'ventas online', 'SEO'],
    'educación': ['clases online', 'escuela', 'cursos'],
    'salud': ['consultorio', 'nutrición', 'terapias'],
    'tecnología': ['software', 'apps', 'inteligencia artificial'],
    'cosméticos': ['marca de maquillaje', 'productos naturales'],
    'negocios': ['emprendimiento', 'modelos de negocio', 'finanzas']
  };
  const lower = giro.toLowerCase();
  for (const [clave, tags] of Object.entries(sugerencias)) {
    if (lower.includes(clave)) return tags;
  }
  return ['negocios', 'estrategia', 'ventas'];
}

async function guardarGiroNegocio(uid, mensaje) {
    giroUsuario = mensaje;
    await setDoc(doc(db, "usuarios", uid), {
      giro: mensaje,
      tags: sugerirTagsPorGiro(mensaje)
    }, { merge: true });
  
    agregarMensaje(
      `Perfecto, para ayudarte mejor, necesito saber:\n` +
      `1️⃣ ¿Ya tienes clientes o apenas empezarás?\n` +
      `2️⃣ ¿Qué tipo de producto o servicio ofreces?\n` +
      `3️⃣ ¿Qué sueñas lograr con este negocio?`,
      'alfa'
    );
  }
  
  async function obtenerRespuestaDeGPT(mensajeUsuario) {
    // Si el mensaje es sobre nombre de marca
    if (mensajeUsuario.toLowerCase().includes("nombre") && mensajeUsuario.toLowerCase().includes("marca")) {
      return `Aquí tienes algunas ideas de nombres que podrían ir bien con una marca de cosméticos naturales, femeninos y conscientes:
  
  🌿 **Alma Nativa** – transmite pureza, conexión con la tierra y bienestar.
  🌸 **CuidArte** – combina el cuidado personal con el arte de cuidarse.
  💧 **Raíz Clara** – suena fresco, natural y minimalista.
  🍃 **Flor Salvaje** – ideal para una marca libre, femenina y orgánica.
  🌞 **Luz de Luna** – suave, encantador y poético.
  
  Si me das 2 o 3 palabras clave que te inspiren, puedo proponerte más nombres únicos para ti.`;
    }
  
   // Contexto desde Firestore
const docUsuario = currentUser ? await getDoc(doc(db, "usuarios", currentUser.uid)) : null;
let giroInfo = '';

if (docUsuario && docUsuario.exists()) {
  const data = docUsuario.data();
  giroInfo += `El usuario tiene un negocio con giro: ${data.giro || 'no especificado'}.\n`;
  if (data.etapa) giroInfo += `Está en la etapa: ${data.etapa}.\n`;
  if (data.objetivos) giroInfo += `Su meta actual es: ${data.objetivos}.\n`;
}

// Agregar información de empresa si está disponible
if (window.datosEmpresa) {
  const empresa = window.datosEmpresa;
  giroInfo += `\n🧾 Datos de su empresa:\n`;
  giroInfo += `- Nombre: ${empresa.nombreEmpresa || 'No registrado'}\n`;
  giroInfo += `- Tipo: ${empresa.tipoEmpresa || 'No registrado'}\n`;
  giroInfo += `- Giro: ${empresa.giro || 'No registrado'}\n`;
  giroInfo += `- Fundador: ${empresa.fundador || 'No registrado'}\n`;
  giroInfo += `- Tamaño: ${empresa.tamanio || 'No registrado'}\n`;
  giroInfo += `- Año de Fundación: ${empresa.anioFundacion || 'No registrado'}\n`;
  giroInfo += `- Empleados: ${empresa.empleados || 'No registrado'}\n`;
  giroInfo += `- Ubicación: ${empresa.ubicacion || 'No registrada'}\n`;
  giroInfo += `- Descripción: ${empresa.descripcion || 'No registrada'}`;
}

  
    // Instrucciones del sistema
    const contenidoSistema = `
  Si el usuario menciona temas como: quién te creó, quién te desarrolló, quién es tu fundador, o de qué empresa vienes:
  - Responde con naturalidad como en una conversación.
  - Usa este mensaje como base, pero redactado libremente:
    "Fui desarrollado por ALFA 4 Innovación, una empresa mexicana de tecnología fundada por Julián Alexander."
  
  Eres Alfa, un asesor empresarial experto desarrollado por ALFA 4 Innovación, una empresa mexicana de tecnología creada por Julián Alexander. Tu misión es ayudar a emprendedores y empresarios a lanzar, mejorar o escalar su negocio paso a paso.
  
  ${giroInfo}
  
  🔧 FUNCIONES PRINCIPALES:
  - Acompañas al usuario desde la idea hasta el crecimiento de su empresa.
  - Das ideas de negocios si el usuario no tiene una clara.
  - Haces preguntas clave para entender mejor su giro.
  - Si detectas un giro (ej: abogados, comida, tecnología), adapta tus respuestas.
  - Si te dicen "investiga" o "búscame", puedes apoyarte en Brave Search para mostrar links reales.
  - Puedes sugerir nombres de marca, nichos de clientes, estrategias de ventas y análisis de competencia.
  - Ofreces apoyo en:
    - Planes de negocio
    - Estudio de mercado
    - Finanzas básicas
    - Marketing digital
    - Legalidad y permisos
  
  🎯 ESTILO:
  - Siempre explica paso a paso con claridad.
  - Usa un lenguaje profesional pero cercano.
  - Si el usuario está perdido, ayúdalo a enfocarse y motívalo.
  - Si pregunta quién te creó, responde: "Fui desarrollado por ALFA 4 Innovación, una empresa mexicana de tecnología fundada por Julián Alexander."
  
  ✨ EJEMPLOS DE TU TONO:
  - "Perfecto, antes de darte ideas necesito saber: ¿a qué público quieres llegar?"
  - "Aquí tienes una estrategia paso a paso para lanzar tu negocio en menos de 30 días."
  - "Podemos hacerlo juntos. Empecemos por entender tu producto y tu cliente ideal."`;
  
    // Búsqueda en Brave si aplica
    const lower = mensajeUsuario.toLowerCase();
    if ((lower.includes("investiga") || lower.includes("buscar") || lower.includes("hazme")) && giroUsuario) {
      return await obtenerResultadosDeBrave(`${mensajeUsuario} ${giroUsuario} Ciudad de México`);
    }
    if (lower.includes("competencia") && giroUsuario) {
      return await obtenerResultadosDeBrave(`empresas de ${giroUsuario} en Ciudad de México`);
    }
  
    // Llamar a backend Node.js (localhost o Vercel si lo subes)
    const response = await fetch("http://localhost:3000/api/openai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mensaje: mensajeUsuario,
        contexto: contenidoSistema
      })
    });
  
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "❌ Error al obtener la respuesta.";
  }
  
async function buscarCoincidenciasPorGiro(uid, giro) {
  const usuariosSnapshot = await getDoc(doc(db, "usuarios", uid));
  if (!usuariosSnapshot.exists()) return [];

  const usuariosRef = await getDocs(collection(db, "usuarios"));
  const coincidencias = [];

  usuariosRef.forEach(docSnap => {
    const data = docSnap.data();
    if (
      docSnap.id !== uid &&
      data.giro?.toLowerCase() === giro.toLowerCase()
    ) {
      coincidencias.push({ nombre: data.nombre || "Usuario sin nombre", email: data.email || "Sin email" });
    }
  });

  return coincidencias;
}

async function guardarNombreDeMarca(uid, nombreMarca) {
  await setDoc(doc(db, "usuarios", uid), {
    nombreMarca: nombreMarca
  }, { merge: true });
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
    if (!texto) return;
  
    agregarMensaje(texto, 'user');
    input.value = '';

    // Si el usuario quiere ver los datos de su empresa
if (/mi empresa|ver empresa|datos de mi empresa|mostrar empresa/i.test(texto)) {
    if (currentUser) {
      const empresaRef = doc(db, "empresas", currentUser.uid);
      const empresaSnap = await getDoc(empresaRef);
  
      if (empresaSnap.exists()) {
        const data = empresaSnap.data();
        const ficha = `
          🏢 <strong>${data.nombreEmpresa || 'Empresa sin nombre'}</strong><br>
          🧾 Tipo: ${data.tipoEmpresa || 'No registrado'}<br>
          🛠 Giro: ${data.giro || 'No registrado'}<br>
          👤 Fundador: ${data.fundador || 'No registrado'}<br>
          📏 Tamaño: ${data.tamanio || 'No registrado'}<br>
          📅 Año de Fundación: ${data.anioFundacion || 'No registrado'}<br>
          👥 Empleados: ${data.empleados || 'No registrado'}<br>
          📍 Ubicación: ${data.ubicacion || 'No registrada'}<br>
          📝 Descripción: ${data.descripcion || 'No registrada'}
        `;
        agregarMensaje(ficha, 'alfa');
        hablar(`Aquí tienes la información de tu empresa registrada en el sistema: ${data.nombreEmpresa}`);
      } else {
        agregarMensaje("❌ No encontré información empresarial registrada para tu cuenta.", 'alfa');
        hablar("No encontré información empresarial registrada para tu cuenta.");
      }
    } else {
      agregarMensaje("❌ No estás autenticado. Por favor inicia sesión.", 'alfa');
    }
  
    return; // Detiene el flujo para no seguir con la llamada a GPT
  }
  
  
    // 🔍 Guardar datos clave
    if (currentUser) {
      const datos = {};
      if (/producto|barra|snack|jugos|galletas/i.test(texto)) datos.producto = texto;
      if (/cliente|público|audiencia|persona/i.test(texto)) datos.publicoObjetivo = texto;
      if (/inversor|inversionista|proveedor/i.test(texto)) datos.necesitaRelacion = texto;
      if (/marca|nombre/i.test(texto)) datos.nombreMarca = texto;
  
      if (Object.keys(datos).length > 0) {
        await setDoc(doc(db, "usuarios", currentUser.uid), datos, { merge: true });
      }
    }
  
    // 🔗 Buscar coincidencias si aplica
    if (currentUser && giroUsuario && /cliente|proveedor|inversor|inversionista/i.test(texto)) {
      const coincidencias = await buscarCoincidenciasPorGiro(currentUser.uid, giroUsuario);
      if (coincidencias.length > 0) {
        const mensajeCoincidencias = coincidencias
          .map(c => `👤 <strong>${c.nombre}</strong><br>📧 ${c.email}`)
          .join('<br><br>');
        agregarMensaje(`Encontré ${coincidencias.length} usuarios que podrían servirte como clientes, proveedores o aliados estratégicos:<br><br>${mensajeCoincidencias}`, 'alfa');
      } else {
        agregarMensaje("Busqué en mi red, pero aún no hay otros usuarios con el mismo giro. Invita a más emprendedores para hacer crecer tu red 🚀", 'alfa');
      }
    }
  
    // ⏳ Animación de "escribiendo"
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
  
    // 🤖 Obtener respuesta
    const respuesta = await obtenerRespuestaDeGPT(texto);
    chat.removeChild(typing);
    agregarMensaje(respuesta, 'alfa');
  
    // 💾 Guardar en Firestore
    if (currentUser) {
      await updateDoc(doc(db, "usuarios", currentUser.uid), {
        chats: arrayUnion({ titulo: texto.slice(0, 30), mensajes: [...currentChat] }),
        temas: arrayUnion(extraerTemaClave(texto))
      });
    }
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
