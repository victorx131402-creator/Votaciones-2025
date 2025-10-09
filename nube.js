
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, push, remove, query, orderByChild, equalTo, runTransaction } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBYflm70mFVdioZqKdiWe1m92XCTy44Z_c",
  authDomain: "votaciones-2024-f1e0c.firebaseapp.com",
  databaseURL: "https://votaciones-2024-f1e0c-default-rtdb.firebaseio.com/",
  projectId: "votaciones-2024-f1e0c",
  storageBucket: "votaciones-2024-f1e0c.firebasestorage.app",
  messagingSenderId: "293361877394",
  appId: "1:293361877394:web:22f329fdcfceac4d5ac14b",
};


const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const storage = getStorage(app);
const auth = getAuth(app);

const coloresRef = ref(db, "config/colores");
try {
  console.debug('[nube] inicializando módulo');

 
  (function(){
    function ensureOverlay() {
      if (document.getElementById('jsErrorOverlay')) return document.getElementById('jsErrorOverlay');
      const o = document.createElement('div');
      o.id = 'jsErrorOverlay';
      o.style.position = 'fixed';
      o.style.left = '12px';
      o.style.right = '12px';
      o.style.bottom = '12px';
      o.style.zIndex = '2147483647';
      o.style.background = 'rgba(200,20,20,0.95)';
      o.style.color = '#fff';
      o.style.padding = '12px';
      o.style.borderRadius = '8px';
      o.style.fontFamily = 'monospace';
      o.style.fontSize = '13px';
      o.style.maxHeight = '40vh';
      o.style.overflow = 'auto';
      o.style.boxShadow = '0 4px 18px rgba(0,0,0,0.4)';
      o.style.display = 'none';
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(o));
      return o;
    }
    function showError(text) {
      try {
        const o = ensureOverlay();
        o.textContent = text;
        o.style.display = 'block';
        console.error('[nube overlay] ', text);
      } catch(e) { console.error('[nube] overlay error', e); }
    }
    window.addEventListener('error', (ev) => {
      const msg = ev && ev.message ? ev.message : String(ev);
      const loc = ev && ev.filename ? ` (${ev.filename}:${ev.lineno}:${ev.colno})` : '';
      showError(msg + loc);
    });
    window.addEventListener('unhandledrejection', (ev) => {
      showError('UnhandledRejection: ' + (ev.reason && ev.reason.message ? ev.reason.message : String(ev.reason)));
    });
  })();

  try {
    const navEntry = performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    const isBackForward = navEntry && navEntry.type === 'back_forward';
    const pathNow = window.location.pathname.split('/').pop();
    if (isBackForward && document.referrer && document.referrer.includes('panel.html') && (pathNow === '' || pathNow === 'index.html' || pathNow === '/')) {
      try { sessionStorage.removeItem('adminAuth'); console.debug('[nube] nav back_forward from panel to index: adminAuth removed'); } catch(e) {}
      try { if (typeof signOut === 'function' && auth) signOut(auth).catch(()=>{}); } catch(e) {}
    }
  } catch (e) {
  }

function aplicarColores(colores) {
  document.documentElement.style.setProperty("--color1", colores.color1 || "#ffffff");
  document.documentElement.style.setProperty("--color2", colores.color2 || "#000000");
  document.documentElement.style.setProperty("--color3", colores.color3 || "#333333");

  const c1 = document.getElementById("color1");
  const c2 = document.getElementById("color2");
  const c3 = document.getElementById("color3");
  if (c1 && c2 && c3) {
    c1.value = colores.color1 || "#ffffff";
    c2.value = colores.color2 || "#000000";
    c3.value = colores.color3 || "#333333";
  }
}

onValue(coloresRef, (snapshot) => {
  if (snapshot.exists()) {
    aplicarColores(snapshot.val());
  }
});

// Mantener sessionStorage/localStorage en sincronía con el estado de Firebase Auth
try {
  onAuthStateChanged(auth, (user) => {
    try {
      if (user) {
        // guardar identificador mínimo de sesión (email)
        try { sessionStorage.setItem('adminAuth', user.email || user.uid); } catch(e){}
        try { localStorage.setItem('adminAuth', user.email || user.uid); } catch(e){}
      } else {
        try { sessionStorage.removeItem('adminAuth'); } catch(e){}
      }
    } catch(e) { console.error('[nube] onAuthStateChanged handler error', e); }
  });
} catch(e) { /* ignore if auth not available */ }


try {
  const saved = localStorage.getItem('colores');
  if (saved) {
    aplicarColores(JSON.parse(saved));
  }
} catch (e) {}

} catch (err) {
  console.error('[nube] error inicializando lógica principal:', err);
}

