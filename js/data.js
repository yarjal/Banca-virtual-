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
  movimientos: [
    { tipo: "in",  titulo: "Depósito de nómina", monto: 450.00, fecha: "2026-11-01T09:12:00" },
    { tipo: "out", titulo: "Pago de servicios",  monto: 26.61,  fecha: "2026-11-03T18:40:00" },
  ],
};
