import { arrancarEscena } from './escena.js';
import { MUNDOS, MECANICAS, ORDEN } from './contenido.js';
import { pictograma } from './pictogramas.js';
import { accionDeDestino, guardarMundo, leerMundo, leerAvatar, guardarAvatar, siguienteAvatar } from './menu.js';
import { crearEstela } from './estela.js';
import { crearConfeti, avanzarConfeti, quedanVisibles } from './confeti.js';
import { fanfarria, asegurarAudio, iniciarMusica, alternarEfectos, alternarMusica, estadoSonido } from './audio.js';
import { PEGATINAS, leerColeccion, ganarPegatina, coleccionVisible } from './pegatinas.js';
import { prefiereMenosMovimiento, cantidadConfeti } from './movimiento-reducido.js';

// El avatar es del niño (historia 22): se elige con un clic y se recuerda.
// Nada de bolas raras: solo caras que se entienden.
const AVATARES = [
  { id: 'gato', nombre: 'Gato' },
  { id: 'perro', nombre: 'Perro' },
  { id: 'pato', nombre: 'Pato' },
  { id: 'bicho', nombre: 'Bicho' },
];

const avatarGuardado = leerAvatar();
const avatarValido = AVATARES.some((a) => a.id === avatarGuardado) ? avatarGuardado : AVATARES[0].id;

const estado = {
  vista: 'menu',
  mundoId: leerMundo() ?? MUNDOS[0].id,
  avatarId: avatarValido,
  mecanicaId: null,
  coleccion: leerColeccion(),
  ultimaPegatina: null,
};

let escena = null;
let generacion = 0;
let punteroHandler = null;

function svg(nombre) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pictograma(nombre));
}

function publicar(extra = {}) {
  window.juego = {
    vista: estado.vista,
    mundo: estado.mundoId,
    avatar: estado.avatarId,
    mecanica: estado.mecanicaId,
    escena: escena?.estado() ?? null,
    sonido: estadoSonido(),
    pegatinas: { ...estado.coleccion },
    ultimaPegatina: estado.ultimaPegatina,
    ...extra,
  };
}

function salirDePartida() {
  generacion += 1;
  escena?.detener?.();
  escena = null;
  if (punteroHandler) {
    window.removeEventListener('pointermove', punteroHandler);
    punteroHandler = null;
  }
  estado.mecanicaId = null;
  estado.vista = 'menu';
  document.body.dataset.vista = 'menu';
}

function botonEfectos() {
  const { efectos } = estadoSonido();
  return `<button class="herramienta" data-accion="efectos" data-estado="${efectos ? 'apagado' : 'encendido'}"
            aria-pressed="${efectos}" aria-label="${efectos ? 'Activar los efectos de sonido' : 'Silenciar los efectos de sonido'}">
            <img alt="" src="${svg(efectos ? 'silencio' : 'sonido')}">
          </button>`;
}

function botonMusica() {
  const { musica } = estadoSonido();
  return `<button class="herramienta" data-accion="musica" data-estado="${musica ? 'encendida' : 'apagada'}"
            aria-pressed="${musica}" aria-label="${musica ? 'Quitar la música' : 'Poner música'}">
            <img alt="" src="${svg(musica ? 'musica' : 'musicaApagada')}">
          </button>`;
}

function render() {
  salirDePartida();
  const ganadas = Object.values(estado.coleccion).filter((n) => n > 0).length;
  document.getElementById('app').innerHTML = `
    <section class="menu">
      <header class="menu__cabecera">
        <button class="avatar" data-accion="avatar" data-avatar="${estado.avatarId}"
                aria-label="Cambiar mi avatar">
          <img class="avatar__img" alt="" src="${svg(estado.avatarId)}">
        </button>
        <nav class="mundos" aria-label="Elige un mundo">
          ${MUNDOS.map(
            (m) => `
            <button class="mundo ${m.id === estado.mundoId ? 'mundo--activo' : ''}"
                    data-mundo="${m.id}" style="--fondo:${m.fondo};--acento:${m.acento}"
                    aria-pressed="${m.id === estado.mundoId}">
              <span class="mundo__icono"><img alt="" src="${m.imagen}"></span>
            </button>`,
          ).join('')}
        </nav>
        <div class="herramientas">
          <button class="herramienta herramienta--premio" data-accion="coleccion"
                  data-ganadas="${ganadas}" aria-label="Mis pegatinas">
            <img alt="" src="${svg('coleccion')}">
          </button>
          ${botonEfectos()}
          ${botonMusica()}
        </div>
      </header>
      <main class="juegos">
        ${ORDEN.filter((id) => MECANICAS[id]?.implementada).map(
          (id) => `
          <button class="juego" data-juego="${id}">
            <span class="juego__icono"><img alt="" src="${svg(iconoMecanica(id))}"></span>
          </button>`,
        ).join('')}
      </main>
    </section>`;
  animarMenu();
  publicar({ escena: null, ultimo: null });
}

