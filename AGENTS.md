# AGENTS.md

Punteros, no reglas duplicadas. Si algo no está aquí, está en el documento enlazado.

## Antes de tocar

- `README.md` — qué es el proyecto, cómo servirlo y qué es constante.
- `GLOSSARY.md` — vocabulario del dominio: ayuda, ronda, escena, catálogo, pista.
- `docs/adr/` — decisiones aceptadas. No reabrir una sin un ADR nuevo.

## Mapa

- `js/claves.js` — claves de `localStorage`. Debe cargarse antes de `comun.js`.
- `js/comun.js` — capa constante: puntero, audio, métricas, ayuda, celebración.
- `js/arte.js` — catálogo de sets, rutas, licencias y miniaturas.
- `js/motor.js` — registro de juegos, ronda y contexto `H` (`objetivo`, `pieza`, `toca`, `tocaFondo`, `resuelve`, `anotaClic`).
- `js/juegos/*.js` — definiciones: `arte`, `meta`, `siguiente` y `crear(H)`.
- `css/movimiento.css` — único sitio de `@keyframes` y `transition` de juego (ADR 0003).

## Comprobar

```bash
bash scripts/check.sh
```

Comprueba sintaxis, transiciones fuera de sitio, confeti fuera de `comun.js` y rutas del catálogo.
El workflow equivalente está en `.github/workflows/check.yml`.
