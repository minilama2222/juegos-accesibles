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
curl -s -o /dev/null -w "%{http_code}\n" https://minilama2222.github.io/juegos-accesibles/
curl -s https://minilama2222.github.io/juegos-accesibles/js/<fichero-modificado> | head
gh api repos/minilama2222/juegos-accesibles/pages/builds/latest --jq '.status, .commit'
```

Comprueba que el build corresponde a tu commit y que el fichero nuevo se sirve. Solo entonces
entrega la URL.

## Dónde está el proyecto

- Worktree activo: `/root/work/juegos-opencode`, rama `opencode/juegos`.
- El worktree `/root/work/juegos-accesibles` está en `main` y **desfasado**; no es la base para
  trabajo nuevo.
- Orden de tickets y spec: `.scratch/juegos-punteria/README.md` y
  `docs/specs/0001-serie-punteria-raton.md`.
- Decisiones de arquitectura: `docs/adr/`. La primera es
  [`0001-sistema-de-movimiento.md`](docs/adr/0001-sistema-de-movimiento.md).

## Reglas de producto (no se negocian dentro de un juego)

- Cero texto: todo se entiende mirando.
- Un solo gesto: un clic. Sin arrastrar ni doble clic.
- Objetivos grandes y una cosa por pantalla.

Ver `docs/specs/` para el detalle.