function iconoMecanica(id) {
  if (id === 'causaEfecto') return 'destello';
  if (id === 'hover') return 'aguantar';
  if (id === 'clickEstatico') return 'balon';
  return 'regalo';
}
function animarColeccion() {
  const gsap = window.gsap;
  if (!gsap) return;
  if (prefiereMenosMovimiento()) {
    gsap.from('.pegatina, .volver', { opacity: 0, duration: 0.2, ease: 'power1.out' });
    return;
  }
  gsap.from('.volver', { scale: 0.6, opacity: 0, duration: 0.35, ease: 'back.out(2.5)' });
  gsap.from('.pegatina', {
    scale: 0.4,
    opacity: 0,
    rotate: -12,
    duration: 0.45,
    stagger: 0.05,
    ease: 'back.out(2.2)',
  });
}

function renderColeccion() {
  salirDePartida();
  estado.vista = 'coleccion';
  document.body.dataset.vista = 'coleccion';
  const visibles = coleccionVisible(estado.coleccion);
  document.getElementById('app').innerHTML = `
    <section class="coleccion">
      <button class="volver" data-accion="volver" aria-label="Volver al menú">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M78 50H34M48 36L34 50l14 14" fill="none" stroke="currentColor" stroke-width="9"
                stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="20" cy="50" r="9" fill="currentColor"/>
        </svg>
      </button>
      <div class="herramientas herramientas--coleccion">${botonEfectos()}${botonMusica()}</div>
      <div class="pegatinas" role="list" aria-label="Mis pegatinas">
        ${visibles
          .map(
            (p) => `
          <figure class="pegatina ${p.ganada ? 'pegatina--ganada' : ''}"
                  role="listitem" data-pegatina="${p.id}" data-ganada="${p.ganada}"
                  aria-label="${p.nombre}${p.ganada ? '' : ': por conseguir'}">
            <span class="pegatina__icono"><img alt="" src="${svg(p.icono)}"></span>
          </figure>`,
          )
          .join('')}
      </div>
    </section>`;
  animarColeccion();
  publicar({ escena: null });
}

function actualizarControlesSonido() {
  const { efectos, musica } = estadoSonido();
  document.querySelectorAll('[data-accion="efectos"]').forEach((b) => {
    b.dataset.estado = efectos ? 'apagado' : 'encendido';
    b.setAttribute('aria-pressed', String(efectos));
    b.setAttribute('aria-label', efectos ? 'Activar los efectos de sonido' : 'Silenciar los efectos de sonido');
    const img = b.querySelector('img');
    if (img) img.src = svg(efectos ? 'silencio' : 'sonido');
  });
  document.querySelectorAll('[data-accion="musica"]').forEach((b) => {
    b.dataset.estado = musica ? 'encendida' : 'apagada';
    b.setAttribute('aria-pressed', String(musica));
    b.setAttribute('aria-label', musica ? 'Quitar la música' : 'Poner música');
    const img = b.querySelector('img');
    if (img) img.src = svg(musica ? 'musica' : 'musicaApagada');
  });
}

