# 03: Refuerzo, sonido y pegatinas

**What to build:** Cada acierto de cualquier juego produce una celebración de menos de medio segundo que no tapa el siguiente objetivo, con sonido alegre. Hay un botón de silencio. Al terminar una partida se gana una pegatina que se guarda y puede verse en una colección.

**Blocked by:** 02 — Causa-efecto

**Status:** hecho

**Hecho:**
- El refuerzo de acierto es un anillo de 480 ms en el sitio del acierto; el objetivo nuevo
  aparece aparte, así que el refuerzo no tapa el siguiente objetivo (commits `3d1e9a9` y `1446977`).
- Sonidos distintos y cortos: acierto (dos notas, < 0,3 s, con el tono del mundo), entrada de
  pieza y fanfarria de final. La música de fondo es un arpegio suave, apagado por defecto y con
  su propio botón.
- El tono de aviso (`error()`) es suave y está limitado para que pulsar rápido no se convierta
  en una alarma. Hoy ninguna de las dos mecánicas publicadas puede fallar; se conectará en la
  primera mecánica con fallo (ticket 06).
- El botón de altavoz silencia solo los efectos (acierto, error, entrada y fanfarria), con su
  propio nodo maestro, y guarda la preferencia en `localStorage` (`juegos.efectos.v1`). La música
  es opt-in y se controla con su propia nota (`juegos.musica.v1`); apagar una no apaga la otra.
- Al terminar la partida se entrega una pegatina, se ve sobre el confeti y se guarda en
  `localStorage` (`juegos.pegatinas.v1`). Se gana primero la que falta; al completar la
  colección se repite una, sin tratarlo como castigo.
- La colección es una vista del menú, sin texto, con las ganadas a color y las pendientes en
  silueta. También lleva los botones de sonido y música.
- `tests/pegatinas.test.js` y `tests/audio.test.js` cubren el almacenamiento con almacenes
  falsos. `tests/navegador.test.js` cubre silencio persistente, música opt-in y «termino una
  partida y aparece una pegatina nueva en la colección».

- [x] El refuerzo dura <0,5 s y no oculta el siguiente objetivo más tiempo del que dura.
- [x] Acierto, error, entrada y fanfarria tienen sonidos distintos; el botón de efectos los corta y la preferencia persiste.
- [x] La música de fondo es suave, opcional y no compite con los sonidos de juego.
- [x] Al terminar una partida se entrega una pegatina guardada en `localStorage`, sin repetidos visibles como castigo.
- [x] Existe una vista de colección de pegatinas accesible desde el menú.
- [x] Los fallos se notan suavemente, sin quitar progreso ni vidas. El aviso existe y está listo; se conectará en la primera mecánica que pueda fallar (ticket 06).
- [x] Tests unitarios de almacenamiento de pegatinas; test de Playwright de "termino una partida y aparece una pegatina nueva en la colección".
