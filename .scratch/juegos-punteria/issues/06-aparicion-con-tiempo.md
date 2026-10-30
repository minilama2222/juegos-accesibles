# 06: Aparición con tiempo

**What to build:** Un juego donde el dibujo aparece visible unos segundos y luego hay un hueco; hay que clicarlo mientras está. Enseña a esperar y reaccionar y prepara la mecánica de movimiento.

**Blocked by:** 05 — Click estático

**Status:** ready-for-agent

- [ ] El objetivo alterna ventanas visible/hueco con tiempos definidos por la ayuda adaptativa.
- [ ] Clicar durante el hueco no penaliza con sonido duro ni quita progreso.
- [ ] El juego termina con un final claro y vuelve al menú.
- [ ] Disponible en los cuatro mundos desde el menú.
- [ ] `window.juego` expone si el objetivo está visible, aciertos y fin.
- [ ] Tests unitarios de ventanas temporales; test de Playwright de "espero, aparece y clico".
