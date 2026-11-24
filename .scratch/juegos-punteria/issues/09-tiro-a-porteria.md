# 09: Tiro a portería

**What to build:** Una escena fija de portería con huecos clicables; clicar un hueco lanza el balón y celebra el gol. Combina precisión con una escena vistosa concreta.

**Blocked by:** 05 — Click estático

**Status:** hecho

- [x] La portería tiene huecos clicables con tamaño mínimo respetado.
- [x] Clicar un hueco lanza un balón animado y celebra el acierto.
- [x] Fallar libera el balón despacio a una zona vacía sin penalización.
- [x] La ayuda adaptativa puede agrandar los huecos.
- [x] Disponible en los cuatro mundos desde el menú.
- [x] Tests unitarios de la asignación hueco/resultado; test de Playwright de "clico el hueco y entra".

## Hecho

- **Lógica pura** en `js/tiro-a-porteria.js`: `geometriaPorteria` (marco centrado que deja
  libre la franja inferior), `crearHuecos` (rejilla 3×2 con margen, siempre dentro del marco),
  `asignarHueco` / `resultadoTiro` (la costura gol/fallo del ticket), `escalarHuecos` (la ayuda
  cambia el radio sin mover el centro) y `destinoFallo` (zona vacía acotada a la pantalla).
- **Escena** en `js/escena-tiro-a-porteria.js`, enrutada desde `js/escena.js`. Portería fija
  dibujada con panel, red y marco del color del mundo; seis huecos grandes con contorno blanco.
  El objeto del mundo espera abajo como balón; al clicar un hueco vuela en arco con
  `animarTiro` (curva pura en `js/animaciones.js`) y el hueco celebra con la curva de acierto,
  el sonido del mundo y el refuerzo/estallido de la capa de interfaz.
- **Fallo suave**: un clic fuera lanza el balón despacio a la zona pulsada, suena bajo, suma un
  fallo con pausa anti-rebote de 300 ms y no resta progreso. Dos fallos seguidos suben la ayuda
  y agrandan los huecos; cuatro aciertos la bajan. El radio lógico y la escala dibujada se
  actualizan juntos cada fotograma, así el clic coincide siempre con lo que se ve.
- **Registro y menú**: `MECANICAS.tiroAPorteria` (`implementada: true`, meta 6, huecos 9–13 vmin)
  se añade al final de `ORDEN`; aparece en el menú de los cuatro mundos con un pictograma propio
  de portería. Las mecánicas de aparición y movimiento se insertarán antes cuando lleguen.
- **API observable** (`window.juego.escena`): `huecos` (centro, radio y radio base), `porteria`,
  `aciertos`, `fallos`, `ultimoTiro`, `balon` en vuelo, `ayuda`, `meta`, `terminada`, `lista` y
  `visible`.
- **Tests**: `tests/tiro-a-porteria.test.js` (geometría, tamaño mínimo, rejilla sin solapes,
  escalado por ayuda, asignación hueco/resultado y destino del fallo), dos casos nuevos en
  `tests/animaciones.test.js` (arco del tiro) y cuatro de Playwright en `tests/navegador.test.js`
  (gol, fallo con ayuda, final de partida y los cuatro mundos). Actualizados
  `tests/contenido.test.js` y la lista de juegos del menú.
- Suite completa: `node --test tests/*.test.js` → 140 tests en verde.
