# 17: Flujo de rediseño por pieza y auditoría inicial

**What to build:** Convertir el catálogo en una herramienta de mejora continua: un proceso
claro para rediseñar una pieza, verla a tamaño real, aprobarla y publicarla, más una primera
auditoría del arte propio.

**Blocked by:** 15 — Galería `catalogo.html` · 16 — Guardarraíles del catálogo en los tests

**Status:** pendiente

- [ ] Escribir `docs/arte/README.md` con el proceso:
  1. Elegir una pieza del catálogo (empezar por las marcadas `boceto`).
  2. Abrir su SVG en `assets/propios/<id>.svg` y rediseñarlo sin tocar el resto.
  3. Verla en `catalogo.html` a 40, 100 y 300 px sobre claro, oscuro y los cuatro mundos.
  4. Comparar con el estado anterior y anotar la decisión en `nota`.
  5. Cambiar `estado` a `aprobado` solo si se lee bien en los tres tamaños y en los cuatro
     fondos.
  6. Ejecutar `npm run check` y `npm test`, publicar y comprobar Pages.
- [ ] Añadir a la galería un filtro `?estado=boceto` y un contador de piezas pendientes.
- [ ] Hacer la auditoría inicial de las 25 piezas propias a los tres tamaños y sobre los cuatro
  fondos. Registrar en `docs/arte/auditoria.md`:
  - pieza,
  - estado (`aprobado` o `boceto`),
  - problema visual observado,
  - prioridad y nota de rediseño.
- [ ] Marcar como `boceto` todo lo que no aguante el tamaño pequeño; como `aprobado`, lo que ya
  se lea bien.
- [ ] Rediseñar una pieza piloto de principio a fin para validar el proceso. Propuesta:
  `destello`, porque es el icono de la primera mecánica, se ve grande en el menú y es simple.
- [ ] Comprobar que el rediseño de la piloto no cambia ninguna regla, ningún test de juego y
  ninguna posición; solo el dibujo.
- [ ] Dejar en el README de arte el orden recomendado de los siguientes rediseños.

**Criterio de aceptación:** existe una lista visible de piezas pendientes, una pieza piloto
rediseñada y publicada, y cualquier persona puede repetir el proceso con otra pieza sin tocar
lógica de juego.
