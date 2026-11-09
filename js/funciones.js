/* ===================== Funciones adicionales =====================
 * Carruseles deslizables, notificaciones, pestañas (Productos, Solicitudes,
 * Beneficios), QR con cámara, pago de servicios, recargas y retiro sin tarjeta.
 */

/* ---------- Hojas inferiores (bottom sheets) ---------- */
function abrirHoja(id) {
  if (id === "sheet-datos") renderPerfil();
  $("#" + id).classList.add("open");
}
function cerrarHoja(id) { $("#" + id).classList.remove("open"); }
document.querySelectorAll(".sheet-backdrop").forEach((b) =>
  b.addEventListener("click", (e) => { if (e.target === b && b.id !== "pin-sheet") cerrarHoja(b.id); }));

// Deslizar la hoja hacia abajo para cerrarla
document.querySelectorAll(".sheet").forEach((sh) => {
  let y0 = null, dy = 0;
  sh.addEventListener("touchstart", (e) => { if (sh.scrollTop <= 0) { y0 = e.touches[0].clientY; dy = 0; sh.style.transition = "none"; } }, { passive: true });
  sh.addEventListener("touchmove", (e) => {
    if (y0 === null) return;
    dy = Math.max(0, e.touches[0].clientY - y0);
    sh.style.transform = `translateY(${dy}px)`;
  }, { passive: true });
  sh.addEventListener("touchend", () => {
    if (y0 === null) return;
    sh.style.transition = ""; sh.style.transform = "";
    if (dy > 90) cerrarHoja(sh.parentNode.id);
    y0 = null;
  });
});

/* ---------- Carrusel de promociones (se desliza solo) ---------- */
(function promo() {
  const c = $("#promo-carousel"), dots = [...document.querySelectorAll("#promo-dots i")];
  let i = 0, pausa = false;
  const marcar = () => {
    i = Math.round(c.scrollLeft / c.clientWidth);
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
  };
  c.addEventListener("scroll", () => { clearTimeout(c._t); c._t = setTimeout(marcar, 60); }, { passive: true });
  c.addEventListener("touchstart", () => (pausa = true), { passive: true });
  c.addEventListener("touchend", () => setTimeout(() => (pausa = false), 4000));
  dots.forEach((d, k) => d.addEventListener("click", () => c.scrollTo({ left: k * c.clientWidth, behavior: "smooth" })));
  setInterval(() => {
    if (pausa || !$("#screen-home").classList.contains("active")) return;
    const sig = (i + 1) % dots.length;
    c.scrollTo({ left: sig * c.clientWidth, behavior: "smooth" });
  }, 4500);
})();

/* ---------- Carrusel de productos: "1 de 3" ---------- */
$("#products-track").addEventListener("scroll", (e) => {
  const t = e.target, n = t.children.length;
  const k = Math.round(t.scrollLeft / (t.firstElementChild?.offsetWidth + 12 || 1));
  $("#products-pager").textContent = `${Math.min(k + 1, n)} de ${n}`;
}, { passive: true });

/* ---------- Notificaciones ---------- */
$("#btn-notif").addEventListener("click", () => {
  const lista = [...estado.notificaciones].sort((a, b) => b.fecha.localeCompare(a.fecha));
  $("#notif-list").innerHTML = lista.map((n) => `
    <li class="${n.leida ? "" : "unread"}">
      <span class="n-ico">${n.icono}</span>
      <div><b>${escapar(n.titulo)}</b><p class="small muted">${escapar(n.texto)}</p>
      <span class="small muted">${new Date(n.fecha).toLocaleDateString("es-EC", { day: "2-digit", month: "short" })}</span></div>
    </li>`).join("") || `<li class="empty">No tienes notificaciones</li>`;
  abrirHoja("sheet-notif");
  estado.notificaciones.forEach((n) => (n.leida = true));
  guardar();
  setTimeout(renderInicio, 400);
});
function notificar(icono, titulo, texto) {
  estado.notificaciones.push({ icono, titulo, texto, fecha: new Date().toISOString(), leida: false });
  guardar();
}

