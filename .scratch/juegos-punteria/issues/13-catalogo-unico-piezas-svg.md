# 13: Catálogo único y piezas propias como SVG

**What to build:** Un manifiesto único de arte (`js/arte.js`) y las piezas propias como ficheros SVG editables en `assets/propios/<id>.svg`. El juego debe verse y comportarse igual que hoy; lo que cambia es de dónde sale el dibujo y cómo se identifica.

**Blocked by:** 12 — Glosario y ADR del catálogo de piezas

**Status:** pendiente

- [ ] Crear `js/arte.js` con:
  - `PIEZAS`: un objeto indexado por id, con la ficha completa de cada pieza.
  - `pieza(id)`: devuelve la ficha o `null`.
  - `dibujo(id)`: devuelve el SVG propio ya cargado, o `null` si la pieza no es propia.
  - `imagen(id)`: devuelve una ruta o data-URI lista para un `<img>` o para Kaplay.
  - `fondo(mundo)`: resuelve el generador de fondo del mundo.
  - `cargarArte()`: precarga una sola vez los SVG propios y resuelve cuando están todos.
- [ ] Ficha obligatoria por pieza: `id`, `nombre`, `tipo` (`propio`, `arasaac` o `fondo`), `fuente`, `licencia`, `usos`, `tamanos`, `estado` y `nota`.
- [ ] Extraer a `assets/propios/<id>.svg` las 24 piezas que hoy viven en `js/pictogramas.js`:
  `destello`, `aguantar`, `aparicion`, `movimiento`, `porteria`, `arrastre`, `parejas4`,
  `parejas6`, `parejas8`, `lugar`, `sonido`, `silencio`, `musica`, `musicaApagada`,
  `pantalla`, `pantallaSalir`, `coleccion`, `tactil`, `volver`, `chispa`, `huella`, `copo`,
  `estrella`, `bicho`.
- [ ] Añadir la pieza `otro-juego` con la flecha que hoy está inline en `main.js`, y borrar ese
  `<svg>` de `main.js`.
- [ ] Cada SVG propio conserva `viewBox="0 0 120 120"`, no lleva `<text>`, no referencia
  recursos externos, no lleva `<script>` y se puede abrir y editar por separado.
- [ ] Registrar en el mismo manifiesto los 32 conceptos de ARASAAC que hoy declara
  `js/arasaac.js`, con su PNG en `assets/arasaac/<id>.png` como fuente y la licencia
  CC BY-NC-SA 4.0.
- [ ] Registrar los cuatro fondos (`navidad`, `animalitos`, `futbol`, `amarillo`) como
  `tipo: 'fondo'`, con `js/fondos.js` como fuente y sus usos.
- [ ] `main.js` espera a `cargarArte()` antes del primer render. Si un SVG no carga, la app no
  se queda en blanco: deja un error visible para el adulto y no arranca el menú a medias.
- [ ] Sustituir los usos directos de `pictograma`/`imagenPictograma` por el catálogo. Como
  mucho, dejar `js/pictogramas.js` como fachada temporal sin dibujos dentro; el objetivo es
  que no quede ningún SVG de contenido en JS.
- [ ] Mantener `js/arasaac.js` como catálogo de ids de ARASAAC; el manifiesto lo envuelve y le
  añade metadatos, pero no duplica la lista de ids.
- [ ] Actualizar los tests existentes para que lean el manifiesto y los ficheros, sin cambiar
  lo que comprueban del juego.
- [ ] Comprobar que no cambia el aspecto: menú, colección, cuatro mundos, pegatinas y las ocho
  mecánicas siguen pintando lo mismo.

**Criterio de aceptación:** `npm test` en verde, `window.juego` sin cambios y las 25 piezas
propias (24 actuales + `otro-juego`) más 32 conceptos ARASAAC y 4 fondos aparecen declarados en
`js/arte.js`. En el repo no queda ningún dibujo de contenido inline en JS.
