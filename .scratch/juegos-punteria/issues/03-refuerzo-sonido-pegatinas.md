# 03: Refuerzo, sonido y pegatinas

**What to build:** Cada acierto de cualquier juego produce una celebración de menos de medio segundo que no tapa el siguiente objetivo, con sonido alegre. Hay un botón de silencio. Al terminar una partida se gana una pegatina que se guarda y puede verse en una colección.

**Blocked by:** 02 — Causa-efecto

**Status:** ready-for-agent

- [ ] El refuerzo dura <0,5 s y no oculta el siguiente objetivo más tiempo del que dura.
- [ ] Acierto, error, entrada y fanfarria tienen sonidos distintos; el botón de silencio los corta y la preferencia persiste.
- [ ] La música de fondo es suave, opcional y no compite con los sonidos de juego.
- [ ] Al terminar una partida se entrega una pegatina guardada en `localStorage`, sin repetidos visibles como castigo.
- [ ] Existe una vista de colección de pegatinas accesible desde el menú.
- [ ] Los fallos se notan suavemente, sin quitar progreso ni vidas.
- [ ] Tests unitarios de almacenamiento de pegatinas; test de Playwright de "termino una partida y aparece una pegatina nueva en la colección".
