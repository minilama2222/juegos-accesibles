import { cargarKaplay } from './kaplay-carga.js';
import { crearHover } from './hover.js';
import { crearMarcador } from './sesion.js';
import { calcularRadio } from './objetivo.js';
import { animarAparicion, progreso, APARICION_MS } from './animaciones.js';
import { prefiereMenosMovimiento } from './movimiento-reducido.js';
import { arrancarCausaEfecto } from './escena-causa-efecto.js';
import { arrancarClickEstatico } from './escena-click-estatico.js';
import { arrancarTiroAPorteria } from './escena-tiro-a-porteria.js';
import { acierto, entrada } from './audio.js';
import { crearAyuda } from './ayuda.js';

// Deja el objetivo dentro de la pantalla con un margen mínimo.
function limitarAlBorde(x, y, radio, ancho, alto) {
  return {
    x: Math.min(ancho - radio - 8, Math.max(radio + 8, x)),
    y: Math.min(alto - radio - 8, Math.max(radio + 8, y)),
  };
}

export async function arrancarEscena(opciones) {
  // Cada mecánica tiene su escena; aquí solo se elige.
  if (opciones.mecanica?.id === 'causaEfecto') return arrancarCausaEfecto(opciones);
  if (opciones.mecanica?.id === 'clickEstatico') return arrancarClickEstatico(opciones);
  if (opciones.mecanica?.id === 'tiroAPorteria') return arrancarTiroAPorteria(opciones);

  const { mundo, mecanica, alCambiar, alTerminar, alEstallar } = opciones;
  const ayuda = opciones.ayuda ?? crearAyuda({ juego: mecanica.id });
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
    fallos: 0,
    lista: false,
  };

  const juego = kaplay({
    canvas: document.getElementById('lienzo'),
    global: false,
    width: window.innerWidth,
    height: window.innerHeight,
    // Canvas transparente: el color y el arte del mundo viven detrás (CSS/SVG).
    // Sin esto Kaplay pinta su tablero de transparencia por defecto.
    background: [0, 0, 0, 0],
    touchToMouse: false,
  });

  let objetivo;
  let dibujo = null;
  let puntero = null;
  const colorEstela = mundo.acento;
  let apareceEn = 0;
  let intentoConProgreso = false;
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
  const tamBase = () =>
    calcularRadio({
      vmin: V_MIN(),
      minimo: Number.isFinite(mecanica.objetivoMinVmin) ? mecanica.objetivoMinVmin : 10,
      maximo: Number.isFinite(mecanica.objetivoMaxVmin) ? mecanica.objetivoMaxVmin : 18,
    });

  // La bola se dibuja con el radio base; la ayuda se aplica como escala. Así
  // el mismo objetivo puede crecer sin recolocarse ni cambiar de reglas.
  const factorAyuda = () => {
    const o = estado.objetivo;
    if (!o || !o.radioBase) return 1;
    return o.radio / o.radioBase;
  };

  const oficial = () => ({
    mecanica: estado.mecanica,
    mundo: estado.mundo,
    objetivo: estado.objetivo ? { ...estado.objetivo } : null,
    hoverLleno: Number(estado.hoverLleno.toFixed(3)),
    hoverCompletado: estado.hoverCompletado,
    aciertos: estado.aciertos,
    fallos: estado.fallos,
    ayuda: ayuda.leer(),
    meta: marcador.leer().meta,
    terminada: marcador.leer().terminada,
    lista: estado.lista,
    // Regresión: tras un acierto el objetivo debe volver a verse (opacidad > 0).
    visible: !!objetivo && objetivo.opacity > 0.01 && !objetivo.hidden,
  });

  function colocarObjetivo() {
    const base = tamBase();
    const radio = base * ayuda.parametros().factorTamano;
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

    const { x, y } = limitarAlBorde(elegido.x, elegido.y, radio, ancho, alto);
    estado.objetivo = { x, y, radio, radioBase: base };
    if (objetivo) {
      objetivo.pos = juego.vec2(x, y);
      objetivo.use(juego.circle(base));
      apareceEn = juego.time();
      colocarDibujo();
    }
    entrada(mundo.sonidos?.entrada);
  }

  function aplicarAyudaAlObjetivo() {
    const o = estado.objetivo;
    if (!o) return;
    o.radio = o.radioBase * ayuda.parametros().factorTamano;
    const pos = limitarAlBorde(o.x, o.y, o.radio, juego.width(), juego.height());
    o.x = pos.x;
    o.y = pos.y;
    if (objetivo) objetivo.pos = juego.vec2(o.x, o.y);
    colocarDibujo();
  }

  juego.onLoad(() => {
    juego.scene('hover', () => {
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

      juego.onUpdate(() => {
        const e = hover.avanzar(juego.dt() * 1000);
        const llenoAntes = estado.hoverLleno;
        estado.hoverLleno = e.lleno;
        if (e.lleno > 0.15) intentoConProgreso = true;

        // Un intento que se vacía del todo sin completarse es un fallo suave:
        // no quita progreso ni vidas, solo pide más ayuda para la próxima.
        if (!e.completado && e.lleno === 0 && llenoAntes > 0 && intentoConProgreso) {
          intentoConProgreso = false;
          estado.fallos += 1;
          const nivelAntes = ayuda.leer().nivel;
          ayuda.anotarFallo();
          if (ayuda.leer().nivel > nivelAntes) aplicarAyudaAlObjetivo();
        }

        const ahora = juego.time();
        const pAp = progreso((ahora - apareceEn) * 1000, APARICION_MS);
        const a = animarAparicion(pAp);
        const f = factorAyuda();

        if (menosMovimiento) {
          // Menos movimiento: el objetivo no se deforma ni gira; el hover sí responde
          // (es la señal de que va a acertar) y la aparición es instantánea.
          const pulso = 1 + 0.12 * e.lleno;
          objetivo.scale = juego.vec2(pulso * f, pulso * f);
          objetivo.angle = 0;
          objetivo.opacity = 1;
          if (e.lleno > 0) dibujarAro(e.lleno);
        } else {
          const pulso = 1 + 0.12 * e.lleno + 0.03 * Math.sin(ahora * 7);
          objetivo.scale = juego.vec2(a.escalaX * pulso * f, a.escalaY * pulso * f);
          objetivo.angle = (a.giro * 180) / Math.PI;
          objetivo.opacity = a.opacidad;
          if (e.lleno > 0) dibujarAro(e.lleno);
        }
        sincronizarDibujo();

        if (e.completado) {
          intentoConProgreso = false;
          const m = marcador.anotarAcierto();
          estado.aciertos = m.aciertos;
          ayuda.anotarAcierto();
          acierto(mundo.sonidos?.acierto ?? 660);
          hover.reiniciar();
          hover.salir();
          estado.hoverLleno = 0;
          estado.hoverCompletado = false;
          const x = estado.objetivo.x;
          const y = estado.objetivo.y;
          const radio = estado.objetivo.radio;
          // Un estallido por acierto, no uno por fotograma. Con menos movimiento no hay partículas.
          if (!menosMovimiento) alEstallar?.({ x, y, radio, color: mundo.acento });
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
