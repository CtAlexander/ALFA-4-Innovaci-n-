// js/pantalla-principal.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, getDocs, orderBy, updateDoc, increment } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import lottie from "https://cdn.skypack.dev/lottie-web";

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
const auth = getAuth(app);
const db = getFirestore(app);

lottie.loadAnimation({
    container: document.getElementById("avatarAnimacion"),
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: "Animation - 1746668881094 (1).json"
  });
  
  function hablar(texto) {
    const voz = new SpeechSynthesisUtterance();
    voz.text = texto;
    voz.lang = "es-MX";
    voz.pitch = 1;
    voz.rate = 1;
    speechSynthesis.speak(voz);
  }
  
async function cargarNoticias(uid) {
  const res = await fetch("https://newsapi.org/v2/everything?q=negocios+OR+criptomonedas+OR+bolsa+OR+startup&language=es&sortBy=publishedAt&apiKey=17e02f82fff34a769e2a8f6740c9327c");
  const data = await res.json();
  const noticias = data.articles.slice(0, 5);
  const feed = document.getElementById("feedPublicaciones");

  noticias.forEach((noticia, index) => {
    const div = document.createElement("div");
    div.className = "post";
    div.innerHTML = `
      <h4><img src="https://cdn-icons-png.flaticon.com/512/149/149071.png" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:8px;"> Noticia IA Alfa</h4>
      <h5>${noticia.title}</h5>
      <p>${noticia.description || "Sin descripción"}</p>
      ${noticia.urlToImage ? `<div class="reaction-anim"><img src="${noticia.urlToImage}" alt="Imagen noticia"></div>` : ""}
      <p><a href="${noticia.url}" target="_blank" style="color: #81d4fa;">Leer más</a></p>
      <div class="reaction-symbol" ondblclick="this.classList.add('animate-dollar'); setTimeout(() => this.classList.remove('animate-dollar'), 800); const count = document.getElementById('noticia-reacciones-${index}'); let num = parseInt(count.textContent) || 0; count.textContent = (num + 1) + ' personas reaccionaron';">💲</div>
      <div class="reaction-count" id="noticia-reacciones-${index}">0 personas reaccionaron</div>
    `;
    feed.appendChild(div);
  });
}

window.addEventListener("DOMContentLoaded", () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const uid = user.uid;
      const userRef = doc(db, "usuarios", uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        const nombre = data.nombre || "emprendedor";
        const tipo = data.tipo || "emprendedor";
        const saludo = tipo.toLowerCase() === "empresario" ? "empresario" : "emprendedor";
        const mensaje = `Bienvenido ${saludo} ${nombre}.`;
        document.getElementById("mensajeAlfa").textContent = `✨ ${mensaje}`;
        document.getElementById("mensajeBienvenida").textContent = mensaje;
        hablar(mensaje);
      }

      const publicacionesRef = collection(db, "publicaciones");
      const publicacionesSnap = await getDocs(query(publicacionesRef, orderBy("fecha", "desc")));
      const feed = document.getElementById("feedPublicaciones");

      publicacionesSnap.forEach((docSnap) => {
        const data = docSnap.data();
        const div = document.createElement("div");
        div.className = "post";
        const reacciones = data.reacciones || 0;

        div.innerHTML = `
          <h4><img src="${data.fotoPerfil || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'}" style="width:30px;height:30px;border-radius:50%;vertical-align:middle;margin-right:8px;"> ${data.uid === uid ? 'Tu publicación' : data.autor || 'Usuario desconocido'}</h4>
          ${data.imagen ? `<div class="reaction-anim"><img src="${data.imagen}" alt="Imagen"></div>` : ""}
          <p>${data.contenido || ""}</p>
          <div class="reaction-symbol">💲</div>
          <div class="reaction-count">${reacciones} personas reaccionaron</div>
        `;

        const imgContenedor = div.querySelector(".reaction-anim");
        if (imgContenedor) {
          imgContenedor.addEventListener("dblclick", async () => {
            imgContenedor.classList.remove("reaction-anim");
            void imgContenedor.offsetWidth;
            imgContenedor.classList.add("reaction-anim");

            await updateDoc(doc(db, "publicaciones", docSnap.id), {
              reacciones: increment(1)
            });

            const countEl = div.querySelector(".reaction-count");
            const actual = parseInt(countEl.textContent) || 0;
            countEl.textContent = `${actual + 1} personas reaccionaron`;
          });
        }

        feed.appendChild(div);
      });

      await cargarNoticias(uid);
    } else {
      window.location.href = "index.html";
    }
  });
});

window.irAPerfil = () => window.location.href = "perfil.html";
window.irAAvance = () => window.location.href = "avance.html";
window.irAAlfa = () => window.location.href = "chat-con-alfa.html";
window.irAPanelGeneral = () => window.location.href = "panel-general.html";
window.irAMiEmpresa = () => window.location.href = "mi-empresa.html";
window.irAConexiones = () => window.location.href = "conexiones.html";
window.irAConfiguracion = () => window.location.href = "configuracion.html";
window.irAChatUsuarios = () => window.location.href = "chat-usuarios.html";
window.irABuscarNegocios = () => window.location.href = "buscar-negocios.html";
window.irAMisMovimientos = () => window.location.href = "mis-movimientos.html";
