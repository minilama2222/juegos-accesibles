# 07: Parejas de 4, 6 y 8

**What to build:** Un juego tranquilo de memoria: el niño elige tablero de 4, 6 u 8 parejas y gira cartas clicándolas. El tablero se adapta al tamaño de pantalla con cartas grandes.

**Blocked by:** 06 — Aparición con tiempo

**Status:** hecho

- [x] El menú permite elegir 4, 6 u 8 parejas con pictogramas, sin texto legible.
- [x] El tablero se adapta a la pantalla sin scroll y mantiene cartas grandes.
- [x] Girar una carta es un clic; dos cartas iguales se quedan visibles.
- [x] Fallar un par no quita progreso; la ayuda adaptativa puede alargar el tiempo visible.
- [x] Disponible en los cuatro mundos desde el menú.
- [x] Tests unitarios de la regla de parejas; test de Playwright de "encuentro un par".

## Hecho

- `js/parejas.js`: baraja mezclada, tablero adaptativo (elige la rejilla que hace las cartas más grandes, mínimo 44 px), asignación de clic a carta y máquina de estados de la partida. Fallar un par suma un fallo suave pero no toca las parejas encontradas; la ayuda escala el tiempo que se quedan destapadas.
- `js/escena-parejas.js`: escena Kaplay con dorso del mundo, caras con pictograma del mundo, giro contenido, pareja encontrada con halo y refuerzo, y vuelta a esconder tras el tiempo visible.
- `js/contenido.js`: mecánica `parejas` al final de `ORDEN`, tableros 4/6/8 y ocho pictogramas propios por mundo.
- `js/pictogramas.js`: iconos de menú para 4, 6 y 8 parejas y los pictogramas nuevos de cada mundo.
- `js/main.js` / `js/escena.js`: tres botones de parejas en el menú, arranque de la escena con el tablero elegido y estado en `window.juego` (`cartas`, `parejas`, `encontradas`, `terminada`, `ayuda`, `tiempoVisibleMs`).
- Tests: `tests/parejas.test.js` (reglas, tablero, giro, fallo y ayuda) y casos de navegador de parejas en `tests/navegador.test.js`.
- Verificación: `node --test tests/*.test.js` en verde (173 tests).