function animarMenu() {
  const gsap = window.gsap;
  if (!gsap) return;
  if (prefiereMenosMovimiento()) {
    // Menos movimiento: aparece y ya está. Sin rebotes ni latido en bucle.
    gsap.from('.avatar, .mundo, .juego', { opacity: 0, duration: 0.2, ease: 'power1.out' });
    return;
  }
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  tl.from('.avatar', { scale: 0.6, opacity: 0, duration: 0.4, ease: 'back.out(3)' })
    .from(
      '.mundo',
      { scale: 0.7, y: -18, duration: 0.42, stagger: { each: 0.05, from: 'center' }, ease: 'back.out(2.6)' },
      '-=0.15',
    )
    .from('.juego', { scale: 0.75, opacity: 0, duration: 0.45, ease: 'back.out(2.4)' }, '-=0.1');
  gsap.to('.juego', {
    scale: 1.06,
    duration: 0.55,
    yoyo: true,
    repeat: 3,
    ease: 'sine.inOut',
    delay: 1.2,
    onComplete: () => gsap.set('.juego', { scale: 1 }),
  });
}

function cambiarAvatar() {
  const ids = AVATARES.map((a) => a.id);
  estado.avatarId = siguienteAvatar(estado.avatarId, ids);
  guardarAvatar(estado.avatarId);

  const boton = document.querySelector('[data-accion="avatar"]');
  const img = boton?.querySelector('img');
  if (boton) boton.dataset.avatar = estado.avatarId;
  if (img) {
    img.src = svg(estado.avatarId);
    const gsap = window.gsap;
    if (gsap && !prefiereMenosMovimiento()) {
      gsap.fromTo(
        img,
        { scale: 0.5, rotate: -14 },
        { scale: 1, rotate: 0, duration: 0.4, ease: 'back.out(3)' },
      );
    }
  }
  publicar();
}

function elegirMundo(id) {
  estado.mundoId = id;
  guardarMundo(id);
  document.querySelectorAll('[data-mundo]').forEach((b) => {
    const activo = b.dataset.mundo === id;
    b.classList.toggle('mundo--activo', activo);
    b.setAttribute('aria-pressed', String(activo));
  });
  publicar();
}

async function jugar(mecanicaId) {
  const partida = ++generacion;
  estado.ultimaPegatina = null;
  const mundo = MUNDOS.find((m) => m.id === estado.mundoId) ?? MUNDOS[0];
  const mecanica = MECANICAS[mecanicaId] ?? MECANICAS.hover;
  estado.mecanicaId = mecanicaId;
  estado.vista = 'juego';
  escena = null;

  document.body.dataset.vista = 'juego';
  document.getElementById('app').innerHTML = `
    <section class="partida" data-vista="juego" data-mundo="${mundo.id}"
             style="--fondo:${mundo.fondo};--acento:${mundo.acento}">
      <canvas id="lienzo" class="lienzo"></canvas>
      <canvas class="estela" id="estela" aria-hidden="true"></canvas>
      <canvas class="estallidos" id="estallidos" aria-hidden="true"></canvas>
      <div class="puntero" id="puntero" aria-hidden="true"></div>
      <button class="salir" id="otro-juego" data-accion="otro-juego" aria-label="Otro juego">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M22 50h44M52 36l14 14-14 14" fill="none" stroke="currentColor" stroke-width="9"
                stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="80" cy="50" r="9" fill="currentColor"/>
        </svg>
      </button>
      <div class="herramientas herramientas--juego">${botonEfectos()}${botonMusica()}</div>
    </section>`;

  animarSalida();
  seguirPuntero();
  publicar();

  escena = await arrancarEscena({
    mundo,
    mecanica,
    alCambiar: (e) => {
      if (partida === generacion && estado.vista === 'juego') publicar({ escena: e });
    },
    alEstallar: (punto, ac) => {
      if (partida === generacion) pintarEstallido(punto, ac);
    },
    alTerminar: (r) => {
      if (partida !== generacion || estado.vista !== 'juego') return;
      publicar({ ultimo: r });
      if (r.terminada) celebrarYVolver(partida);
    },
  });
  if (partida !== generacion) {
    escena.detener?.();
    return;
  }
  estado.escenaLista = true;
  publicar();
}

const estallidosActivos = [];

function pintarEstallido(punto, ac) {
  // Chispas repartidas alrededor: cada golpe se ve distinto sin ser ruidoso.
  const chispas = Array.from({ length: 10 }, (_, i) => ({
    ang: (i / 10) * Math.PI * 2 + Math.random() * 0.4,
    dist: 40 + Math.random() * 80,
    grande: i % 2 === 0,
  }));
  estallidosActivos.push({ ...punto, ac, desde: performance.now(), chispas });
  if (!estallidosActivos.loop) {
    estallidosActivos.loop = requestAnimationFrame(pintarEstallidos);
  }
}

