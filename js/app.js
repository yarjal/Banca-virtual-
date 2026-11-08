/* ===================== Banca Virtual - lógica ===================== */
const CLAVE = "bancaAndino_v1";
const $ = (s) => document.querySelector(s);

let estado = cargar();
let saldoVisible = true;
let historial = [];          // pila de pantallas para el botón "atrás"
let destinatario = null;     // contacto seleccionado para transferir
let transferencia = null;    // { monto, descripcion }
let fotoSubida = null;       // foto cargada en "Nueva cuenta"
let centavos = 0;            // monto que se va escribiendo (en centavos)
let pin = "";                // clave de seguridad que se va escribiendo
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const vibrar = (ms = 8) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };

/* ---------- Persistencia ---------- */
function cargar() {
  try {
    const g = JSON.parse(localStorage.getItem(CLAVE));
    if (g && g.contactos) return g;
  } catch (e) {}
  return structuredClone(ESTADO_INICIAL);
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
}

/* ---------- Utilidades ---------- */
const dinero = (n) => "$" + n.toLocaleString("es-EC", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const normalizar = (t) => (t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const enmascarar = (num) => "*** *** " + String(num).slice(-4);
const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function iniciales(nombre) {
  const p = (nombre || "?").trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[1]?.[0] || "")).toUpperCase() || "?";
}
function avatarHTML(persona, clase = "") {
  const ini = escapar(iniciales(persona.alias || persona.nombre));
  if (persona.foto) {
    return `<div class="avatar ${clase}"><img src="${escapar(persona.foto)}" alt="Foto de ${escapar(persona.nombre)}"
      onerror="this.parentNode.textContent='${ini}'"></div>`;
  }
  return `<div class="avatar ${clase}">${ini}</div>`;
}
function resaltar(texto, q) {
  const t = escapar(texto);
  if (!q) return t;
  const i = normalizar(texto).indexOf(normalizar(q));
  if (i < 0) return t;
  return escapar(texto.slice(0, i)) + "<mark>" + escapar(texto.slice(i, i + q.length)) + "</mark>" + escapar(texto.slice(i + q.length));
}
function fechaLarga(d) {
  return d.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" });
}
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove("show"), 2200);
}
function leerMonto(txt) {
  const n = parseFloat(String(txt).replace(/\s|\$/g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
}

/* ---------- Navegación ---------- */
function ir(nombre, { reemplazar = false, efecto = "" } = {}) {
  const actual = document.querySelector(".screen.active");
  if (actual && !reemplazar) historial.push(actual.id.replace("screen-", ""));
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active", "back", "fade"));
  const sig = $("#screen-" + nombre);
  if (efecto) sig.classList.add(efecto);
  sig.classList.add("active");
  window.scrollTo(0, 0);
  document.querySelector(".phone").scrollTop = 0;
  const render = { home: renderInicio, transfer: renderContactos, "new-account": resetNueva, amount: renderMonto,
                   confirm: renderConfirmar, receive: renderRecibir, profile: renderPerfil }[nombre];
  if (render) render();
}
function atras() { ir(historial.pop() || "home", { reemplazar: true, efecto: "back" }); }
function inicio() { historial = []; ir("home", { reemplazar: true, efecto: "back" }); }

/* ---------- Inicio ---------- */
function renderInicio() {
  $("#acc-name").textContent = estado.cuentaAlias;
  $("#acc-mask").textContent = "******" + estado.cuentaNumero.slice(-4);
  $("#balance").textContent = saldoVisible ? dinero(estado.saldo) : "$ ••••";
  const ul = $("#movements");
  const movs = [...estado.movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 6);
  ul.innerHTML = movs.length ? movs.map((m) => `
    <li>
      ${m.foto !== undefined || m.tipo === "out" ? avatarHTML({ nombre: m.titulo, foto: m.foto }) : `<div class="avatar" style="background:#dcfce7;color:#166534">+</div>`}
      <div class="mv-info">
        <div class="mv-title">${escapar(m.titulo)}</div>
        <div class="small muted">${new Date(m.fecha).toLocaleDateString("es-EC", { day: "2-digit", month: "short" })}</div>
      </div>
      <div class="mv-amt ${m.tipo === "out" ? "neg" : "pos"}">${m.tipo === "out" ? "-" : "+"}${dinero(m.monto)}</div>
    </li>`).join("") : `<li class="empty">Aún no tienes movimientos</li>`;
}

/* ---------- Transferir a: lista de contactos ---------- */
function renderContactos() {
  const q = $("#search-contact").value;
  const nq = normalizar(q);
  const lista = estado.contactos
    .filter((c) => !nq || normalizar(c.alias + " " + c.nombre + " " + c.cuenta).includes(nq))
    .sort((a, b) => (a.alias || a.nombre).localeCompare(b.alias || b.nombre, "es"));

  if (!lista.length) {
    $("#contact-list").innerHTML = `<p class="empty">No se encontró "${escapar(q)}".<br><span class="link" data-go="new-account">Agregar como nueva cuenta</span></p>`;
    return;
  }
  let html = "", letra = "";
  for (const c of lista) {
    const l = normalizar(c.alias || c.nombre)[0].toUpperCase();
    if (l !== letra) { letra = l; html += `<div class="letter">${l}</div>`; }
    html += `
      <button class="contact" data-id="${c.id}">
        ${avatarHTML(c)}
        <div class="c-info">
          <div class="c-alias">${resaltar(c.alias || c.nombre, q)}</div>
          <div class="c-name">${resaltar(c.nombre, q)}</div>
          <div class="c-acc">${escapar(c.tipo)} | ${resaltar(c.cuenta, q)}</div>
          <span class="bank-chip"><i></i>${escapar(c.banco)}</span>
        </div>
        <svg class="c-icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="13" rx="2"/><path d="M8 9h8M8 12h5M8 17l-2 3"/></svg>
      </button>`;
  }
  $("#contact-list").innerHTML = html;
}

/* ---------- Nueva cuenta: foto al escribir el nombre ---------- */
function resetNueva() {
  $("#form-new").reset();
  actualizarVistaPrevia.ultima = null;
  fotoSubida = null;
  actualizarVistaPrevia();
}
function buscarEnDirectorio(texto) {
  const n = normalizar(texto);
  if (n.length < 2) return [];
  return DIRECTORIO.filter((p) => normalizar(p.nombre).split(" ").some((w) => w.startsWith(n)) || normalizar(p.nombre).includes(n));
}
function actualizarVistaPrevia() {
  const nombre = $("#new-name").value.trim();
  const coincidencias = buscarEnDirectorio(nombre);
  const exacta = DIRECTORIO.find((p) => normalizar(p.nombre) === normalizar(nombre))
              || (coincidencias.length === 1 ? coincidencias[0] : null);

  const foto = fotoSubida || exacta?.foto || null;
  const box = $("#new-avatar");
  const htmlNuevo = nombre
    ? avatarHTML({ nombre: exacta?.nombre || nombre, foto }, "avatar-xl")
    : `<div class="avatar avatar-xl"><span>?</span></div>`;
  const clave = nombre ? (foto || iniciales(exacta?.nombre || nombre)) : "";
  if (actualizarVistaPrevia.ultima !== clave) {   // solo animar cuando cambia la foto
    actualizarVistaPrevia.ultima = clave;
    box.outerHTML = htmlNuevo.replace('class="avatar', 'id="new-avatar" class="avatar pop');
  }
  $("#new-preview-name").textContent = nombre ? (exacta?.nombre || nombre) : "Escribe el nombre del destinatario";
  $("#new-preview-sub").textContent = !nombre ? "La foto aparecerá automáticamente"
    : exacta ? `${exacta.banco} · ${exacta.tipo} ${enmascarar(exacta.cuenta)}`
    : "Usuario no registrado: se mostrarán sus iniciales";

  // Sugerencias con foto mientras escribe
  const sug = coincidencias.filter((p) => normalizar(p.nombre) !== normalizar(nombre)).slice(0, 4);
  $("#new-suggest").innerHTML = sug.map((p, i) =>
    `<button type="button" data-sug="${DIRECTORIO.indexOf(p)}">${avatarHTML(p)}<span><b>${resaltar(p.nombre, nombre)}</b><br><span class="muted">${escapar(p.banco)}</span></span></button>`
  ).join("");
}
function elegirSugerencia(idx) {
  const p = DIRECTORIO[idx];
  $("#new-name").value = p.nombre;
  $("#new-bank").value = p.banco;
  $("#new-type").value = p.tipo;
  $("#new-number").value = p.cuenta;
  actualizarVistaPrevia();
}

/* ---------- Monto ---------- */
function renderMonto() {
  const c = destinatario;
  $("#amount-recipient").innerHTML = `${avatarHTML(c)}
    <div class="c-info"><div class="c-alias">${escapar(c.nombre)}</div>
    <div class="c-acc">${escapar(c.tipo)} | ${escapar(c.cuenta)}</div>
    <span class="bank-chip"><i></i>${escapar(c.banco)}</span></div>`;
  $("#amount-balance").textContent = dinero(estado.saldo);
  $("#amount-error").textContent = "";
  centavos = 0;
  $("#amount").value = dinero(0);
  $("#description").value = "";
  setTimeout(() => $("#amount").focus(), 300);
}

/* ---------- Confirmar ---------- */
function renderConfirmar() {
  const c = destinatario;
  $("#confirm-box").innerHTML = `
    ${avatarHTML(c, "avatar-xl")}
    <div class="big">${dinero(transferencia.monto)}</div>
    <div class="c-alias">A ${escapar(c.nombre)}</div>
    <div class="small muted">${escapar(c.banco)} · ${escapar(c.tipo)} ${enmascarar(c.cuenta)}</div>
    <div class="small muted">Desde ${escapar(estado.cuentaAlias)} ${enmascarar(estado.cuentaNumero)}</div>
    ${transferencia.descripcion ? `<div class="small">"${escapar(transferencia.descripcion)}"</div>` : ""}`;
}
function ejecutarTransferencia() {
  const ahora = new Date();
  const comprobante = String(Math.floor(100000000 + Math.random() * 900000000));
  estado.saldo = Math.round((estado.saldo - transferencia.monto) * 100) / 100;
  estado.movimientos.push({
    tipo: "out", titulo: "Transferencia a " + destinatario.nombre, monto: transferencia.monto,
    fecha: ahora.toISOString(), foto: destinatario.foto || null,
  });
  guardar();
  renderComprobante(ahora, comprobante);
  historial = [];
  ir("receipt", { reemplazar: true, efecto: "fade" });
}

/* ---------- Comprobante (con la foto del destinatario) ---------- */
function renderComprobante(fecha, numero) {
  const c = destinatario;
  $("#r-amount").textContent = dinero(transferencia.monto).replace("$", "$ ");
  $("#r-to").textContent = "A " + apellidosPrimero(c.nombre);
  $("#r-date").textContent = "El " + fechaLarga(fecha);
  $("#r-from").textContent = "De " + estado.usuario;
  $("#r-dest").textContent = enmascarar(c.cuenta);
  $("#r-bank").textContent = c.banco;
  $("#r-origin").textContent = enmascarar(estado.cuentaNumero);
  $("#r-number").textContent = numero;
  $("#r-desc-row").style.display = transferencia.descripcion ? "" : "none";
  $("#r-desc").textContent = transferencia.descripcion;
  dibujarQR("#r-qr", `DEMO|Comprobante ${numero}|${dinero(transferencia.monto)}|${c.nombre}|${fecha.toISOString()}`);
  renderComprobante.texto =
    `Comprobante (DEMO) N° ${numero}\n${dinero(transferencia.monto)} a ${c.nombre}\n${fechaLarga(fecha)}\nBanco destino: ${c.banco}`;
}
// Como en los comprobantes reales: "Apellido Apellido Nombre(s)"
function apellidosPrimero(nombre) {
  const p = nombre.trim().split(/\s+/);
  if (p.length < 3) return nombre;
  return [...p.slice(-2), ...p.slice(0, -2)].join(" ");
}
function dibujarQR(sel, texto) {
  const el = $(sel);
  el.innerHTML = "";
  if (window.QRCode) new QRCode(el, { text: texto.normalize("NFD").replace(/[^\x20-\x7e]/g, ""), width: 300, height: 300, correctLevel: QRCode.CorrectLevel.L });
  else el.innerHTML = `<p class="small muted">(QR no disponible sin internet)</p>`;
}
async function compartir() {
  const texto = renderComprobante.texto || "";
  try {
    if (navigator.share) { await navigator.share({ title: "Comprobante", text: texto }); return; }
    await navigator.clipboard.writeText(texto);
    toast("Comprobante copiado al portapapeles");
  } catch (e) { toast("No se pudo compartir"); }
}

/* ---------- Recibir y Perfil ---------- */
function renderRecibir() {
  $("#rcv-name").textContent = estado.usuario;
  $("#rcv-acc").textContent = "Cta. Ahorro " + estado.cuentaNumero;
  dibujarQR("#my-qr", `DEMO|${estado.usuario}|${estado.cuentaNumero}|Banco Andino`);
}
function renderPerfil() {
  $("#p-name").value = estado.usuario;
  $("#p-balance").value = estado.saldo.toFixed(2).replace(".", ",");
}

/* ===================== Eventos ===================== */
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-go],[data-back],[data-home],[data-toast],[data-id],[data-sug],.chip");
  if (!t) return;
  if (t.dataset.go) { e.preventDefault(); ir(t.dataset.go); }
  else if (t.hasAttribute("data-back")) atras();
  else if (t.hasAttribute("data-home")) inicio();
  else if (t.dataset.toast) { e.preventDefault(); toast(t.dataset.toast); }
  else if (t.dataset.id) { destinatario = estado.contactos.find((c) => c.id == t.dataset.id); ir("amount"); }
  else if (t.dataset.sug !== undefined) elegirSugerencia(+t.dataset.sug);
  else if (t.classList.contains("chip")) {
    document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
    t.classList.add("active");
  }
});

