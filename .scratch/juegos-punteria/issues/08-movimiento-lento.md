# 08: Movimiento lento

**What to build:** Un juego donde el dibujo se desplaza con una trayectoria suave y hay que clicarlo al paso. La velocidad crece con el nivel de ayuda invertido (más aciertos, algo más rápido).

**Blocked by:** 06 — Aparición con tiempo

**Status:** hecho

- [x] El objetivo sigue una trayectoria suave y no se solapa consigo mismo de forma confusa.
- [x] La velocidad parte lenta y sube con aciertos, con techo humano.
- [x] El clic fuera no penaliza de forma dura.
- [x] Disponible en los cuatro mundos desde el menú.
- [x] `window.juego` expone la posición actual del objetivo y la velocidad.
- [x] Tests unitarios de la trayectoria y el escalado de velocidad; test de Playwright de "sigo el objetivo y clico".

## Hecho

- `js/movimiento-lento.js`: trayectoria radial cerrada y simple (sin autointersección), avance
  angular y escalado de velocidad puro; la ayuda multiplica por `factorVelocidad` (<1).
- `js/escena-movimiento-lento.js`: escena que mueve el objetivo por la curva, acelera cada dos
  aciertos hasta el techo, agranda el dibujo y lo ralentiza al subir la ayuda, y trata el clic
  fuera como fallo suave (sin restar progreso). Expone en `window.juego.escena` la posición,
  `velocidad`, `velocidadBase`, aciertos, fallos, ayuda y terminada.
- Registro `MECANICAS.movimientoLento` y orden entre aparición y tiro a portería; icono propio
  en el menú (`movimiento`).
- Tests: `tests/movimiento-lento.test.js` (curva contenida, suave, sin cruces; velocidad por
  aciertos con techo; freno por ayuda) y casos de navegador de seguimiento + clic, ayuda que
  ralentiza, fin de partida y cuatro mundos. `node --test tests/*.test.js`: 166 en verde.