// Proteger páginas administrativas: si no hay sesión de Firebase Auth, redirigir a index.html
window.addEventListener('DOMContentLoaded', () => {
  try {
    const path = window.location.pathname.split('/').pop();
    const protectedPages = ['panel.html', 'alumnos.html', 'grupos.html', 'resultados.html'];
    if (!protectedPages.includes(path)) return;
    // Usar onAuthStateChanged para comprobar el estado de autenticación y reaccionar inmediatamente
    try {
      onAuthStateChanged(auth, (user) => {
        if (!user) {
          try { sessionStorage.removeItem('adminAuth'); } catch(e){}
          try { localStorage.removeItem('adminAuth'); } catch(e){}
          // intentar signOut por si hubiese sesión parcial
          try { if (typeof signOut === 'function' && auth) signOut(auth).catch(()=>{}); } catch(e){}
          window.location.href = 'index.html';
        }
      });
    } catch(e) {
      // como fallback, si no existe adminAuth en storage redirigimos
      try { const admin = sessionStorage.getItem('adminAuth') || localStorage.getItem('adminAuth'); if (!admin) window.location.href = 'index.html'; } catch(e){}
    }
  } catch(e) { console.error('[nube] auth protect check error', e); }
});

function actualizarColores(color1, color2, color3) {
  try {
    aplicarColores({ color1, color2, color3 });
  } catch (e) {}
  try { localStorage.setItem('colores', JSON.stringify({ color1, color2, color3 })); } catch(e){}
  try {
    set(coloresRef, { color1, color2, color3 });
  } catch (e) {
    console.warn('[nube] no se pudo guardar en Firebase, se utilizó fallback local', e);
  }
}

const gruposRef = ref(db, 'grupos');
const alumnosRef = ref(db, 'alumnos');



function showLoader() { try { document.body.classList.remove('loaded'); const l = document.getElementById('loader'); if (l) { l.style.display = 'flex'; } } catch(e){} }
function hideLoader() { try { document.body.classList.add('loaded'); const l = document.getElementById('loader'); if (l) { l.style.display = 'none'; } } catch(e){} }

async function uploadImageAndGetUrl(file, destPath) {

  try {
    const sRef = storageRef(storage, destPath);
    const snapshot = await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    return { url, path: destPath };
  } catch (e) {
    console.error('[nube] upload via SDK failed', e);
    throw e;
  }
}

async function addGrupo(name, file) {

  function slugify(s) {
    return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  }
  let slug = slugify(name) || `grupo-${Date.now()}`;
  // garantizar unicidad: si existe, agregar sufijo corto
  let targetRef = ref(db, `grupos/${slug}`);
  let snap = await get(targetRef);
  if (snap.exists()) {
    // añadir sufijo con timestamp hasta que sea único
    slug = `${slug}-${Date.now().toString().slice(-4)}`;
    targetRef = ref(db, `grupos/${slug}`);
  }
  let imageUrl = '';
  let imagePath = '';
  if (file) {
    const ext = (file.name && file.name.split('.').pop()) || 'jpg';
    const dest = `grupos/${slug}.${ext}`;
    const r = await uploadImageAndGetUrl(file, dest);
    imageUrl = r.url; imagePath = r.path;
  }
  // Inicializar votes a 0 para que siempre exista la propiedad
  await set(targetRef, { name, imageUrl, imagePath, votes: 0 });
}

async function deleteGrupo(id, imagePath) {
  // Nota: ahora solo eliminamos la entrada en la base de datos.
  // La imagen en Storage quedará intacta para borrado manual.
  try {
    const gRef = ref(db, `grupos/${id}`);
    await remove(gRef);
  } catch (e) {
    console.warn('[nube] error borrando entrada en DB', e);
    throw e;
  }
}

// Función para renderizar tarjetas
function renderGrupoCard(id, data) {
  // Preferir el contenedor de administración, pero soportar también la página de voto
  const container = document.getElementById('gruposContainer') || document.getElementById('votarContainer');
  if (!container) return;
  const card = document.createElement('div');
  card.className = 'card group-card';
  // Mostrar contador de votos solo en la vista de administración (gruposContainer).
  const isAdminView = !!document.getElementById('gruposContainer');
  card.innerHTML = `
    <div class="card-media">
      ${data.imageUrl ? `<img src="${data.imageUrl}" alt="${data.name}">` : '<div style="color:#777">Sin imagen</div>'}
    </div>
    <div class="card-body">
      <div class="card-title">${escapeHtml(data.name)}</div>
      ${ isAdminView ? `<div class="card-meta" style="margin-top:8px;color:var(--color3);font-weight:600">Votos: <span style="font-weight:800">${escapeHtml(String((data.votes != null) ? data.votes : 0))}</span></div>` : '' }
      <div class="card-actions">
        ${ isAdminView ? `<button class="btn btn-secondary" data-delete-id="${id}" data-image-path="${data.imagePath||''}">Eliminar</button>` : '' }
        ${ !isAdminView ? `<button class="btn btn-primary" data-vote-id="${id}" data-vote-name="${escapeHtml(data.name)}" data-vote-image="${data.imageUrl||''}">Votar</button>` : '' }
      </div>
    </div>
  `;
  container.appendChild(card);
}