async function entrar() {
  historial = [];
  ir("home", { reemplazar: true, efecto: "fade" });
  const card = $("#account-card");
  card.classList.add("skeleton");
  await esperar(700);
  card.classList.remove("skeleton");
}
$("#form-login").addEventListener("submit", async (e) => {
  e.preventDefault();
  const b = $("#btn-login");
  b.classList.add("loading");
  await esperar(1100);
  b.classList.remove("loading");
  $("#login-pass").value = "";
  entrar();
});
$("#btn-bio").addEventListener("click", async () => {
  await procesando("Coloca tu dedo en el lector", 1300);
  vibrar(30);
  entrar();
});
$("#toggle-pass").addEventListener("click", () => {
  const i = $("#login-pass");
  i.type = i.type === "password" ? "text" : "password";
});
$("#login-hello").textContent = "¡Hola, " + estado.usuario.split(" ")[0] + "!";

// Pantalla de carga al abrir la app
window.addEventListener("load", () => setTimeout(() => $("#splash").classList.add("hide"), 1200));

// Instalable como app (PWA)
if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
$("#toggle-balance").addEventListener("click", () => { saldoVisible = !saldoVisible; renderInicio(); });
$("#search-contact").addEventListener("input", renderContactos);

$("#new-name").addEventListener("input", actualizarVistaPrevia);
$("#new-photo").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) { fotoSubida = null; actualizarVistaPrevia(); return; }
  // Reducimos la imagen para que quepa en localStorage
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas"), s = 200;
    c.width = c.height = s;
    const m = Math.min(img.width, img.height);
    c.getContext("2d").drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
    fotoSubida = c.toDataURL("image/jpeg", 0.8);
    URL.revokeObjectURL(img.src);
    actualizarVistaPrevia();
  };
  img.src = URL.createObjectURL(f);
});
$("#form-new").addEventListener("submit", (e) => {
  e.preventDefault();
  const nombre = $("#new-name").value.trim();
  const reg = DIRECTORIO.find((p) => normalizar(p.nombre) === normalizar(nombre));
  const nuevo = {
    id: Date.now(),
    nombre,
    alias: $("#new-alias").value.trim() || nombre.split(" ")[0],
    banco: $("#new-bank").value,
    tipo: $("#new-type").value,
    cuenta: $("#new-number").value.trim(),
    foto: fotoSubida || reg?.foto || null,
  };
  estado.contactos.push(nuevo);
  guardar();
  destinatario = nuevo;
  toast("Contacto guardado");
  ir("amount", { reemplazar: true });
});

