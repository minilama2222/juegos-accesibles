# 0002 · Arte de los objetivos: pictogramas ARASAAC

- Estado: aceptado
- Fecha: 2026-11-24
- Sustituye: la línea «Assets: SVG propios generados; sin ARASAAC ni descargas externas» de
  `docs/specs/0001-serie-punteria-raton.md`.

## Contexto

El objetivo de cada mundo estaba declarado en `contenido.js` (`regalo`, `gato`, `balon`,
`bicho`) pero la escena solo dibujaba un círculo del color del mundo. Al dibujar los objetos se
planteó usar pictogramas de ARASAAC en lugar de seguir ampliando el SVG propio.

## Decisión

Los **objetos de los objetivos** son pictogramas ARASAAC (PNG de 500 px, fondo transparente),
centrados dentro de la bola:

| Mundo | Pictograma | ID |
|---|---|---|
| Navidad | regalo | 25381 |
| Animalitos | gato | 7114 |
| Fútbol | balón | 2269 |
| El monstruo amarillo | carita | 13354 |

La bola de color se queda como fondo: da área de clic grande y contorno blanco legible sobre
cualquier fondo. El dibujo ocupa el 78 % del diámetro.

El resto del arte (avatar, sprites de refuerzo, puntero, fondos) sigue siendo vectorial propio.

## Consecuencias

- **Licencia:** ARASAAC es CC BY-NC-SA 4.0. El proyecto queda limitado a uso **no comercial** y
  debe mantener la atribución en `ATTRIBUTION.md`. Si se comercializara, hay que sustituirlos.
- Los pictogramas no se modifican; solo se escalan al dibujar.
- Cada objetivo necesita su asset (`assets/arasaac/`). Añadir un mundo es añadir un PNG y una
  entrada en `contenido.js`.
- Mezcla de estilos: pictogramas con trazo negro para lo que se toca, SVG planos para el
  decorado. Es deliberado: el objeto debe leerse como «esto es un gato» sin ambigüedad.