// Seguridad mínima: escapar texto para uso en atributos/HTML
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

// Marcar alumno como votado (solo flagged 'voted')
async function markAlumnoVoted(alumnoId) {
  if (!alumnoId) throw new Error('alumnoId missing');
  const aRef = ref(db, `alumnos/${alumnoId}/voted`);
  await set(aRef, true);
}

// --- Alumnos: add / list / remove ---
async function addAlumno(dni, data) {
  const key = String(dni);
  const aRef = ref(db, `alumnos/${key}`);
  const snap = await get(aRef);
  if (snap.exists()) {
    const err = new Error('DNI_EXISTS');
    err.code = 'DNI_EXISTS';
    throw err;
  }
  const createdAt = new Date().toISOString();
  const payload = {
    dni: key,
    primerNombre: data.primerNombre || '',
    segundoNombre: data.segundoNombre || '',
    apellido1: data.apellido1 || '',
    apellido2: data.apellido2 || '',
    voted: false,
    createdAt
  };
  await set(aRef, payload);
}

async function removeAlumno(id) {
  try {
    const aRef = ref(db, `alumnos/${id}`);
    await remove(aRef);
  } catch (e) { console.error('[nube] error eliminando alumno', e); throw e; }
}

// Render tabla de alumnos si existe el contenedor
onValue(alumnosRef, (snapshot) => {
  const table = document.getElementById('alumnosTable');
  const tbody = document.getElementById('alumnosTbody');
  // Además, actualizar contador de alumnos que no han votado (si estamos en resultados.html)
  try {
    const notVotedEl = document.getElementById('notVotedCount');
    if (notVotedEl) {
      let notVoted = 0;
      if (snapshot.exists()) {
        const valAll = snapshot.val();
        Object.keys(valAll).forEach(k => { if (!valAll[k] || valAll[k].voted !== true) notVoted++; });
      }
      notVotedEl.textContent = String(notVoted);
    }
  } catch(e) { /* no-crash */ }
  if (!table || !tbody) return; // solo actúa si estamos en alumnos.html
  // limpiar
  tbody.innerHTML = '';
  if (snapshot.exists()) {
    const val = snapshot.val();
    Object.keys(val).forEach(id => {
      const row = document.createElement('tr');
      const dni = val[id].dni || '';
      const p1 = val[id].primerNombre || '';
      const p2 = val[id].segundoNombre || '';
      const a1 = val[id].apellido1 || '';
      const a2 = val[id].apellido2 || '';
      const created = val[id].createdAt || '';
      let createdPretty = created;
      try { if (created) createdPretty = new Date(created).toLocaleString(); } catch(e){}
      const fullName = [p1, p2, a1, a2].filter(Boolean).join(' ');
      row.innerHTML = `
        <td style="width:120px;text-align:center;font-family:monospace">${dni}</td>
        <td style="flex:1">${escapeHtml(fullName)}</td>
        <td style="width:180px;text-align:center">${createdPretty}</td>
        <td style="width:120px;text-align:center"><button class="btn btn-secondary btn-sm" data-alumno-id="${id}">Eliminar</button></td>
      `;
      tbody.appendChild(row);
    });
  }
  // attach delete handlers
  tbody.querySelectorAll('button[data-alumno-id]').forEach(b => {
    b.onclick = async (ev) => {
      const id = b.getAttribute('data-alumno-id');
      if (!id) return;
      try { showLoader(); await removeAlumno(id); } catch(e){ console.error(e); alert('No se pudo eliminar alumno'); } finally { hideLoader(); }
    };
  });
});

