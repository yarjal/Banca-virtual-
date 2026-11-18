/* ===================== Pantallas estilo app real =====================
 * Teclado numérico propio, "Desliza para transferir", transferir entre mis
 * cuentas, retiro sin tarjeta, pagar tarjetas, montos máximos, bienvenida
 * y carrusel de productos con flechas.
 */

const CUENTAS = {
  saldo:  () => ({ alias: estado.cuentaAlias, numero: estado.cuentaNumero, tipo: "Transaccional", saldo: estado.saldo }),
  ahorro: () => ({ alias: "AHORRO" + estado.ahorroNumero.slice(-4), numero: estado.ahorroNumero, tipo: "Ahorros", saldo: estado.ahorro }),
};
const numeroCuenta = (k) => CUENTAS[k || "saldo"]().numero;

/* ---------- Teclado numérico de la app ---------- */
// Devuelve un objeto con el texto del monto ("150.5") y lo pinta en pantalla
function crearMonto(displaySel, padSel, { decimales = true, max = 99999 } = {}) {
  const m = { txt: "", onChange: null };
  m.valor = () => +m.txt || 0;
  m.pintar = () => {
    const el = $(displaySel + " .amt-val");
    el.textContent = "$ " + (m.txt || "0");
    $(displaySel).classList.toggle("empty", !m.txt);
    el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
    if (m.onChange) m.onChange();
  };
  m.reset = () => { m.txt = ""; m.pintar(); };
  $(padSel).addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    vibrar();
    const k = b.dataset.k || b.textContent.trim();
    let t = m.txt;
    if (k === "del") t = t.slice(0, -1);
    else if (k === ".") { if (!decimales || !k || t.includes(".")) return; t = (t || "0") + "."; }
    else if (/^\d$/.test(k)) {
      if (t.includes(".") && t.split(".")[1].length >= 2) return;
      t = t === "0" ? k : t + k;
      if (+t > max) return sacudir(displaySel);
    } else return;
    m.txt = t; m.pintar();
  });
  return m;
}
function sacudir(sel) { const e = $(sel); e.classList.remove("shake"); void e.offsetWidth; e.classList.add("shake"); vibrar(40); }

/* ---------- "Desliza para transferir" ---------- */
function crearDeslizador(sel, alCompletar) {
  const root = $(sel), knob = root.querySelector(".slide-knob"), fill = root.querySelector(".slide-fill");
  let x0 = null, x = 0, maxX = 0, listo = false;
  const poner = (v, anim) => {
    knob.style.transition = fill.style.transition = anim ? "transform .3s cubic-bezier(.2,.8,.2,1), width .3s" : "none";
    knob.style.transform = `translateX(${v}px)`;
    fill.style.width = `${v + knob.offsetWidth / 2 + 4}px`;
    root.querySelector(".slide-text").style.opacity = 1 - v / (maxX || 1);
  };
  const reiniciar = () => { listo = false; x = 0; root.classList.remove("done"); poner(0, true); };
  knob.addEventListener("pointerdown", (e) => {
    if (listo) return;
    maxX = root.clientWidth - knob.offsetWidth - 8;
    x0 = e.clientX - x; knob.setPointerCapture(e.pointerId);
  });
  knob.addEventListener("pointermove", (e) => {
    if (x0 === null) return;
    x = Math.max(0, Math.min(maxX, e.clientX - x0)); poner(x);
  });
  const soltar = async () => {
    if (x0 === null) return;
    x0 = null;
    if (x > maxX * 0.85) {
      listo = true; poner(maxX, true); root.classList.add("done"); vibrar(30);
      const ok = await alCompletar();
      if (ok === false) setTimeout(reiniciar, 250);
    } else { x = 0; poner(0, true); }
  };
  knob.addEventListener("pointerup", soltar);
  knob.addEventListener("pointercancel", soltar);
  // Accesible con teclado: Enter sobre el botón
  knob.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter" || listo) return;
    maxX = root.clientWidth - knob.offsetWidth - 8;
    listo = true; poner(maxX, true); root.classList.add("done");
    if ((await alCompletar()) === false) setTimeout(reiniciar, 250);
  });
  return { reiniciar };
}

