import { cargarKaplay } from './kaplay-carga.js';
import { crearHover } from './hover.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAparicion, progreso, APARICION_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';

export async function arrancarEscena({ mundo, mecanica, alCambiar, alTerminar, alEstallar }) {
  const kaplay = await cargarKaplay();
  const menosMovimiento = prefiereMenosMovimiento();
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
  let dibujo = null;
  let puntero = null;
  const colorEstela = mundo.acento;
  let apareceEn = 0;
  // El objeto del mundo va dentro de la bola: la bola da área de clic y contorno,
  // el pictograma da el significado (ADR: arte ARASAAC para los objetivos).
  const FACTOR_DIBUJO = 0.78;
  juego.loadSprite('objeto-mundo', mundo.imagen);

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
  const tam = () =>
    calcularRadio({
      vmin: V_MIN(),
      minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 10,
      maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 18,
    });

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
    // Regresión: tras un acierto el objetivo debe volver a verse (opacidad > 0).
    visible: !!objetivo && objetivo.opacity > 0.01 && !objetivo.hidden,
  });

  function colocarObjetivo() {
    const radio = tam();
    const ancho = juego.width();
    const alto = juego.height();
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

    let elegido = null;
    if (lejos.length > 0) {
      elegido = lejos[Math.floor(Math.random() * lejos.length)];
    } else {
      for (let i = 0; i < 200 && !elegido; i++) {
        const x = radio + 16 + Math.random() * Math.max(1, ancho - (radio + 16) * 2);
        const y = radio + 16 + Math.random() * Math.max(1, alto - (radio + 16) * 2);
        if (Math.hypot(x - referencia.x, y - referencia.y) > radio * 3) elegido = { x, y };
      }
      elegido ??= { x: ancho / 2, y: alto / 2 };
    }

    const x = Math.min(ancho - radio - 8, Math.max(radio + 8, elegido.x));
    const y = Math.min(alto - radio - 8, Math.max(radio + 8, elegido.y));
    estado.objetivo = { x, y, radio };
    if (objetivo) {
      objetivo.pos = juego.vec2(x, y);
      objetivo.use(juego.circle(radio));
      apareceEn = juego.time();
      colocarDibujo();
    }
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
      dibujo = juego.add([
        juego.sprite('objeto-mundo'),
        juego.pos(estado.objetivo.x, estado.objetivo.y),
        juego.anchor('center'),
        'dibujo-objetivo',
      ]);
      sincronizarDibujo();
      estado.lista = true;

      juego.onUpdate(() => {
        const e = hover.avanzar(juego.dt() * 1000);
        estado.hoverLleno = e.lleno;

        const ahora = juego.time();
        const pAp = progreso((ahora - apareceEn) * 1000, APARICION_MS);
        const a = animarAparicion(pAp);

        if (menosMovimiento) {
          // Menos movimiento: el objetivo no se deforma ni gira; el hover sí responde
          // (es la señal de que va a acertar) y la aparición es instantánea.
          const pulso = 1 + 0.12 * e.lleno;
          objetivo.scale = juego.vec2(pulso, pulso);
          objetivo.angle = 0;
          objetivo.opacity = 1;
          if (e.lleno > 0) dibujarAro(e.lleno);
        } else {
          const pulso = 1 + 0.12 * e.lleno + 0.03 * Math.sin(ahora * 7);
          objetivo.scale = juego.vec2(a.escalaX * pulso, a.escalaY * pulso);
          objetivo.angle = (a.giro * 180) / Math.PI;
          objetivo.opacity = a.opacidad;
          if (e.lleno > 0) dibujarAro(e.lleno);
        }
        sincronizarDibujo();

        if (e.completado) {
          const m = marcador.anotarAcierto();
          estado.aciertos = m.aciertos;
          hover.reiniciar();
          hover.salir();
          estado.hoverLleno = 0;
          estado.hoverCompletado = false;
          const x = estado.objetivo.x;
          const y = estado.objetivo.y;
          const radio = estado.objetivo.radio;
          // Un estallido por acierto, no uno por fotograma. Con menos movimiento no hay partículas.
          if (!menosMovimiento) alEstallar?.({ x, y, radio });
          colocarObjetivo(); // la bola nueva empieza su aparición desde cero, sin saltos
          alTerminar?.({ acierto: true, aciertos: m.aciertos, terminada: m.terminada });
          if (m.terminada) {
            objetivo.hidden = true;
            if (dibujo) dibujo.hidden = true;
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

  function dibujarAro(lleno) {
    const o = estado.objetivo;
    if (!o) return;
    const color = juego.Color.fromHex('#ffffff');
    juego.drawCircle({
      radius: o.radio * 1.22,
      pos: juego.vec2(o.x, o.y),
      color: juego.rgb(color.r, color.g, color.b),
      opacity: 0.18,
      outline: { width: 7, color: juego.rgb(color.r, color.g, color.b) },
    });
    const giro = -Math.PI / 2 + lleno * Math.PI * 2;
    const pasos = 48;
    for (let i = 0; i < pasos * lleno; i++) {
      const a1 = -Math.PI / 2 + (i / pasos) * Math.PI * 2;
      const a2 = -Math.PI / 2 + ((i + 1.4) / pasos) * Math.PI * 2;
      const r = o.radio * 1.22;
      juego.drawLine({
        p1: juego.vec2(o.x + Math.cos(a1) * r, o.y + Math.sin(a1) * r),
        p2: juego.vec2(o.x + Math.cos(Math.min(a2, giro)) * r, o.y + Math.sin(Math.min(a2, giro)) * r),
        width: 9,
        color: juego.rgb(color.r, color.g, color.b),
        opacity: 0.95,
      });
    }
  }

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