// Listener para cambios en grupos
onValue(gruposRef, (snapshot) => {
  // soportar dos tipos de contenedores: admin (gruposContainer) y votación (votarContainer)
  const adminContainer = document.getElementById('gruposContainer');
  const voteContainer = document.getElementById('votarContainer');
  const container = adminContainer || voteContainer;
  if (container) {
    container.innerHTML = '';
    if (snapshot.exists()) {
      const val = snapshot.val();
      Object.keys(val).forEach(id => renderGrupoCard(id, val[id]));
    }
  }
  // attach delete handlers only if admin container is present
  if (adminContainer) {
    adminContainer.querySelectorAll('button[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-delete-id');
      const img = btn.getAttribute('data-image-path');
      // abrir modal de confirmación
      const confirmModal = document.getElementById('deleteConfirmModal');
      const confirmText = document.getElementById('deleteConfirmText');
      const confirmBtn = document.getElementById('confirmDeleteBtn');
      const cancelBtn = document.getElementById('cancelDeleteBtn');
      if (!confirmModal || !confirmBtn || !cancelBtn) return;
      confirmText.textContent = '¿Eliminar este grupo/candidato?';
      confirmModal.style.display = 'flex';
      // limpiar handlers previos
      confirmBtn.onclick = null;
      cancelBtn.onclick = null;
      cancelBtn.onclick = () => { confirmModal.style.display = 'none'; };
      confirmBtn.onclick = async () => {
        // evitar múltiples clicks
        if (confirmBtn.dataset.busy === '1') return;
        confirmBtn.dataset.busy = '1';
        confirmBtn.disabled = true;
        try {
          // ocultar modal de confirmación antes de mostrar loader (loader tiene z-index menor que modal)
          if (confirmModal) confirmModal.style.display = 'none';
          showLoader(); // mostrar loader
          // dejar que el navegador repinte para que el loader sea visible antes de la operación
          await new Promise((res) => requestAnimationFrame(res));
          await deleteGrupo(id, img);
          const msg = document.getElementById('gruposMsg'); if (msg) { msg.textContent = 'Eliminado.'; setTimeout(()=>msg.textContent='',2000); }
        } catch (err) { console.error(err); alert('No se pudo eliminar. Revisa consola.'); }
        // ocultar loader y re-habilitar
        setTimeout(()=>{ hideLoader(); confirmBtn.dataset.busy = '0'; confirmBtn.disabled = false; }, 400);
      };
    });
    });
  }

  try {
    const resultsTable = document.getElementById('resultsTable');
    if (resultsTable) {
      const tbody = resultsTable.querySelector('tbody');
      tbody.innerHTML = '';
      if (snapshot.exists()) {
        const val = snapshot.val();
        Object.keys(val).forEach(id => {
          const row = document.createElement('tr');
          const name = val[id].name || '';
          const votes = (val[id].votes != null) ? String(val[id].votes) : '0';
          row.innerHTML = `<td class="name" style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(name)}</td><td class="votes" style="padding:8px;border-bottom:1px solid #eee">${votes}</td>`;
          tbody.appendChild(row);
        });
      }
    }
  } catch(e) { console.error('[nube] results table render error', e); }
});

window.addEventListener('DOMContentLoaded', ()=>{
  const addBtn = document.getElementById('addGroupBtn');
  const addModal = document.getElementById('addGroupModal');
  const cancelAdd = document.getElementById('cancelAddGroup');
  const saveAdd = document.getElementById('saveAddGroup');
  const nameEl = document.getElementById('groupName');
  const fileEl = document.getElementById('groupImage');
  const addMsg = document.getElementById('addGroupMsg');

  if(addBtn && addModal){
    addBtn.addEventListener('click', ()=>{ addModal.style.display='flex'; });
  }
  if(cancelAdd && addModal){ cancelAdd.addEventListener('click', ()=>{ addModal.style.display='none'; addMsg.style.display='none'; }); }

  if(saveAdd){
    saveAdd.addEventListener('click', async ()=>{
      const name = nameEl.value && nameEl.value.trim();
      const file = fileEl.files && fileEl.files[0];
      if(!name){ addMsg.textContent='Ingrese un nombre.'; addMsg.style.display='block'; return; }
      if (saveAdd.dataset.busy === '1') return;
      saveAdd.dataset.busy = '1';
      saveAdd.disabled = true;
      try{
        if (addModal) addModal.style.display='none';
  showLoader();
  await new Promise((res) => requestAnimationFrame(res));
  await addGrupo(name, file);
        if (addMsg) { addMsg.textContent='Guardado.'; addMsg.style.display='block'; }
        setTimeout(()=>{ if (addMsg) addMsg.style.display='none'; try{ if (nameEl) nameEl.value=''; if (fileEl) fileEl.value=''; }catch(e){} }, 800);
      }catch(e){ console.error(e); if (addMsg) { addMsg.textContent='Error al guardar.'; addMsg.style.display='block'; } }
      setTimeout(()=>{ hideLoader(); saveAdd.dataset.busy = '0'; saveAdd.disabled = false; }, 600);
    });
  }
  try {
    const addDniBtn = document.getElementById('addDniBtn');
    const dniInput = document.getElementById('dniInput');
    const searchDni = document.getElementById('searchDni');
    const alumnosTable = document.getElementById('alumnosTable');
    const alumnosTbody = document.getElementById('alumnosTbody');
    if (addDniBtn && dniInput) {
      addDniBtn.addEventListener('click', async () => {
        const val = dniInput.value && dniInput.value.trim();
        const primer = (document.getElementById('primerNombre')||{}).value && document.getElementById('primerNombre').value.trim();
        const segundo = (document.getElementById('segundoNombre')||{}).value && document.getElementById('segundoNombre').value.trim();
        const ap1 = (document.getElementById('apellido1')||{}).value && document.getElementById('apellido1').value.trim();
        const ap2 = (document.getElementById('apellido2')||{}).value && document.getElementById('apellido2').value.trim();
        const msgEl = document.getElementById('dniAddMsg');
        if (msgEl) { msgEl.style.display = 'none'; msgEl.textContent = ''; }
        if (!/^[0-9]{8}$/.test(val)) { if (msgEl) { msgEl.textContent = 'Ingrese un DNI válido de 8 dígitos'; msgEl.style.display='block'; } return; }
        if (!primer || !ap1) { if (msgEl) { msgEl.textContent = 'Ingrese al menos primer nombre y primer apellido'; msgEl.style.display='block'; } return; }
        if (addDniBtn.dataset.busy === '1') return;
        addDniBtn.dataset.busy = '1'; addDniBtn.disabled = true;
        try {
          showLoader();
          await addAlumno(val, { primerNombre: primer, segundoNombre: segundo, apellido1: ap1, apellido2: ap2 });
          dniInput.value = ''; try{ document.getElementById('primerNombre').value=''; document.getElementById('segundoNombre').value=''; document.getElementById('apellido1').value=''; document.getElementById('apellido2').value=''; }catch(e){}
          if (msgEl) { msgEl.textContent = 'Alumno agregado.'; msgEl.style.color = '#080'; msgEl.style.display = 'block'; }
        } catch(e){ 
          console.error(e);
          if (e && e.code === 'DNI_EXISTS') {
            if (msgEl) { msgEl.textContent = 'El DNI ya existe.'; msgEl.style.color = '#c00'; msgEl.style.display='block'; }
          } else {
            if (msgEl) { msgEl.textContent = 'Error al guardar alumno.'; msgEl.style.color = '#c00'; msgEl.style.display='block'; }
          }
        } finally { hideLoader(); addDniBtn.dataset.busy='0'; addDniBtn.disabled=false; }
      });
    }
    if (searchDni && alumnosTbody) {
      searchDni.addEventListener('input', () => {
        const q = searchDni.value.trim();
        alumnosTbody.querySelectorAll('tr').forEach(tr => {
          const txt = tr.children[0].textContent || '';
          tr.style.display = txt.indexOf(q) !== -1 ? '' : 'none';
        });
      });
    }
  } catch(e) { console.error('[nube] alumnos handlers error', e); }
});

