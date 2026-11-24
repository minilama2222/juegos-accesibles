# 04: Ayuda adaptativa y métricas

**What to build:** Cada juego ajusta su nivel de ayuda solo, según aciertos y fallos: agranda objetivos, alarga ventanas o ralentiza movimiento, y recuerda ese ajuste entre sesiones. En paralelo se guardan métricas invisibles para Jordán que el padre puede exportar.

**Blocked by:** 03 — Refuerzo, sonido y pegatinas

**Status:** hecho

**Hecho:**
- La ayuda vive en `js/ayuda.js`: escalera de 0 a 5, sube tras 2 fallos seguidos y baja tras
  4 aciertos seguidos. Se guarda por juego en `juegos.ayuda.v1`, así que un juego no contagia a
  otro y se recuerda entre sesiones.
- La ayuda se aplica como tamaño: el objetivo de hover (y el brote de causa-efecto) se dibuja con
  un radio base y se escala con `factorTamano`. `factorVentana` y `factorVelocidad` quedan listos
  para las mecánicas de tiempo y movimiento (tickets 06 y 08). No cambia ninguna regla visible.
- Un intento de hover que se vacía del todo sin completarse cuenta como fallo suave: no quita
  progreso ni vidas y agranda el objetivo cuando toca.
- Las métricas viven en `js/metricas.js`: partidas, aciertos, fallos, duración, cambios de juego y
  ayuda final, por juego y en total, en `juegos.metricas.v1`. Se cierran al salir, al terminar la
  partida y al cerrar la pestaña.
- El padre exporta con la tecla `E` (o `window.juego.exportarMetricas()`): descarga
  `juegos-metricas-<fecha>.json`. No hay botón ni texto visible en el juego.
- `tests/ayuda.test.js` y `tests/metricas.test.js` cubren la escalera y el almacenamiento con
  almacenes falsos. `tests/navegador.test.js` cubre que fallar repetidamente agranda el objetivo
  de forma observable en `window.juego`, que la ayuda persiste, y que las métricas se guardan y
  exportan sin verse.

- [x] Cada juego mantiene y persiste un nivel de ayuda ajustado por aciertos y fallos consecutivos.
- [x] La ayuda se aplica como máximo en tamaño, tiempo o velocidad, sin cambiar las reglas visibles.
- [x] El nivel de ayuda de un juego no afecta a otro.
- [x] Se registran partidas, aciertos, fallos, duración, cambios de juego y ayuda final en `localStorage`.
- [x] Existe una exportación de métricas para el padre, sin nada de esto visible en el juego.
- [x] Tests unitarios de la escalera de ayuda y del almacenamiento; test de Playwright de que fallar repetidamente agranda el objetivo de forma observable en `window.juego`.
