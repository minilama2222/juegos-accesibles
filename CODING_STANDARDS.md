# Estándares de código

Reglas para la **revisión**. Lo que ya cubren tests o CI no se repite aquí; esto recoge los
juicios que un check automático no puede sustituir.

## Escenas (Kaplay)

- El canvas de la escena es **transparente** (`background: [0,0,0,0]`); el fondo del mundo lo
  pinta `main.js` con el SVG de `js/fondos.js`. Una escena con `background: mundo.fondo` tapa el
  arte del mundo.
- El registro de mecánicas es `MECANICAS` (`js/contenido.js`) + `ARRANQUES` (`js/escena.js`).
  Añadir una mecánica es añadir su entrada en ambos; no una cascada nueva de `if`.
- `window.juego.escena` publica estado observable: objetivo, aciertos, fallos, ayuda, terminada y
  lo específico de la mecánica. Los tests de navegador hablan con esa API.

## Movimiento y ayuda

- Toda curva de animación vive en `js/animaciones.js`, pura y testeada (ADR 0001). La escena solo
  aplica el resultado.
- La ayuda adaptativa solo puede agrandar, alargar o ralentizar. Nunca quita progreso ni cambia
  reglas visibles.
- Un fallo es **suave**: sin sonido duro, sin vidas y sin retroceso.
- Un objetivo no acepta acierto hasta que es **visible de verdad** (por opacidad/fase), no solo
  porque exista en la escena.

## Mecánicas nuevas

- Cada mecánica declara `id`, `implementada`, `icono`, su meta/reglas y funciona en los cuatro
  mundos.
- Si una mecánica nueva repite el patrón de otra escena, extrae primero un helper puro (por
  ejemplo a `js/escena-comun.js`) antes de añadir la enésima copia.
- Los tests de navegador usan `window.juego`, no coordenadas internas de Kaplay.

## Reglas de producto

- Cero texto visible dentro de un juego; el menú puede usar `aria-label` para el adulto.
- Un solo gesto: un clic. El arrastre es la excepción declarada de nivel avanzado.
- Objetivos y cartas de **44 px mínimo**, en la práctica mucho mayores.

## Dónde mirar

- `docs/adr/0001-sistema-de-movimiento.md`: capas, curvas y movimiento reducido.
- `docs/adr/0003-arte-arasaac-primero.md`: arte y licencias (sustituye a 0002).
- `docs/specs/0001-serie-punteria-raton.md`: producto y costuras de test.
- `.scratch/juegos-punteria/README.md`: estado de los tickets.
