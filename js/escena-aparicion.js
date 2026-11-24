import { cargarKaplay } from './kaplay-carga.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAparicion, progreso, APARICION_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada, error } from './audio.js';
import { crearAyuda } from './ayuda.js';
import { elegirPosicionLejos, estaDentro } from './click-estatico.js';
import { avanzarAparicion, crearEstadoAparicion, registrarAcierto, registrarFallo, reajustarVentana } from './aparicion.js';

// Aparición con tiempo: el dibujo se ve unos segundos y luego queda un hueco.
// Hay que clicarlo mientras está visible. El clic en el hueco (o cuando la
// ventana se agota) es un fallo suave: no suena duro, no quita progreso y solo
// pide más tiempo para la próxima. Los tiempos salen de la ayuda adaptativa.
export async function arrancarAparicion({ mundo, mecanica, alCambiar, alTerminar, alEstallar, ayuda: ayudaEntrada }) {
  const ayuda = ayudaEntrada ?? crearAyuda({ juego: mecanica.id });
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
  const marcador = crearMarcador({ meta: mecanica.meta ?? 6 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;
  // El tamaño de partida se sortea una sola vez; la ayuda es lo único que lo
  // agranda, y el objetivo nunca baja de 44 px.
  const baseObjetivo = calcularRadio({
    vmin: V_MIN(),
    minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 12,
    maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 20,
  });

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    objetivo: null,
    aciertos: 0,
    fallos: 0,
    lista: false,
  };

  const juego = kaplay({
    canvas: document.getElementById('lienzo'),
    global: false,
    width: window.innerWidth,
    height: window.innerHeight,
    background: mundo.fondo,
    touchToMouse: false,
  });

  let objetivo;
  let dibujo = null;
  let apareceEn = 0;
  let ultimoFallo = -Infinity;
  let reloj = crearEstadoAparicion({
    nivel: ayuda.leer().nivel,
    baseMs: Number.isFinite(mecanica.ventanaMs) ? mecanica.ventanaMs : undefined,
    huecoMs: Number.isFinite(mecanica.huecoMs) ? mecanica.huecoMs : undefined,
  });

  // El pictograma va dentro de la bola: la bola da el área de clic y el
  // contorno; el dibujo da el significado (ADR de arte ARASAAC).
  const FACTOR_DIBUJO = 0.78;
  juego.loadSprite('objeto-mundo', mundo.imagen);

  const factorAyuda = () => {
    const o = estado.objetivo;
    if (!o || !o.radioBase) return 1;
    return o.radio / o.radioBase;
  };

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: estado.objetivo ? { ...estado.objetivo } : null,
    aciertos: estado.aciertos,
    fallos: estado.fallos,
    ayuda: ayuda.leer(),
    meta: marcador.leer().meta,
    terminada: marcador.leer().terminada,
    lista: estado.lista,
    fase: reloj.fase,
    visible: reloj.fase === 'visible' && !!objetivo && !objetivo.hidden && !marcador.leer().terminada,
    ventanaMs: Math.round(reloj.ventanaMs),
    restanteMs: Math.max(0, Math.round(reloj.restanteMs)),
    huecoMs: reloj.huecoMs,
  });

  function colocarDibujo() {
    if (!dibujo || !estado.objetivo) return;
    dibujo.pos = juego.vec2(estado.objetivo.x, estado.objetivo.y);
  }

  function sincronizarDibujo() {
    if (!dibujo || !objetivo || !objetivo.scale || !estado.objetivo) return;
    const base = (estado.objetivo.radio * 2 * FACTOR_DIBUJO) / 500; // el PNG mide 500×500
    dibujo.scale = juego.vec2(objetivo.scale.x * base, objetivo.scale.y * base);
    dibujo.angle = objetivo.angle;
    dibujo.opacity = objetivo.opacity;
    dibujo.hidden = objetivo.hidden;
  }

  // `desde` es la posición anterior: el objetivo nuevo cae lejos, para que
  // buscarlo forme parte del juego. Sin él, el primero aparece centrado.
  function colocarObjetivo(desde = null) {
    const radio = baseObjetivo * ayuda.parametros().factorTamano;
    const { x, y } = elegirPosicionLejos({
      ancho: juego.width(),
      alto: juego.height(),
      radio,
      desde,
    });

    estado.objetivo = { x, y, radio, radioBase: baseObjetivo };
    if (objetivo) {
      objetivo.pos = juego.vec2(x, y);
      objetivo.use(juego.circle(baseObjetivo));
      apareceEn = juego.time();
      colocarDibujo();
    }
  }

  function mostrarObjetivo() {
    if (!objetivo) return;
    apareceEn = juego.time();
    objetivo.hidden = false;
    if (dibujo) dibujo.hidden = false;
  }

  function ocultarObjetivo() {
    if (objetivo) objetivo.hidden = true;
    if (dibujo) dibujo.hidden = true;
  }

  function aplicarAyudaAlObjetivo() {
    const o = estado.objetivo;
    if (!o) return;
    o.radio = o.radioBase * ayuda.parametros().factorTamano;
    if (objetivo) objetivo.pos = juego.vec2(o.x, o.y);
    colocarDibujo();
  }

  // Fallo suave: cuenta para la ayuda y las métricas, alarga la ventana y no
  // toca aciertos ni progreso. El clic en el hueco no lleva sonido duro.
  function anotarFallo({ sonido = true } = {}) {
    const ahora = juego.time();
    // Pulsar rápido de desahogo no infla los fallos: como mucho uno cada 350 ms.
    if (ahora - ultimoFallo < 0.35) return false;
    ultimoFallo = ahora;
    estado.fallos += 1;
    const nivelAntes = ayuda.leer().nivel;
    ayuda.anotarFallo();
    if (ayuda.leer().nivel > nivelAntes) aplicarAyudaAlObjetivo();
    reloj = reajustarVentana(registrarFallo(reloj), ayuda.leer().nivel, mecanica.ventanaMs);
    if (sonido) error(mundo.sonidos?.error ?? 240);
    return true;
  }

  function acertar() {
    const m = marcador.anotarAcierto();
    estado.aciertos = m.aciertos;
    ayuda.anotarAcierto();
    // El acierto solo puede acortar el reto; no se reajusta al mínimo del
    // nivel porque eso devolvería el tiempo ganado.
    reloj = registrarAcierto(reloj);
    acierto(mundo.sonidos?.acierto ?? 660);

    const anterior = estado.objetivo;
    if (!menosMovimiento && anterior) {
      alEstallar?.({ x: anterior.x, y: anterior.y, radio: anterior.radio, color: mundo.acento });
    }
    alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });

    if (m.terminada) {
      estado.lista = false;
      ocultarObjetivo();
      alCambiar?.(oficial());
      return;
    }

    // El hueco empieza ya; en la siguiente aparición se elegirá otro sitio.
    ocultarObjetivo();
    alCambiar?.(oficial());
  }

  juego.onLoad(() => {
    juego.scene('aparicion', () => {
      colocarObjetivo();
      objetivo = juego.add([
        juego.circle(estado.objetivo.radioBase),
        juego.pos(estado.objetivo.x, estado.objetivo.y),
        juego.color(juego.Color.fromHex(mundo.acento)),
        juego.outline(4, juego.Color.fromHex('#ffffff')),
        juego.anchor('center'),
        'objetivo',
      ]);
      dibujo = juego.add([
        juego.sprite('objeto-mundo'),
        juego.pos(estado.objetivo.x, estado.objetivo.y),
        juego.anchor('center'),
        'dibujo-objetivo',
      ]);
      sincronizarDibujo();
      estado.lista = true;
      mostrarObjetivo();
      entrada(mundo.sonidos?.entrada);
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        const ahora = juego.time();
        // La posición anterior se guarda aunque ahora estemos en el hueco:
        // así la nueva ventana aparece lejos y no encima del último acierto.
        const anterior = estado.objetivo ? { ...estado.objetivo } : null;
        reloj = avanzarAparicion(reloj, juego.dt() * 1000);

        if (reloj.cambio === 'seOculto') {
          // Se agotó la ventana sin acierto: hueco y más ayuda, sin castigo.
          ocultarObjetivo();
          anotarFallo({ sonido: false });
          alCambiar?.(oficial());
        } else if (reloj.cambio === 'aparece') {
          // Nueva ventana en otro sitio, con su entrada y su animación.
          colocarObjetivo(anterior);
          mostrarObjetivo();
          entrada(mundo.sonidos?.entrada);
          alCambiar?.(oficial());
        }

        if (reloj.fase === 'visible' && objetivo && !objetivo.hidden) {
          const pAp = progreso((ahora - apareceEn) * 1000, APARICION_MS);
          const a = animarAparicion(pAp);
          const f = factorAyuda();
          if (menosMovimiento) {
            // Sin deformación ni giro: aparece de golpe y se queda quieto.
            objetivo.scale = juego.vec2(f, f);
            objetivo.angle = 0;
            objetivo.opacity = 1;
          } else {
            objetivo.scale = juego.vec2(a.escalaX * f, a.escalaY * f);
            objetivo.angle = (a.giro * 180) / Math.PI;
            objetivo.opacity = a.opacidad;
          }
          sincronizarDibujo();
        }
      });
    });
    juego.go('aparicion');
  });

  return {
    estado: oficial,
    clic(x, y) {
      if (!estado.lista || marcador.leer().terminada) return;
      if (reloj.fase !== 'visible') {
        // Clic en el hueco: fallo suave, sin sonido duro ni pérdida de progreso.
        anotarFallo({ sonido: false });
        alCambiar?.(oficial());
        return;
      }
      if (estaDentro(estado.objetivo, x, y)) acertar();
      else {
        anotarFallo();
        alCambiar?.(oficial());
      }
    },
    moverPuntero() {},
    detener() {
      estado.lista = false;
      juego.quit?.();
    },
  };
}
