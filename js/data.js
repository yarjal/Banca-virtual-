/*
 * Datos de ejemplo de la banca virtual.
 *
 * DIRECTORIO: personas "registradas" en el banco. Cuando escribes el nombre
 * del destinatario en "Nueva cuenta", se busca aquí y aparece su foto.
 * Para usar fotos reales, guarda la imagen en img/contactos/ y cambia "foto".
 * (Ej: foto: "img/contactos/sofia.jpg")
 */
const DIRECTORIO = [
  { nombre: "Sofía Ramírez Torres",  foto: "img/contactos/sofia.svg",   banco: "Banco Andino",          tipo: "Cta. Ahorro",    cuenta: "2205865374" },
  { nombre: "Andrés Molina Vega",    foto: "img/contactos/andres.svg",  banco: "Banco Andino",          tipo: "Cta. Ahorro",    cuenta: "2201946409" },
  { nombre: "Valeria Cárdenas Ruiz", foto: "img/contactos/valeria.svg", banco: "Banco del Pacífico Sur", tipo: "Cta. Corriente", cuenta: "1004587721" },
  { nombre: "Mateo Herrera Paz",     foto: "img/contactos/mateo.svg",   banco: "Banco Andino",          tipo: "Cta. Ahorro",    cuenta: "2209981230" },
  { nombre: "Camila Ortiz León",     foto: "img/contactos/camila.svg",  banco: "Banco Austral",         tipo: "Cta. Ahorro",    cuenta: "3307745102" },
  { nombre: "Diego Salazar Mena",    foto: "img/contactos/diego.svg",   banco: "Cooperativa Progreso",  tipo: "Cta. Ahorro",    cuenta: "4401236587" },
];

/* Estado inicial (se guarda luego en el navegador con localStorage) */
const ESTADO_INICIAL = {
  usuario: "Usuario Demo Pérez",
  cuentaAlias: "FLEX8633",
  cuentaNumero: "2200458633",
  saldo: 523.39,
  contactos: [
    { id: 1, alias: "Sofi",  ...DIRECTORIO[0] },
    { id: 2, alias: "Andy",  ...DIRECTORIO[1] },
    { id: 3, alias: "Vale",  ...DIRECTORIO[2] },
    { id: 4, alias: "Mateo", ...DIRECTORIO[3] },
  ],
  ahorro: 1250.00,
  ahorroNumero: "2200711204",
  tarjetaBloqueada: false,
  movimientos: [
    { tipo: "in",  titulo: "Depósito de nómina", monto: 450.00, fecha: "2026-11-01T09:12:00" },
    { tipo: "out", titulo: "Pago Electricidad",  monto: 26.61,  fecha: "2026-11-03T18:40:00" },
    { tipo: "out", titulo: "Pago QR Cafetería Central", monto: 3.50, fecha: "2026-10-29T08:15:00" },
    { tipo: "in",  titulo: "Transferencia de Sofía Ramírez", monto: 20.00, fecha: "2026-10-27T13:02:00" },
  ],
  solicitudes: [
    { nombre: "Certificado bancario", fecha: "2026-10-20T10:00:00", estado: "Aprobada" },
  ],
  notificaciones: [
    { icono: "💸", titulo: "Recibiste $20,00", texto: "Sofía Ramírez te transfirió dinero.", fecha: "2026-10-27T13:02:00", leida: false },
    { icono: "🎁", titulo: "¡Nuevo beneficio!", texto: "2x1 en cine todos los martes con tu Visa Débito.", fecha: "2026-11-02T09:00:00", leida: false },
    { icono: "🔐", titulo: "Inicio de sesión", texto: "Ingresaste a tu Banca Móvil desde un nuevo dispositivo.", fecha: "2026-11-05T19:30:00", leida: false },
  ],
};

/* Empresas para "Pagar servicios" (nombres ficticios) */
const SERVICIOS = [
  { nombre: "Empresa Eléctrica Andina", cat: "Luz",        icono: "💡", color: "#fef3c7" },
  { nombre: "Agua Potable Municipal",   cat: "Agua",       icono: "💧", color: "#dbeafe" },
  { nombre: "FibraNet Hogar",           cat: "Internet",   icono: "🌐", color: "#e0e7ff" },
  { nombre: "TeleAndes Fija",           cat: "Teléfono",   icono: "☎️", color: "#dcfce7" },
  { nombre: "Universidad del Valle",    cat: "Educación",  icono: "🎓", color: "#fce7f3" },
  { nombre: "Servicio de Rentas",       cat: "Impuestos",  icono: "🏛️", color: "#f3f4f6" },
  { nombre: "TV Cable Andes",           cat: "Televisión", icono: "📺", color: "#ffedd5" },
];

/* Comercio que aparece al "Simular escaneo" de un QR */
const COMERCIO_DEMO = { nombre: "Cafetería Central", banco: "Banco Andino", tipo: "Cta. Corriente", cuenta: "2205550198", foto: null, comercio: true };
