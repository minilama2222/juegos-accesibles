# 04: Ayuda adaptativa y métricas

**What to build:** Cada juego ajusta su nivel de ayuda solo, según aciertos y fallos: agranda objetivos, alarga ventanas o ralentiza movimiento, y recuerda ese ajuste entre sesiones. En paralelo se guardan métricas invisibles para Jordán que el padre puede exportar.

**Blocked by:** 03 — Refuerzo, sonido y pegatinas

**Status:** ready-for-agent

- [ ] Cada juego mantiene y persiste un nivel de ayuda ajustado por aciertos y fallos consecutivos.
- [ ] La ayuda se aplica como máximo en tamaño, tiempo o velocidad, sin cambiar las reglas visibles.
- [ ] El nivel de ayuda de un juego no afecta a otro.
- [ ] Se registran partidas, aciertos, fallos, duración, cambios de juego y ayuda final en `localStorage`.
- [ ] Existe una exportación de métricas para el padre, sin nada de esto visible en el juego.
- [ ] Tests unitarios de la escalera de ayuda y del almacenamiento; test de Playwright de que fallar repetidamente agranda el objetivo de forma observable en `window.juego`.