/* ---------- Transferir a un contacto ---------- */
let cuentaOrigen = "saldo";
const montoTr = crearMonto("#amt-display", "#np-amount");
const costoDe = (c) => (c && c.banco !== "Banco Andino" ? 0.41 : 0);
function pintarOrigen() {
  const a = CUENTAS[cuentaOrigen]();
  $("#amt-from").innerHTML = `<span class="small muted">Desde</span><b>${a.alias}</b><span class="small muted">${a.tipo} · ${saldoVisible ? dinero(a.saldo) : "$ ••••"}</span><span class="chev-d">⌄</span>`;
}
function renderMonto() {
  const c = destinatario;
  $("#amount-recipient").innerHTML = `${avatarHTML(c)}
    <div class="c-info"><span class="small muted">Para</span><div class="c-alias">${escapar(c.nombre)}</div>
    <div class="c-acc">${escapar(c.tipo)} ${enmascarar(c.cuenta)} · ${escapar(c.banco)}</div></div>`;
  cuentaOrigen = "saldo";
  pintarOrigen();
  $("#description").value = ""; $("#description").hidden = true; $("#btn-motivo").hidden = false;
  const costo = costoDe(c);
  $("#amt-cost").innerHTML = costo ? `<span class="i-dot">i</span> Esta transferencia tiene un costo de ${dinero(costo)}`
                                   : `<span class="i-dot">i</span> Transferencia sin costo`;
  $("#amount-error").textContent = "";
  montoTr.reset(); deslizadorTr.reiniciar();
}
$("#amt-from").addEventListener("click", () => {
  cuentaOrigen = cuentaOrigen === "saldo" ? "ahorro" : "saldo"; pintarOrigen(); vibrar();
  toast("Debitar desde " + CUENTAS[cuentaOrigen]().alias);
});
$("#btn-motivo").addEventListener("click", () => { $("#btn-motivo").hidden = true; $("#description").hidden = false; $("#description").focus(); });
montoTr.onChange = () => ($("#amount-error").textContent = "");
function validarMonto(monto, cuenta, errSel, costo = 0) {
  const lim = estado.limites;
  if (monto <= 0) return ($(errSel).textContent = "Ingresa un monto"), false;
  if (monto + costo > CUENTAS[cuenta]().saldo) return ($(errSel).textContent = "Saldo insuficiente"), false;
  if (lim.movilOn && monto > lim.movil) return ($(errSel).textContent = `Superas tu monto máximo diario (${dinero(lim.movil)})`), false;
  return true;
}
const deslizadorTr = crearDeslizador("#slide-amount", () => {
  const monto = montoTr.valor(), costo = costoDe(destinatario);
  if (!validarMonto(monto, cuentaOrigen, "#amount-error", costo)) { sacudir("#amt-display"); return false; }
  transferencia = { monto, costo, desde: cuentaOrigen, descripcion: $("#description").value.trim() };
  pedirClave(ejecutarTransferencia);
  // Si cancela la clave, el deslizador vuelve
  const vigilar = setInterval(() => {
    if (!$("#pin-sheet").classList.contains("open") && !$("#processing").classList.contains("show")) {
      clearInterval(vigilar);
      if ($("#screen-amount").classList.contains("active")) deslizadorTr.reiniciar();
    }
  }, 300);
});

/* ---------- Transferir entre mis cuentas ---------- */
let own = { desde: "saldo", hacia: "ahorro" };
const montoOwn = crearMonto("#own-display", "#np-own");
function cajaCuenta(k) {
  const a = CUENTAS[k]();
  return `<b>${a.alias}</b><span class="small muted">${a.tipo}</span><span class="small">${saldoVisible ? dinero(a.saldo) : "$ ••••"}</span>`;
}
function renderOwn() {
  $("#own-from").innerHTML = cajaCuenta(own.desde);
  $("#own-to").innerHTML = cajaCuenta(own.hacia);
  $("#own-motivo").value = ""; $("#own-motivo").hidden = true; $("#own-btn-motivo").hidden = false;
  $("#own-error").textContent = "";
  montoOwn.reset(); deslizadorOwn.reiniciar();
}
$("#own-swap").addEventListener("click", (e) => {
  own = { desde: own.hacia, hacia: own.desde };
  const b = e.currentTarget; b.classList.remove("spin"); void b.offsetWidth; b.classList.add("spin");
  document.querySelectorAll(".own-acc").forEach((x) => { x.classList.remove("flip"); void x.offsetWidth; x.classList.add("flip"); });
  $("#own-from").innerHTML = cajaCuenta(own.desde); $("#own-to").innerHTML = cajaCuenta(own.hacia);
  vibrar();
});
$("#own-btn-motivo").addEventListener("click", () => { $("#own-btn-motivo").hidden = true; $("#own-motivo").hidden = false; $("#own-motivo").focus(); });
montoOwn.onChange = () => ($("#own-error").textContent = "");
const deslizadorOwn = crearDeslizador("#slide-own", async () => {
  const monto = montoOwn.valor();
  if (!validarMonto(monto, own.desde, "#own-error")) { sacudir("#own-display"); return false; }
  const d = CUENTAS[own.desde](), h = CUENTAS[own.hacia](), motivo = $("#own-motivo").value.trim();
  await procesando("Transfiriendo entre tus cuentas", 1300);
  finalizarOperacion({
    monto, desde: own.desde, acreditar: own.hacia,
    titulo: "¡Transferencia exitosa!", linea: "A tu cuenta " + h.alias,
    movimiento: `Transferencia a ${h.alias} (mis cuentas)`,
    detalles: [["Cuenta origen", enmascarar(d.numero)], ["Cuenta destino", enmascarar(h.numero)], ["Tipo", "Entre mis cuentas"]]
      .concat(motivo ? [["Motivo", motivo]] : []),
    otraVez: ["own", "Volver a<br>transferir"],
  });
});