// Monto estilo app bancaria: escribes 3-1-5 y se ve $3,15
function pintarMonto() {
  const el = $("#amount");
  el.value = dinero(centavos / 100);
  requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length));
  $("#amount-error").textContent = "";
}
$("#amount").addEventListener("beforeinput", (e) => {
  e.preventDefault();                               // nosotros controlamos el texto
  if (e.inputType.startsWith("delete")) centavos = Math.floor(centavos / 10);
  else if (/^\d+$/.test(e.data || "")) centavos = Math.min(+(String(centavos) + e.data), 9999999);
  pintarMonto();
});
$("#amount").addEventListener("input", pintarMonto); // por si algún teclado no envía beforeinput
$("#amount").addEventListener("focus", pintarMonto);
document.querySelectorAll("[data-monto]").forEach((b) =>
  b.addEventListener("click", () => { centavos = +b.dataset.monto * 100; pintarMonto(); vibrar(); }));
$("#form-amount").addEventListener("submit", (e) => {
  e.preventDefault();
  const monto = centavos / 100;
  if (monto <= 0) return ($("#amount-error").textContent = "Ingresa un monto válido");
  if (monto > estado.saldo) return ($("#amount-error").textContent = "Saldo insuficiente");
  transferencia = { monto, descripcion: $("#description").value.trim() };
  ir("confirm");
});
$("#btn-confirm").addEventListener("click", abrirClave);

