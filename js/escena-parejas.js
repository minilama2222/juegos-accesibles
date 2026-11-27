import { cargarKaplay } from './kaplay-carga.js';
import { animarAcierto, animarVolteo, progreso } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada, error } from './audio.js';
import { crearAyuda } from './ayuda.js';
import { imagenPictograma } from './pictogramas.js';
import { imagenArasaac } from './arasaac.js';
import {
  disposicionTablero,
  indiceCartaEn,
  normalizarParejas,
  tiempoVisiblePar,
  crearJuegoParejas,
} from './parejas.js';

// Parejas: un tablero de cartas boca abajo. Un clic gira una carta; si las dos
// son iguales se quedan visibles para siempre. Si no, se quedan un momento a la
// vista y vuelven a esconderse. Fallar nunca quita progreso: solo pide más
// tiempo a la ayuda adaptativa. Toda la verdad del juego vive en js/parejas.js.
const VOLTEO_MS = 190;
const CELEBRACION_MS = 480;
const LADO_SPRITE = 256;

// Lo que se nombra en una carta es un pictograma de ARASAAC (PNG), igual que en
// el resto del juego; el SVG propio solo es reserva para los gestos (dorso,
// refuerzo). Con `imagenPictograma` todas las cartas caían en la estrella de
// reserva y el tablero era ocho copias del mismo dibujo.
function fuentePictograma(nombre) {
  return imagenArasaac(nombre) ?? imagenPictograma(nombre);
}

// Kaplay carga bien los PNG pero no dibuja los SVG como sprite. Se rasteriza
// cada pictograma a PNG en un canvas antes de cargarlo: mismo dibujo, sin
// depender del soporte de SVG del motor.
async function rasterizar(nombre) {
  const img = new Image();
  img.src = fuentePictograma(nombre);
  try {
    await img.decode();
  } catch {
    return { url: img.src, lado: 150 };
  }
  const lienzo = document.createElement('canvas');
  lienzo.width = LADO_SPRITE;
  lienzo.height = LADO_SPRITE;
  const ctx = lienzo.getContext('2d');
  ctx.drawImage(img, 0, 0, LADO_SPRITE, LADO_SPRITE);
  return { url: lienzo.toDataURL('image/png'), lado: LADO_SPRITE };
}

