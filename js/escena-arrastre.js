import { cargarKaplay } from './kaplay-carga.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAparicion, progreso, APARICION_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada, error } from './audio.js';
import { crearAyuda } from './ayuda.js';
import {
  TOLERANCIA,
  UMBRAL_ARRASTRE_VMIN,
  elegirReparto,
  estaDentro,
  huboArrastre,
  resultadoSuelte,
} from './arrastre.js';

const PAUSA_FALLO_MS = 350;

// Arrastre: un dibujo grande a un lado y su zona al otro. Hay que pulsarlo,
// mantenerlo y llevarlo hasta la zona; soltar dentro acierta y soltar fuera es
// un fallo suave que devuelve el dibujo a su sitio, sin quitar progreso.
// Es la excepción declarada a "un solo clic" (spec 0001) y no toca las demás
// mecánicas.
export async function arrancarArrastre({
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
  const marcador = crearMarcador({ meta: mecanica.meta ?? 4 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;

  // El dibujo es grande para agarrarlo sin precisión fina. La ayuda adaptativa
  // agranda dibujo y zona por igual.
  const baseObjetivo = calcularRadio({
    vmin: V_MIN(),
    minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 12,
    maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 16,
  });

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    objetivo: null, // el dibujo, en su sitio o en la mano
    inicio: null, // dónde descansa el dibujo
    zona: null, // el destino
    faseArrastre: 'inactivo', // inactivo | arrastrando | soltado
    soltado: null, // último punto donde se soltó
    aciertos: 0,
    fallos: 0,
    lista: false,
  };

  const juego = kaplay({
    canvas: document.getElementById('lienzo'),
    global: false,
    width: window.innerWidth,
    height: window.innerHeight,
    // Canvas transparente: el mundo se ve detrás y la zona se dibuja encima.
    background: [0, 0, 0, 0],
    touchToMouse: false,
  });

  let objeto = null;
  let dibujo = null;
  let apareceEn = 0;
  let agarrado = false;
  let puntoPresion = null;
  let ultimoFallo = -Infinity;
  const colorAcento = juego.Color.fromHex(mundo.acento);
  const colorBlanco = juego.Color.fromHex('#ffffff');

  // El pictograma va dentro de la bola: la bola da el área de agarre y el
  // contorno; el dibujo da el significado (ADR de arte ARASAAC).
  const FACTOR_DIBUJO = 0.78;
  juego.loadSprite('objeto-mundo', mundo.imagen);

  const factorAyuda = () => ayuda.parametros().factorTamano;

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
    visible: !!objeto && objeto.opacity > 0.01 && !objeto.hidden,
    // El arrastre en curso, tal como lo leen los tests: inicio, zona y soltado.
    arrastre: {
      estado: estado.faseArrastre,
      inicio: estado.inicio ? { x: estado.inicio.x, y: estado.inicio.y } : null,
      objetivo: estado.objetivo
        ? { x: estado.objetivo.x, y: estado.objetivo.y, radio: estado.objetivo.radio }
        : null,
      zona: estado.zona
        ? { x: estado.zona.x, y: estado.zona.y, radio: estado.zona.radio }
        : null,
      soltado: estado.soltado ? { ...estado.soltado } : null,
    },
  });

  function colocarDibujo() {
    if (!dibujo || !estado.objetivo) return;
    dibujo.pos = juego.vec2(estado.objetivo.x, estado.objetivo.y);
  }

  function sincronizarDibujo() {
    if (!dibujo || !objeto || !objeto.scale || !estado.objetivo) return;
    const base = (estado.objetivo.radio * 2 * FACTOR_DIBUJO) / 500; // el PNG mide 500×500
    dibujo.scale = juego.vec2(objeto.scale.x * base, objeto.scale.y * base);
    dibujo.angle = objeto.angle;
    dibujo.opacity = objeto.opacity;
    dibujo.hidden = objeto.hidden;
  }

  // Reparte de nuevo el dibujo y la zona (al empezar y cuando la ayuda crece).
  function nuevoReparto({ animar = true } = {}) {
    const radio = baseObjetivo * factorAyuda();
    const reparto = elegirReparto({
      ancho: juego.width(),
      alto: juego.height(),
      radioObjetivo: radio,
    });
    estado.inicio = { x: reparto.inicio.x, y: reparto.inicio.y };
    estado.zona = { ...reparto.zona };
    estado.objetivo = { x: estado.inicio.x, y: estado.inicio.y, radio, radioBase: baseObjetivo };
    if (objeto) {
      objeto.pos = juego.vec2(estado.inicio.x, estado.inicio.y);
      objeto.use(juego.circle(baseObjetivo));
      colocarDibujo();
      if (animar) apareceEn = juego.time();
    }
  }

  // El dibujo vuelve a su sitio sin castigo: es un fallo suave.
  function volverAlInicio() {
    if (!estado.inicio) return;
    estado.objetivo.x = estado.inicio.x;
    estado.objetivo.y = estado.inicio.y;
    apareceEn = juego.time();
    if (objeto) objeto.pos = juego.vec2(estado.inicio.x, estado.inicio.y);
    colocarDibujo();
  }

  function anotarFallo() {
    const ahora = juego.time();
    // Pulsar rápido de desahogo no infla los fallos: como mucho uno cada 350 ms.
    if ((ahora - ultimoFallo) * 1000 < PAUSA_FALLO_MS) return false;
    ultimoFallo = ahora;
    estado.fallos += 1;
    const nivelAntes = ayuda.leer().nivel;
    ayuda.anotarFallo();
    error(mundo.sonidos?.error ?? 240);
    return ayuda.leer().nivel > nivelAntes;
  }

  function acertar() {
    const m = marcador.anotarAcierto();
    estado.aciertos = m.aciertos;
    ayuda.anotarAcierto();
    acierto(mundo.sonidos?.acierto ?? 660);

    const o = estado.objetivo;
    if (!menosMovimiento && o) {
      alEstallar?.({ x: o.x, y: o.y, radio: o.radio, color: mundo.acento });
    }
    alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });

    if (m.terminada) {
      estado.lista = false;
      estado.faseArrastre = 'soltado';
      if (objeto) objeto.hidden = true;
      if (dibujo) dibujo.hidden = true;
      return;
    }

    // Nueva pareja de dibujo y zona, con su aparición desde cero.
    nuevoReparto();
    estado.faseArrastre = 'soltado';
  }

  // Regla de soltado: dentro de la zona (con su tolerancia) acierta; fuera es
  // fallo suave y el dibujo vuelve a su sitio.
  function soltar(x, y) {
    if (!estado.lista || !agarrado || marcador.leer().terminada) return;
    agarrado = false;
    const umbral = UMBRAL_ARRASTRE_VMIN * V_MIN();
    const desde = puntoPresion ?? { x, y };

    // Un clic quieto sobre el dibujo no es un arrastre: se cancela en silencio.
    if (!huboArrastre(desde, { x, y }, umbral)) {
      estado.faseArrastre = 'inactivo';
      volverAlInicio();
      alCambiar?.(oficial());
      return;
    }

    const r = resultadoSuelte({
      zona: estado.zona,
      x,
      y,
      tolerancia: estado.zona.radio * TOLERANCIA,
    });
    estado.soltado = { x: Math.round(x), y: Math.round(y), acierto: r.acierto };
    estado.faseArrastre = 'soltado';

    if (r.acierto) acertar();
    else {
      // Si el fallo sube la ayuda, el reparto y el tamaño nuevos se aplican ya
      // en esta ronda; no hay que esperar al siguiente acierto.
      const subeAyuda = anotarFallo();
      if (subeAyuda) nuevoReparto();
      else volverAlInicio();
    }
    alCambiar?.(oficial());
  }

  function dibujarZona() {
    const z = estado.zona;
    if (!z || !estado.lista) return;
    // Halo tenue para que se lea como "aquí va".
    juego.drawCircle({
      pos: juego.vec2(z.x, z.y),
      radius: z.radio,
      color: juego.rgb(colorAcento.r, colorAcento.g, colorAcento.b),
      opacity: 0.16,
    });
    // Borde de guiones: se distingue de un objetivo normal sin usar texto.
    const tramos = 26;
    for (let i = 0; i < tramos; i += 2) {
      const a1 = (i / tramos) * Math.PI * 2;
      const a2 = ((i + 1) / tramos) * Math.PI * 2;
      juego.drawLine({
        p1: juego.vec2(z.x + Math.cos(a1) * z.radio, z.y + Math.sin(a1) * z.radio),
        p2: juego.vec2(z.x + Math.cos(a2) * z.radio, z.y + Math.sin(a2) * z.radio),
        width: 7,
        color: juego.rgb(colorBlanco.r, colorBlanco.g, colorBlanco.b),
        opacity: 0.9,
      });
    }
  }

  juego.onLoad(() => {
    juego.scene('arrastre', () => {
      nuevoReparto({ animar: false });
      apareceEn = juego.time();
      objeto = juego.add([
        juego.circle(baseObjetivo),
        juego.pos(estado.objetivo.x, estado.objetivo.y),
        juego.color(colorAcento),
        juego.outline(4, colorBlanco),
        juego.anchor('center'),
        'objetivo',
      ]);
      dibujo = juego.add([
        juego.sprite('objeto-mundo'),
        juego.pos(estado.objetivo.x, estado.objetivo.y),
        juego.anchor('center'),
        'dibujo-objetivo',
      ]);
      objeto.z = 3;
      dibujo.z = 4;
      sincronizarDibujo();
      estado.lista = true;
      entrada(mundo.sonidos?.entrada);
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        if (!estado.lista) return;
        const pAp = progreso((juego.time() - apareceEn) * 1000, APARICION_MS);
        const a = animarAparicion(pAp);
        if (menosMovimiento) {
          // Sin deformación ni giro: aparece entero y se queda quieto.
          objeto.scale = juego.vec2(1, 1);
          objeto.angle = 0;
        } else {
          objeto.scale = juego.vec2(a.escalaX, a.escalaY);
          objeto.angle = (a.giro * 180) / Math.PI;
        }
        sincronizarDibujo();
        dibujarZona();
        alCambiar?.(oficial());
      });
    });
    juego.go('arrastre');
  });

  return {
    estado: oficial,
    // Pulsar sobre el dibujo lo agarra; el resto de la pantalla no hace nada.
    pulsar(x, y) {
      if (!estado.lista || marcador.leer().terminada) return;
      if (!estaDentro(estado.objetivo, x, y)) return;
      agarrado = true;
      puntoPresion = { x, y };
      estado.faseArrastre = 'arrastrando';
      estado.soltado = null;
      estado.objetivo.x = x;
      estado.objetivo.y = y;
      if (objeto) objeto.pos = juego.vec2(x, y);
      colocarDibujo();
      alCambiar?.(oficial());
    },
    moverPuntero(x, y) {
      if (!agarrado || !estado.lista) return;
      estado.objetivo.x = x;
      estado.objetivo.y = y;
      if (objeto) objeto.pos = juego.vec2(x, y);
      colocarDibujo();
      alCambiar?.(oficial());
    },
    soltar,
    cancelar() {
      if (!agarrado) return;
      agarrado = false;
      estado.faseArrastre = 'inactivo';
      volverAlInicio();
      alCambiar?.(oficial());
    },
    detener() {
      estado.lista = false;
      agarrado = false;
      juego.quit?.();
    },
  };
}
