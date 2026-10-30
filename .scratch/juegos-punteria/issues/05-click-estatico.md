# 05: Click estático

**What to build:** Un juego de apuntar y clicar un dibujo grande que no se mueve, que se recoloca lejos entre aciertos para obligar a recorrer la pantalla. Partida corta con final claro.

**Blocked by:** 04 — Ayuda adaptativa y métricas

**Status:** ready-for-agent

- [ ] El objetivo es fijo hasta el acierto y se recoloca a una distancia mínima entre aciertos.
- [ ] El tamaño de partida es grande y la ayuda adaptativa lo modula.
- [ ] El clic fuera del objetivo no penaliza de forma dura.
- [ ] Disponible en los cuatro mundos desde el menú.
- [ ] `window.juego` expone objetivo activo, aciertos y fin de partida.
- [ ] Tests unitarios de recolocación y distancia mínima; test de Playwright de "clico el objetivo y avanza".
