# 01: Maqueta jugable — menú, mundo y hover

**What to build:** Jordán abre la página en el iMac, ve un menú sin texto con pictogramas grandes donde elige avatar y mundo (navidad, animalitos, fútbol, criatura amarilla), entra en el juego de "aguantar el puntero encima", ve la barra llenarse mientras se queda quieto sobre el objetivo y vence la partida. En cualquier momento puede pulsar un botón grande de "otro juego" y volver al menú sin perder nada. La página está publicada en GitHub Pages y se actualiza con cada push a `main`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] La página arranca servida estáticamente, sin build y sin `npm install` para jugar.
- [x] Kaplay está vendoreado y da la escena de juego; GSAP está vendoreado y anima la UI; no se anima el mismo objeto con ambos.
- [x] El menú muestra avatar y los cuatro mundos con pictogramas y sonido, sin texto legible.
- [x] Elegir mundo persiste durante la sesión y se aplica a la escena del juego.
- [x] La mecánica hover: el puntero debe permanecer dentro del objetivo ~0,6-1 s; una barra se llena; salirse la vacía despacio sin penalizar; no hay click.
- [x] El objetivo nunca baja de 44 px y se escala con `vmin`; sin scroll.
- [x] El botón "otro juego" está siempre visible, fuera del área de juego, y navega al menú sin confirmación.
- [x] El puntero del sistema se sustituye por uno propio grande y visible.
- [x] Existe una API pública `window.juego` que expone: juego actual, mundo, objetivos activos, aciertos, fin de partida y estado del hover; los elementos clave llevan atributos `data-*`.
- [x] Tests unitarios en node cubren las reglas de llenado/vaciado del hover.
- [x] Un test de Playwright (Chromium headless) comprueba que quedarse encima completa la barra, salirse la vacía y el botón "otro juego" vuelve al menú, hablando sólo con `window.juego` y `data-*`.
- [x] Para un fallo de test no se usan capturas como criterio; las capturas sólo sirven de evidencia.
- [x] `main` publica en GitHub Pages y cada push actualiza la versión visible.