// --- Voting page handlers ---
window.addEventListener('DOMContentLoaded', ()=>{
  try {
    // sólo si estamos en votar.html
    const path = window.location.pathname.split('/').pop();
    if (path !== 'votar.html') return;

    // Force a get() to ensure onValue(gruposRef) fires after DOMContentLoaded in case
    // the listener ran earlier than the page constructed the votarContainer.
    try { get(gruposRef).catch(()=>{}); } catch(e){}

    // contenedor donde se renderizan las tarjetas ya está poblado por onValue(gruposRef)
    const votarContainer = document.getElementById('votarContainer');
    // Mostrar nombre del alumno en la cabecera si existe
    (async function showAlumnoName(){
      try {
        const alumnoId = sessionStorage.getItem('alumnoId');
        // si no hay alumnoId en session, redirigir al index para que ingrese DNI
        if (!alumnoId) { window.location.href = 'index.html'; return; }
        const aRef = ref(db, `alumnos/${alumnoId}`);
        const snap = await get(aRef);
        // si no existe el registro del alumno, redirigir
        if (!snap.exists()) { window.location.href = 'index.html'; return; }
        const data = snap.val() || {};
        // si ya votó, redirigir a index
        if (data.voted === true) { try { alert('Este DNI ya votó.'); } catch(e){}; window.location.href = 'index.html'; return; }
        const full = [data.primerNombre, data.segundoNombre, data.apellido1, data.apellido2].filter(Boolean).join(' ');
        const welcome = document.getElementById('welcomeAlumno');
        if (welcome) welcome.textContent = `Bienvenido ${full}`;
      } catch(e) { console.error('[nube] showAlumnoName error', e); try { window.location.href = 'index.html'; } catch(e){} }
    })();
    const voteModal = document.getElementById('voteConfirmModal');
    const voteImage = document.getElementById('voteConfirmImage');
    const voteName = document.getElementById('voteConfirmName');
    const confirmVoteBtn = document.getElementById('confirmVoteBtn');
    const cancelVoteBtn = document.getElementById('cancelVoteBtn');

    // delegación: cuando se haga click en un botón de votar, verificar DNI y abrir modal
    document.body.addEventListener('click', async (ev)=>{
      const btn = ev.target.closest && ev.target.closest('[data-vote-id]');
      if (!btn) return;
      ev.preventDefault();
      const gid = btn.getAttribute('data-vote-id');
      const gname = btn.getAttribute('data-vote-name');
      const gimg = btn.getAttribute('data-vote-image');
      if (!gid) return;
      try {
        // comprobar que el usuario ingresó su DNI en index
        const alumnoId = sessionStorage.getItem('alumnoId');
        if (!alumnoId) {
          // no hay sesión de alumno: forzar ingreso
          alert('Debes ingresar tu DNI en la página de inicio antes de votar.');
          window.location.href = 'index.html';
          return;
        }
        // comprobar en DB que el alumno existe y no haya votado
        try {
          const aRef = ref(db, `alumnos/${alumnoId}`);
          const snap = await get(aRef);
          if (!snap.exists()) {
            alert('DNI no encontrado. Consulte con administración.');
            window.location.href = 'index.html';
            return;
          }
          const data = snap.val() || {};
          if (data.voted === true) {
            alert('Ya se ha registrado un voto para este DNI.');
            window.location.href = 'index.html';
            return;
          }
        } catch(e) {
          console.error('[nube] error verificando alumno antes de votar', e);
          alert('Error verificando su estado. Intente nuevamente.');
          return;
        }
        // si está todo OK, abrir modal
        try { console.debug('[nube] abrir modal de voto', { gid, gname }); } catch(e){}
        if (voteImage) voteImage.src = gimg || '';
        if (voteName) voteName.textContent = gname || '';
        if (voteModal) {
          voteModal.dataset.voteId = gid;
          // mostrar modal y dar foco al botón cancelar para manejar teclado
          voteModal.style.display = 'flex';
          try { if (cancelVoteBtn && typeof cancelVoteBtn.focus === 'function') cancelVoteBtn.focus(); } catch(e){}
        }
      } catch(e) { console.error('[nube] voto click handler error', e); }
    });

    if (cancelVoteBtn) {
      cancelVoteBtn.setAttribute('type','button');
      cancelVoteBtn.addEventListener('click', (ev)=>{
        try { console.debug('[nube] cancelVoteBtn clicked'); } catch(e){}
        ev.preventDefault(); ev.stopPropagation();
        if (voteModal) voteModal.style.display='none';
      });
    }

    // cerrar modal si el usuario clickea en el overlay (fuera del modal-content)
    if (voteModal) {
      voteModal.addEventListener('click', (ev) => {
        try {
          // si el origen del click es el propio overlay (no una parte interna), cerrar
          if (ev.target === voteModal) {
            console.debug('[nube] voteModal overlay click detected');
            voteModal.style.display = 'none';
          }
        } catch(e) { console.error('[nube] error handling overlay click', e); }
      });
      // tecla Escape para cerrar
      window.addEventListener('keydown', (ev) => {
        try {
          if (ev.key === 'Escape' || ev.key === 'Esc') {
            // solo cerrar si el modal está visible
            if (voteModal && voteModal.style.display !== 'none') {
              console.debug('[nube] Escape pressed, closing vote modal');
              voteModal.style.display = 'none';
            }
          }
        } catch(e) { console.error('[nube] error handling Escape key', e); }
      });
    }

    if (confirmVoteBtn) confirmVoteBtn.addEventListener('click', async ()=>{
      // proteger contra múltiples clicks
      if (confirmVoteBtn.dataset.busy === '1') return;
      confirmVoteBtn.dataset.busy = '1'; confirmVoteBtn.disabled = true;
      const vid = voteModal ? voteModal.dataset.voteId : null;
      if (!vid) {
        confirmVoteBtn.dataset.busy = '0'; confirmVoteBtn.disabled = false; return;
      }
      try {
        // obtener alumnoId desde sessionStorage
        const alumnoId = sessionStorage.getItem('alumnoId');
        if (!alumnoId) {
          // no tenemos id de alumno: redirigir a index
          if (voteModal) voteModal.style.display='none';
          window.location.href = 'index.html';
          return;
        }
        // cerrar modal y mostrar loader
        if (voteModal) voteModal.style.display='none';
        showLoader();
        await new Promise(res => requestAnimationFrame(res));
  // marcar voto en DB (solo flagged 'voted')
  await markAlumnoVoted(alumnoId);
        // incrementar contador de votos en el grupo (transacción atómica)
        try {
          const gVotesRef = ref(db, `grupos/${vid}/votes`);
          await runTransaction(gVotesRef, (current) => {
            if (current === null || typeof current === 'undefined') return 1;
            return (Number(current) || 0) + 1;
          });
        } catch(e) { console.error('[nube] no se pudo incrementar contador de votos', e); }
          // (Registro de votos en 'votes' removido por petición del usuario)
        // marcar para mostrar gracias en index
        try { sessionStorage.setItem('showThanks','1'); } catch(e){}
        // redirigir a index
        window.location.href = 'index.html';
      } catch (e) {
        console.error('[nube] error al confirmar voto', e);
        alert('No se pudo registrar el voto. Intente nuevamente.');
      } finally {
        hideLoader(); confirmVoteBtn.dataset.busy = '0'; confirmVoteBtn.disabled = false;
      }
    });

  } catch (e) { console.error('[nube] voting handlers error', e); }
});

