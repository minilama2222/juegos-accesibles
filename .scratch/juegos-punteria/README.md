# Orden de trabajo — serie de juegos de puntería

Spec: `docs/specs/0001-serie-punteria-raton.md`

Trabajar **de bloqueante en bloqueante**. Cualquier ticket cuyos bloqueantes estén hechos puede empezar.

| # | Ticket | Bloqueado por |
|---|---|---|
| 01 | Maqueta jugable — menú, mundo y hover | — |
| 02 | Causa-efecto | 01 |
| 03 | Refuerzo, sonido y pegatinas | 02 |
| 04 | Ayuda adaptativa y métricas | 03 |
| 05 | Click estático | 04 |
| 06 | Aparición con tiempo | 05 |
| 07 | Parejas de 4, 6 y 8 | 06 |
| 08 | Movimiento lento | 06 |
| 09 | Tiro a portería | 05 |
| 10 | Cuatro mundos completos y accesibilidad | 03 |
| 11 | Arrastre — juego avanzado | 08 |

## Despliegue continuo

GitHub Pages se configura desde el **primer ticket (01)**. Cada push a `main` debe publicar la versión nueva:

- Pages sirve la rama `main` (raíz) del repo `minilama2222/juegos-accesibles`.
- Sin build: lo que se sube es lo que se sirve.
- Flujo por ticket: commit en `opencode/juegos` → push → **merge a `main` por fast-forward** (`git push origin opencode/juegos:main`) → Pages lo publica.
- `main` no se comprueba localmente: está reservada por el worktree principal. El merge se hace empujando la ref directamente.
- Cada ticket se commitea, se mergea a `main` y se comprueba que Pages muestra la versión nueva.
- URL de Pages (ya activada, rama `main`, raíz): https://minilama2222.github.io/juegos-accesibles/
