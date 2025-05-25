var twists = [];
var twistIdCounter = 1;
var twistInput = document.getElementById('twistInput');
var publishBtn = document.getElementById('publishBtn');
var twistsContainer = document.getElementById('twistsContainer');
function publishTwist(content, parentId) {
    if (parentId === void 0) { parentId = null; }
    var newTwist = {
        id: twistIdCounter++,
        parentId: parentId,
        content: content.trim(),
        children: [],
    };
    if (parentId === null) {
        twists.push(newTwist);
    }
    else {
        var parent_1 = findTwistById(parentId, twists);
        if (parent_1) {
            parent_1.children.push(newTwist);
        }
    }
    renderTwists();
}
function findTwistById(id, list) {
    for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
        var twist = list_1[_i];
        if (twist.id === id)
            return twist;
        var found = findTwistById(id, twist.children);
        if (found)
            return found;
    }
    return null;
}
function eliminarTwist(id, list) {
    if (list === void 0) { list = twists; }
    for (var i = 0; i < list.length; i++) {
        if (list[i].id === id) {
            list.splice(i, 1);
            return true;
        }
        else if (eliminarTwist(id, list[i].children)) {
            return true;
        }
    }
    return false;
}
function renderTwists() {
    twistsContainer.innerHTML = '';
    for (var _i = 0, twists_1 = twists; _i < twists_1.length; _i++) {
        var twist = twists_1[_i];
        var elem = createTwistElement(twist);
        twistsContainer.appendChild(elem);
    }
}
function createTwistElement(twist) {
    var div = document.createElement('div');
    div.classList.add('twist');
    if (twist.parentId !== null)
        div.classList.add('threaded');
    var p = document.createElement('p');
    p.textContent = twist.content;
    div.appendChild(p);
    var acciones = document.createElement('div');
    acciones.className = 'acciones-twist';
    var replyBtn = document.createElement('button');
    replyBtn.textContent = 'Responder';
    replyBtn.className = 'btn-responder';
    replyBtn.addEventListener('click', function () { return openReplyInput(div, twist.id); });
    var deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Eliminar';
    deleteBtn.className = 'btn-eliminar';
    deleteBtn.addEventListener('click', function () {
        eliminarTwist(twist.id);
        renderTwists();
    });
    acciones.appendChild(replyBtn);
    acciones.appendChild(deleteBtn);
    div.appendChild(acciones);
    for (var _i = 0, _a = twist.children; _i < _a.length; _i++) {
        var child = _a[_i];
        var childElem = createTwistElement(child);
        div.appendChild(childElem);
    }
    return div;
}
function openReplyInput(parentElem, parentId) {
    if (parentElem.querySelector('.reply-input'))
        return;
    var textarea = document.createElement('textarea');
    textarea.className = 'reply-input';
    textarea.placeholder = 'Escribe tu respuesta...';
    var sendBtn = document.createElement('button');
    sendBtn.textContent = 'Publicar';
    sendBtn.className = 'reply-send-btn';
    sendBtn.addEventListener('click', function () {
        if (textarea.value.trim() !== '') {
            publishTwist(textarea.value, parentId);
        }
    });
    parentElem.appendChild(textarea);
    parentElem.appendChild(sendBtn);
}
publishBtn.addEventListener('click', function () {
    var content = twistInput.value.trim();
    if (content !== '') {
        publishTwist(content, null);
        twistInput.value = '';
    }
});
renderTwists();
