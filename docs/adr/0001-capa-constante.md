# 0001 · Capa constante y capa variable

- Estado: aceptado
- Fecha: 2026-11-19
- Origen: formaliza la sección «Capa constante y capa variable» del README. Hasta ahora la
  decisión solo vivía en el README; este ADR es el sitio donde se registra.

## Contexto

Cada juego nuevo corre el riesgo de introducir su propio puntero, su propio tamaño de objetivo
o su propio comportamiento del clic. En un minijuego de práctica de ratón, eso obliga al niño a
reaprender la mecánica en cada pantalla y se pierde justo lo que se entrena: la atención
sostenida y la puntería.

## Decisión

El proyecto se divide en dos capas explícitas.

**Constante** — no cambia de un juego a otro:

- puntero propio (flecha grande, sin adornos) y estela de puntos;
- tamaño mínimo de objetivo (44 px como piso; en la práctica, 96 px y se escala por juego);
- posición del botón de volver e interruptor de sonido;
- comportamiento del clic: un solo `pointerdown`, un solo gesto;
- ausencia de texto dentro del juego;
- duración e intensidad del refuerzo (ver `0003-movimiento`).

**Variable** — puede cambiar por juego:

- el set de arte (pictogramas y sprites);
- la paleta de acento;
- el fondo y el decorado.

## Consecuencias

- La variedad va en el **decorado**, no en las **reglas**. Un juego nuevo elige arte y paleta,
  no interacción.
- Todo cambio que altere la capa constante es un cambio de ADR, no una decisión de juego.
- El modo adulto de `comun.js` (`data-modo="adulto"` en el `<script>`) existe porque las páginas de adulto también
  cargan el mismo fichero: sin él, heredan puntero, estela y la tecla `E` de exportar métricas.
