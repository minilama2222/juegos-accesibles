import { cargarKaplay } from './kaplay-carga.js';
import { crearMarcador } from './sesion.js';
import { animarBrote, progreso, BROTE_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { acierto, entrada } from './audio.js';

// Causa-efecto: cualquier clic hace aparecer el objeto del mundo en ese punto.
// No hay forma de fallar; el juego termina al llegar a la meta de toques.
const MAX_BROTES = 10;

export async function arrancarCausaEfecto({ mundo, mecanica, alCambiar, alTerminar, alEstallar }) {
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
  const marcador = crearMarcador({ meta: mecanica.meta ?? 12 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    aciertos: 0,
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

  juego.loadSprite('objeto-mundo', mundo.imagen);

  const brotes = [];
  let ultimoToque = null;

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: null,
    hoverLleno: 0,
    hoverCompletado: false,
    aciertos: estado.aciertos,
    toques: estado.aciertos,
    meta: marcador.leer().meta,
    terminada: marcador.leer().terminada,
    lista: estado.lista,
    brotes: brotes.length,
    ultimoToque,
  });

  const diametro = () => {
    const min = Number.isFinite(mecanica.broteMinVmin) ? mecanica.broteMinVmin : 12;
    const max = Number.isFinite(mecanica.broteMaxVmin) ? mecanica.broteMaxVmin : 20;
    return V_MIN() * (min + Math.random() * (max - min));
  };

  function brotar(x, y) {
    while (brotes.length >= MAX_BROTES) {
      brotes.shift().obj.destroy();
    }
    const base = diametro() / 500; // el pictograma mide 500×500
    const obj = juego.add([
      juego.sprite('objeto-mundo'),
      juego.pos(x, y),
      juego.anchor('center'),
    ]);
    obj.scale = juego.vec2(base, base);
    obj.opacity = 0;
    brotes.push({ obj, x, y, base, desde: juego.time() });
  }

  juego.onLoad(() => {
    juego.scene('causaEfecto', () => {
      estado.lista = true;
      entrada();
      alCambiar?.(oficial());

      juego.onUpdate(() => {
        const ahora = juego.time();
        for (let i = brotes.length - 1; i >= 0; i--) {
          const b = brotes[i];
          const p = progreso((ahora - b.desde) * 1000, BROTE_MS);
          const a = animarBrote(p);

          if (menosMovimiento) {
            // Sin desplazamiento ni overshoot: aparece en el sitio, se funde y se va.
            b.obj.scale = juego.vec2(b.base, b.base);
            b.obj.opacity = a.opacidad;
            b.obj.angle = 0;
          } else {
            b.obj.scale = juego.vec2(b.base * a.escalaX, b.base * a.escalaY);
            b.obj.opacity = a.opacidad;
            b.obj.angle = (a.giro * 180) / Math.PI;
            b.obj.pos = juego.vec2(b.x, b.y - a.subida * V_MIN() * 6);
          }

          if (p >= 1) {
            b.obj.destroy();
            brotes.splice(i, 1);
          }
        }
      });
    });
    juego.go('causaEfecto');
  });

  return {
    estado: oficial,
    clic(x, y) {
      if (!estado.lista || marcador.leer().terminada) return;
      const m = marcador.anotarAcierto();
      estado.aciertos = m.aciertos;
      ultimoToque = { x: Math.round(x), y: Math.round(y) };
      brotar(x, y);
      acierto(mundo.sonidoAcierto ?? 660);
      // Un anillo por toque en el sitio exacto, además del objeto. Con menos
      // movimiento no hay partículas: el objeto que aparece ya es la respuesta.
      if (!menosMovimiento) alEstallar?.({ x, y, radio: V_MIN() * 5, color: mundo.acento });
      alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });

      if (m.terminada) {
        estado.lista = false;
        alCambiar?.(oficial());
        return;
      }
      alCambiar?.(oficial());
    },
    moverPuntero() {},
    detener() {
      estado.lista = false;
      juego.quit?.();
    },
  };
}
