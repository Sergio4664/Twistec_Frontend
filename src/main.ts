interface Twist {
  id: number;
  parentId: number | null;
  content: string;
  timestamp: string;
  children: Twist[];
}

let twists: Twist[] = [];
let twistIdCounter = 1;
const MAX_RESPUESTA_PROFUNDIDAD = 2;

const twistInput = document.getElementById('twistInput') as HTMLTextAreaElement;
const publishBtn = document.getElementById('publishBtn') as HTMLButtonElement;
const twistsContainer = document.getElementById('twistsContainer') as HTMLDivElement;

function publishTwist(content: string, parentId: number | null = null) {
  const newTwist: Twist = {
    id: twistIdCounter++,
    parentId,
    content: content.trim(),
    timestamp: new Date().toLocaleString(),
    children: [],
  };

  if (parentId === null) {
    twists.push(newTwist);
  } else {
    const parent = findTwistById(parentId, twists);
    if (parent) {
      parent.children.push(newTwist);
    }
  }

  renderTwists();
}

function findTwistById(id: number, list: Twist[]): Twist | null {
  for (const twist of list) {
    if (twist.id === id) return twist;
    const found = findTwistById(id, twist.children);
    if (found) return found;
  }
  return null;
}

function eliminarTwist(id: number, list: Twist[] = twists): boolean {
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) {
      list.splice(i, 1);
      return true;
    } else if (eliminarTwist(id, list[i].children)) {
      return true;
    }
  }
  return false;
}

function calcularProfundidad(twist: Twist): number {
  let profundidad = 0;
  let actual = twist;
  while (actual.parentId !== null) {
    const padre = findTwistById(actual.parentId, twists);
    if (!padre) break;
    profundidad++;
    actual = padre;
  }
  return profundidad;
}

function renderTwists() {
  twistsContainer.innerHTML = '';
  for (const twist of twists) {
    const elem = createTwistElement(twist);
    twistsContainer.appendChild(elem);
  }
}

function createTwistElement(twist: Twist): HTMLElement {
  const div = document.createElement('div');
  div.classList.add('twist');
  if (twist.parentId !== null) div.classList.add('threaded');

  const p = document.createElement('p');
  p.textContent = twist.content;
  div.appendChild(p);

  const fecha = document.createElement('small');
  fecha.textContent = `Publicado: ${twist.timestamp}`;
  fecha.style.display = "block";
  fecha.style.color = "#666";
  fecha.style.marginTop = "4px";
  fecha.style.fontSize = "12px";
  div.appendChild(fecha);

  const acciones = document.createElement('div');
  acciones.className = 'acciones-twist';

  const profundidad = calcularProfundidad(twist);
  if (profundidad < MAX_RESPUESTA_PROFUNDIDAD) {
    const replyBtn = document.createElement('button');
    replyBtn.textContent = 'Responder';
    replyBtn.className = 'btn-responder';
    replyBtn.addEventListener('click', () => openReplyInput(div, twist.id));
    acciones.appendChild(replyBtn);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = 'Eliminar';
  deleteBtn.className = 'btn-eliminar';
  deleteBtn.addEventListener('click', () => {
    eliminarTwist(twist.id);
    renderTwists();
  });

  acciones.appendChild(deleteBtn);
  div.appendChild(acciones);

  for (const child of twist.children) {
    const childElem = createTwistElement(child);
    div.appendChild(childElem);
  }

  return div;
}

function openReplyInput(parentElem: HTMLElement, parentId: number) {
  if (parentElem.querySelector('.reply-input')) return;

  const textarea = document.createElement('textarea');
  textarea.className = 'reply-input';
  textarea.placeholder = 'Escribe tu respuesta...';

  const sendBtn = document.createElement('button');
  sendBtn.textContent = 'Publicar';
  sendBtn.className = 'reply-send-btn';
  sendBtn.addEventListener('click', () => {
    if (textarea.value.trim() !== '') {
      publishTwist(textarea.value, parentId);
    }
  });

  parentElem.appendChild(textarea);
  parentElem.appendChild(sendBtn);
}

publishBtn.addEventListener('click', () => {
  const content = twistInput.value.trim();
  if (content !== '') {
    publishTwist(content, null);
    twistInput.value = '';
  }
});

renderTwists();