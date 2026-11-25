# AGENTS.md

Instrucciones para quien trabaje en este repo (persona o agente).

## Publicación: cada cambio se ve en GitHub Pages

El interlocutor trabaja en remoto y **no puede abrir ficheros locales ni un servidor de tu máquina**.
Un cambio no está terminado hasta que está publicado y se puede abrir en:

**https://minilama2222.github.io/juegos-accesibles/**

Esto no es opcional y no se pregunta cada vez: se hace siempre.

### Flujo

Pages sirve la rama `main`, raíz del repo, **sin build**. Lo que se sube es lo que se sirve.

```bash
# 1. trabajar y commitear en la rama de trabajo
git add -A && git commit -m "..."

# 2. publicar la rama
git push origin opencode/juegos

# 3. publicar en la web (merge fast-forward a main)
git push origin opencode/juegos:main
```

- `main` no se toca localmente desde este worktree: se empuja la ref directamente.
- Nunca `--force` a `main`.
- Pages tarda ~30–60 s en reconstruir. Si la URL sigue mostrando lo viejo, espera y recarga
  con caché limpia (`?v=<algo>`).

### Verificar antes de decir «hecho»

```bash
npm run verificar-pages
```

Comprueba que la URL responde 200 y que el último build de Pages es tu `HEAD`. Si quieres mirar un
fichero concreto, `curl -s https://minilama2222.github.io/juegos-accesibles/js/<fichero> | head`.
Solo entonces entrega la URL.

## Dónde está el proyecto

- Worktree activo: `/root/work/juegos-opencode`, rama `opencode/juegos`.
- El worktree `/root/work/juegos-accesibles` está en `main` y **desfasado**; no es la base para
  trabajo nuevo.
- Orden de tickets y spec: `.scratch/juegos-punteria/README.md` y
  `docs/specs/0001-serie-punteria-raton.md`.
- Decisiones de arquitectura: `docs/adr/`. La primera es
  [`0001-sistema-de-movimiento.md`](docs/adr/0001-sistema-de-movimiento.md).
- Criterios de revisión: [`CODING_STANDARDS.md`](CODING_STANDARDS.md).

## Trabajo en paralelo

`opencode.worktree_create` deja el worktree **detached en el `main` viejo** y sin `node_modules`.
Para un ticket o rama nueva usa el script del repo:

```bash
scripts/worktree.sh ticket-99
# crea ../juegos-opencode-ticket-99, rama ticket-99 desde opencode/juegos, con node_modules enlazado
```

Después trabaja dentro de ese directorio y no toques el worktree de integración.

## Reglas de producto (no se negocian dentro de un juego)

- Cero texto: todo se entiende mirando.
- Un solo gesto: un clic. El arrastre solo existe en el juego avanzado (ticket 11).
- Objetivos grandes y una cosa por pantalla.

Ver `docs/specs/` para el detalle.
