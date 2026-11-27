import { arrancarEscena } from './escena.js';
import { MUNDOS, MECANICAS, ORDEN, mundoPorId } from './contenido.js';
import { pictograma } from './pictogramas.js';
import { imagenArasaac } from './arasaac.js';
import { fondoSvg } from './fondos.js';
import { accionDeDestino, guardarMundo, leerMundo, leerAvatar, guardarAvatar, siguienteAvatar } from './menu.js';
import { crearEstela } from './estela.js';
import { crearConfeti, avanzarConfeti, quedanVisibles } from './confeti.js';
import { fanfarria, asegurarAudio, iniciarMusica, alternarEfectos, alternarMusica, estadoSonido } from './audio.js';
import { PEGATINAS, leerColeccion, ganarPegatina, coleccionVisible } from './pegatinas.js';
import { prefiereMenosMovimiento, cantidadConfeti } from './movimiento-reducido.js';
import { crearAyuda } from './ayuda.js';
import { crearMetricas } from './metricas.js';
import { alternarPantallaCompleta, estaEnPantallaCompleta } from './pantalla.js';
import { crearGuardaUnica } from './partida.js';
import { AVISO_TACTIL, hayPunteroGrueso } from './tactil.js';

// El avatar es del niño (historia 22): se elige con un clic y se recuerda.
// Nada de bolas raras: solo caras que se entienden.
const AVATARES = [
  { id: 'contento', nombre: 'Carita contenta' },
  { id: 'contenta', nombre: 'Carita contenta de pelo largo' },
];

const avatarGuardado = leerAvatar();
const avatarValido = AVATARES.some((a) => a.id === avatarGuardado) ? avatarGuardado : AVATARES[0].id;
const metricas = crearMetricas();

const estado = {
  vista: 'menu',
  mundoId: leerMundo() ?? MUNDOS[0].id,
  avatarId: avatarValido,
  mecanicaId: null,
  coleccion: leerColeccion(),
  ultimaPegatina: null,
  ayuda: null,
  partidaActiva: false,
  confeti: null,
  ultimoRefuerzo: null,
};

let escena = null;
let generacionActual = 0;
let punteroHandler = null;
const cierreUnico = crearGuardaUnica();

function mundoActual() {
  return mundoPorId(estado.mundoId);
}

// Lo que se ve y se oye del mundo, observable desde los tests (window.juego).
function aparienciaMundo(m) {
  return {
    fondo: m.fondo,
    acento: m.acento,
    paleta: [...m.paleta],
    fondoArte: m.fondoArte,
    objetivo: m.objetivo,
    imagen: m.imagen,
    refuerzo: m.refuerzo,
    sonidos: { ...m.sonidos, fanfarria: [...m.sonidos.fanfarria] },
  };
}

function fondoDe(m) {
  return `<div class="fondo${estado.vista === 'menu' ? ' fondo--menu' : ''}" aria-hidden="true">${fondoSvg(m)}</div>`;
}

function svg(nombre) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pictograma(nombre));
}

// La pegatina pinta su pictograma ARASAAC; si faltara, la estrella dibujada.
function dibujoPegatina(p) {
  const imagen = imagenArasaac(p.pictograma);
  return imagen ? `<img alt="" src="${imagen}">` : svg('estrella');
}

function publicar(extra = {}) {
  const mundo = mundoActual();
  const escenaEstado = escena?.estado?.() ?? null;
  // En parejas, la escena publica también el tablero en la raíz de window.juego:
  // cartas, parejas encontradas, si ha terminado y la ayuda vigente.
  const parejas =
    escenaEstado?.mecanica === 'parejas'
      ? {
          cartas: escenaEstado.cartas,
          parejas: escenaEstado.parejas,
          encontradas: escenaEstado.encontradas,
          terminada: escenaEstado.terminada,
          bloqueada: escenaEstado.bloqueada,
          tiempoVisibleMs: escenaEstado.tiempoVisibleMs,
          dibujos: escenaEstado.dibujos,
        }
      : {};
  window.juego = {
    vista: estado.vista,
    mundo: estado.mundoId,
    avatar: estado.avatarId,
    mecanica: estado.mecanicaId,
    escena: escenaEstado,
    sonido: estadoSonido(),
    pegatinas: { ...estado.coleccion },
    ultimaPegatina: estado.ultimaPegatina,
    ayuda: estado.ayuda?.leer() ?? null,
    apariencia: aparienciaMundo(mundo),
    movimiento: {
      reducido: prefiereMenosMovimiento(),
      confeti: estado.confeti,
    },
    ultimoRefuerzo: estado.ultimoRefuerzo,
    estallidos: estallidosActivos.length,
    exportarMetricas,
    ...parejas,
    ...extra,
  };
}

