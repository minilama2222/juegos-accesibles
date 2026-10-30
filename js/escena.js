import { cargarKaplay } from './kaplay-carga.js';
import { crearHover } from './hover.js';

export async function arrancarEscena({ mundo, mecanica, alCambiar, alTerminar }) {
  const kaplay = await cargarKaplay();
  const hover = crearHover({ llenadoMs: mecanica.llenadoMs, vaciadoMs: mecanica.vaciadoMs });
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
  const tam = () => Math.max(44, mecanica.objetivoVmin * V_MIN());

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: estado.objetivo ? { ...estado.objetivo } : null,
    hoverLleno: Number(estado.hoverLleno.toFixed(3)),
    hoverCompletado: estado.hoverCompletado,
    aciertos: estado.aciertos,
    lista: estado.lista,
  });

  function colocarObjetivo() {
    const radio = tam();
    const margen = radio + 24;
    const maxX = Math.max(1, juego.width() - margen * 2);
    const maxY = Math.max(1, juego.height() - margen * 2);
    const lejosDelPuntero = (x, y) => !puntero || Math.hypot(x - puntero.x, y - puntero.y) > radio * 2.5;

    let x;
    let y;
    for (let i = 0; i < 40; i++) {
      x = margen + Math.random() * maxX;
      y = margen + Math.random() * maxY;
      if (lejosDelPuntero(x, y)) break;
    }
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
          estado.aciertos += 1;
          hover.reiniciar();
          hover.salir();
          estado.hoverLleno = 0;
          estado.hoverCompletado = false;
          colocarObjetivo();
          objetivo.scale = juego.vec2(1, 1);
          alTerminar?.({ acierto: true, aciertos: estado.aciertos });
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
