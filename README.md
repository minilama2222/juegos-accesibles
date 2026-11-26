# Juegos accesibles

Minijuegos web para **practicar el uso del ratón y la atención sostenida**.

Diseñados bajo tres reglas que no se negocian dentro de un juego:

- **Cero texto.** Todo se entiende mirando.
- **Un solo clic.** Nada de arrastrar, doble clic ni pasar por encima.
- **Objetivos grandes** (mínimo 44×44 px, en la práctica mucho más) y **una cosa por pantalla**.

Y con dos principios de aprendizaje que vienen de la evidencia, no del gusto:

- **Ventana adaptativa, sin castigo por ir despacio**: el juego lleva al acierto y, si hay tiempo,
  la ventana aprende el ritmo del niño en vez de penalizarlo (ver [ADR 0003](docs/adr/0003-movimiento.md)).
- **Refuerzo inmediato** (menos de un segundo). Las demoras de 6 s ya perjudican a algunos niños.

## Qué hay ahora mismo

| Juego | Escalón | Qué entrena |
|-------|---------|-------------|
| `juego.html?j=escalon0` | 0 · Toca y pasa algo | Causa-efecto puro. Imposible fallar. |
| `juego.html?j=escalon1` | 1 · El que brilla | Elegir entre dos objetivos grandes. |
| `juego.html?j=escalon2` | 2 · Toca el que suena | Elegir entre tres usando el sonido. |
| `juego.html?j=escalon3` | 3 · ¿Dónde está? | Seguir un objetivo que aparece y se esconde. |
| `juego.html?j=parejas` | 4–6 · Parejas | Memoria visual con parejas de animales. |
| `juego.html?j=punteria1` | P1 · Diana estática | Puntería: un objetivo grande y quieto, con ayuda que se retira. |

`index.html` es la pantalla de selección: **esa sí lleva texto**, porque la usa un adulto para elegir.
Los juegos se sirven solo por `juego.html?j=<id>`; las antiguas páginas sueltas se retiraron
(ver [ADR 0004](docs/adr/0004-retirada-legado.md)).

## Cómo probarlo

No necesita servidor ni compilación: son ficheros estáticos.

```bash
python3 -m http.server 8000
# y abrir http://localhost:8000
```

## Capa constante y capa variable

Esto es deliberado y está razonado en los ADR del repo:

- [`docs/adr/0001-capa-constante.md`](docs/adr/0001-capa-constante.md) — qué es constante y qué variable.
- [`docs/adr/0002-reglas-no-negociables.md`](docs/adr/0002-reglas-no-negociables.md) — las tres reglas.
- [`docs/adr/0003-movimiento.md`](docs/adr/0003-movimiento.md) — cómo se mueve el juego (los 12 principios).
- [`docs/adr/0004-retirada-legado.md`](docs/adr/0004-retirada-legado.md) — retirada de las páginas antiguas.

- **Constante** (nunca cambia): puntero, tamaño de objetivo, posición del botón de volver,
  comportamiento del clic, ausencia de texto, duración e intensidad del refuerzo.
- **Variable** (puede cambiar por juego): el set de arte, la paleta y el fondo.

La variedad va en el **decorado**, no en las **reglas**. Si cambia la interfaz, cada juego nuevo obliga a
reaprender la mecánica y se pierde justo lo que se entrena.

## Estado y siguiente paso

El arte actual son pictogramas de [ARASAAC](https://arasaac.org) (CC BY-NC-SA). El catálogo
—qué set usa cada juego, rutas, miniaturas y licencia— vive en `js/arte.js`; el índice, el panel y
la página de revisión leen de ahí. Las formas SVG de `js/comun.js` quedan solo en la celebración
final.

## Métricas (para el adulto)

Dentro de un juego, pulsar **`E`** descarga un JSON con el historial local por juego —aciertos, fallos,
**distancia media del clic al centro del objetivo** y **porcentaje de clics dentro**— y la sesión en
curso. Es el mismo almacén que lee `panel.html`. Se guarda en el propio dispositivo
(`localStorage`); **no se envía nada a ningún servidor**.

La ventana adaptativa del [ADR 0003](docs/adr/0003-movimiento.md) (4–8 s) está **prevista pero
todavía no implementada**: ningún juego declara `tiempo: true` y `panel.html` no muestra ese valor.
Cuando se implemente, aprenderá el ritmo del niño entre sesiones.

## Accesibilidad

- Contraste de componentes **≥3:1** (WCAG 2.2).
- El color nunca es el único indicador.
- Sin autoplay ni parpadeos a más de 3 Hz en superficie grande (WCAG 2.3.1).
- La clase `.idle` está definida para una pieza jugable por pantalla, pero ningún juego la usa
  todavía. Ver [ADR 0003](docs/adr/0003-movimiento.md).
- En pantalla táctil se usa el cursor del sistema y se ocultan puntero y estela.

Ver `ATTRIBUTION.md` para licencias.