function pintarEstallidos() {
  const lienzo = document.getElementById('estallidos');
  if (!lienzo || estallidosActivos.length === 0) {
    estallidosActivos.loop = null;
    estallidosActivos.length = 0;
    return;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  if (lienzo.width !== ancho * dpr) {
    lienzo.width = ancho * dpr;
    lienzo.height = alto * dpr;
  }
  const ctx = lienzo.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, ancho, alto);

  for (let i = estallidosActivos.length - 1; i >= 0; i--) {
    const e = estallidosActivos[i];
    const t = Math.min(1, (performance.now() - e.desde) / 480); // tope del refuerzo (ADR 0001, regla 5)
    if (t >= 1 || e.ac?.opacidad <= 0.01) {
      estallidosActivos.splice(i, 1);
      continue;
    }
    const vida = e.ac?.opacidad ?? 1 - t;
    const r = e.radio * (1.05 + 1.4 * (1 - vida));
    ctx.globalAlpha = Math.min(1, vida);
    ctx.lineWidth = 4 + 14 * vida;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 18 * vida;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = vida * 0.35;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.radio * (0.6 + 0.4 * vida), 0, Math.PI * 2);
    ctx.fill();

    // Chispas del color del mundo, saliendo en abanico.
    const colorChispa = e.color || '#ffd54f';
    ctx.fillStyle = colorChispa;
    ctx.shadowColor = colorChispa;
    ctx.shadowBlur = 14;
    for (const s of e.chispas) {
      const d = e.radio * 0.55 + s.dist * t;
      ctx.globalAlpha = (1 - t) * 0.95;
      const r = (s.grande ? 6 : 4) + 8 * (1 - t);
      ctx.beginPath();
      ctx.arc(e.x + Math.cos(s.ang) * d, e.y + Math.sin(s.ang) * d, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;
  estallidosActivos.loop = requestAnimationFrame(pintarEstallidos);
}

function mostrarPremio(contenedor, premio) {
  const gsap = window.gsap;
  const p = PEGATINAS.find((x) => x.id === premio.id) ?? PEGATINAS[0];
  const caja = document.createElement('div');
  caja.className = 'premio';
  caja.dataset.premio = premio.id;
  caja.innerHTML = `<img alt="" src="${svg(p.icono)}">`;
  contenedor.appendChild(caja);
  if (gsap && !prefiereMenosMovimiento()) {
    gsap.fromTo(
      caja,
      { scale: 0.2, rotate: -18, opacity: 0 },
      { scale: 1, rotate: 0, opacity: 1, duration: 0.5, ease: 'back.out(2.4)', delay: 0.15 },
    );
  } else if (gsap) {
    gsap.fromTo(caja, { opacity: 0 }, { opacity: 1, duration: 0.2 });
  }
}

function celebrarYVolver(partida) {
  const gsap = window.gsap;
  estado.vista = 'cerrando';
  const premio = ganarPegatina();
  estado.coleccion = premio.coleccion;
  estado.ultimaPegatina = { id: premio.id, nueva: premio.nueva };
  publicar({ ultimaPegatina: estado.ultimaPegatina, pegatinas: { ...estado.coleccion } });
  try {
    fanfarria();
  } catch {}

  const contenedor = document.querySelector('.partida') ?? document.body;
  const lienzo = document.createElement('canvas');
  lienzo.className = 'confeti';
  contenedor.appendChild(lienzo);
  mostrarPremio(contenedor, premio);

  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  lienzo.width = ancho * dpr;
  lienzo.height = alto * dpr;
  const ctx = lienzo.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const piezas = crearConfeti({ ancho, alto, cantidad: cantidadConfeti() });
  let ultimo = performance.now();
  let terminado = false;

  const terminar = () => {
    if (terminado) return;
    terminado = true;
    if (partida !== generacion) return;
    if (estado.vista !== 'cerrando') return;
    render();
  };

  if (gsap) {
    gsap.fromTo(lienzo, { opacity: 0 }, { opacity: 1, duration: 0.2 });
  }

  const dibujar = (ahora) => {
    const dt = Math.min(0.05, (ahora - ultimo) / 1000);
    ultimo = ahora;
    avanzarConfeti(piezas, dt);
    ctx.clearRect(0, 0, ancho, alto);
    for (const p of piezas) {
      if (p.y > alto + 40) continue;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.95;
      ctx.fillRect(-p.ancho / 2, -p.alto / 2, p.ancho, p.alto * (0.4 + Math.abs(Math.cos(p.giro)) * 0.6));
      ctx.restore();
    }
    if (quedanVisibles(piezas, alto)) {
      requestAnimationFrame(dibujar);
    } else {
      setTimeout(terminar, 250);
    }
  };
  requestAnimationFrame(dibujar);
  setTimeout(terminar, 4200);
}

function animarSalida() {
  const gsap = window.gsap;
  if (!gsap) return;
  const cortina = document.createElement('div');
  cortina.className = 'cortina';
  cortina.style.background = getComputedStyle(document.body).getPropertyValue('--fondo') || '#10231d';
  document.body.appendChild(cortina);
  if (prefiereMenosMovimiento()) {
    // Sin círculo que se cierra ni botón girando: fundido corto y listo.
    gsap.fromTo(cortina, { opacity: 0 }, { opacity: 1, duration: 0.15, onComplete: () => cortina.remove() });
    return;
  }
  gsap
    .timeline()
    .fromTo(
      cortina,
      { clipPath: 'circle(150% at 50% 50%)' },
      { clipPath: 'circle(0% at 50% 50%)', duration: 0.55, ease: 'power3.inOut' },
    )
    .add(() => cortina.remove());
}

function seguirPuntero() {
  const p = document.getElementById('puntero');
  const lienzo = document.getElementById('estela');
  if (!p || !lienzo) return;

  const ctx = lienzo.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const ancho = window.innerWidth;
  const alto = window.innerHeight;
  lienzo.width = ancho * dpr;
  lienzo.height = alto * dpr;

  const estela = crearEstela({ vidaMs: 450, huecos: 40 });
  const color = getComputedStyle(document.body).getPropertyValue('--acento').trim() || '#ffd54f';

  punteroHandler = (ev) => {
    p.style.transform = `translate(${ev.clientX}px, ${ev.clientY}px)`;
    estela.añadir(ev.clientX, ev.clientY, performance.now());
    escena?.moverPuntero?.(ev.clientX, ev.clientY);
  };
  window.addEventListener('pointermove', punteroHandler, { passive: true });

  const dibujar = () => {
    if (!lienzo.isConnected) return;
    const ahora = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, ancho, alto);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    for (const t of estela.tramos(ahora)) {
      ctx.globalAlpha = Math.min(0.9, t.vida * 0.9);
      ctx.lineWidth = 6 + 26 * t.vida;
      ctx.beginPath();
      ctx.moveTo(t.x1, t.y1);
      ctx.lineTo(t.x2, t.y2);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    requestAnimationFrame(dibujar);
  };
  requestAnimationFrame(dibujar);
}

document.addEventListener('click', (ev) => {
  if (accionDeDestino(ev, '[data-accion="efectos"]')) {
    alternarEfectos();
    actualizarControlesSonido();
    publicar();
    return;
  }
  if (accionDeDestino(ev, '[data-accion="musica"]')) {
    alternarMusica();
    actualizarControlesSonido();
    publicar();
    return;
  }
  if (estado.vista === 'coleccion') {
    if (accionDeDestino(ev, '[data-accion="volver"]')) return render();
    return;
  }
  if (estado.vista === 'juego') {
    if (accionDeDestino(ev, '[data-accion="otro-juego"]')) return render();
    // La mecánica decide qué significa un clic en la escena (en hover, nada).
    escena?.clic?.(ev.clientX, ev.clientY);
    return;
  }
  if (accionDeDestino(ev, '[data-accion="coleccion"]')) return renderColeccion();
  if (accionDeDestino(ev, '[data-accion="avatar"]')) return cambiarAvatar();
  const m = accionDeDestino(ev, '[data-mundo]');
  if (m) return elegirMundo(m.dataset.mundo);
  const j = accionDeDestino(ev, '[data-juego]');
  if (j) {
    try {
      asegurarAudio();
      iniciarMusica();
    } catch {}
    return jugar(j.dataset.juego);
  }
});

render();
