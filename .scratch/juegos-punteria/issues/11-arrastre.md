# 11: Arrastre — juego avanzado

**What to build:** Un juego futuro de nivel avanzado donde hay que pulsar un dibujo, no soltar y moverlo hasta su sitio. Entrena el arrastre como mecánica nueva, sin tocar los juegos existentes, y llega después del resto de la serie.

**Blocked by:** 08 — Movimiento lento

**Status:** hecho

- [x] La mecánica de arrastre se registra como una mecánica más sin modificar las existentes.
- [x] El juego exige pulsar, mantener y soltar en una zona; soltar fuera no penaliza de forma dura.
- [x] `window.juego` expone el arrastre en curso (inicio, objetivo, soltado) para poder testearlo.
- [x] El juego aparece al final de la progresión recomendada, sin bloquear los anteriores.
- [x] Tests unitarios de la regla de soltado; test de Playwright de "arrastro el dibujo hasta su sitio".

## Hecho

- **Registro:** `MECANICAS.arrastre` (`meta: 4`, dibujo grande de 12–16 vmin) y
  `ORDEN` lo coloca al final, después de parejas, tiro a portería y movimiento lento. Las mecánicas
  anteriores no cambian; solo se añade una entrada y su icono de menú.
- **Lógica pura (`js/arrastre.js`):** reparto del dibujo y su zona (horizontal en pantalla
  ancha, vertical en pantalla alta), regla de soltado con tolerancia del 25 % más allá del
  borde, agarre solo pulsando sobre el dibujo y umbral para distinguir un clic de un arrastre.
- **Escena (`js/escena-arrastre.js`):** pulsar el dibujo lo agarra, el dibujo sigue al puntero
  y soltar dentro de la zona acierta (refuerzo y sonido del mundo). Soltar fuera es un fallo
  suave: dibujo devuelto a su sitio, sin quitar progreso ni terminar la partida. Un clic quieto
  se cancela en silencio. Funciona en los cuatro mundos con el pictograma y el acento propios.
- **Interacción (`js/main.js`):** `pointerdown`/`pointerup`/`pointercancel` llegan a la escena;
  las mecánicas anteriores no implementan esos métodos, así que su comportamiento no cambia.
- **API observable:** `window.juego.escena.arrastre` expone `estado` (`inactivo`,
  `arrastrando`, `soltado`), `inicio`, `objetivo`, `zona` y `soltado` (`{x, y, acierto}`).
- **Tests:** `tests/arrastre.test.js` (reparto, tolerancia, agarre y umbral) y tres pruebas de
  Playwright en `tests/navegador.test.js` (arrastre completo, fallo suave y los cuatro mundos).
  Suite completa en verde: 196 tests.
