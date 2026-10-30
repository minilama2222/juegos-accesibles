# 11: Arrastre — juego avanzado

**What to build:** Un juego futuro de nivel avanzado donde hay que pulsar un dibujo, no soltar y moverlo hasta su sitio. Entrena el arrastre como mecánica nueva, sin tocar los juegos existentes, y llega después del resto de la serie.

**Blocked by:** 08 — Movimiento lento

**Status:** ready-for-agent

- [ ] La mecánica de arrastre se registra como una mecánica más sin modificar las existentes.
- [ ] El juego exige pulsar, mantener y soltar en una zona; soltar fuera no penaliza de forma dura.
- [ ] `window.juego` expone el arrastre en curso (inicio, objetivo, soltado) para poder testearlo.
- [ ] El juego aparece al final de la progresión recomendada, sin bloquear los anteriores.
- [ ] Tests unitarios de la regla de soltado; test de Playwright de "arrastro el dibujo hasta su sitio".