export async function arrancarParejas({
  mundo,
  mecanica,
  parejas: parejasEntrada,
  alCambiar,
  alTerminar,
  alEstallar,
  ayuda: ayudaEntrada,
}) {
  const ayuda = ayudaEntrada ?? crearAyuda({ juego: mecanica.id });
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
  const parejas = normalizarParejas(parejasEntrada ?? mecanica.parejasPorDefecto);
  const baseVisibleMs = Number.isFinite(mecanica.tiempoParMs) ? mecanica.tiempoParMs : 1500;
  const partida = crearJuegoParejas({ parejas, simbolos: mundo.parejas ?? mundo.sprites });

  const simbolos = [...new Set(partida.leer().cartas.map((c) => c.simbolo))];
  const [arte, arteDorso] = await Promise.all([
    Promise.all(simbolos.map(async (s) => [s, await rasterizar(s)])).then((pares) => new Map(pares)),
    rasterizar(mundo.refuerzo ?? 'estrella'),
  ]);

  const ancho = () => window.innerWidth;
  const alto = () => window.innerHeight;
  const margen = () => Math.max(16, Math.min(ancho(), alto()) * 0.035);
  const layout = disposicionTablero({
    parejas,
    ancho: ancho(),
    alto: alto(),
    margen: margen(),
    // Deja libre la franja de las herramientas (arriba) y la de "otro juego"
    // (abajo). El tablero no hace scroll: vive entero dentro de la pantalla.
    margenSuperior: Math.max(margen(), alto() * 0.1),
    margenInferior: Math.max(margen(), alto() * 0.16),
  });

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    parejas,
    fallos: 0,
    encontradas: 0,
    bloqueada: false,
    terminada: false,
    tiempoVisibleMs: tiempoVisiblePar(ayuda.leer().nivel, baseVisibleMs),
    lista: false,
  };

  const juego = kaplay({
    canvas: document.getElementById('lienzo'),
    global: false,
    width: ancho(),
    height: alto(),
    background: [0, 0, 0, 0],
    touchToMouse: false,
  });

  for (const simbolo of simbolos) juego.loadSprite(`pareja-${simbolo}`, arte.get(simbolo).url);
  juego.loadSprite('dorso-mundo', arteDorso.url);

  const colorBlanco = juego.Color.fromHex('#ffffff');
  const colorDorso = juego.Color.fromHex('#101b17');
  const colorAcento = juego.Color.fromHex(mundo.acento);
  const colorFondoCara = juego.Color.fromHex('#fbfbf7');
  const colorPlato = juego.Color.fromHex(mundo.paleta?.[0] ?? mundo.fondo);

  const visuales = [];
  const volteos = new Map();
  const celebraciones = [];
  let resolverEn = Infinity;

  const cartasOficiales = () => {
    const base = partida.leer();
    return base.cartas.map((c) => {
      const pos = layout.cartas[c.id];
      return {
        ...c,
        indice: c.id,
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0,
        lado: layout.lado,
      };
    });
  };

  const oficial = () => {
    const base = partida.leer();
    return {
      mecanica: estado.mecanica,
      mundo: estado.mundo,
      objetivo: null,
      parejas: estado.parejas,
      cartas: cartasOficiales(),
      encontradas: base.encontradas,
      aciertos: base.encontradas,
      fallos: base.fallos,
      bloqueada: base.bloqueada,
      terminada: base.terminada,
      ayuda: ayuda.leer(),
      meta: estado.parejas,
      tiempoVisibleMs: estado.tiempoVisibleMs,
      lista: estado.lista,
      visible: estado.lista && layout.cartas.length > 0,
      // Origen del dibujo de cada símbolo: los tests comprueban que cada pareja
      // pinta un dibujo distinto y que ninguna cae en la reserva.
      dibujos: Object.fromEntries(simbolos.map((s) => [s, fuentePictograma(s)])),
    };
  };

  function posicion(indice) {
    return layout.cartas[indice] ?? { x: ancho() / 2, y: alto() / 2 };
  }

  function crearCarta(indice, simbolo) {
    const { x, y } = posicion(indice);
    const lado = layout.lado;
    const sprite = arte.get(simbolo);
    const escalaIcono = (lado * 0.8) / (sprite?.lado ?? 150);
    const escalaDorso = (lado * 0.42) / (arteDorso.lado ?? 150);

    const halo = juego.add([
      juego.rect(lado * 1.08, lado * 1.08),
      juego.pos(x, y),
      juego.anchor('center'),
      juego.color(colorAcento),
    ]);
    halo.opacity = 0.34;
    halo.hidden = true;
    halo.z = 1;

    const dorso = juego.add([
      juego.rect(lado, lado),
      juego.pos(x, y),
      juego.anchor('center'),
      juego.color(colorDorso),
      juego.outline(4, colorBlanco),
    ]);
    dorso.z = 2;

    const iconoDorso = juego.add([
      juego.sprite('dorso-mundo'),
      juego.pos(x, y),
      juego.anchor('center'),
    ]);
    iconoDorso.scale = juego.vec2(escalaDorso, escalaDorso);
    iconoDorso.z = 3;

    const caraFondo = juego.add([
      juego.rect(lado, lado),
      juego.pos(x, y),
      juego.anchor('center'),
      juego.color(colorFondoCara),
      juego.outline(4, colorAcento),
    ]);
    caraFondo.hidden = true;
    caraFondo.z = 2;

    // Plato oscuro bajo el pictograma: los dibujos con trazo blanco (copos,
    // huesos) se leen igual sobre una cara clara.
    const plato = juego.add([
      juego.circle(lado * 0.43),
      juego.pos(x, y),
      juego.anchor('center'),
      juego.color(colorPlato),
    ]);
    plato.hidden = true;
    plato.z = 3;

    const cara = juego.add([
      juego.sprite(`pareja-${simbolo}`),
      juego.pos(x, y),
      juego.anchor('center'),
    ]);
    cara.scale = juego.vec2(escalaIcono, escalaIcono);
    cara.hidden = true;
    cara.z = 4;

    visuales[indice] = {
      halo,
      dorso,
      iconoDorso,
      caraFondo,
      plato,
      cara,
      escalaIcono,
      escalaDorso,
      lado,
    };
  }

  // Refleja el estado lógico en los objetos de Kaplay. La carta encontrada
  // conserva la cara y un halo; la oculta enseña el dorso del mundo.
  function aplicarVisual(indice) {
    const carta = partida.leer().cartas[indice];
    const v = visuales[indice];
    if (!carta || !v) return;
    const bocaArriba = carta.estado !== 'oculta';
    v.dorso.hidden = bocaArriba;
    v.iconoDorso.hidden = bocaArriba;
    v.caraFondo.hidden = !bocaArriba;
    v.plato.hidden = !bocaArriba;
    v.cara.hidden = !bocaArriba;
    v.halo.hidden = carta.estado !== 'encontrada';
  }

  function iniciarVolteo(indice) {
    if (menosMovimiento) {
      aplicarVisual(indice);
      return;
    }
    volteos.set(indice, { desde: juego.time(), aplicado: false });
  }

  function resetEscala(indice) {
    const v = visuales[indice];
    if (!v) return;
    v.dorso.scale = juego.vec2(1, 1);
    v.caraFondo.scale = juego.vec2(1, 1);
    v.plato.scale = juego.vec2(1, 1);
    v.cara.scale = juego.vec2(v.escalaIcono, v.escalaIcono);
    v.iconoDorso.scale = juego.vec2(v.escalaDorso, v.escalaDorso);
    v.halo.scale = juego.vec2(1, 1);
  }

  function actualizarVolteos(ahora) {
    for (const [indice, v] of volteos) {
      const t = progreso((ahora - v.desde) * 1000, VOLTEO_MS);
      const vis = visuales[indice];
      if (!vis) {
        volteos.delete(indice);
        continue;
      }
      // Giro contenido: la curva vive en animaciones.js y aquí solo se aplica.
      const a = animarVolteo(t);
      vis.dorso.scale = juego.vec2(a.escalaX, a.escalaY);
      vis.caraFondo.scale = juego.vec2(a.escalaX, a.escalaY);
      vis.plato.scale = juego.vec2(a.escalaX, a.escalaY);
      vis.cara.scale = juego.vec2(vis.escalaIcono * a.escalaX, vis.escalaIcono * a.escalaY);
      vis.iconoDorso.scale = juego.vec2(vis.escalaDorso * a.escalaX, vis.escalaDorso * a.escalaY);

      if (t >= 0.5 && !v.aplicado) {
        v.aplicado = true;
        aplicarVisual(indice);
      }
      if (t >= 1) {
        resetEscala(indice);
        volteos.delete(indice);
      }
    }
  }

  function actualizarCelebraciones(ahora) {
    for (let i = celebraciones.length - 1; i >= 0; i--) {
      const c = celebraciones[i];
      const t = progreso((ahora - c.desde) * 1000, CELEBRACION_MS);
      for (const indice of c.indices) {
        const v = visuales[indice];
        if (!v) continue;
        const a = animarAcierto(t);
        v.caraFondo.scale = juego.vec2(a.escalaX, a.escalaY);
        v.plato.scale = juego.vec2(a.escalaX, a.escalaY);
        v.cara.scale = juego.vec2(v.escalaIcono * a.escalaX, v.escalaIcono * a.escalaY);
        v.halo.scale = juego.vec2(a.escalaX, a.escalaY);
      }
      if (t >= 1) {
        for (const indice of c.indices) resetEscala(indice);
        celebraciones.splice(i, 1);
      }
    }
  }

  function anotarFallo() {
    // El fallo ya está contado en la regla pura; aquí solo se pide ayuda. Si
    // sube el nivel, el par que se está viendo y los siguientes duran más.
    ayuda.anotarFallo();
    estado.tiempoVisibleMs = tiempoVisiblePar(ayuda.leer().nivel, baseVisibleMs);
    resolverEn = juego.time() + estado.tiempoVisibleMs / 1000;
    error(mundo.sonidos?.error ?? 240);
  }

  function acertarPareja(resultado) {
    ayuda.anotarAcierto();
    // Un acierto también puede bajar la ayuda: el tiempo visible se recalcula
    // en esa misma partida, sin esperar a otro fallo.
    estado.tiempoVisibleMs = tiempoVisiblePar(ayuda.leer().nivel, baseVisibleMs);
    acierto(mundo.sonidos?.acierto ?? 660);
    const segunda = posicion(resultado.indices[1]);
    if (!menosMovimiento) {
      alEstallar?.({
        x: segunda.x,
        y: segunda.y,
        radio: layout.lado * 0.5,
        color: mundo.acento,
      });
      celebraciones.push({ indices: [...resultado.indices], desde: juego.time() });
      // La primera carta ya estaba boca arriba: solo se enciende su halo.
      const primera = visuales[resultado.indices[0]];
      if (primera) primera.halo.hidden = false;
    } else {
      for (const indice of resultado.indices) aplicarVisual(indice);
    }
    alTerminar?.({
      acierto: true,
      aciertos: resultado.encontradas,
      terminada: resultado.terminada,
    });
    if (resultado.terminada) estado.lista = false;
  }

  juego.onLoad(() => {
    juego.scene('parejas', () => {
      const cartas = partida.leer().cartas;
      cartas.forEach((carta) => crearCarta(carta.id, carta.simbolo));
      cartas.forEach((carta) => aplicarVisual(carta.id));
      estado.lista = true;
      entrada(mundo.sonidos?.entrada);
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        const ahora = juego.time();
        actualizarVolteos(ahora);
        actualizarCelebraciones(ahora);
        if (partida.leer().bloqueada && ahora >= resolverEn) {
          const r = partida.resolverFallo();
          if (r.cambio) {
            for (const indice of r.indices) iniciarVolteo(indice);
          }
        }
        alCambiar?.(oficial());
      });
    });
    juego.go('parejas');
  });

  return {
    estado: oficial,
    clic(x, y) {
      if (!estado.lista || partida.leer().terminada) return;
      const indice = indiceCartaEn(layout, x, y);
      if (indice < 0) return; // tocar el fondo no es fallo: juego tranquilo
      const resultado = partida.girar(indice);
      if (!resultado.cambio) return;

      iniciarVolteo(indice);
      if (resultado.tipo === 'pareja') acertarPareja(resultado);
      else if (resultado.tipo === 'fallo') {
        anotarFallo();
        // La primera carta ya se ve; al agotarse el tiempo se giran las dos.
      }
      alCambiar?.(oficial());
    },
    detener() {
      estado.lista = false;
      juego.quit?.();
    },
  };
}
