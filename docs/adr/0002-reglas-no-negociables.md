# 0002 · Reglas no negociables

- Estado: aceptado
- Fecha: 2026-11-19
- Origen: formaliza las tres reglas del README que hasta ahora no tenían ADR.

## Decisión

Dentro de un juego:

1. **Cero texto.** Todo se entiende mirando. `index.html` y `panel.html` son la excepción: los
   usa un adulto.
2. **Un solo clic.** Nada de arrastrar, doble clic ni pasar por encima como requisito. El único
   gesto es un `pointerdown`. El imán `.cerca` (crecer al acercarse el cursor) es una ayuda
   *opcional*: avisa de que un clic va a acertar, pero el juego funciona idéntico si el niño
   nunca pasa por encima.
3. **Objetivos grandes y una cosa por pantalla.** Mínimo 44 × 44 px; en la práctica, mucho más.

## Cambios posteriores

En la misma fecha se levantaron dos reglas de aprendizaje que el README defendía y que este ADR
no cubría:

- «Aprendizaje sin error» → **ventana adaptativa, sin castigo por ir despacio** (ver
  `0003-movimiento`).
- «Sin movimiento de fondo / sin parpadeos» como promesa absoluta de reposo → **idle con
  función, un solo `.idle` por pantalla** (ver `0003-movimiento`). El parpadeo a más de 3 Hz en
  superficie grande sigue prohibido: es salud visual (WCAG 2.3.1), no estilo.

Las tres reglas de este ADR siguen vigentes. Lo que cambia es *cómo se practica* dentro de
ellas, no qué gestos hay que aprender.

## Consecuencias

- Las reglas se aplican a `juego.html` y a los juegos que sirve (`js/juegos/*.js`). Las
  páginas de adulto están fuera de su alcance.
- Una regla solo cambia con un ADR que la sustituya, no con un commit de un juego.