// === Integración con inputs si existen ===
window.addEventListener("DOMContentLoaded", () => {
  const c1 = document.getElementById("color1");
  const c2 = document.getElementById("color2");
  const c3 = document.getElementById("color3");

  if (c1 && c2 && c3) {
    [c1, c2, c3].forEach((input) => {
      input.addEventListener("input", () => {
        actualizarColores(c1.value, c2.value, c3.value);
      });
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.remove("loaded");

  setTimeout(() => {
    document.body.classList.add("loaded");
  }, 1500);
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const show = sessionStorage.getItem('showThanks');
    if (!show) return;
    sessionStorage.removeItem('showThanks');
    const modal = document.getElementById('thanksModal');
    const closeBtn = document.getElementById('closeThanksBtn');
    if (!modal) return;
    modal.style.display = 'flex';
    if (closeBtn) closeBtn.addEventListener('click', ()=>{ modal.style.display='none'; });
  } catch(e) { console.error('[nube] showThanks error', e); }
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const path = window.location.pathname.split('/').pop();
    const nav = performance && performance.getEntriesByType ? performance.getEntriesByType('navigation')[0] : null;
    const isBack = nav && nav.type === 'back_forward';
    if ((path === '' || path === 'index.html' || path === '/') && isBack && document.referrer && document.referrer.includes('panel.html')) {
      try { sessionStorage.removeItem('adminAuth'); console.debug('[nube] closed adminAuth because user navigated back from panel'); } catch(e){}
      try { if (typeof signOut === 'function' && auth) signOut(auth).catch(()=>{}); } catch(e){}
    }
  } catch(e) {}
  try {
    const path2 = window.location.pathname.split('/').pop();
    if (path2 === '' || path2 === 'index.html' || path2 === '/') {
      try { sessionStorage.removeItem('panelBlocked'); } catch(e){}
      try { sessionStorage.removeItem('panelOpened'); } catch(e){}
      try { sessionStorage.removeItem('adminAuth'); } catch(e){}
      try { if (typeof signOut === 'function' && auth) signOut(auth).catch(()=>{}); } catch(e){}
      console.debug('[nube] cleaned panelBlocked and panelOpened on index load');
    }
  } catch(e) {}
  try {
    const panelLink = document.getElementById("panelLink");
    const loginModal = document.getElementById("loginModal");
    const closeModal = document.getElementById("closeModal");
    const loginBtn = document.getElementById("loginBtn");
    const loginMsg = document.getElementById("loginMsg");

    if (panelLink) {
      panelLink.addEventListener("click", (e) => {
        e.preventDefault();
        if (loginModal) loginModal.style.display = "flex";
      });
    }

    if (sessionStorage.getItem('openLogin')) {
      try { sessionStorage.removeItem('openLogin'); } catch(e){}
      try { sessionStorage.removeItem('adminAuth'); } catch(e){}
      try { if (typeof signOut === 'function' && auth) signOut(auth).catch(()=>{}); } catch(e){}
      console.debug('[nube] openLogin detected: cleaned adminAuth and removed openLogin, not opening modal');
    }
    try {
      const path = window.location.pathname.split('/').pop();
      if (path === 'panel.html') {
    try { sessionStorage.setItem('panelOpened','1'); } catch(e){}
    try { history.replaceState({panelOpened: true, ts: Date.now()}, ''); } catch(e){}
    // Al cerrar la página/panel solo limpiamos el flag panelOpened; NO forzamos signOut aquí
    window.addEventListener('beforeunload', () => { try { sessionStorage.removeItem('panelOpened'); } catch(e){} });

        function ensureAuthPanel() {
          try {
            const admin = sessionStorage.getItem('adminAuth');
              if (!admin) {
              try { sessionStorage.removeItem('panelOpened'); sessionStorage.setItem('openLogin','1'); } catch(e){}
              console.debug('[nube] ensureAuthPanel: adminAuth not present — openLogin flag set, not redirecting.');
              return;
            }
          } catch(e){}
        }
        ensureAuthPanel();
        window.addEventListener('pageshow', ensureAuthPanel);
        document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') ensureAuthPanel(); });
        window.addEventListener('pagehide', (ev) => {
          try {
            sessionStorage.setItem('panelBlocked','1');
            sessionStorage.removeItem('panelOpened');
            console.debug('[nube] pagehide: panelBlocked set (adminAuth preserved)');
          } catch(e) {}
        });
        window.addEventListener('popstate', (ev) => {
          try { sessionStorage.setItem('panelBlocked','1'); sessionStorage.removeItem('panelOpened'); } catch(e){}
        });
      }

      if (path === '' || path === 'index.html' || path === '/') {
        try {
          const panelOpened = sessionStorage.getItem('panelOpened');
          if (panelOpened) {
            try { sessionStorage.removeItem('adminAuth'); } catch(e){}
            try { sessionStorage.removeItem('panelOpened'); } catch(e){}
            try { sessionStorage.setItem('openLogin','1'); } catch(e){}
            try { sessionStorage.setItem('panelBlocked','1'); } catch(e){}
          }
        } catch(e){}
      }
    } catch(e) { console.error('[nube] panelOpened logic error', e); }

    if (closeModal) {
      closeModal.addEventListener("click", () => {
        if (loginModal) loginModal.style.display = "none";
      });
    }

    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        const userEl = document.getElementById("user");
        const passEl = document.getElementById("pass");
        const user = userEl ? userEl.value.trim() : '';
        const pass = passEl ? passEl.value.trim() : '';

        if (!user || !pass) {
          if (loginMsg) { loginMsg.textContent = "Por favor ingrese usuario y contraseña."; loginMsg.style.display = "block"; }
          return;
        }

        try {
          // Usar Firebase Auth para autenticación con email/contraseña
          const cred = await signInWithEmailAndPassword(auth, user, pass);
          const u = cred && cred.user;
          try { sessionStorage.setItem('adminAuth', u.email || u.uid); } catch(e){}
          try { localStorage.setItem('adminAuth', u.email || u.uid); } catch(e){}
          try { sessionStorage.removeItem('panelBlocked'); } catch(e){}
          window.location.href = "panel.html";
        } catch (error) {
          // mapear errores a mensajes amigables
          let msg = 'Error autenticando. Revise credenciales.';
          try {
            if (error && error.code) {
              if (error.code === 'auth/user-not-found') msg = 'Usuario no encontrado.';
              else if (error.code === 'auth/wrong-password') msg = 'Contraseña incorrecta.';
              else msg = error.message || String(error);
            }
          } catch(e){}
          if (loginMsg) { loginMsg.textContent = msg; loginMsg.style.display = 'block'; }
          console.error('Auth error:', error);
        }
      });
    }
  } catch (e) { console.error('[nube] modal handlers error', e); }


    try {

      document.querySelectorAll('a[href$="panel.html"]').forEach(a => {
        a.addEventListener('click', (ev) => {
          try {
            const href = a.getAttribute('href');
            const isSameOrigin = a.host === window.location.host || !a.host;
            const admin = sessionStorage.getItem('adminAuth');
            console.debug('[nube] click panel link (allow navigation)', {href, isSameOrigin, admin});
          } catch (err) {
            console.error('[nube] error manejando click en panel link', err);
          }
        });
      });
    } catch (e) {}
});

