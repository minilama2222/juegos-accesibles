import { cargarKaplay } from './kaplay-carga.js';
import { crearHover } from './hover.js';
import { crearMarcador } from './sesion.js';

export async function arrancarEscena({ mundo, mecanica, alCambiar, alTerminar }) {
  const kaplay = await cargarKaplay();
  const hover = crearHover({ llenadoMs: mecanica.llenadoMs, vaciadoMs: mecanica.vaciadoMs });
  const marcador = crearMarcador({ meta: mecanica.meta ?? 6 });
  const V_MIN = () => Math.min(window.innerWidth, window.innerHeight) / 100;

  const estado = {
    mecanica: mecanica.id,
    mundo: mundo.id,
    objetivo: null,
    hoverLleno: 0,
    hoverCompletado: false,
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

  let objetivo;
  let puntero = null;
  const tam = () =>
    Math.max(44, (Number.isFinite(mecanica.objetivoVmin) ? mecanica.objetivoVmin : 32) * V_MIN());

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: estado.objetivo ? { ...estado.objetivo } : null,
    hoverLleno: Number(estado.hoverLleno.toFixed(3)),
    hoverCompletado: estado.hoverCompletado,
    aciertos: estado.aciertos,
    meta: marcador.leer().meta,
    terminada: marcador.leer().terminada,
    lista: estado.lista,
  });

  function colocarObjetivo() {
    const radio = tam();
    const ancho = juego.width();
    const alto = juego.height();
    const margen = radio + 24;
    const referencia = estado.objetivo ?? puntero ?? { x: ancho / 2, y: alto / 2 };

    const tercios = [1 / 8, 3 / 8, 5 / 8, 7 / 8];
    const lejos = [];
    for (const fx of tercios) {
      for (const fy of tercios) {
        const x = ancho * fx;
        const y = alto * fy;
        if (Math.hypot(x - referencia.x, y - referencia.y) > radio * 3) lejos.push({ x, y });
      }
    }
    const opciones = lejos.length > 0 ? lejos : tercios.flatMap((fx) => tercios.map((fy) => ({ x: ancho * fx, y: alto * fy })));
    const elegido = opciones[Math.floor(Math.random() * opciones.length)];

    const x = Math.min(ancho - radio - 8, Math.max(radio + 8, elegido.x));
    const y = Math.min(alto - radio - 8, Math.max(radio + 8, elegido.y));
    estado.objetivo = { x, y, radio };
    if (objetivo) objetivo.pos = juego.vec2(x, y);
  }

  juego.onLoad(() => {
    juego.scene('hover', () => {
      colocarObjetivo();
      objetivo = juego.add([
        juego.circle(estado.objetivo.radio),
        juego.pos(estado.objetivo.x, estado.objetivo.y),
        juego.color(juego.Color.fromHex(mundo.acento)),
        juego.outline(4, juego.Color.fromHex('#ffffff')),
        juego.anchor('center'),
        'objetivo',
      ]);
      estado.lista = true;

      juego.onUpdate(() => {
        const e = hover.avanzar(juego.dt() * 1000);
        estado.hoverLleno = e.lleno;
        const escala = 1 + 0.08 * e.lleno;
        objetivo.scale = juego.vec2(escala, escala);

        if (e.completado) {
          const m = marcador.anotarAcierto();
          estado.aciertos = m.aciertos;
          hover.reiniciar();
          hover.salir();
          estado.hoverLleno = 0;
          estado.hoverCompletado = false;
          colocarObjetivo();
          objetivo.scale = juego.vec2(1, 1);
          alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });
          if (m.terminada) {
            objetivo.hidden = true;
            alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: true });
            alCambiar?.(oficial());
            return;
          }
        } else {
          estado.hoverCompletado = false;
        }
        alCambiar?.(oficial());
      });
    });
    juego.go('hover');
  });

  function dentro(x, y) {
    const o = estado.objetivo;
    return o ? Math.hypot(x - o.x, y - o.y) <= o.radio : false;
  }

  return {
    estado: oficial,
    moverPuntero(x, y) {
      if (!estado.lista) return;
      puntero = { x, y };
      if (dentro(x, y)) hover.entrar();
      else hover.salir();
    },
    detener() {
      estado.lista = false;
      juego.quit?.();
    },
  };
}
