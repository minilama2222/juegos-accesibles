# Spec 0001 — Serie de juegos para afinar la puntería con el ratón

Estado: **lista para agente** · Fecha: 2026-10-30 · Origen: entrevista (`/grill-me`) + acuerdos de costuras.

## Problem Statement

Jordán es un niño prelector, con TDAH diagnosticado, al que le cuesta **apuntar con el ratón**: mover y mantener el puntero sobre algo, y pulsar sin moverse. Se frustra rápido y, cuando pasa, quiere cambiar de juego. No sabe leer. Juega en un iMac grande, mirando a su padre, y le motivan los juegos vistosos (navidad, animalitos, fútbol, criaturas tipo Pokémon) y los movimientos contenidos, no excesivos.

No hay en casa nada que le entrene esta habilidad de forma progresiva, sin texto, sin castigo y sin bloquearle cuando pierde el interés.

## Solution

Una serie de juegos web estáticos, sin build, publicada en GitHub Pages, que él puede usar solo:

- Cinco o seis juegos cortos (60-90 s) que van de **hover puro** a **click estático**, **aparición con tiempo**, **movimiento lento**, **tiro a portería** y **parejas** (4, 6 y 8).
- Cada juego se juega en **cuatro mundos visuales**: navidad, animalitos, fútbol y criatura amarilla inspirada (sin IP real).
- Interfaz sin texto: pictogramas, color, forma y sonido.
- **Botón de "otro juego" siempre visible**; cambiar nunca penaliza.
- Refuerzo vistoso pero breve, premio final y colección de pegatinas.
- Métricas invisibles para el padre, nunca mostradas al niño.

## User Stories

1. Como Jordán, quiero ver un menú con dibujos grandes, para elegir juego sin saber leer.
2. Como Jordán, quiero elegir un mundo (navidad, animalitos, fútbol, criatura amarilla) al empezar, para jugar con lo que me gusta ese día.
3. Como Jordán, quiero que el mundo elegido se mantenga durante toda la sesión, para no tener que volver a elegirlo.
4. Como Jordán, quiero un primer juego donde tocar cualquier sitio provoque algo bonito, para entender que el ratón hace cosas.
5. Como Jordán, quiero un juego donde basta con dejar el puntero quieto encima de un dibujo, para practicar el apuntado sin pulsar.
6. Como Jordán, quiero que si me salgo del dibujo la barra se vacíe despacio, para poder volver sin empezar de cero.
7. Como Jordán, quiero que el objetivo del hover sea enorme al principio y se haga algo más pequeño con la práctica, para notar que mejoro sin frustrarme.
8. Como Jordán, quiero clicar un dibujo grande que no se mueve, para practicar el click con blanco fácil.
9. Como Jordán, quiero clicar dibujos que aparecen y desaparecen cuando quieren, para aprender a esperar y reaccionar.
10. Como Jordán, quiero clicar un dibujo que se mueve despacio, para practicar el seguimiento.
11. Como Jordán, quiero tirar balones a una portería con huecos, para disfrutar apuntando con precisión.
12. Como Jordán, quiero jugar a las parejas de 4, 6 u 8, para tener un juego tranquilo y de memoria.
13. Como Jordán, quiero que cada partida dure poco y termine con un final claro, para no aburrirme.
14. Como Jordán, quiero ver un refuerzo espectacular pero muy corto al acertar, para sentirme bien sin que me tape el siguiente objetivo.
15. Como Jordán, quiero oír sonidos y música alegres, para no aburrirme.
16. Como Jordán, quiero poder silenciar el sonido con un botón, para cuando no quiera ruido.
17. Como Jordán, quiero un botón grande de "otro juego" siempre visible, para cambiar cuando me frustro.
18. Como Jordán, quiero que salir de un juego no me quite nada, para no tener miedo de probar.
19. Como Jordán, quiero que cuando cambie de juego varias veces seguidas no me regañen ni me bloqueen, para sentirme libre.
20. Como Jordán, quiero una pegatina al terminar una partida, para coleccionarlas.
21. Como Jordán, quiero ver mis pegatinas juntas, para presumir de colección.
22. Como Jordán, quiero ver mi nombre o mi avatar en el menú, para sentir el juego mío.
23. Como Jordán, quiero que el juego ocupe toda la pantalla del iMac, para no perderme en ventanas.
24. Como Jordán, quiero un puntero grande y visible, para saber dónde estoy.
25. Como Jordán, quiero que los errores se noten poco, para no sentirme mal.
26. Como Jordán, quiero que el juego funcione aunque pulse rápido muchas veces, para quejarme desahogándome sin romper nada.
27. Como Jordán, quiero que la música de fondo sea suave y opcional, para no distraerme.
28. Como padre, quiero que el juego funcione abriendo una página, para no tener que instalar nada.
29. Como padre, quiero que el juego funcione en GitHub Pages, para abrirlo desde cualquier sitio.
30. Como padre, quiero que la dificultad se adapte sola, para que él reciba el reto justo.
31. Como padre, quiero que las métricas se guarden localmente sin verse en pantalla, para saber si progresa.
32. Como padre, quiero poder exportar las métricas, para revisarlas cuando él no esté.
33. Como padre, quiero que todas las animaciones se reduzcan si el sistema lo pide, para no marearle.
34. Como padre, quiero que el juego no dependa de red más allá de la primera carga, para que vaya rápido.
35. Como padre, quiero que el contenido temático sea sustituible sin tocar la lógica, para añadir mundos después.

