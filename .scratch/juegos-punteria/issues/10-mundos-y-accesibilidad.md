# 10: Cuatro mundos completos y accesibilidad

**What to build:** Los cuatro mundos quedan terminados visualmente: navidad, animalitos, fútbol y criatura amarilla inspirada (sin IP real). Se respeta `prefers-reduced-motion` y se ofrece pantalla completa; el juego aguanta pulsaciones rápidas repetidas sin romperse.

**Blocked by:** 03 — Refuerzo, sonido y pegatinas

**Status:** ready-for-agent

- [ ] Los cuatro mundos tienen fondo, paleta, objetivo, refuerzo, puntero y sonidos propios.
- [ ] Ningún mundo usa IP real ni assets de terceros con licencia restrictiva.
- [ ] `prefers-reduced-motion` reduce confeti y partículas.
- [ ] Se ofrece pantalla completa desde el menú; no hay scroll accidental.
- [ ] Pulsar repetidamente muy rápido en cualquier juego no rompe la partida ni duplica pegatinas.
- [ ] Test de Playwright con `reducedMotion: 'reduce'` de que se reduce la animación y no cambia el resultado del juego.
