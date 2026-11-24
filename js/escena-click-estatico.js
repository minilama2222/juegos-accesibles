import { cargarKaplay } from './kaplay-carga.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAparicion, progreso, APARICION_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada, error } from './audio.js';
import { crearAyuda } from './ayuda.js';
import { elegirPosicionLejos, estaDentro } from './click-estatico.js';

// Click estático: un dibujo grande que no se mueve hasta que aciertas. Tras
// cada acierto se recoloca lejos, para practicar el recorrido con el ratón.
// Un clic fuera es un fallo suave: suena bajo, cuenta para la ayuda y no quita
// progreso ni mueve el objetivo.
export async function arrancarClickEstatico({ mundo, mecanica, alCambiar, alTerminar, alEstallar, ayuda: ayudaEntrada }) {
  const ayuda = ayudaEntrada ?? crearAyuda({ juego: mecanica.id });
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
  const marcador = crearMarcador({ meta: mecanica.meta ?? 8 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;
  // El tamaño de partida se sortea una sola vez: entre aciertos solo cambia el
  // sitio, y la ayuda adaptativa es lo único que lo agranda.
  const baseObjetivo = calcularRadio({
    vmin: V_MIN(),
    minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 14,
    maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 22,
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
  // El pictograma va dentro de la bola: la bola da el área de clic y el
  // contorno; el dibujo da el significado (ADR de arte ARASAAC).
  const FACTOR_DIBUJO = 0.78;
  juego.loadSprite('objeto-mundo', mundo.imagen);

  // La bola se dibuja con el radio base; la ayuda se aplica como escala. Así
  // el mismo objetivo crece sin cambiar de sitio ni de reglas visibles.
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
    visible: !!objetivo && objetivo.opacity > 0.01 && !objetivo.hidden,
  });

  function colocarDibujo() {
    if (!dibujo) return;
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

  // `desde` es el objetivo anterior: el nuevo tiene que caer lejos. Sin él,
  // el primero aparece centrado, que es el blanco más fácil.
  function colocarObjetivo(desde = null) {
    const base = baseObjetivo;
    const radio = base * ayuda.parametros().factorTamano;
    const { x, y } = elegirPosicionLejos({
      ancho: juego.width(),
      alto: juego.height(),
      radio,
      desde,
    });

    estado.objetivo = { x, y, radio, radioBase: base };
    if (objetivo) {
      objetivo.pos = juego.vec2(x, y);
      objetivo.use(juego.circle(base));
      apareceEn = juego.time();
      colocarDibujo();
    }
    entrada(mundo.sonidos?.entrada);
  }

  // La ayuda solo hace el dibujo más grande, sin moverlo del sitio.
  function aplicarAyudaAlObjetivo() {
    const o = estado.objetivo;
    if (!o) return;
    o.radio = o.radioBase * ayuda.parametros().factorTamano;
    if (objetivo) objetivo.pos = juego.vec2(o.x, o.y);
    colocarDibujo();
  }

  function anotarFallo() {
    const ahora = juego.time();
    // Pulsar rápido de desahogo no debe inflar los fallos: como mucho uno
    // cuenta cada 350 ms. Aun así, el clic nunca rompe ni resta nada.
    if (ahora - ultimoFallo < 0.35) return;
    ultimoFallo = ahora;
    estado.fallos += 1;
    const nivelAntes = ayuda.leer().nivel;
    ayuda.anotarFallo();
    if (ayuda.leer().nivel > nivelAntes) aplicarAyudaAlObjetivo();
    error(mundo.sonidos?.error ?? 240);
  }

  function acertar() {
    const m = marcador.anotarAcierto();
    estado.aciertos = m.aciertos;
    ayuda.anotarAcierto();
    acierto(mundo.sonidos?.acierto ?? 660);

    const anterior = estado.objetivo;
    if (!menosMovimiento && anterior) {
      alEstallar?.({ x: anterior.x, y: anterior.y, radio: anterior.radio, color: mundo.acento });
    }
    alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });

    if (m.terminada) {
      estado.lista = false;
      if (objetivo) objetivo.hidden = true;
      if (dibujo) dibujo.hidden = true;
      alCambiar?.(oficial());
      return;
    }

    // El nuevo objetivo se aleja del anterior y reaparece con su animación.
    colocarObjetivo(anterior);
    alCambiar?.(oficial());
  }

  juego.onLoad(() => {
    juego.scene('clickEstatico', () => {
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
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        const pAp = progreso((juego.time() - apareceEn) * 1000, APARICION_MS);
        const a = animarAparicion(pAp);
        const f = factorAyuda();

        if (menosMovimiento) {
          // Sin deformación ni giro: el objetivo aparece de golpe y se queda quieto.
          objetivo.scale = juego.vec2(f, f);
          objetivo.angle = 0;
          objetivo.opacity = 1;
        } else {
          objetivo.scale = juego.vec2(a.escalaX * f, a.escalaY * f);
          objetivo.angle = (a.giro * 180) / Math.PI;
          objetivo.opacity = a.opacidad;
        }
        sincronizarDibujo();
      });
    });
    juego.go('clickEstatico');
  });

  return {
    estado: oficial,
    clic(x, y) {
      if (!estado.lista || marcador.leer().terminada) return;
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
