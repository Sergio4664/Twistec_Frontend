import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

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

// Interfaz Twist
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

  // ⚠️ Cambia esto a true para forzar reinicio
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
    console.log("Nombre no encontrado, mostrando modal...");
    solicitarNombre().then(iniciar);
  } else {
    console.log("Nombre ya guardado:", nombreUsuario);
    iniciar(nombreUsuario);
  }

  function solicitarNombre(): Promise<string> {
    console.log("Ejecutando solicitarNombre()");
    return new Promise((resolve) => {
      const modal = document.getElementById("nombreModal") as HTMLDivElement;
      const input = document.getElementById("nombreInput") as HTMLInputElement;
      const btn = document.getElementById("confirmarNombre") as HTMLButtonElement;

      if (!modal || !input || !btn) {
        console.error("❌ No se encontró uno o más elementos del modal");
        return;
      }

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

  function renderTwistsRealtime() {
    onValue(ref(db, "twists"), (snapshot) => {
      const data = snapshot.val();
      twistsContainer.innerHTML = "";

      if (data) {
        const twistList: Twist[] = Object.entries(data).map(([id, value]: any) => ({ id, ...value }));
        const rootTwists = twistList.filter(t => !t.parentId);
        const tree = buildTwistTree(rootTwists, twistList);
        tree.forEach(t => twistsContainer.appendChild(createTwistElement(t)));
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

  function createTwistElement(twist: Twist): HTMLElement {
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

    const profundidad = calcularProfundidad(twist);
    if (profundidad < 2) {
      const replyBtn = document.createElement("button");
      replyBtn.textContent = "Responder";
      replyBtn.className = "btn-responder";
      replyBtn.addEventListener("click", () => openReplyInput(div, twist.id));
      acciones.appendChild(replyBtn);
    }

    div.appendChild(acciones);

    if (twist.children) {
      twist.children.forEach(child => {
        const childElem = createTwistElement(child);
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

  function calcularProfundidad(twist: Twist): number {
    let profundidad = 0;
    let actual = twist;
    const lookup = new Map<string, Twist>();
    document.querySelectorAll<HTMLElement>(".twist").forEach(el => {
      const id = el.dataset?.id;
      if (id) lookup.set(id, actual);
    });
    while (actual.parentId) {
      const padre = lookup.get(actual.parentId);
      if (!padre) break;
      profundidad++;
      actual = padre;
    }
    return profundidad;
  }
});