## Implementation Decisions

### Stack y distribución

- **Estático, sin build**: HTML + módulos ES + CSS + JS vendoreados.
- **Kaplay 3001.0.19** (67 KB gz, MIT) vendoreado: escena de juego (`canvas`, sprites, movimiento, partículas).
- **GSAP 3.15.0** (27 KB gz, licencia libre de Webflow desde 2025) vendoreado: UI fuera del canvas (menú, mundos, pegatinas, transiciones, refuerzos DOM).
- **Separación de capas**: Kaplay posee la escena de juego; GSAP posee la capa de interfaz. No se anima el mismo objeto con ambos.
- **Assets**: SVG propios generados; sin ARASAAC ni descargas externas; sin IP real.
- **Deploy**: GitHub Pages desde `main` del repo `minilama2222/juegos-accesibles`.
- **Sin backend, sin almacenamiento remoto**: `localStorage` únicamente.

### Modelo de contenido

- Un **juego** es una definición pura: `id`, `mecánica`, `reglas` (nº de objetivos, tamaños, tiempos, cadencia), sin DOM ni canvas.
- Un **mundo** es un paquete visual intercambiable: paleta, fondo, sprites (objetivo, refuerzo, puntero), sonido de acierto/error y nombre pictográfico.
- La combinación **juego × mundo** no cambia reglas: sólo aspecto. Añadir un mundo no toca la lógica.
- Progresión recomendada (no bloqueante): causa-efecto → hover → click estático → aparición → movimiento lento → tiro a portería → parejas.

### Mecánicas

- **Causa-efecto**: click en cualquier parte de la escena produce una aparición; el objetivo no importa.
- **Hover**: objetivo que se amplía; el puntero debe permanecer dentro ~0,6-1 s con una barra que se llena; salirse vacía lentamente y no penaliza; sin click.
- **Click estático**: objetivo grande fijo, se recoloca lejos entre aciertos.
- **Aparición**: objetivo visible unos segundos y hueco; el click fuera de tiempo no penaliza con sonido duro.
- **Movimiento lento**: objetivo con trayectoria suave, velocidad creciente por nivel de dificultad.
- **Tiro a portería**: escena fija con huecos clicables; acierto = animación de balón y celebración corta.
- **Parejas**: 4, 6 u 8 parejas por elección; tablero que se adapta al tamaño de pantalla.
- **Tamaño de objetivo nunca por debajo de 44 px**; en la práctica, mucho mayores.

### Interacción

