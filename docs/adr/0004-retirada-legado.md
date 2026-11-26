# 0004 · Retirada de las páginas legado

- Estado: aceptado
- Fecha: 2026-11-26
- Sustituye: la parte de «Legado» del alcance del [ADR 0003](0003-movimiento.md).

## Contexto

`escalon0.html` y `punteria1.html` eran copias antiguas de dos juegos que ya existen en
`juego.html?j=escalon0` y `juego.html?j=punteria1`. Con el tiempo divergieron del motor: una no
registraba métricas, la otra no avanzaba de nivel y tenía su propio crecimiento del objetivo. Cada
arreglo había que hacerlo dos veces.

El ADR 0003 aplazaba su migración «después del piloto de `escalon1`». Ese piloto ya existe y la
escalera completa se sirve desde el motor, así que la condición está cumplida.

Además, `recorte-check.html` apuntaba a recortes SVG que se habían retirado y ya no servía para
comprobar nada.

## Decisión

Se **eliminan** `escalon0.html`, `punteria1.html` y `recorte-check.html`. No se dejan redirecciones:
las URLs antiguas dejan de existir a propósito. Los juegos quedan solo en `juego.html?j=<id>`.

`ctx3.json` no se toca: no es una página ni forma parte del sitio.

## Consecuencias

- Una sola implementación por juego y un solo sitio donde arreglar cada mecánica.
- `Juego.formaSVG` queda solo para la celebración final.
- Los marcadores o enlaces externos a las páginas antiguas dejan de funcionar; se asume porque el
  proyecto no tiene usuarios externos ni URLs publicadas.
- El alcance de «Legado» del ADR 0003 queda cerrado por este ADR.
