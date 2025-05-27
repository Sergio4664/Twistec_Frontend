import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, remove } from "firebase/database";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAmJiDyecVAWWocMg1fEdiODEW4rkd3V4",
  authDomain: "twistec-ef032.firebaseapp.com",
  databaseURL: "https://twistec-ef032-default-rtdb.firebaseio.com",
  projectId: "twistec-ef032",
  storageBucket: "twistec-ef032.appspot.com",
  messagingSenderId: "855346673295",
  appId: "1:855346673295:web:8362e691db063a240122fa"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

interface Twist {
  id: string;
  parentId: string | null;
  content: string;
  timestamp: string;
  author: string;
  children?: Twist[];
}

document.addEventListener("DOMContentLoaded", () => {
  const twistInput = document.getElementById("twistInput") as HTMLTextAreaElement;
  const publishBtn = document.getElementById("publishBtn") as HTMLButtonElement;
  const twistsContainer = document.getElementById("twistsContainer") as HTMLDivElement;
  const toggleBtn = document.getElementById("toggleTema") as HTMLButtonElement;

  // Alternancia de tema claro/oscuro
  toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    toggleBtn.textContent = document.body.classList.contains("dark-mode") ? "☀️" : "🌙";
  });

  // Opcional: forzar reinicio del nombre
  const resetNombre = false;
  if (resetNombre) localStorage.removeItem("usuario");

  let nombreUsuario = localStorage.getItem("usuario") || "";

  const iniciar = (nombre: string) => {
    nombreUsuario = nombre;
    localStorage.setItem("usuario", nombre);
    registrarIngreso(nombreUsuario);

    publishBtn.addEventListener("click", () => {
      const content = twistInput.value.trim();
      if (content !== "") {
        publishTwist(content);
        twistInput.value = "";
      }
    });

    renderTwistsRealtime();
  };

  if (!nombreUsuario) {
    solicitarNombre().then(iniciar);
  } else {
    iniciar(nombreUsuario);
  }

  function solicitarNombre(): Promise<string> {
    return new Promise((resolve) => {
      const modal = document.getElementById("nombreModal") as HTMLDivElement;
      const input = document.getElementById("nombreInput") as HTMLInputElement;
      const btn = document.getElementById("confirmarNombre") as HTMLButtonElement;

      modal.style.display = "flex";

      const confirmar = () => {
        const nombre = input.value.trim();
        if (nombre !== "") {
          modal.style.display = "none";
          resolve(nombre);
        } else {
          input.focus();
        }
      };

      btn.addEventListener("click", confirmar);
      input.addEventListener("keyup", (e) => {
        if (e.key === "Enter") confirmar();
      });
    });
  }

  function registrarIngreso(nombre: string) {
    push(ref(db, "usuarios"), {
      nombre,
      fecha: new Date().toISOString()
    });
  }

  function publishTwist(content: string, parentId: string | null = null) {
    const twistData = {
      parentId,
      content: content.trim(),
      timestamp: new Date().toLocaleString(),
      author: nombreUsuario
    };
    push(ref(db, "twists"), twistData);
  }

  function eliminarTwist(id: string) {
    const twistRef = ref(db, `twists/${id}`);
    remove(twistRef);
  }

  function renderTwistsRealtime() {
    onValue(ref(db, "twists"), (snapshot) => {
      const data = snapshot.val();
      twistsContainer.innerHTML = "";

      if (data) {
        const twistList: Twist[] = Object.entries(data).map(([id, value]: any) => ({ id, ...value }));
        const rootTwists = twistList.filter(t => !t.parentId);
        const tree = buildTwistTree(rootTwists, twistList);
        tree.forEach(t => twistsContainer.appendChild(renderTwistTree(t)));
      }
    });
  }

  function buildTwistTree(roots: Twist[], all: Twist[]): Twist[] {
    return roots.map(root => ({
      ...root,
      children: all.filter(t => t.parentId === root.id).map(child => ({
        ...child,
        children: all.filter(t2 => t2.parentId === child.id)
      }))
    }));
  }

  function renderTwistTree(twist: Twist, profundidad: number = 0): HTMLElement {
    const div = document.createElement("div");
    div.classList.add("twist");
    if (twist.parentId) div.classList.add("threaded");

    const p = document.createElement("p");
    p.innerHTML = `<strong>${twist.author}</strong>: ${twist.content}`;
    div.appendChild(p);

    const fecha = document.createElement("small");
    fecha.textContent = `Publicado: ${twist.timestamp}`;
    fecha.style.display = "block";
    fecha.style.color = "#666";
    fecha.style.marginTop = "4px";
    fecha.style.fontSize = "12px";
    div.appendChild(fecha);

    const acciones = document.createElement("div");
    acciones.className = "acciones-twist";

    if (profundidad < 2) {
      const replyBtn = document.createElement("button");
      replyBtn.textContent = "Responder";
      replyBtn.className = "btn-responder";
      replyBtn.addEventListener("click", () => openReplyInput(div, twist.id));
      acciones.appendChild(replyBtn);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Eliminar";
    deleteBtn.className = "btn-eliminar";
    deleteBtn.addEventListener("click", () => eliminarTwist(twist.id));
    acciones.appendChild(deleteBtn);

    div.appendChild(acciones);

    if (twist.children) {
      twist.children.forEach(child => {
        const childElem = renderTwistTree(child, profundidad + 1);
        div.appendChild(childElem);
      });
    }

    return div;
  }

  function openReplyInput(parentElem: HTMLElement, parentId: string) {
    if (parentElem.querySelector(".reply-input")) return;

    const textarea = document.createElement("textarea");
    textarea.className = "reply-input";
    textarea.placeholder = "Escribe tu respuesta...";

    const sendBtn = document.createElement("button");
    sendBtn.textContent = "Publicar";
    sendBtn.className = "reply-send-btn";
    sendBtn.addEventListener("click", () => {
      if (textarea.value.trim() !== "") {
        publishTwist(textarea.value, parentId);
      }
    });

    parentElem.appendChild(textarea);
    parentElem.appendChild(sendBtn);
  }
});
