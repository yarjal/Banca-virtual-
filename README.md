# Banca Virtual — Proyecto universitario

Banca virtual móvil hecha con **HTML, CSS y JavaScript puro**, sin instalar nada.
"Banco Andino" es una marca ficticia.

## Cómo abrirla
- Abre `index.html` en el navegador (mejor en vista móvil: F12 → icono de celular), o
- publícala gratis con **GitHub Pages**: Settings → Pages → Branch `main` / root.

Usuario y contraseña de demo: cualquiera. Clave de seguridad para transferir: cualquier número de 6 dígitos.

## Instalarla en el celular como una app
1. Publícala con GitHub Pages (necesita `https`).
2. Ábrela en el celular con Chrome → menú ⋮ → **Agregar a pantalla principal / Instalar app**
   (en iPhone: Safari → Compartir → **Agregar a inicio**).
3. Se abre con su ícono, a pantalla completa y sin la barra del navegador.

En la computadora la app se muestra dentro de un marco de celular.

## Detalles de app real
- Pantalla de carga al abrir, login con etiquetas flotantes, mostrar/ocultar contraseña e ingreso con huella.
- Transiciones deslizantes entre pantallas (adelante y atrás) y carga tipo "skeleton" del saldo.
- Monto como en las apps de banco: escribes 3-1-5 y aparece $3,15. También hay montos rápidos.
- Antes de transferir se pide una **clave de seguridad de 6 dígitos** con teclado numérico y luego aparece "Procesando…".
- Vibración ligera al tocar (en celulares que lo permiten).

## Funciones
- **Inicio deslizable**: carrusel de promociones automático, tarjetas de productos que se deslizan ("1 de 3"),
  filtros Cuentas/Tarjetas/Préstamos y accesos rápidos que se deslizan hacia los lados.
- **Notificaciones** en una hoja inferior (se cierra deslizándola hacia abajo).
- **Transferir** con foto del destinatario, **Recibir dinero**.
- **Escanear o mostrar QR**: usa la cámara del celular; con "Mi QR" otra persona puede escanearte. También hay "Simular escaneo".
- **Pagar servicios** (luz, agua, internet, universidad…), **Recargar celular** y **Retiro sin tarjeta** con código y temporizador.
- Menú inferior con **Productos** (cuentas, tarjeta con bloqueo temporal, movimientos filtrables), **Solicitudes**,
  **Beneficios** y **Perfil**.
- Todas las operaciones piden clave de 6 dígitos y generan su comprobante.

## Pantallas
1. **Inicio**: saldo (con ojo para ocultarlo), Mis productos, ¿Qué quieres hacer?, últimos movimientos y barra inferior.
2. **Transferir a**: buscador de contactos (con su foto), Nueva cuenta / Nuevo celular / Al Exterior y Mis contactos agrupados por letra.
3. **Nueva cuenta**: **al escribir el nombre del destinatario aparece su foto** y sugerencias con foto. También puedes subir una foto.
4. **Monto → Confirmación → Comprobante**: el comprobante muestra un visto verde de éxito, el monto, la fecha, las cuentas, el N° de comprobante y un QR.
5. **Recibir dinero** (QR con tus datos) y **Perfil** (cambiar nombre/saldo, restablecer datos).

Los datos (saldo, contactos, movimientos) se guardan en el navegador (`localStorage`).

## Poner fotos reales
1. Copia las fotos en `img/contactos/` (ej. `sofia.jpg`).
2. En `js/data.js`, cambia la propiedad `foto` de la persona: `foto: "img/contactos/sofia.jpg"`.
3. Agrega más personas al arreglo `DIRECTORIO` para que su foto salga al escribir su nombre.

## Estructura
```
index.html        pantallas
css/styles.css    diseño
js/data.js        personas, contactos y saldo inicial
js/app.js         lógica (navegación, búsqueda con foto, transferencias, comprobante)
js/funciones.js   carruseles, notificaciones, pestañas, QR, servicios, recargas y retiro
manifest.json     datos para instalarla como app
sw.js             service worker (instalación y uso sin internet)
img/contactos/    fotos de perfil
```