// Cierra la partida en curso y deja las métricas en el almacén. Se llama al
// salir, al terminar y al cerrar la pestaña; nunca se muestra en pantalla.
function terminarPartidaActual() {
  if (!estado.partidaActiva) return;
  const e = escena?.estado?.() ?? null;
  metricas.terminar({
    aciertos: e?.aciertos ?? 0,
    fallos: e?.fallos ?? 0,
    ayudaFinal: e?.ayuda?.nivel ?? estado.ayuda?.leer().nivel ?? 0,
  });
  estado.partidaActiva = false;
}

function salirDePartida() {
  terminarPartidaActual();
  generacionActual += 1;
  escena?.detener?.();
  escena = null;
  if (punteroHandler) {
    window.removeEventListener('pointermove', punteroHandler);
    punteroHandler = null;
  }
  estado.mecanicaId = null;
  estado.ayuda = null;
  estado.vista = 'menu';
  document.body.dataset.vista = 'menu';
}

// El padre exporta las métricas con la tecla E. No hay botón ni texto dentro
// del juego: el niño nunca ve esta parte.
function exportarMetricas() {
  const datos = {
    exportadoEn: new Date().toISOString(),
    ...metricas.exportar(),
  };
  try {
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = `juegos-metricas-${new Date().toISOString().slice(0, 10)}.json`;
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  } catch {}
  return datos;
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

function botonPantalla() {
  const activa = estaEnPantallaCompleta();
  return `<button class="herramienta" data-accion="pantalla-completa"
            data-estado="${activa ? 'activa' : 'inactiva'}" aria-pressed="${activa}"
            aria-label="${activa ? 'Salir de pantalla completa' : 'Pantalla completa'}">
            <img alt="" src="${svg(activa ? 'pantallaSalir' : 'pantalla')}">
          </button>`;
}

// Aviso al padre, no al niño: solo icono, con su aria-label. No cambia nada
// del juego ni añade texto visible.
function avisoTactil() {
  if (!hayPunteroGrueso()) return '';
  return `<span class="aviso aviso--tactil" role="status" aria-label="${AVISO_TACTIL}">
            <img alt="" src="${svg('tactil')}">
          </span>`;
}

function actualizarControlesPantalla() {
  const activa = estaEnPantallaCompleta();
  document.querySelectorAll('[data-accion="pantalla-completa"]').forEach((b) => {
    b.dataset.estado = activa ? 'activa' : 'inactiva';
    b.setAttribute('aria-pressed', String(activa));
    b.setAttribute('aria-label', activa ? 'Salir de pantalla completa' : 'Pantalla completa');
    const img = b.querySelector('img');
    if (img) img.src = svg(activa ? 'pantallaSalir' : 'pantalla');
  });
}

function render() {
  salirDePartida();
  estado.confeti = null;
  estado.ultimoRefuerzo = null;
  const ganadas = Object.values(estado.coleccion).filter((n) => n > 0).length;
  const mundoMenu = mundoActual();
  document.getElementById('app').innerHTML = `
    <section class="menu" style="--fondo:${mundoMenu.fondo};--acento:${mundoMenu.acento}">
      ${fondoDe(mundoMenu)}
      <header class="menu__cabecera">
        <div class="herramientas herramientas--izquierda">
          <button class="herramienta herramienta--lugar" data-accion="lugar"
                  aria-label="Cambiar de mundo" style="--tinta:${mundoMenu.paleta[2]}">
            <img alt="" src="${svg('lugar')}">
          </button>
          <button class="herramienta herramienta--premio" data-accion="coleccion"
                  data-ganadas="${ganadas}" aria-label="Mis pegatinas">
            <img alt="" src="${svg('coleccion')}">
          </button>
        </div>
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
        <div class="herramientas herramientas--derecha">
          ${botonAvatar()}
          ${botonEfectos()}
          ${botonMusica()}
          ${botonPantalla()}
          ${avisoTactil()}
        </div>
      </header>
      <main class="juegos">
        ${ORDEN.filter((id) => MECANICAS[id]?.implementada)
          .flatMap((id) =>
            id === 'parejas'
              ? MECANICAS.parejas.tableros.map((n) => botonJuego(id, n))
              : [botonJuego(id)],
          )
          .join('')}
      </main>
    </section>`;
  animarMenu();
  publicar({ escena: null, ultimo: null });
}

// El avatar ya no es una cara grande: es un control más (gato, carita…), así
// que vive en la fila de herramientas y se pinta como los demás.
function botonAvatar() {
  return `
    <button class="herramienta herramienta--avatar" data-accion="avatar"
            data-avatar="${estado.avatarId}" aria-label="Cambiar mi avatar">
      <img alt="" src="${imagenArasaac(estado.avatarId)}">
    </button>`;
}

function botonJuego(id, parejas) {
  const extra = parejas ? ` data-parejas="${parejas}"` : '';
  const nombre = parejas ? `${parejas} parejas` : id;
  return `
    <button class="juego" data-juego="${id}"${extra} aria-label="${nombre}">
      <span class="juego__icono"><img alt="" src="${dibujoMecanica(id, parejas)}"></span>
    </button>`;
}

// Los iconos de mecánica pueden ser un pictograma ARASAAC con su propia clase
// de color (p. ej. `destello`) o un SVG propio del menú (p. ej. `porteria`).
function dibujoMecanica(id, parejas) {
  const nombre = iconoMecanica(id, parejas);
  return imagenArasaac(nombre) ?? svg(nombre);
}

function iconoMecanica(id, parejas) {
  const mecanica = MECANICAS[id];
  if (!mecanica?.icono) return 'regalo';
  // Parejas usa un icono por tablero (`parejas4`, `parejas6`, `parejas8`).
  return id === 'parejas' ? `${mecanica.icono}${parejas ?? mecanica.parejasPorDefecto}` : mecanica.icono;
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
  estado.confeti = null;
  document.body.dataset.vista = 'coleccion';
  const visibles = coleccionVisible(estado.coleccion);
  const mundoMenu = mundoActual();
  document.getElementById('app').innerHTML = `
    <section class="coleccion" style="--fondo:${mundoMenu.fondo};--acento:${mundoMenu.acento}">
      ${fondoDe(mundoMenu)}
      <button class="volver" data-accion="volver" aria-label="Volver al menú">
        <img alt="" src="${svg('volver')}">
      </button>
      <div class="herramientas herramientas--coleccion">${botonEfectos()}${botonMusica()}${botonPantalla()}</div>
      <div class="pegatinas" role="list" aria-label="Mis pegatinas">
        ${visibles
          .map(
            (p) => `
          <figure class="pegatina ${p.ganada ? 'pegatina--ganada' : ''}"
                  role="listitem" data-pegatina="${p.id}" data-ganada="${p.ganada}"
                  aria-label="${p.nombre}${p.ganada ? '' : ': por conseguir'}">
            <span class="pegatina__icono">${dibujoPegatina(p)}</span>
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

// "Lugar": cambia al siguiente mundo. Es el mismo paquete visual y sonoro de
// siempre; no toca reglas.
function cambiarMundo() {
  const i = MUNDOS.findIndex((m) => m.id === estado.mundoId);
  elegirMundo(MUNDOS[(i + 1) % MUNDOS.length].id);
}

function cambiarAvatar() {
  const ids = AVATARES.map((a) => a.id);
  estado.avatarId = siguienteAvatar(estado.avatarId, ids);
  guardarAvatar(estado.avatarId);

  // Hay más de un botón de avatar (menú y partida): se cambian todos.
  for (const boton of document.querySelectorAll('[data-accion="avatar"]')) {
    boton.dataset.avatar = estado.avatarId;
    const img = boton.querySelector('img');
    if (!img) continue;
    img.src = imagenArasaac(estado.avatarId);
    const gsap = window.gsap;
    if (gsap && !prefiereMenosMovimiento()) {
      gsap.fromTo(
        img,
        { scale: 0.5, rotate: -14 },
        { scale: 1, rotate: 0, duration: 0.4, ease: 'back.out(3)' },
      );
    }
  }
  // En partida el puntero es la propia cara: cambia con ella.
  const puntero = document.querySelector('#puntero img');
  if (puntero) {
    puntero.dataset.puntero = estado.avatarId;
    puntero.src = imagenArasaac(estado.avatarId);
  }
  publicar();
}

function elegirMundo(id) {
  estado.mundoId = id;
  guardarMundo(id);
  const mundo = mundoPorId(id);
  const menu = document.querySelector('.menu');
  if (menu) {
    menu.style.setProperty('--fondo', mundo.fondo);
    menu.style.setProperty('--acento', mundo.acento);
    const fondo = menu.querySelector('.fondo--menu');
    if (fondo) fondo.innerHTML = fondoSvg(mundo);
  }
  document.querySelectorAll('[data-mundo]').forEach((b) => {
    const activo = b.dataset.mundo === id;
    b.classList.toggle('mundo--activo', activo);
    b.setAttribute('aria-pressed', String(activo));
  });
  // La pieza «lugar» y el fondo de los botones llevan el acento del mundo.
  const lugar = menu?.querySelector('[data-accion="lugar"]');
  if (lugar) lugar.style.setProperty('--tinta', mundo.paleta[2]);
  publicar();
}

async function jugar(mecanicaId, opciones = {}) {
  terminarPartidaActual();
  const partida = ++generacionActual;
  estado.ultimaPegatina = null;
  estado.confeti = null;
  estado.ultimoRefuerzo = null;
  const mundo = mundoActual();
  const mecanica = MECANICAS[mecanicaId] ?? MECANICAS.hover;
  estado.mecanicaId = mecanicaId;
  estado.ayuda = crearAyuda({ juego: mecanicaId });
  metricas.empezar(mecanicaId);
  estado.partidaActiva = true;
  estado.vista = 'juego';
  escena = null;

  document.body.dataset.vista = 'juego';
  document.getElementById('app').innerHTML = `
    <section class="partida" data-vista="juego" data-mundo="${mundo.id}" data-fondo="${mundo.fondoArte}"
             style="--fondo:${mundo.fondo};--acento:${mundo.acento}">
      ${fondoDe(mundo)}
      <canvas id="lienzo" class="lienzo"></canvas>
      <canvas class="estela" id="estela" aria-hidden="true"></canvas>
      <canvas class="estallidos" id="estallidos" aria-hidden="true"></canvas>
      <div class="sellos" id="sellos" aria-hidden="true"></div>
      <div class="puntero" id="puntero" aria-hidden="true">
        <img alt="" data-puntero="${estado.avatarId}" src="${imagenArasaac(estado.avatarId)}">
      </div>
      <button class="salir" id="otro-juego" data-accion="otro-juego" aria-label="Otro juego">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path d="M22 50h44M52 36l14 14-14 14" fill="none" stroke="currentColor" stroke-width="9"
                stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="80" cy="50" r="9" fill="currentColor"/>
        </svg>
      </button>
      <div class="herramientas herramientas--juego">${botonEfectos()}${botonMusica()}${botonPantalla()}</div>
    </section>`;

  animarSalida();
  seguirPuntero();
  publicar();

  escena = await arrancarEscena({
    mundo,
    mecanica,
    parejas: opciones.parejas,
    ayuda: estado.ayuda,
    alCambiar: (e) => {
      if (partida === generacionActual && estado.vista === 'juego') publicar({ escena: e });
    },
    alEstallar: (punto, ac) => {
      if (partida === generacionActual) pintarEstallido(punto, ac);
    },
    alTerminar: (r) => {
      if (partida !== generacionActual || estado.vista !== 'juego') return;
      publicar({ ultimo: r });
      if (r.terminada) {
        // Cierra las métricas al terminar de jugar, no tras el confeti.
        terminarPartidaActual();
        celebrarYVolver(partida);
      }
    },
  });
  if (partida !== generacionActual) {
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
  const mundo = mundoActual();
  estado.ultimoRefuerzo = {
    mundo: mundo.id,
    refuerzo: mundo.refuerzo,
    x: Math.round(punto.x),
    y: Math.round(punto.y),
  };
  if (!prefiereMenosMovimiento()) mostrarSello(punto, mundo);
}

// El refuerzo del mundo: un sello corto (<0,5 s) en el punto del acierto.
// Es DOM (capa de interfaz, ADR 0001) para que cada mundo tenga su dibujo.
function mostrarSello(punto, mundo) {
  const capa = document.getElementById('sellos');
  if (!capa) return;
  const caja = document.createElement('span');
  caja.className = 'sello';
  caja.style.left = `${punto.x}px`;
  caja.style.top = `${punto.y}px`;
  const img = document.createElement('img');
  img.alt = '';
  img.dataset.refuerzo = mundo.refuerzo;
  img.src = svg(mundo.refuerzo);
  caja.appendChild(img);
  capa.appendChild(caja);

  const quitar = () => caja.remove();
  const gsap = window.gsap;
  if (gsap) {
    gsap.fromTo(
      caja,
      { scale: 0.3, rotate: -18, opacity: 0 },
      { scale: 1.1, rotate: 0, opacity: 1, duration: 0.16, ease: 'back.out(2)' },
    );
    gsap.to(caja, { scale: 1.8, opacity: 0, duration: 0.28, delay: 0.18, onComplete: quitar });
  }
  setTimeout(quitar, 620); // red de seguridad aunque GSAP no esté
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
  caja.innerHTML = dibujoPegatina(p);
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

function celebrarYVolver(generacion) {
  // Un solo cierre por partida: los avisos repetidos y los clics de más no
  // entregan dos pegatinas ni montan dos confetis.
  if (!cierreUnico.reclamar(generacion)) return;
  const gsap = window.gsap;
  const mundo = mundoActual();
  estado.vista = 'cerrando';
  const premio = ganarPegatina();
  estado.coleccion = premio.coleccion;
  estado.ultimaPegatina = { id: premio.id, nueva: premio.nueva };
  try {
    fanfarria(mundo.sonidos?.fanfarria);
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

  const piezas = crearConfeti({ ancho, alto, cantidad: cantidadConfeti(), colores: mundo.paleta });
  estado.confeti = piezas.length;
  publicar({ ultimaPegatina: estado.ultimaPegatina, pegatinas: { ...estado.coleccion } });
  let ultimo = performance.now();
  let terminado = false;

  const terminar = () => {
    if (terminado) return;
    terminado = true;
    if (generacion !== generacionActual) return;
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

// Arrastre (ticket 11): pulsar y soltar llegan a la escena. Las mecánicas
// anteriores no definen `pulsar`/`soltar`, así que su clic sigue igual.
document.addEventListener('pointerdown', (ev) => {
  if (estado.vista !== 'juego') return;
  escena?.pulsar?.(ev.clientX, ev.clientY);
});

document.addEventListener('pointerup', (ev) => {
  if (estado.vista !== 'juego') return;
  escena?.soltar?.(ev.clientX, ev.clientY);
});

// Si el sistema cancela el gesto (ventana fuera, pérdida de puntero), el
// dibujo vuelve a su sitio en silencio: no se queda pegado a la mano.
document.addEventListener('pointercancel', () => {
  if (estado.vista !== 'juego') return;
  escena?.cancelar?.();
});

document.addEventListener('click', (ev) => {
  if (accionDeDestino(ev, '[data-accion="pantalla-completa"]')) {    alternarPantallaCompleta().then(actualizarControlesPantalla);
    return;
  }
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
  if (accionDeDestino(ev, '[data-accion="lugar"]')) return cambiarMundo();
  const m = accionDeDestino(ev, '[data-mundo]');
  if (m) return elegirMundo(m.dataset.mundo);
  const j = accionDeDestino(ev, '[data-juego]');
  if (j) {
    try {
      asegurarAudio();
      iniciarMusica();
    } catch {}
    const cuantas = j.dataset.parejas ? Number(j.dataset.parejas) : undefined;
    return jugar(j.dataset.juego, { parejas: cuantas });
  }
});

document.addEventListener('keydown', (ev) => {
  if (ev.repeat) return;
  if (ev.key?.toLowerCase() !== 'e') return;
  if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
  ev.preventDefault();
  exportarMetricas();
});

window.addEventListener('pagehide', () => terminarPartidaActual());
document.addEventListener('fullscreenchange', actualizarControlesPantalla);

render();