/* ---------- Pestaña Productos ---------- */
let filtroMov = "all";
function renderProductos() {
  $("#products-list").innerHTML = productos().filter((p) => p.cat === "Cuentas").map(tarjetaProducto).join("");
  $("#dc-name").textContent = estado.usuario.toUpperCase();
  $("#debit-card").classList.toggle("locked", estado.tarjetaBloqueada);
  $("#sw-lock").checked = estado.tarjetaBloqueada;
  const movs = [...estado.movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha))
    .filter((m) => filtroMov === "all" || m.tipo === filtroMov);
  $("#all-movements").innerHTML = movs.map(itemMovimiento).join("") || `<li class="empty">Sin movimientos</li>`;
}
$("#mov-filter").addEventListener("click", (e) => {
  const b = e.target.closest("[data-f]"); if (!b) return;
  filtroMov = b.dataset.f; setTimeout(renderProductos);
});
$("#sw-lock").addEventListener("change", (e) => {
  estado.tarjetaBloqueada = e.target.checked; guardar(); vibrar(20);
  $("#debit-card").classList.toggle("locked", estado.tarjetaBloqueada);
  toast(estado.tarjetaBloqueada ? "Tarjeta bloqueada temporalmente" : "Tarjeta desbloqueada");
});
// Mostrar/ocultar saldo también en la pestaña Productos
$("#products-list").addEventListener("click", (e) => { if (e.target.closest("[data-eye]")) setTimeout(renderProductos); });

/* ---------- Pestaña Solicitudes ---------- */
function renderSolicitudes() {
  const l = [...estado.solicitudes].sort((a, b) => b.fecha.localeCompare(a.fecha));
  $("#req-list").innerHTML = l.map((r) => `
    <li><div class="avatar req-avatar">📝</div>
      <div class="mv-info"><div class="mv-title">${escapar(r.nombre)}</div>
      <div class="small muted">${new Date(r.fecha).toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })}</div></div>
      <span class="status ${r.estado === "Aprobada" ? "ok" : ""}">${r.estado}</span></li>`).join("")
    || `<li class="empty">Aún no tienes solicitudes</li>`;
}
document.querySelectorAll("[data-req]").forEach((b) => b.addEventListener("click", async () => {
  await procesando("Enviando tu solicitud", 1200);
  estado.solicitudes.push({ nombre: b.dataset.req, fecha: new Date().toISOString(), estado: "En revisión" });
  notificar("📝", "Solicitud recibida", `Tu solicitud de ${b.dataset.req} está en revisión.`);
  renderSolicitudes(); renderInicio();
  toast("¡Solicitud enviada! Te contactaremos pronto");
}));

/* ---------- Pestaña Beneficios: filtro ---------- */
$("#benefit-filter").addEventListener("click", (e) => {
  const b = e.target.closest("[data-b]"); if (!b) return;
  document.querySelectorAll(".benefit").forEach((x) => (x.hidden = b.dataset.b !== "all" && x.dataset.cat !== b.dataset.b));
});