/* ---------- Retiro sin tarjeta ---------- */
const montoWd = crearMonto("#wd-display", "#np-wd", { decimales: false, max: 300 });
let relojRetiro = null;
function resetRetiro() {
  $("#wd-form").hidden = false; $("#wd-result").hidden = true; $("#wd-error").textContent = "";
  $("#wd-for").textContent = "Para ti";
  $("#wd-phone").textContent = "Celular " + estado.celular.replace(/(\d{2})\d{4}(\d{4})/, "$1•• ••$2");
  clearInterval(relojRetiro);
  montoWd.reset();
}
montoWd.onChange = () => ($("#wd-error").textContent = "");
$("#btn-wd").addEventListener("click", () => {
  const v = montoWd.valor();
  if (!v || v % 10 || v > 300) { sacudir("#wd-display"); return ($("#wd-error").textContent = "El monto debe terminar en 0 y ser máximo $300"); }
  if (v > estado.saldo) return ($("#wd-error").textContent = "Saldo insuficiente");
  pedirClave(() => {
    const codigo = String(Math.floor(100000 + Math.random() * 900000));
    estado.saldo = Math.round((estado.saldo - v) * 100) / 100;
    estado.movimientos.push({ tipo: "out", titulo: "Retiro sin tarjeta", monto: v, fecha: new Date().toISOString() });
    guardar();
    $("#wd-code").textContent = codigo.replace(/(\d{3})(\d{3})/, "$1 $2");
    $("#wd-amount").textContent = dinero(v);
    $("#wd-form").hidden = true; $("#wd-result").hidden = false;
    let seg = 30 * 60;
    clearInterval(relojRetiro);
    relojRetiro = setInterval(() => {
      seg--; $("#wd-timer").textContent = `${String(Math.floor(seg / 60)).padStart(2, "0")}:${String(seg % 60).padStart(2, "0")}`;
      if (seg <= 0) clearInterval(relojRetiro);
    }, 1000);
  });
});

/* ---------- Pagar tarjetas ---------- */
function renderTarjetas() {
  const tc = estado.tc;
  $("#cc-name").textContent = estado.usuario.toUpperCase();
  $("#cc-total").textContent = $("#cc-opt-total").textContent = dinero(tc.deuda);
  $("#cc-min").textContent = $("#cc-opt-min").textContent = dinero(Math.min(tc.minimo, tc.deuda));
  const f = new Date(); f.setDate(28);
  $("#cc-date").textContent = f.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" });
  $("#cc-from").textContent = estado.cuentaAlias + " " + enmascarar(estado.cuentaNumero);
  $("#cc-other").value = ""; $("#cc-error").textContent = "";
  document.querySelector('input[name=ccopt][value=total]').checked = true;
}
$("#cc-other").addEventListener("focus", () => (document.querySelector('input[name=ccopt][value=otro]').checked = true));
$("#btn-cc").addEventListener("click", () => {
  const tc = estado.tc, opt = document.querySelector("input[name=ccopt]:checked").value;
  const v = opt === "total" ? tc.deuda : opt === "min" ? Math.min(tc.minimo, tc.deuda) : leerMonto($("#cc-other").value);
  if (tc.deuda <= 0) return ($("#cc-error").textContent = "No tienes valores pendientes");
  if (v <= 0 || v > tc.deuda) return ($("#cc-error").textContent = "Ingresa un monto válido (hasta " + dinero(tc.deuda) + ")");
  if (v > estado.saldo) return ($("#cc-error").textContent = "Saldo insuficiente");
  pedirClave(() => finalizarOperacion({
    monto: v, titulo: "¡Pago exitoso!", linea: "Tarjeta Signature •••• 4021",
    movimiento: "Pago Tarjeta Signature",
    alFinal: () => { tc.deuda = Math.round((tc.deuda - v) * 100) / 100; tc.minimo = Math.min(tc.minimo, tc.deuda); },
    detalles: [["Tarjeta", "VISA Signature •••• 4021"], ["Tipo de pago", { total: "Pago total", min: "Pago mínimo", otro: "Otro monto" }[opt]],
               ["Cuenta origen", enmascarar(estado.cuentaNumero)]],
    otraVez: ["cards", "Pagar otra<br>tarjeta"],
  }));
});

