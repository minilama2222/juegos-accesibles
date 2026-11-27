# Glosario

Términos del dominio tal como los usa el proyecto. Si un concepto cambia de
significado, se cambia aquí y en el código, no solo en la conversación.

## Ayuda

Apoyo que el juego da al niño y que **se retira con el acierto y crece con el
fallo**. Su valor va de `0.3` (mínima) a `1` (máxima) y lo mueve
`Juego.metricas.registrarResultado()` en `js/comun.js`.

La ayuda es una sola para toda la aplicación: el imán y el tamaño de la diana
leen el mismo valor. **No persiste entre sesiones**; cada partida empieza en el
máximo y la memoria entre sesiones es responsabilidad de la ventana adaptativa.

No confundir con la **ventana adaptativa**: son dos mecanismos distintos.

## Ventana adaptativa

Tiempo máximo que un objetivo con tiempo permanece disponible. Aprende el ritmo
del niño **entre sesiones**, por juego, y se guarda en `localStorage` (suelo 4 s,
techo 8 s). Está definida en el [ADR 0003](docs/adr/0003-movimiento.md), pero
**todavía no está implementada**: ningún juego la declara con `tiempo: true` ni
`panel.html` la muestra.

## Escena

Área jugable (`#escena`). Contiene los objetivos y las piezas que aparecen; el
chrome —volver, sonido y celebración— vive fuera. El motor la posee y expone
`H.objetivo()` para crear objetivos, `H.pieza()` para piezas transitorias,
`H.toca()` para aciertos sobre `.objetivo` y `H.tocaFondo()` para cualquier clic
del área jugable. El imán es un único listener global que recorre los objetivos
vivos.

## Objetivo

Pieza jugable sobre la que se puede acertar. Es grande (mínimo 44 × 44 px, en la
práctica mucho más), no lleva texto y responde a un solo `pointerdown`. La capa
constante define su tamaño mínimo, su clase `.objetivo` y el imán opcional; el
juego solo elige arte, posición y tamaño dentro de ese marco.

## Acierto y fallo

Resultado que **declara el juego** para un clic, no una propiedad puramente
geométrica. Un clic dentro del objetivo puede ser fallo si el juego lo considera
así (por ejemplo, revelar una carta que no forma pareja), y un clic fuera puede
ser acierto en un juego de causa-efecto. La geometría se conserva aparte para
medir la puntería real: `distanciaMedia` y `porcentajeDentro` siguen hablando de
dónde cayó el clic.

## Catálogo de arte

Único sitio que declara los sets de arte disponibles (`animales`, `pelotas`, `ojos`), sus rutas,
nombres, miniaturas y licencia. Vive en `js/arte.js`. Un juego elige un set con `arte: "<id>"`; el
índice, el panel y la página de revisión leen nombre y licencia del mismo catálogo.

## Pista

Señal sonora que identifica una pieza concreta. El módulo de audio la construye
con melodía y paneo a partir de la posición y el total de piezas
(`Juego.audio.pista(indice, total)`); el juego no elige frecuencias ni canales.
Se usa en el juego de «toca el que suena».

## Ronda

Tramo de una sesión que termina cuando se alcanza la **meta de aciertos** que
declara el juego (`meta`). El motor lleva la cuenta con `H.resuelve()` —métricas,
sonido y marca en una sola llamada— y, al llegar, guarda la sesión, celebra y pasa
al juego declarado en `siguiente`. `H.anotaClic()` registra un clic cuyo resultado
todavía no se conoce, sin tocar la cuenta de la ronda. Los juegos no repiten esa
ceremonia ni llevan su propio contador de ronda.

## Sesión

Una partida de un juego, desde que se abre hasta que se cierra. Al cerrarse se
guarda un resumen de métricas (aciertos, fallos, distancia media, porcentaje
dentro, ayuda final y duración) en el almacén local por juego
(`juegos.metricas.v2`), que es el que leen `panel.html` y la tecla `E`.