/* ---------- Escanear o mostrar QR ---------- */
let stream = null, escaneando = false;
function abrirQR() { cambiarQR("scan"); }
function cambiarQR(tab) {
  document.querySelectorAll("[data-qrtab]").forEach((b) => b.classList.toggle("on", b.dataset.qrtab === tab));
  $("#qr-scan").hidden = tab !== "scan";
  $("#qr-show").hidden = tab !== "show";
  if (tab === "scan") iniciarCamara();
  else {
    detenerCamara();
    $("#myqr-name").textContent = estado.usuario;
    $("#myqr-acc").textContent = "Cta. Ahorro " + enmascarar(estado.cuentaNumero);
    dibujarQR("#myqr", `DEMO|${estado.usuario}|${estado.cuentaNumero}|Banco Andino`);
  }
}
document.querySelectorAll("[data-qrtab]").forEach((b) => b.addEventListener("click", () => cambiarQR(b.dataset.qrtab)));
async function iniciarCamara() {
  const msg = $("#scan-msg");
  if (!navigator.mediaDevices?.getUserMedia) { msg.textContent = "Tu navegador no permite usar la cámara"; return; }
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (!$("#screen-qr").classList.contains("active")) return detenerCamara();
    const v = $("#qr-video");
    v.srcObject = stream; await v.play();
    msg.textContent = "Apunta la cámara al código QR";
    escaneando = true; leerCuadro();
  } catch (e) {
    msg.textContent = "No se pudo abrir la cámara. Usa \"Simular escaneo\".";
  }
}
function detenerCamara() {
  escaneando = false;
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}
function leerCuadro() {
  if (!escaneando) return;
  const v = $("#qr-video");
  if (v.readyState >= 2 && window.jsQR) {
    const c = leerCuadro.c || (leerCuadro.c = document.createElement("canvas"));
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(v, 0, 0);
    const r = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
    if (r && r.data) return qrLeido(r.data);
  }
  requestAnimationFrame(leerCuadro);
}
function qrLeido(texto) {
  detenerCamara(); vibrar(40);
  const p = texto.split("|");
  if (p[0] === "DEMO" && p.length === 4) {      // QR de "Mi QR" de otra persona
    const reg = DIRECTORIO.find((d) => normalizar(d.nombre) === normalizar(p[1]));
    destinatario = { nombre: p[1], cuenta: p[2], banco: p[3], tipo: "Cta. Ahorro", foto: reg?.foto || null };
  } else {
    destinatario = { ...COMERCIO_DEMO };
  }
  toast("QR leído");
  ir("amount", { reemplazar: true });
}
$("#btn-sim-scan").addEventListener("click", () => qrLeido("COMERCIO"));

/* ---------- Pagar servicios ---------- */
let servicio = null, deuda = 0;
function renderServicios() {
  const q = normalizar($("#search-service").value);
  $("#service-list").innerHTML = SERVICIOS.filter((x) => !q || normalizar(x.nombre + " " + x.cat).includes(q))
    .map((x) => `<button class="contact" data-serv="${SERVICIOS.indexOf(x)}">
        <span class="avatar serv-ico" style="background:${x.color}">${x.icono}</span>
        <div class="c-info"><div class="c-alias">${resaltar(x.nombre, $("#search-service").value)}</div><div class="c-name">${x.cat}</div></div>
        <span class="chev">›</span></button>`).join("") || `<p class="empty">No encontramos esa empresa</p>`;
}
$("#search-service").addEventListener("input", renderServicios);
$("#service-list").addEventListener("click", (e) => {
  const b = e.target.closest("[data-serv]"); if (!b) return;
  servicio = SERVICIOS[+b.dataset.serv];
  $("#sp-title").textContent = servicio.cat;
  $("#sp-head").innerHTML = `<span class="avatar serv-ico" style="background:${servicio.color}">${servicio.icono}</span>
    <div class="c-info"><div class="c-alias">${servicio.nombre}</div><div class="c-acc">${servicio.cat}</div></div>`;
  $("#form-service").reset(); $("#form-service").hidden = false; $("#sp-result").hidden = true;
  ir("service-pay");
});
$("#form-service").addEventListener("submit", async (e) => {
  e.preventDefault();
  const code = $("#sp-code").value.trim();
  const b = $("#btn-sp-query"); b.classList.add("loading"); await esperar(1000); b.classList.remove("loading");
  // Valor "consultado": depende del código para que siempre salga igual
  let h = 0; for (const ch of code) h = (h * 31 + ch.charCodeAt(0)) % 9973;
  deuda = Math.round((8 + (h % 6200) / 100) * 100) / 100;
  const mes = new Date().toLocaleDateString("es-EC", { month: "long", year: "numeric" });
  $("#sp-amount").textContent = dinero(deuda);
  $("#sp-details").innerHTML = [["Titular", estado.usuario], ["Contrato", code], ["Periodo", mes], ["Vence", "15 de " + mes.split(" ")[0]]]
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${escapar(v)}</dd></div>`).join("");
  $("#sp-error").textContent = "";
  $("#form-service").hidden = true; $("#sp-result").hidden = false;
});
$("#btn-sp-pay").addEventListener("click", () => {
  if (deuda > estado.saldo) return ($("#sp-error").textContent = "Saldo insuficiente");
  const code = $("#sp-code").value.trim();
  pedirClave(() => finalizarOperacion({
    monto: deuda, titulo: "¡Pago exitoso!", linea: servicio.nombre, movimiento: "Pago " + servicio.nombre,
    detalles: [["Servicio", servicio.cat], ["Contrato", code], ["Cuenta origen", enmascarar(estado.cuentaNumero)]],
    otraVez: ["services", "Pagar otro<br>servicio"],
  }));
});

/* ---------- Recargas ---------- */
let montoRecarga = 5;
function resetRecarga() { $("#rc-error").textContent = ""; }
$("#rc-amounts").addEventListener("click", (e) => {
  const b = e.target.closest("[data-v]"); if (!b) return;
  $("#rc-amounts").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
  b.classList.add("on"); montoRecarga = +b.dataset.v; vibrar();
});
$("#rc-number").addEventListener("input", (e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10)));
$("#form-recharge").addEventListener("submit", (e) => {
  e.preventDefault();
  const num = $("#rc-number").value;
  if (!/^09\d{8}$/.test(num)) return ($("#rc-error").textContent = "Ingresa un número válido (09XXXXXXXX)");
  if (montoRecarga > estado.saldo) return ($("#rc-error").textContent = "Saldo insuficiente");
  const op = $("#rc-ops .chip.active").textContent;
  pedirClave(() => finalizarOperacion({
    monto: montoRecarga, titulo: "¡Recarga exitosa!", linea: `${op} · ${num.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")}`,
    movimiento: `Recarga ${op} ${num}`,
    detalles: [["Operadora", op], ["Número", num], ["Cuenta origen", enmascarar(estado.cuentaNumero)]],
    otraVez: ["recharge", "Hacer otra<br>recarga"],
  }));
});