window.addEventListener('DOMContentLoaded', () => {
  try {
    const dniField = document.getElementById('dni');
    const dniMsg = document.getElementById('dniMsg');
    if (!dniField) return;
    const card = dniField.closest('.card');
    let enterBtn = null;
    if (card) enterBtn = card.querySelector('button.btn-primary');
    if (!enterBtn) enterBtn = document.querySelector('.card.registro button.btn-primary');
    if (!enterBtn) return;

    enterBtn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const val = dniField.value && dniField.value.trim();
      if (!/^[0-9]{8}$/.test(val)) {
        if (dniMsg) { dniMsg.textContent = 'Ingrese un DNI válido de 8 dígitos'; dniMsg.style.display = 'block'; }
        return;
      }
      if (enterBtn.dataset.busy === '1') return;
      enterBtn.dataset.busy = '1'; enterBtn.disabled = true;
      if (dniMsg) { dniMsg.textContent = ''; dniMsg.style.display = 'none'; }
      try {
        try { document.body.classList.remove('loaded'); } catch(e){}
        showLoader();
        await new Promise(res => requestAnimationFrame(res));

        const q = query(alumnosRef, orderByChild('dni'), equalTo(String(val)));
        const snap = await get(q);
        if (snap.exists()) {
          const data = snap.val();
          const keys = Object.keys(data || {});
          const id = keys[0];
          const alumno = data[id];
          if (alumno && alumno.voted) {
            if (dniMsg) { dniMsg.textContent = 'Este DNI ya votó.'; dniMsg.style.display = 'block'; }
          } else {
            try { sessionStorage.setItem('alumnoId', id); } catch(e){}
            window.location.href = 'votar.html';
          }
        } else {
          if (dniMsg) { dniMsg.textContent = 'DNI no registrado. Consulte con administración.'; dniMsg.style.display = 'block'; }
        }
      } catch (e) {
        console.error(e);
        if (dniMsg) { dniMsg.textContent = 'Error validando DNI. Revisa consola.'; dniMsg.style.display = 'block'; }
      } finally {
        hideLoader();
        enterBtn.dataset.busy = '0'; enterBtn.disabled = false;
      }
    });
  } catch (e) { console.error('[nube] index dni check error', e); }
});
 