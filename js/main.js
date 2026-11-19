import { arrancarEscena } from './escena.js';
import { MUNDOS, MECANICAS, ORDEN } from './contenido.js';
import { pictograma } from './pictogramas.js';
import { accionDeDestino, guardarMundo, leerMundo } from './menu.js';
import { crearEstela } from './estela.js';

const CLAVE_AVATAR = 'juegos.avatar';

const AVATARES = [
  { id: 'balon', nombre: 'Balón' },
  { id: 'gato', nombre: 'Gato' },
  { id: 'estrella', nombre: 'Estrella' },
  { id: 'bicho', nombre: 'Bicho' },
];

const estado = {
  vista: 'menu',
  mundoId: leerMundo() ?? MUNDOS[0].id,
  avatarId: localStorage.getItem(CLAVE_AVATAR) ?? AVATARES[0].id,
  mecanicaId: null,
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

function render() {
  salirDePartida();
  document.getElementById('app').innerHTML = `
    <section class="menu">
      <header class="menu__cabecera">
        <div class="avatar" data-avatar="${estado.avatarId}">
          <img class="avatar__img" alt="" src="${svg(estado.avatarId)}">
        </div>
        <nav class="mundos" aria-label="Elige un mundo">
          ${MUNDOS.map(
            (m) => `
            <button class="mundo ${m.id === estado.mundoId ? 'mundo--activo' : ''}"
                    data-mundo="${m.id}" style="--fondo:${m.fondo};--acento:${m.acento}"
                    aria-pressed="${m.id === estado.mundoId}">
              <span class="mundo__icono"><img alt="" src="${svg(m.objetivo)}"></span>
            </button>`,
          ).join('')}
        </nav>
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
  if (id === 'hover') return 'estrella';
  if (id === 'clickEstatico') return 'balon';
  return 'regalo';
}

function animarMenu() {
  const gsap = window.gsap;
  if (!gsap) return;
  gsap.from('.mundo', { scale: 0.75, duration: 0.3, stagger: 0.05, ease: 'back.out(2)' });
  gsap.from('.juego', { y: 24, duration: 0.35, stagger: 0.06, ease: 'power2.out' });
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
      <div class="puntero" id="puntero" aria-hidden="true"></div>
      <button class="salir" id="otro-juego" data-accion="otro-juego" aria-label="Otro juego">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M22 50h44M52 36l14 14-14 14" fill="none" stroke="currentColor" stroke-width="9"
                stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="80" cy="50" r="9" fill="currentColor"/>
        </svg>
      </button>
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

function celebrarYVolver(partida) {
  const gsap = window.gsap;
  if (!gsap) return render();
  estado.vista = 'cerrando';
  const contenedor = document.querySelector('.partida');
  if (!contenedor) return render();
  const fiesta = document.createElement('div');
  fiesta.className = 'fiesta';
  fiesta.innerHTML = Array.from({ length: 18 }, (_, i) => {
    const ang = (i / 18) * Math.PI * 2;
    return `<span style="--dx:${Math.cos(ang) * 32}vmin;--dy:${Math.sin(ang) * 32}vmin"></span>`;
  }).join('');
  contenedor.appendChild(fiesta);
  let hecha = false;
  const terminar = () => {
    if (hecha) return;
    hecha = true;
    if (partida !== generacion) return;
    if (estado.vista !== 'cerrando') return;
    render();
  };
  gsap.to(fiesta, { opacity: 0, duration: 1.1, ease: 'power2.out', onComplete: terminar });
  setTimeout(terminar, 1500);
}

function animarSalida() {
  const gsap = window.gsap;
  if (!gsap) return;
  gsap.from('.salir', { scale: 0, duration: 0.35, delay: 0.15, ease: 'back.out(3)' });
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
  if (estado.vista === 'juego') {
    if (accionDeDestino(ev, '[data-accion="otro-juego"]')) return render();
    return;
  }
  const m = accionDeDestino(ev, '[data-mundo]');
  if (m) return elegirMundo(m.dataset.mundo);
  const j = accionDeDestino(ev, '[data-juego]');
  if (j) return jugar(j.dataset.juego);
});

render();
