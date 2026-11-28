# 14: Nombres canónicos, variantes y fin de las repeticiones

**What to build:** Que cada dibujo tenga un solo nombre y un solo significado, que las variantes
se declaren como tales y que desaparezcan las repeticiones detectadas. Incluye arreglar el
refuerzo del mundo, que hoy cae siempre en la estrella de reserva.

**Blocked by:** 13 — Catálogo único y piezas propias como SVG

**Status:** pendiente

- [ ] Aplicar la regla de nombres: id en español, singular y sin sufijo de fuente. La fuente es
  un metadato (`tipo`/`fuente`), no parte del nombre.
- [ ] Quitar el sufijo `Arasaac` cuando ya no haga falta:
  - `copoArasaac` → `copo`
  - `huellaArasaac` → `huella`
  - `estrellaArasaac` → `estrella`
  - `bichoArasaac` → `pulpo` (el PNG 3379 es un pulpo, no un bicho genérico)
- [ ] Resolver la colisión de la estrella:
  - `estrella` queda como el pictograma ARASAAC 3100 (pegatina y Navidad).
  - `chispa` queda como el gesto propio del refuerzo del mundo amarillo.
  - Se elimina `chispaArasaac` y el id 3100 deja de estar declarado dos veces.
- [ ] Retirar las reservas muertas del arte propio: `copo`, `huella` y `bicho`. La estrella
  propia de reserva pasa a `sin-dibujo` y solo se usa como fallback cuando falta una pieza; no
  es una pieza de contenido.
- [ ] Declarar las variantes con `varianteDe`, sin fusionar ficheros:
  - `silencio` → variante de `sonido`
  - `musicaApagada` → variante de `musica`
  - `pantallaSalir` → variante de `pantalla`
  Cada una conserva su propio SVG y se puede rediseñar por separado.
- [ ] Arreglar `mostrarSello` en `main.js`: el refuerzo se resuelve por el catálogo y respeta
  el tipo de pieza. Un refuerzo ARASAAC pinta su PNG; un refuerzo propio pinta su SVG. Hoy
  `copoArasaac`, `huellaArasaac`, `silbatoArasaac` y `chispaArasaac` acaban en la estrella.
- [ ] Actualizar `js/contenido.js`, `js/pegatinas.js`, `js/main.js` y los tests con los nombres
  canónicos.
- [ ] Migrar la colección guardada si cambia algún id de pegatina: `bicho` → `pulpo` debe
  conservar las veces ganadas. Nada de perder progreso del niño por un renombrado.
- [ ] Regenerar la tabla de `ATTRIBUTION.md` con `npm run arasaac:licencia`.
- [ ] Comprobar que no hay dos fichas con la misma `fuente`, salvo que sean el mismo dibujo
  declarado como variante (y en ese caso la fuente también es distinta).

**Criterio de aceptación:** no existe ninguna pareja de ids apuntando al mismo dibujo; no queda
ninguna reserva muerta; los cuatro refuerzos de mundo pintan el dibujo que les toca; `npm test`
en verde y la colección antigua se conserva.