- **Botón "otro juego"** fijo, grande, siempre visible y fuera del área de juego; lleva al selector sin pedir confirmación.
- **Selector de mundo** al entrar en la serie; la elección persiste durante la sesión.
- **Puntero propio** grande dibujado por la escena, con estela corta y opcional.
- **Sin texto en el juego**; pictogramas, color y audio.
- **Refuerzo** <0,5 s de duración; nunca oculta el siguiente objetivo más tiempo.
- **Fallo**: animación y sonido suaves; sin pérdida de progreso ni vidas.

### Ayuda adaptativa

- Cada juego mantiene un **nivel de ayuda** ajustado por aciertos y fallos consecutivos.
- La ayuda puede agrandar el objetivo, alargar el tiempo de aparición, ralentizar el movimiento o acercar el objetivo al puntero.
- El nivel de ayuda se guarda por juego y persiste entre sesiones.

### Estado y almacenamiento

- `localStorage` con claves versionadas: mundo elegido, ayuda por juego, pegatinas, métricas.
- **Métricas locales**: partidas jugadas, aciertos, fallos, duración, cambios de juego, ayuda final. Exportables por el padre.
- Nada de estadísticas visibles en juego.

### Accesibilidad y ergonomía

- Todo escalado con `vmin`; sin scroll accidental; pantalla completa opcional.
- `prefers-reduced-motion` reduce o elimina animaciones de confeti y partículas.
- Táctil no soportado (detección y aviso discreto al padre).
- Un `pointer-coarse` o móvil no rompe la página, simplemente no es el objetivo.

### Costuras para test

Dos costuras, acordadas:

1. **Lógica pura** — definiciones de contenido, estado de partida, ayuda adaptativa, progresión y almacenamiento. Testeable en node sin navegador.
2. **Comportamiento** — la API pública `window.juego` (estado observable: juego actual, mundo, objetivos activos, aciertos, fin de partida) más atributos `data-*` en el DOM. Los tests de navegador hablan con esa API, nunca con coordenadas de canvas.

## Testing Decisions

- Se testea **comportamiento externo**, no implementación: dado el estado y una entrada de puntero, qué transición ocurre y qué se observa en `window.juego`; qué se persiste en almacenamiento.
- **Unitarios (node `--test`)**: reglas de cada mecánica (llenado y vaciado de la barra de hover, ventanas de aparición, trayectorias, reglas de parejas), ayuda adaptativa, progresión y almacenamiento con falsos de almacenamiento.
- **Comportamiento (Playwright 1.64.1, Chromium headless)**: smoke por mecánica — hover rellena, click acierta, click falla suavemente, "otro juego" navega, mundo persiste al cambiar de juego, partida termina y da pegatina.
- Prior art: no existe todavía en el repo; esta serie define la primera suite.
- Cada test de navegador arranca la página servida estáticamente y termina en un estado limpio.
- Los tests no usan capturas como criterio de éxito; las capturas sólo sirven como evidencia para el padre.

## Out of Scope

- Táctil, móvil y control por teclado.
- Arrastrar y soltar.
- Doble clic.
- Multijugador, cuentas, backend, sincronización.
- Otras lenguas aparte de nombres de fichero y código.
- Accesorios físicos (ratón adaptado, eye-tracker).
- Panel de métricas visible para el padre en esta versión (sólo export).
- Contenido con IP real (Pokémon, Disney, etc.).

## Further Notes

- La decisión de Kaplay frente a DOM puro asume que el juego crecerá; el precio es que la escena no es DOM accesible. Se compensa con hitboxes generosas y la API `window.juego`.
- GSAP es libre desde abril de 2025 bajo licencia "no charge" de Webflow; se respeta la marca y la licencia en los créditos del repositorio.
- El repo arranca de cero: no se reutiliza nada del código anterior de la rama `main` previa (`8b620cf`), que queda sólo como histórico.
- El padre dispone de Playwright y Chromium instalados para desarrollar y probar; eso no es requisito para jugar.