/* ---------- Retiro sin tarjeta ---------- */
let montoRetiro = 20, relojRetiro = null;
function resetRetiro() {
  $("#wd-form").hidden = false; $("#wd-result").hidden = true; $("#wd-error").textContent = "";
  clearInterval(relojRetiro);
}
$("#wd-amounts").addEventListener("click", (e) => {
  const b = e.target.closest("[data-v]"); if (!b) return;
  $("#wd-amounts").querySelectorAll("button").forEach((x) => x.classList.remove("on"));
  b.classList.add("on"); montoRetiro = +b.dataset.v; vibrar();
});
$("#btn-wd").addEventListener("click", () => {
  if (montoRetiro > estado.saldo) return ($("#wd-error").textContent = "Saldo insuficiente");
  pedirClave(() => {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    estado.saldo = Math.round((estado.saldo - montoRetiro) * 100) / 100;
    estado.movimientos.push({ tipo: "out", titulo: "Retiro sin tarjeta", monto: montoRetiro, fecha: new Date().toISOString() });
    guardar();
    $("#wd-code").textContent = codigo.replace(/(\d{3})(\d{3})/, "$1 $2");
    $("#wd-amount").textContent = dinero(montoRetiro);
    $("#wd-form").hidden = true; $("#wd-result").hidden = false;
    let seg = 30 * 60;
    clearInterval(relojRetiro);
    relojRetiro = setInterval(() => {
      seg--; $("#wd-timer").textContent = `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
      if (seg <= 0) clearInterval(relojRetiro);
    }, 1000);
  });
});

/* ---------- Ajustes de perfil ---------- */
$("#sw-push").addEventListener("change", (e) => toast(e.target.checked ? "Notificaciones activadas" : "Notificaciones desactivadas"));
$("#sw-bio").addEventListener("change", (e) => {
  $("#btn-bio").hidden = !e.target.checked;
  toast(e.target.checked ? "Ingreso con huella activado" : "Ingreso con huella desactivado");
});

/* ---------- En computadora: el marco del celular se ajusta a la altura de la pantalla ---------- */
function ajustarMarco() {
  const ph = document.querySelector(".phone");
  ph.style.zoom = innerWidth >= 600 ? Math.min(1, (innerHeight - 24) / 884) : "";
}
addEventListener("resize", ajustarMarco);
ajustarMarco();