/* ---------- Montos máximos transaccionales ---------- */
function renderLimites() {
  const l = estado.limites;
  $("#lim-web").value = l.web; $("#lim-movil").value = l.movil;
  $("#lim-web-on").checked = l.webOn; $("#lim-movil-on").checked = l.movilOn;
  pintarLimites(); $("#lim-error").textContent = "";
}
function pintarLimites() {
  document.querySelectorAll(".limit-card").forEach((c) => c.classList.toggle("off", !c.querySelector("input[type=checkbox]").checked));
}
["#lim-web-on", "#lim-movil-on"].forEach((s) => $(s).addEventListener("change", pintarLimites));
["#lim-web", "#lim-movil"].forEach((s) => $(s).addEventListener("input", (e) => (e.target.value = e.target.value.replace(/\D/g, "").slice(0, 5))));
$("#btn-limits").addEventListener("click", async () => {
  const web = +$("#lim-web").value, movil = +$("#lim-movil").value;
  if (!web || !movil || web > 15001 || movil > 15001) return ($("#lim-error").textContent = "Ingresa montos entre $1 y $15.001");
  const b = $("#btn-limits"); b.classList.add("loading"); await esperar(900); b.classList.remove("loading");
  estado.limites = { web, movil, webOn: $("#lim-web-on").checked, movilOn: $("#lim-movil-on").checked };
  guardar(); toast("Configuración guardada"); atras();
});

/* ---------- Nuevo contacto: pestañas y opciones ---------- */
function syncNueva() {
  const banco = $("#new-bank").value, andino = banco === "Banco Andino";
  document.querySelectorAll("#new-bank-tabs button").forEach((b) => b.classList.toggle("on", (b.dataset.bank === "andino") === andino));
  $("#new-bank-wrap").hidden = andino;
  if (!andino) $("#new-bank-other").value = banco;
  document.querySelectorAll("#new-acctype button").forEach((b) => b.classList.toggle("on", b.dataset.v === $("#new-type").value));
}
$("#new-bank-tabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-bank]"); if (!b) return;
  $("#new-bank").value = b.dataset.bank === "andino" ? "Banco Andino" : $("#new-bank-other").value;
  syncNueva();
});
$("#new-bank-other").addEventListener("change", (e) => { $("#new-bank").value = e.target.value; });
document.querySelectorAll(".pills").forEach((g) => g.addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  g.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
  if (g.id === "new-acctype") $("#new-type").value = b.dataset.v;
}));
const _resetNueva = resetNueva;
resetNueva = function () { _resetNueva(); $("#new-bank").value = "Banco Andino"; $("#new-type").value = "Cta. Ahorro"; syncNueva(); };
const _elegir = elegirSugerencia;
elegirSugerencia = function (i) { _elegir(i); syncNueva(); };

/* ---------- Carrusel de productos: flechas ---------- */
function moverProductos(dir) {
  const t = $("#products-track"), w = (t.firstElementChild?.offsetWidth || 0) + 12;
  t.scrollBy({ left: dir * w, behavior: "smooth" });
}
$("#pg-prev").addEventListener("click", () => moverProductos(-1));
$("#pg-next").addEventListener("click", () => moverProductos(1));

/* ---------- Cerrar promoción ---------- */
$("#promo-close").addEventListener("click", () => {
  const w = $("#promo-wrap");
  w.style.height = w.offsetHeight + "px";
  requestAnimationFrame(() => { w.classList.add("closing"); w.style.height = "0px"; });
  $("#promo-dots").hidden = true;
});

/* ---------- Bienvenida (solo la primera vez) ---------- */
(function bienvenida() {
  let visto = false;
  try { visto = localStorage.getItem("andino_onboarding") === "1"; } catch (e) {}
  if (visto) return;
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $("#screen-onboarding").classList.add("active");
  const tr = $("#onb-track"), dots = [...document.querySelectorAll("#onb-dots i")];
  const idx = () => Math.round(tr.scrollLeft / tr.clientWidth);
  const terminar = () => {
    try { localStorage.setItem("andino_onboarding", "1"); } catch (e) {}
    ir("login", { reemplazar: true, efecto: "fade" });
  };
  tr.addEventListener("scroll", () => {
    const i = idx();
    dots.forEach((d, k) => d.classList.toggle("on", k === i));
    $("#onb-next span").textContent = i === dots.length - 1 ? "Comenzar" : "Siguiente";
  }, { passive: true });
  $("#onb-next").addEventListener("click", () => {
    const i = idx();
    if (i >= dots.length - 1) terminar();
    else tr.scrollTo({ left: (i + 1) * tr.clientWidth, behavior: "smooth" });
  });
  $("#onb-skip").addEventListener("click", terminar);
})();
