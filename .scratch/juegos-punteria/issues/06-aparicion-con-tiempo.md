# 06: Aparición con tiempo

**What to build:** Un juego donde el dibujo aparece visible unos segundos y luego hay un hueco; hay que clicarlo mientras está. Enseña a esperar y reaccionar y prepara la mecánica de movimiento.

**Blocked by:** 05 — Click estático

**Status:** hecho

- [x] El objetivo alterna ventanas visible/hueco con tiempos definidos por la ayuda adaptativa.
- [x] Clicar durante el hueco no penaliza con sonido duro ni quita progreso.
- [x] El juego termina con un final claro y vuelve al menú.
- [x] Disponible en los cuatro mundos desde el menú.
- [x] `window.juego` expone si el objetivo está visible, aciertos y fin.
- [x] Tests unitarios de ventanas temporales; test de Playwright de "espero, aparece y clico".

## Hecho

- **Costura pura** (`js/aparicion.js`): reloj de fases `visible`/`hueco`, ventana base
  escalada con `factorVentana` (4,5 s en nivel 0) y acotada a **4–8 s**. Dos aciertos
  seguidos recortan 300 ms el reto; cada fallo suave alarga 600 ms la ayuda. Subir de
  nivel a mitad de partida nunca quita tiempo ya ganado. `tests/aparicion.test.js`
  cubre transiciones, pasos, rachas, suelo/techo y reajuste por ayuda.
- **Escena** (`js/escena-aparicion.js`): el pictograma del mundo aparece con su
  animación y sonido de entrada, se oculta al acabar la ventana o al acertar, y
  reaparece lejos. El clic en el hueco cuenta fallo suave **sin sonido duro y sin
  tocar aciertos**; el clic fuera con el objetivo visible usa el error suave de
  siempre. Termina al llegar a la meta con el cierre y la pegatina comunes.
- **API observable**: `window.juego.escena` expone `visible`, `fase`, `ventanaMs`,
  `restanteMs`, `huecoMs`, `aciertos`, `fallos`, `ayuda`, `meta` y `terminada`.
- **Registro, menú y mundos**: `MECANICAS.aparicion` (meta 6, ventana 4,5 s, hueco
  1,2 s) entra en `ORDEN` tras click estático, con icono de reloj propio en el menú.
  Funciona con los cuatro paquetes visuales y sonoros sin reglas distintas.
- **Tests de navegador**: espera al hueco, comprueba que el clic no suma, vuelve a
  ver el objetivo en otro sitio y clica; meta y vuelta al menú; y apertura en los
  cuatro mundos. Suite completa en verde (`node --test tests/*.test.js`).
- **Interpretación del ADR**: se aplica como escalera de dificultad sin castigo
  (los 300 ms quitan tiempo para subir el reto y los 600 ms lo devuelven como
  ayuda); nunca se resta progreso ni se usa sonido duro por esperar.
