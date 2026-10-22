# Juegos accesibles

Minijuegos web para **practicar el uso del ratón y la atención sostenida**.

Diseñados bajo tres reglas que no se negocian dentro de un juego:

- **Cero texto.** Todo se entiende mirando.
- **Un solo clic.** Nada de arrastrar, doble clic ni pasar por encima.
- **Objetivos grandes** (mínimo 44×44 px, en la práctica mucho más) y **una cosa por pantalla**.

Y con dos principios de aprendizaje que vienen de la evidencia, no del gusto:

- **Aprendizaje sin error**: el juego lleva al acierto; no se deja fallar para «ver si acierta».
- **Refuerzo inmediato** (menos de un segundo). Las demoras de 6 s ya perjudican a algunos niños.

## Qué hay ahora mismo

| Página | Escalón | Qué entrena |
|--------|---------|-------------|
| `escalon0.html` | 0 · Toca y pasa algo | Causa-efecto puro. Imposible fallar. |
| `punteria1.html` | P1 · Diana estática | Puntería: un objetivo grande y quieto, con ayuda que se retira. |

`index.html` es la pantalla de selección: **esa sí lleva texto**, porque la usa un adulto para elegir.

## Cómo probarlo

No necesita servidor ni compilación: son ficheros estáticos.

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000
```

## Capa constante y capa variable

Esto es deliberado y está razonado en los ADR (en el proyecto privado):

- **Constante** (nunca cambia): puntero, tamaño de objetivo, posición del botón de volver,
  comportamiento del clic, ausencia de texto, duración e intensidad del refuerzo.
- **Variable** (puede cambiar por juego): el set de arte, la paleta y el fondo.

La variedad va en el **decorado**, no en las **reglas**. Si cambia la interfaz, cada juego nuevo obliga a
reaprender la mecánica y se pierde justo lo que se entrena.

## Estado y siguiente paso

El arte de esta primera versión está **dibujado por código** (SVG en `js/comun.js`), para poder probar la
mecánica y el puntero sin depender de recursos. La siguiente iteración sustituye esas formas por packs de
[kenney.nl](https://kenney.nl/assets) (CC0) y fondos generados con FLUX-1-dev, un set por juego.

## Métricas (para el adulto)

Dentro de un juego, pulsar **`E`** descarga un JSON con: aciertos, fallos, **distancia media del clic al
centro del objetivo** y **porcentaje de clics dentro**. Se guardan en el propio dispositivo
(`localStorage`); **no se envía nada a ningún servidor**.

## Accesibilidad

- Contraste de componentes **≥3:1** (WCAG 2.2).
- El color nunca es el único indicador.
- Sin autoplay, sin parpadeos, sin movimiento de fondo.
- Respeta `prefers-reduced-motion`.
- En pantalla táctil se usa el cursor del sistema y se ocultan puntero y estela.

Ver `ATTRIBUTION.md` para licencias.
