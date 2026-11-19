# 0001 · Sistema de movimiento

- Estado: aceptado
- Fecha: 2026-11-19
- Fuente: [Animation Principles — game-development](https://github.com/dylantarre/animation-principles/blob/main/skills/01-by-domain/game-development/SKILL.md)
  (Dylan Tarre, MIT). Traducido a este proyecto; no copiado.

## Contexto

El proyecto anima en tres capas, y eso ya está decidido en `docs/specs/0001-serie-punteria-raton.md`:

| Capa | Qué posee | Dónde |
|---|---|---|
| Escena | objetivos, sprites, partículas, cámara | Kaplay (`js/escena.js`) |
| Interfaz | menú, mundos, pegatinas, cortinas, refuerzos DOM | GSAP (`js/main.js`) |
| CSS | hover de menú, transiciones de botones | `css/estilo.css` |

Y las matemáticas de animación del juego viven aparte, puras y testeadas: `js/animaciones.js`.

La regla que faltaba es **cuál es el criterio**: sin ella, cada mecánica inventa su curva y su
duración, y el juego se vuelve ruidoso justo para un niño con TDAH al que los movimientos
«contenidos, no excesivos» le ayudan (problema de la spec).

## Los 12 principios, traducidos aquí

| Principio | Aquí significa |
|---|---|
| Squash & stretch | Sobre el **sprite**, con volumen: si estira en X, encoge en Y (`animarAparicion`, `animarAcierto`). |
| Anticipación | La aparición se encoge antes de crecer (`anticipo = 0,18`). El hover avisa de que el objetivo se puede tocar. |
| Staging | Una cosa por pantalla; el idle solo en la pieza que se debe tocar. |
| Straight ahead / pose to pose | Pose a pose: la función pura devuelve el estado para un `progreso`; el motor solo lo aplica. |
| Follow through | El refuerzo sigue al acierto (salto, desvanecido) y el confeti cierra la partida. |
| Slow in / slow out | `cubicOut`/`suave`; nunca `linear` en movimiento de personaje. |
| Arc | El acierto rota mientras sube (`giro`), no sube en línea recta. |
| Secondary action | Sonido, pegatina y confeti acompañan; no sustituyen al refuerzo. |
| Timing | Refuerzo ≤ `ACIERTO_MS` (480 ms); el siguiente objetivo nunca queda tapado. |
| Exageración | Medida **en forma** (contorno y recorrido), no en un porcentaje fijo: el overshoot de la aparición llega a ~1,28 y vuelve. |
| Solid drawing | Un perro aplastado sigue siendo un perro. La silueta manda; lo decide la revisión visual. |
| Appeal | El movimiento existe para que el juego sea agradable de mirar, no para lucirse. |

## Reglas vinculantes

1. **Una sola fuente de matemáticas de animación.** Las curvas del juego viven en
   `js/animaciones.js`, son funciones puras de `progreso` y están cubiertas por
   `tests/animaciones.test.js`. Ninguna mecánica reimplementa una curva a mano.
2. **Una capa, un dueño.** Kaplay posee la escena; GSAP la interfaz; el CSS el hover del menú.
   Nunca se anima el mismo objeto con dos de ellas (ya en la spec).
3. **Squash con volumen.** Si una animación estira en un eje, encoge en el otro. No se deforma un
   pictograma hasta volverlo irreconocible; eso lo decide una revisión visual, no un número.
4. **Anticipación antes de acción.** Toda aparición anticipa (se encoge) antes de crecer.
5. **Refuerzo corto.** Un refuerzo de acierto no pasa de 480 ms y no tapa el objetivo siguiente.
6. **Idle con función, uno por pantalla.** El movimiento en reposo solo va en piezas jugables, y
   como mucho hay **un** elemento animado en reposo en la pantalla de juego. En el menú, la
   llamada al juego puede latir unas repeticiones y parar. Nunca en el fondo ni en el decorado.
7. **Sin parpadeo** a más de 3 Hz en superficie grande (WCAG 2.3.1). No es estilo: es salud visual.
8. **Confeti, pieza única.** Solo `js/confeti.js` genera confeti; su duración (2,2–3,6 s) es la
   excepción declarada, porque premia la partida, no un clic.
9. **Movimiento reducido, sí.** `prefers-reduced-motion` se respeta en las tres capas con **un
   único interruptor**: una función `prefiereMenosMovimiento()` que consultan Kaplay, GSAP y el
   confeti. No vale que el CSS lo haga y la escena lo ignore. Lo que se reduce: confeti,
   partículas, overshoot de aparición, latidos del menú y cortinas. Lo que **no** se quita: el
   refuerzo de acierto (se acorta, no desaparece), porque es la señal de que acertó.

### 9.1 Estado de implementación

Hoy el CSS respeta `prefers-reduced-motion` solo en el menú (`.mundo`, `.juego`, `.salir`);
GSAP, Kaplay y el confeti lo ignoran. Pendiente: crear `js/movimiento-reducido.js`, inyectarlo en
la escena y en el bucle de confeti, y cubrirlo con tests.

## Tiempo y ayuda

La spec ya define la **ayuda adaptativa** por juego, persistente entre sesiones. Este ADR fija que
**el tiempo es parte de esa ayuda**:

- Los juegos con aparición con tiempo declaran su ventana y la ajustan con el nivel de ayuda.
- Ventana provisional: **4–8 s** (suelo y techo); sube en pasos de 300 ms tras dos aciertos a
  tiempo seguidos y baja 600 ms al no llegar.
- **Sin castigo por ir despacio**: no resta, no cambia la ayuda a peor y no puntúa en negativo.
- `prefers-reduced-motion`/panel del padre: ver regla 9.

## Verificación

- **Mecánica:** `node --test tests/*.test.js` — las curvas y la ventana son funciones puras.
- **Comportamiento:** Playwright sobre `window.juego` (acierto, refuerzo, fin de partida).
- **Visual:** que el pictograma se siga leyendo y que en pantalla haya como mucho un idle lo
  decide una persona mirando. Los tests no sustituyen ese ojo.

## Consecuencias

- Añadir una mecánica no obliga a inventar animación: reutiliza `js/animaciones.js` o añade una
  función pura con su test.
- El coste es disciplina: si una animación no cabe en estas reglas, se discute aquí, no en el PR.
