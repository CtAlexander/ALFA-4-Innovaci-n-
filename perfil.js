import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import { getAuth, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyA1qb1Aw2I4U-3nn3Iazrsw_RxoE2ZxvUE",
  authDomain: "ia-alfa.firebaseapp.com",
  projectId: "ia-alfa",
  storageBucket: "ia-alfa.appspot.com",
  messagingSenderId: "30859561655",
  appId: "1:30859561655:web:714ab0eb70fd22d9f85b32"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let currentUser;

onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const uid = user.uid;
    const userRef = doc(db, "usuarios", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      document.getElementById("nombreUsuario").value = data.nombre || "Usuario";
      document.getElementById("descripcionUsuario").value = data.descripcion || "";
      if (data.fotoPerfil) document.getElementById("fotoPerfil").src = data.fotoPerfil;

      const mensaje = `Hola ${data.nombre}, veo que eres un ${data.tipo}, ¿qué te gustaría compartir hoy?`;
      document.getElementById("mensajeAlfa").textContent = "✨ " + mensaje;
      const voz = new SpeechSynthesisUtterance(mensaje);
      voz.lang = "es-MX";
      speechSynthesis.speak(voz);
    }

    cargarPublicaciones(uid);
  } else {
    window.location.href = "index.html";
  }
});

document.getElementById("inputFoto").addEventListener("change", async (e) => {
  const archivo = e.target.files[0];
  if (!archivo || !currentUser) return;
  const storageRef = ref(storage, `gs://ia-alfa.firebasestorage.app/perfiles/${currentUser.uid}`);
  await uploadBytes(storageRef, archivo);
  const url = await getDownloadURL(storageRef);
  await updateDoc(doc(db, "usuarios", currentUser.uid), { fotoPerfil: url });
  document.getElementById("fotoPerfil").src = url;
});

document.getElementById("formPublicacion").addEventListener("submit", async (e) => {
  e.preventDefault();
  const texto = document.getElementById("contenidoPublicacion").value;
  const imagen = document.getElementById("imagenPublicacion").files[0];
  let imagenURL = "";
  if (imagen) {
    const storageRef = ref(storage, `gs://ia-alfa.firebasestorage.app/publicaciones/${currentUser.uid}-${Date.now()}`);
    await uploadBytes(storageRef, imagen);
    imagenURL = await getDownloadURL(storageRef);
  }
  await addDoc(collection(db, "publicaciones"), {
    uid: currentUser.uid,
    contenido: texto,
    imagen: imagenURL,
    fecha: serverTimestamp()
  });
  document.getElementById("contenidoPublicacion").value = "";
  document.getElementById("imagenPublicacion").value = "";
  cargarPublicaciones(currentUser.uid);
});

async function cargarPublicaciones(uid) {
  const publicacionesRef = collection(db, "publicaciones");
  const publicacionesUsuario = query(publicacionesRef, where("uid", "==", uid));
  const snapshot = await getDocs(publicacionesUsuario);
  const contenedor = document.getElementById("perfilPublicaciones");
  contenedor.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const post = document.createElement("div");
    post.className = "post-item";
    if (data.imagen) {
      const img = document.createElement("img");
      img.src = data.imagen;
      post.appendChild(img);
    }
    const texto = document.createElement("div");
    texto.textContent = data.contenido;
    post.appendChild(texto);

    const reaccion = document.createElement("div");
    reaccion.className = "reaction";
    post.appendChild(reaccion);

    post.ondblclick = () => {
      reaccion.textContent = "$";
    };

    const menu = document.createElement("div");
    menu.className = "menu";

    const editar = document.createElement("button");
    editar.textContent = "Editar";
    editar.onclick = async () => {
      const nuevoTexto = prompt("Editar publicación:", data.contenido);
      if (nuevoTexto) {
        await updateDoc(doc(db, "publicaciones", docSnap.id), { contenido: nuevoTexto });
        cargarPublicaciones(uid);
      }
    };

    const eliminar = document.createElement("button");
    eliminar.textContent = "Eliminar";
    eliminar.onclick = async () => {
      await deleteDoc(doc(db, "publicaciones", docSnap.id));
      cargarPublicaciones(uid);
    };

    menu.appendChild(editar);
    menu.appendChild(eliminar);
    post.appendChild(menu);
    contenedor.appendChild(post);
  });
}

lottie.loadAnimation({
  container: document.getElementById("avatarAnimacion"),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: "Animation - 1746668881094 (1).json"
});
