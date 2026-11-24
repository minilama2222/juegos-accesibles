import { cargarKaplay } from './kaplay-carga.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAcierto, animarTiro, progreso } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada, error } from './audio.js';
import { crearAyuda } from './ayuda.js';
import {
  crearHuecos,
  destinoFallo,
  escalarHuecos,
  geometriaPorteria,
  resultadoTiro,
} from './tiro-a-porteria.js';

// Tiro a portería: escena fija con una rejilla de huecos. Clicar un hueco
// lanza el objeto del mundo en arco y celebra el gol; clicar fuera lanza el
// balón despacio a una zona vacía y no quita progreso. La ayuda adaptativa
// agranda los huecos tras dos fallos seguidos.
const TIRO_MS = 520;
const TIRO_FALLO_MS = 900;
const GOL_MS = 480;
const PAUSA_FALLO_MS = 300;

export async function arrancarTiroAPorteria({ mundo, mecanica, alCambiar, alTerminar, alEstallar, ayuda: ayudaEntrada }) {
  const ayuda = ayudaEntrada ?? crearAyuda({ juego: mecanica.id });
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
  const marcador = crearMarcador({ meta: mecanica.meta ?? 6 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    objetivo: null,
    porteria: null,
    huecos: [],
    aciertos: 0,
    fallos: 0,
    ultimoTiro: null,
    balon: null,
    lista: false,
  };

  const juego = kaplay({
    canvas: document.getElementById('lienzo'),
    global: false,
    width: window.innerWidth,
    height: window.innerHeight,
    // Canvas transparente: el mundo se ve detrás y la portería encima.
    background: [0, 0, 0, 0],
    touchToMouse: false,
  });

  juego.loadSprite('objeto-mundo', mundo.imagen);

  let objetosHueco = [];
  let balon = null;
  let tiro = null;
  let ultimoFallo = -Infinity;
  let goles = [];
  const colorAcento = juego.Color.fromHex(mundo.acento);
  const colorHueco = juego.Color.fromHex('#08140f');
  const colorBlanco = juego.Color.fromHex('#ffffff');

  const factorAyuda = () => ayuda.parametros().factorTamano;

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: null,
    porteria: estado.porteria ? { ...estado.porteria } : null,
    huecos: estado.huecos.map((h) => ({ ...h })),
    aciertos: estado.aciertos,
    fallos: estado.fallos,
    ultimoTiro: estado.ultimoTiro ? { ...estado.ultimoTiro } : null,
    balon: estado.balon ? { ...estado.balon } : null,
    ayuda: ayuda.leer(),
    meta: marcador.leer().meta,
    terminada: marcador.leer().terminada,
    lista: estado.lista,
    visible: estado.huecos.length > 0 && estado.lista,
  });

  function barra(x, y, ancho, alto, color, opacidad = 1) {
    const b = juego.add([
      juego.rect(ancho, alto),
      juego.pos(x, y),
      juego.anchor('topleft'),
      juego.color(color),
    ]);
    b.opacity = opacidad;
    return b;
  }

  function dibujarPorteria() {
    const p = estado.porteria;
    const poste = p.poste;

    // Red: panel oscuro tenue y una cuadrícula fina, siempre detrás del balón.
    const red = barra(p.x, p.y, p.ancho, p.alto, colorHueco, 0.34);
    red.z = 0;
    for (let i = 1; i < 8; i++) {
      const x = p.x + (i / 8) * p.ancho;
      const linea = barra(x, p.y, 1.5, p.alto, colorBlanco, 0.12);
      linea.z = 1;
    }
    for (let j = 1; j < 5; j++) {
      const y = p.y + (j / 5) * p.alto;
      const linea = barra(p.x, y, p.ancho, 1.5, colorBlanco, 0.12);
      linea.z = 1;
    }

    // Marco: dos postes y un travesaño gruesos, del color del mundo.
    barra(p.x - poste, p.y - poste, p.ancho + poste * 2, poste, colorBlanco).z = 3;
    barra(p.x - poste, p.y, poste, p.alto + poste, colorAcento).z = 3;
    barra(p.x + p.ancho, p.y, poste, p.alto + poste, colorAcento).z = 3;
  }

  function crearObjetosHuecos() {
    objetosHueco = estado.huecos.map((h) => {
      const obj = juego.add([
        juego.circle(h.radioBase),
        juego.pos(h.x, h.y),
        juego.anchor('center'),
        juego.color(colorHueco),
        juego.outline(4, colorBlanco),
        'hueco',
      ]);
      obj.z = 2;
      obj.scale = juego.vec2(factorAyuda(), factorAyuda());
      return obj;
    });
  }

  function crearBalon() {
    const diametro = V_MIN() * 9;
    balon = juego.add([
      juego.sprite('objeto-mundo'),
      juego.pos(juego.width() / 2, juego.height() * 0.92),
      juego.anchor('center'),
    ]);
    balon.base = diametro / 500; // el PNG mide 500×500
    balon.scale = juego.vec2(balon.base, balon.base);
    balon.z = 4;
    reposarBalon();
  }

  // El balón espera abajo, listo para el siguiente tiro. No es un idle: está
  // quieto y solo se mueve cuando el niño clica.
  function reposarBalon() {
    if (!balon) return;
    balon.pos = juego.vec2(juego.width() / 2, juego.height() * 0.92);
    balon.scale = juego.vec2(balon.base, balon.base);
    balon.angle = 0;
    balon.opacity = 1;
    balon.hidden = false;
  }

  function anotarFallo() {
    const ahora = juego.time();
    // Pulsar rápido de desahogo no infla los fallos: como mucho uno cada 300 ms.
    if ((ahora - ultimoFallo) * 1000 < PAUSA_FALLO_MS) return;
    ultimoFallo = ahora;
    estado.fallos += 1;
    // Dos fallos seguidos suben la ayuda; el siguiente fotograma agranda los
    // huecos. Un fallo suelto no cambia nada ni resta progreso.
    ayuda.anotarFallo();
    error(mundo.sonidos?.error ?? 240);
  }

  // El radio lógico de los huecos sigue al factor de ayuda en cada fotograma;
  // el dibujo usa la misma escala, así el clic siempre coincide con lo que se ve.
  function actualizarHuecos() {
    const factor = factorAyuda();
    const ahora = juego.time();
    goles = goles.filter((g) => (ahora - g.desde) * 1000 < GOL_MS);
    for (let i = 0; i < objetosHueco.length; i++) {
      const h = estado.huecos[i];
      const obj = objetosHueco[i];
      if (!h || !obj) continue;
      h.radio = h.radioBase * factor;
      const gol = goles.find((g) => g.hueco === i);
      if (gol) {
        // Celebración corta reutilizando la curva de acierto: el hueco salta y vuelve.
        const a = animarAcierto(progreso((ahora - gol.desde) * 1000, GOL_MS));
        obj.scale = juego.vec2(factor * a.escalaX, factor * a.escalaY);
        obj.opacity = 1;
      } else {
        obj.scale = juego.vec2(factor, factor);
        obj.opacity = 1;
      }
    }
  }

  function lanzar(x, y) {
    const resultado = resultadoTiro(estado.huecos, x, y);
    const desde = { x: juego.width() / 2, y: juego.height() * 0.92 };

    if (resultado.acierto) {
      const hueco = estado.huecos[resultado.hueco];
      estado.ultimoTiro = { acierto: true, hueco: resultado.hueco, x: Math.round(x), y: Math.round(y) };
      tiro = { acierto: true, desde, hacia: { x: hueco.x, y: hueco.y }, inicio: juego.time(), duracion: TIRO_MS / 1000 };
      goles.push({ hueco: resultado.hueco, desde: juego.time() });

      const m = marcador.anotarAcierto();
      estado.aciertos = m.aciertos;
      ayuda.anotarAcierto();
      acierto(mundo.sonidos?.acierto ?? 660);
      if (!menosMovimiento) {
        alEstallar?.({ x: hueco.x, y: hueco.y, radio: hueco.radio, color: mundo.acento });
      }
      alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });
      if (m.terminada) estado.lista = false;
    } else {
      estado.ultimoTiro = { acierto: false, hueco: -1, x: Math.round(x), y: Math.round(y) };
      tiro = {
        acierto: false,
        desde,
        hacia: destinoFallo({ ancho: juego.width(), alto: juego.height(), x, y }),
        inicio: juego.time(),
        duracion: TIRO_FALLO_MS / 1000,
      };
      anotarFallo();
    }

    balon.hidden = false;
    balon.pos = juego.vec2(desde.x, desde.y);
    balon.scale = juego.vec2(balon.base, balon.base);
    balon.opacity = 1;
    alCambiar?.(oficial());
  }

  function actualizarBalon() {
    if (!tiro) {
      estado.balon = null;
      return;
    }
    const p = progreso((juego.time() - tiro.inicio) * 1000, tiro.duracion * 1000);
    const a = animarTiro(p);
    const arco = menosMovimiento ? 0 : a.altura * V_MIN() * 12;
    const x = tiro.desde.x + (tiro.hacia.x - tiro.desde.x) * a.avance;
    const y = tiro.desde.y + (tiro.hacia.y - tiro.desde.y) * a.avance - arco;

    balon.pos = juego.vec2(x, y);
    balon.scale = juego.vec2(balon.base * a.escala, balon.base * a.escala);
    balon.angle = (a.giro * 180) / Math.PI;
    balon.opacity = a.opacidad;
    estado.balon = { x: Math.round(x), y: Math.round(y), activo: p < 1, acierto: tiro.acierto };

    if (p >= 1) {
      tiro = null;
      estado.balon = null;
      reposarBalon();
    }
  }

  juego.onLoad(() => {
    juego.scene('tiroAPorteria', () => {
      estado.porteria = geometriaPorteria({ ancho: juego.width(), alto: juego.height() });
      const base = calcularRadio({
        vmin: V_MIN(),
        minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 9,
        maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 13,
      });
      estado.huecos = escalarHuecos(crearHuecos({ porteria: estado.porteria, radio: base }), factorAyuda());

      dibujarPorteria();
      crearObjetosHuecos();
      crearBalon();
      estado.lista = true;
      entrada(mundo.sonidos?.entrada);
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        actualizarHuecos();
        actualizarBalon();
        if (estado.lista) alCambiar?.(oficial());
      });
    });
    juego.go('tiroAPorteria');
  });

  return {
    estado: oficial,
    clic(x, y) {
      if (!estado.lista || marcador.leer().terminada) return;
      lanzar(x, y);
    },
    moverPuntero() {},
    detener() {
      estado.lista = false;
      juego.quit?.();
    },
  };
}
