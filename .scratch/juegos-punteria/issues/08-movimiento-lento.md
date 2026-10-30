# 08: Movimiento lento

**What to build:** Un juego donde el dibujo se desplaza con una trayectoria suave y hay que clicarlo al paso. La velocidad crece con el nivel de ayuda invertido (más aciertos, algo más rápido).

**Blocked by:** 06 — Aparición con tiempo

**Status:** ready-for-agent

- [ ] El objetivo sigue una trayectoria suave y no se solapa consigo mismo de forma confusa.
- [ ] La velocidad parte lenta y sube con aciertos, con techo humano.
- [ ] El clic fuera no penaliza de forma dura.
- [ ] Disponible en los cuatro mundos desde el menú.
- [ ] `window.juego` expone la posición actual del objetivo y la velocidad.
- [ ] Tests unitarios de la trayectoria y el escalado de velocidad; test de Playwright de "sigo el objetivo y clico".