/* ---------- Clave de seguridad + procesando ---------- */
function abrirClave() { pin = ""; pintarPin(); $("#pin-error").textContent = ""; $("#pin-sheet").classList.add("open"); }
function cerrarClave() { $("#pin-sheet").classList.remove("open"); }
function pintarPin() { document.querySelectorAll("#pin-dots i").forEach((d, i) => d.classList.toggle("on", i < pin.length)); }
$("#pin-sheet").addEventListener("click", (e) => { if (e.target.id === "pin-sheet") cerrarClave(); });
$("#keypad").addEventListener("click", async (e) => {
  const b = e.target.closest("button");
  if (!b || pin.length >= 6 && !b.dataset.k) return;
  vibrar();
  if (b.dataset.k === "cancel") return cerrarClave();
  if (b.dataset.k === "del") { pin = pin.slice(0, -1); return pintarPin(); }
  pin += b.textContent.trim();
  pintarPin();
  if (pin.length === 6) {
    await esperar(250);
    cerrarClave();
    await procesando("Estamos procesando tu transferencia", 1800);
    vibrar(30);
    ejecutarTransferencia();
  }
});
async function procesando(texto, ms) {
  $("#processing-text").textContent = texto;
  $("#processing").classList.add("show");
  await esperar(ms);
  $("#processing").classList.remove("show");
}
$("#btn-share").addEventListener("click", compartir);
$("#btn-copy").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(`${estado.usuario}\nCta. Ahorro ${estado.cuentaNumero}\nBanco Andino`); toast("Datos copiados"); }
  catch (e) { toast("No se pudo copiar"); }
});

$("#form-profile").addEventListener("submit", (e) => {
  e.preventDefault();
  estado.usuario = $("#p-name").value.trim() || estado.usuario;
  estado.saldo = leerMonto($("#p-balance").value);
  guardar(); toast("Perfil actualizado"); inicio();
});
$("#btn-reset").addEventListener("click", () => {
  estado = structuredClone(ESTADO_INICIAL); guardar(); toast("Datos restablecidos"); inicio();
});
$("#btn-logout").addEventListener("click", () => { historial = []; ir("login", { reemplazar: true, efecto: "back" }); });
