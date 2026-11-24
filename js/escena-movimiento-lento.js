import { cargarKaplay } from './kaplay-carga.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAparicion, progreso, APARICION_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada, error } from './audio.js';
import { crearAyuda } from './ayuda.js';
import {
  avanzarAngulo,
  crearTrayectoria,
  velocidadEfectiva,
  velocidadPorAciertos,
} from './movimiento-lento.js';

const PAUSA_FALLO_MS = 350;

// Movimiento lento: el objetivo recorre una curva suave y hay que clicarlo al
// paso. La velocidad empieza lenta, sube cada dos aciertos y se queda en un
// techo humano; la ayuda adaptativa la frena con `factorVelocidad`. Un clic
// fuera solo cuenta como fallo suave: no resta progreso ni para el paseo.
export async function arrancarMovimientoLento({
  mundo,
  mecanica,
  alCambiar,
  alTerminar,
  alEstallar,
  ayuda: ayudaEntrada,
}) {
  const ayuda = ayudaEntrada ?? crearAyuda({ juego: mecanica.id });
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
  const marcador = crearMarcador({ meta: mecanica.meta ?? 6 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;

  const opcionesVelocidad = {
    base: mecanica.velocidadBase,
    techo: mecanica.velocidadMax,
    paso: mecanica.pasoVelocidad,
    cada: mecanica.aciertosPorPaso,
  };

  // El tamaño de partida se sortea una sola vez. Solo la ayuda lo agranda y el
  // objetivo nunca baja de 44 px (objetivo.js), para poder seguirlo y clicarlo.
  const baseObjetivo = calcularRadio({
    vmin: V_MIN(),
    minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 13,
    maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 20,
  });

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    objetivo: null,
    velocidad: 0,
    velocidadBase: 0,
    aciertos: 0,
    fallos: 0,
    lista: false,
  };

  const juego = kaplay({
    canvas: document.getElementById('lienzo'),
    global: false,
    width: window.innerWidth,
    height: window.innerHeight,
    // Canvas transparente: se ve el arte del mundo que hay detrás.
    background: [0, 0, 0, 0],
    touchToMouse: false,
  });

  let objetivo;
  let dibujo = null;
  let apareceEn = 0;
  let ultimoFallo = -Infinity;
  let angulo = Math.random() * Math.PI * 2;
  const giro = Math.random() < 0.5 ? -1 : 1;
  let trayectoria = null;
  let velocidadBase = velocidadPorAciertos(0, opcionesVelocidad);

  // El pictograma va dentro de la bola: la bola da el área de clic y el
  // contorno; el dibujo da el significado (ADR de arte ARASAAC).
  const FACTOR_DIBUJO = 0.78;
  juego.loadSprite('objeto-mundo', mundo.imagen);

  const radioActual = () => baseObjetivo * ayuda.parametros().factorTamano;

  const factorAyuda = () => {
    const o = estado.objetivo;
    if (!o || !o.radioBase) return 1;
    return o.radio / o.radioBase;
  };

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: estado.objetivo ? { ...estado.objetivo } : null,
    velocidad: Number(estado.velocidad.toFixed(3)),
    velocidadBase: Number(velocidadBase.toFixed(3)),
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

  // Recalcula el recorrido con el radio de ahora (la ayuda puede agrandarlo)
  // sin mover el ángulo: el objetivo crece donde está, no da un salto.
  function recalcularTrayectoria() {
    trayectoria = crearTrayectoria({
      ancho: juego.width(),
      alto: juego.height(),
      radio: radioActual(),
      giro,
    });
  }

  function posicionarObjetivo() {
    if (!trayectoria) recalcularTrayectoria();
    const radio = radioActual();
    const p = trayectoria.posicion(angulo);
    estado.objetivo = { x: p.x, y: p.y, radio, radioBase: baseObjetivo };
    if (objetivo) {
      objetivo.pos = juego.vec2(p.x, p.y);
      objetivo.use(juego.circle(baseObjetivo));
      colocarDibujo();
    }
  }

  function avanzarPaseo(dtMs) {
    const radio = radioActual();
    estado.velocidad = velocidadEfectiva(velocidadBase, ayuda.parametros().factorVelocidad);
    angulo = avanzarAngulo(angulo, estado.velocidad, dtMs / 1000);
    if (!trayectoria) recalcularTrayectoria();
    // La ayuda también agranda el dibujo: el recorrido se recalcula para que
    // siga cabiendo entero en la pantalla.
    if (estado.objetivo && Math.abs(estado.objetivo.radio - radio) > 0.5) recalcularTrayectoria();

    const p = trayectoria.posicion(angulo);
    estado.objetivo.x = p.x;
    estado.objetivo.y = p.y;
    estado.objetivo.radio = radio;
    objetivo.pos = juego.vec2(p.x, p.y);
    colocarDibujo();
  }

  // Fallo suave: cuenta para la ayuda y las métricas, suena bajo y no toca el
  // progreso ni la velocidad. Pulsar rápido de desahogo no infla los fallos.
  function anotarFallo() {
    const ahora = juego.time();
    if ((ahora - ultimoFallo) * 1000 < PAUSA_FALLO_MS) return;
    ultimoFallo = ahora;
    estado.fallos += 1;
    ayuda.anotarFallo();
    error(mundo.sonidos?.error ?? 240);
  }

  function acertar() {
    const m = marcador.anotarAcierto();
    estado.aciertos = m.aciertos;
    // Acertar sube la escalera de velocidad; la ayuda decide cuánto de esa
    // velocidad se ve realmente en pantalla.
    velocidadBase = velocidadPorAciertos(m.aciertos, opcionesVelocidad);
    ayuda.anotarAcierto();
    acierto(mundo.sonidos?.acierto ?? 660);

    const o = estado.objetivo;
    if (!menosMovimiento && o) {
      alEstallar?.({ x: o.x, y: o.y, radio: o.radio, color: mundo.acento });
    }
    alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });

    if (m.terminada) {
      estado.lista = false;
      if (objetivo) objetivo.hidden = true;
      if (dibujo) dibujo.hidden = true;
      alCambiar?.(oficial());
      return;
    }

    // El paseo sigue sin cortes: el dibujo no salta al acierto.
    alCambiar?.(oficial());
  }

  juego.onLoad(() => {
    juego.scene('movimientoLento', () => {
      posicionarObjetivo();
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
      apareceEn = juego.time();
      estado.lista = true;
      entrada(mundo.sonidos?.entrada);
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        if (!estado.lista) return;
        avanzarPaseo(juego.dt() * 1000);

        const pAp = progreso((juego.time() - apareceEn) * 1000, APARICION_MS);
        const a = animarAparicion(pAp);
        const f = factorAyuda();
        if (menosMovimiento) {
          // Sin deformación ni giro: se mueve entero, sin marear.
          objetivo.scale = juego.vec2(f, f);
          objetivo.angle = 0;
          objetivo.opacity = 1;
        } else {
          objetivo.scale = juego.vec2(a.escalaX * f, a.escalaY * f);
          objetivo.angle = (a.giro * 180) / Math.PI;
          objetivo.opacity = a.opacidad;
        }
        sincronizarDibujo();
        alCambiar?.(oficial());
      });
    });
    juego.go('movimientoLento');
  });

  return {
    estado: oficial,
    clic(x, y) {
      if (!estado.lista || marcador.leer().terminada) return;
      const o = estado.objetivo;
      if (o && Math.hypot(x - o.x, y - o.y) <= o.radio) acertar();
      else {
        anotarFallo();
        alCambiar?.(oficial());
      }
    },
    detener() {
      estado.lista = false;
      juego.quit?.();
    },
  };
}
