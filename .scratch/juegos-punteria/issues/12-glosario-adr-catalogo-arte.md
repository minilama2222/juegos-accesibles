# 12: Glosario y ADR del catálogo de piezas

**What to build:** Fijar el lenguaje y la decisión de arquitectura del catálogo de arte antes de mover ninguna pieza. Es un ticket de documentación: no toca código de juego ni cambia lo que se ve.

**Blocked by:** —

**Status:** pendiente

- [ ] Crear `GLOSSARY.md` en la raíz con estos términos, sin detalles de implementación:
  - **pieza**: imagen con identidad propia que se pinta en pantalla y se puede nombrar.
  - **catálogo**: manifiesto único que declara cada pieza, su fuente, su licencia y sus usos.
  - **fuente**: de dónde sale la pieza (SVG propio, PNG de ARASAAC o generador de fondo).
  - **variante**: pieza que comparte significado y forma base con otra, pero tiene su propio id y su propio fichero.
  - **reserva**: pieza que solo se pinta cuando falta la pieza real. No es arte de contenido.
  - **fondo**: pieza paisajística, generada a partir de la paleta del mundo.
  - **efecto procedural**: animación dibujada en canvas (confeti, estela, chispas del estallido). No es una pieza del catálogo.
- [ ] Crear `docs/adr/0004-catalogo-de-piezas.md` con la decisión aceptada:
  1. Una pieza, un id y un significado. Dos ids para el mismo dibujo son un error.
  2. Las piezas propias pasan a un SVG por fichero en `assets/propios/<id>.svg`.
  3. ARASAAC sigue siendo arte externo: se puede reseleccionar, nunca redibujar ni modificar.
  4. Los cuatro fondos siguen siendo generadores paramétricos, pero se declaran en el mismo catálogo.
  5. Los efectos procedurales quedan fuera.
  6. El manifiesto es la única fuente de verdad; la galería y los tests leen de él.
  7. La galería es de desarrollo y no está enlazada desde el menú del niño.
- [ ] Dejar claro en el ADR que **complementa** al 0003 y no lo sustituye: el 0003 decide *qué arte se usa*; el 0004 decide *dónde vive y cómo se identifica*.
- [ ] Enlazar el ADR y el glosario desde `CODING_STANDARDS.md` y desde `docs/adr/0003-arte-arasaac-primero.md`.
- [ ] No añadir código, tests ni assets nuevos en este ticket.

**Criterio de aceptación:** una persona nueva puede leer `GLOSSARY.md` y el ADR 0004 y saber qué es una pieza, qué diferencia hay entre pieza, variante, reserva y efecto, y por qué el arte propio vive en ficheros.
