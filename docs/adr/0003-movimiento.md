# 0003 · Movimiento

- Estado: aceptado
- Fecha: 2026-11-19
- Fuente: [Animation Principles — game-development](https://github.com/dylantarre/animation-principles/blob/main/skills/01-by-domain/game-development/SKILL.md)
  (Dylan Tarre, MIT). Se traduce a DOM + pictogramas; no se copia.

## Contexto

El proyecto no tenía criterio de movimiento: `pop`, `entrada`, `se-va`, `latido` y el confeti
estaban repartidos entre `css/comun.css`, `<style>` inline de `escalon0.html` y `style` en JS, con
duraciones y curvas distintas y un `@media (prefers-reduced-motion)` que solo apagaba la mitad.

El skill de origen asume un motor de juego (timeScale, hit-stop, frame data a 60 fps). Aquí el
motor es el DOM: CSS para el estado, `transform`/`opacity` para el movimiento, keyframes solo en
un sitio.

## Los 12 principios, traducidos a este proyecto

| Principio | Aquí significa |
|---|---|
| Squash & stretch | La **caja y el sprite se deforman juntos** (`transform-origin: 50% 100%`). Todos los pictogramas se deforman por igual. Idle suave, clic fuerte. |
| Anticipación | Imán `.cerca` (crece a 1.06) y el idle de la pieza jugable. Opcional, nunca requisito. |
| Staging | Una cosa por pantalla; el idle está solo en la pieza que se debe tocar. |
| Straight ahead / pose to pose | Pose a pose: el estado final lo fija CSS, la transición lo lleva. Nada de física ni rAF propio para feedback. |
| Follow through / overlapping | El confeti, la marca del clic y el sonido cierran después del gesto, con su propio tiempo. |
| Slow in / slow out | Toda animación usa una curva; nunca `linear` para movimiento de personaje. |
| Arc | El recorrido del elemento es una curva (escala + rotación + traslación), nunca un `translate` recto solo. |
| Secondary action | Marca del clic, sonido y celebración acompañan al acierto sin sustituirlo. |
| Timing | Feedback visual en el siguiente frame; acierto legible < 100 ms. |
| Exageración | Medida **en forma** (contorno y recorrido), sin porcentaje fijo. La legibilidad del pictograma la decide la revisión visual. |
| Solid drawing | Silueta y volumen constante: un perro aplastado sigue siendo un perro. |
| Appeal | El movimiento existe para que el juego sea agradable de mirar. |

## Reglas vinculantes

1. **Idle con función.** El movimiento en reposo solo va en piezas jugables, y como máximo un
   elemento por pantalla lleva la clase `.idle`. Nunca en decorado, fondo, botones ni puntero.
2. **Sin parpadeo** a más de 3 Hz en superficie grande (WCAG 2.3.1).
3. **Solo `transform` y `opacity`.** Nada de animar `left`, `top`, `width`, `height`,
   `box-shadow` ni `filter`. Un juego que necesite mover algo lo mueve con `transform`.
4. **Un solo sitio.** Los keyframes y transiciones de juego viven en `css/movimiento.css`. Los
   juegos piden una animación por nombre (`H.anima(el, "acierto")`), no escriben CSS inline.
5. **Celebración aparte.** El confeti es pieza única de `comun.js` (`Juego.confeti`), con su
   duración propia (2,2–3,6 s) porque no es refuerzo de un clic. `grep confeti` fuera de
   `comun.js` es un fallo.
6. **Sin `prefers-reduced-motion`.** Se retira el `@media` incompleto; el movimiento es
   intencionado y no hay versión reducida que mantener.

## Retos con tiempo

> Estado de implementación (2026-11-26): esta sección es una decisión de diseño, todavía no
> implementada. Ningún juego declara `tiempo: true` y `panel.html` no muestra ni reinicia la ventana.

Cualquier juego puede usar tiempo, sin regla propia: no es una capa.

- **Un clic sigue siendo el único gesto.** El tiempo cambia *cuándo* el objetivo está
  disponible, no *cuántos* gestos hay que hacer.
- **La ventana es adaptativa y opt-in** (`tiempo: true` en la definición del juego). Los juegos
  que no la declaran mantienen su ritmo actual.
- **Aprende entre sesiones**, por juego, en `localStorage`: sube 300 ms tras dos aciertos a tiempo
  seguidos; baja 600 ms al no llegar. Suelo 4 s, techo 8 s. **Provisional**: se revisará con
  datos reales. `panel.html` muestra el valor actual y permite reiniciarlo a 4 s.
- **No se castiga ir despacio.** Ir despacio no resta, no cambia la ayuda a peor y no puntúa en
  negativo; como mucho, amplía la ventana.

## Verificación

`scripts/check.sh` aplica, mecánicamente:

- sintaxis JS con `node --check`;
- cero `transition`/`@keyframes` fuera de `css/movimiento.css`;
- cero `style.transition`/`style.animation` en `js/juegos`;
- cero confeti fuera de `js/comun.js`;
- rutas del catálogo de arte existentes.

La regla de un `.idle` por escena y la legibilidad del movimiento quedan para la revisión
visual humana: lo mecánico lo avisa `check.sh`, lo de diseño se decide mirando.

## Alcance

> Nota (2026-11-26): la parte de «Legado» de este alcance se sustituye por el
> [ADR 0004](0004-retirada-legado.md), que retira las páginas antiguas y `recorte-check.html`.

- **Dentro:** `juego.html` y los juegos que sirve (`js/juegos/*.js`, `css/movimiento.css`).
- **Legado:** `escalon0.html` y `punteria1.html` son copias antiguas y divergentes. Se migran a
  los tokens y a `.idle` después del piloto de `escalon1`, no antes.
- **Fuera:** las páginas de adulto (`index.html`, `panel.html`, `preview.html`,
  `recorte-check.html`) tienen su propia decoración y hover libre.

## Consecuencias

- Se levantan dos promesas: «sin movimiento en reposo» y «aprendizaje sin error». Es una
  decisión pedagógica, no técnica: un niño con dificultad motora necesita tiempo y, sobre todo,
  un juego que sea agradable de mirar.
- Las páginas de adulto dejan de heredar puntero, estela y la tecla `E`.
