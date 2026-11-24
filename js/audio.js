// Sonido del juego: efectos (refuerzos y avisos) y música de fondo, en dos buses
// separados. El altavoz silencia los efectos; la nota controla la música.
// Sin audio (o con la preferencia apagada) las funciones no hacen nada: el juego sigue.

export const CLAVE_EFECTOS = 'juegos.efectos.v1';
export const CLAVE_EFECTOS_ANTERIOR = 'juegos.sonido.v1';
export const CLAVE_MUSICA = 'juegos.musica.v1';

function almacen() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export function leerEfectosSilenciados(a = almacen()) {
  try {
    const actual = a?.getItem?.(CLAVE_EFECTOS);
    if (actual === 'apagado' || actual === 'encendido') return actual === 'apagado';
    // Migración: antes el altavoz y la música compartían este ajuste.
    return a?.getItem?.(CLAVE_EFECTOS_ANTERIOR) === 'apagado';
  } catch {
    return false;
  }
}

export function guardarEfectosSilenciados(valor, a = almacen()) {
  try {
    a?.setItem?.(CLAVE_EFECTOS, valor ? 'apagado' : 'encendido');
  } catch {}
  return !!valor;
}

export function leerMusica(a = almacen()) {
  try {
    return a?.getItem?.(CLAVE_MUSICA) === 'si';
  } catch {
    return false;
  }
}

export function guardarMusica(valor, a = almacen()) {
  try {
    a?.setItem?.(CLAVE_MUSICA, valor ? 'si' : 'no');
  } catch {}
  return !!valor;
}

let ctx = null;
let maestroEfectos = null;
let maestroMusica = null;
let efectosSilenciados = leerEfectosSilenciados();
let musicaPermitida = leerMusica();
let musicaTimer = null;
let musicaPaso = 0;

function contexto() {
  if (!ctx) {
    const AC = globalThis.AudioContext ?? globalThis.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    maestroEfectos = ctx.createGain();
    maestroEfectos.gain.value = efectosSilenciados ? 0 : 0.9;
    maestroEfectos.connect(ctx.destination);
    maestroMusica = ctx.createGain();
    maestroMusica.gain.value = 0.9;
    maestroMusica.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function aplicarVolumenEfectos() {
  if (!maestroEfectos || !ctx) return;
  maestroEfectos.gain.setTargetAtTime(efectosSilenciados ? 0 : 0.9, ctx.currentTime, 0.01);
}

export function estadoSonido() {
  return { efectos: efectosSilenciados, musica: musicaPermitida, reproduciendo: !!musicaTimer };
}

export function asegurarAudio() {
  contexto();
}

// Un tono corto. Ataque suave para que ningún sonido sea un golpe seco.
function tono(ac, { frecuencia, duracion = 0.16, tipo = 'triangle', volumen = 0.12, inicio, deslizA, ataque = 0.012, destino = maestroEfectos }) {
  const t = inicio ?? ac.currentTime;
  const osc = ac.createOscillator();
  const gan = ac.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frecuencia, t);
  if (Number.isFinite(deslizA)) osc.frequency.linearRampToValueAtTime(deslizA, t + duracion);

  gan.gain.setValueAtTime(0, t);
  gan.gain.linearRampToValueAtTime(volumen, t + ataque);
  gan.gain.setValueAtTime(volumen * 0.8, t + duracion * 0.65);
  gan.gain.exponentialRampToValueAtTime(0.0008, t + duracion);

  osc.connect(gan).connect(destino);
  osc.start(t);
  osc.stop(t + duracion + 0.05);
}

// Acierto: dos notas alegres y muy cortas (< 0,5 s), distintas del error y de la entrada.
// Se limita para que pulsar rápido no apile osciladores ni sature la salida.
let ultimoAcierto = -Infinity;
export function acierto(frecuencia = 660) {
  if (efectosSilenciados) return;
  const ac = contexto();
  if (!ac) return;
  if (ac.currentTime - ultimoAcierto < 0.09) return;
  ultimoAcierto = ac.currentTime;
  const t = ac.currentTime + 0.01;
  tono(ac, { frecuencia, duracion: 0.12, volumen: 0.15, inicio: t });
  tono(ac, { frecuencia: frecuencia * 1.5, duracion: 0.2, volumen: 0.12, inicio: t + 0.07 });
}

// Error: un descenso suave, sin ruido ni volumen alto. No resta nada, solo avisa.
// Se limita para que pulsar rápido de desahogo no se convierta en una alarma.
let ultimoError = -Infinity;
export function error(frecuencia = 240) {
  if (efectosSilenciados) return;
  const ac = contexto();
  if (!ac) return;
  if (ac.currentTime - ultimoError < 0.35) return;
  ultimoError = ac.currentTime;
  const t = ac.currentTime + 0.01;
  tono(ac, { frecuencia, deslizA: frecuencia * 0.7, duracion: 0.22, tipo: 'sine', volumen: 0.07, inicio: t });
}

// Entrada: un brillo breve cuando aparece una pieza nueva. Cada mundo elige su tono.
export function entrada(frecuencia = 880) {
  if (efectosSilenciados) return;
  const ac = contexto();
  if (!ac) return;
  const t = ac.currentTime + 0.01;
  tono(ac, { frecuencia, deslizA: frecuencia * 1.125, duracion: 0.1, tipo: 'sine', volumen: 0.055, inicio: t });
}

function trompeta(ac, inicio, frecuencia, duracion, volumen) {
  const osc = ac.createOscillator();
  const gan = ac.createGain();
  const filtro = ac.createBiquadFilter();
  filtro.type = 'lowpass';
  filtro.frequency.setValueAtTime(3200, inicio);
  filtro.Q.value = 1.2;
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(frecuencia, inicio);
  osc.frequency.linearRampToValueAtTime(frecuencia * 1.004, inicio + duracion);

  gan.gain.setValueAtTime(0, inicio);
  gan.gain.linearRampToValueAtTime(volumen, inicio + 0.04);
  gan.gain.setValueAtTime(volumen * 0.85, inicio + duracion * 0.7);
  gan.gain.exponentialRampToValueAtTime(0.0008, inicio + duracion);

  osc.connect(filtro).connect(gan).connect(maestroEfectos);
  osc.start(inicio);
  osc.stop(inicio + duracion + 0.05);
}

function bombo(ac, inicio) {
  const osc = ac.createOscillator();
  const gan = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, inicio);
  osc.frequency.exponentialRampToValueAtTime(45, inicio + 0.18);
  gan.gain.setValueAtTime(0.5, inicio);
  gan.gain.exponentialRampToValueAtTime(0.001, inicio + 0.3);
  osc.connect(gan).connect(maestroEfectos);
  osc.start(inicio);
  osc.stop(inicio + 0.32);
}

export const FANFARRIA_POR_DEFECTO = [261.63, 329.63, 392, 523.25];

export function fanfarria(notas = FANFARRIA_POR_DEFECTO) {
  if (efectosSilenciados) return;
  const ac = contexto();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  // Cada mundo trae sus cuatro notas; si faltan, se usa la fanfarria de siempre.
  const [n1, n2, n3, n4] = Array.isArray(notas) && notas.length >= 4 ? notas : FANFARRIA_POR_DEFECTO;

  bombo(ac, t);
  trompeta(ac, t, n1, 0.14, 0.16);
  trompeta(ac, t + 0.16, n2, 0.14, 0.16);
  trompeta(ac, t + 0.32, n3, 0.14, 0.18);
  bombo(ac, t + 0.5);
  trompeta(ac, t + 0.5, n4, 0.5, 0.2);
  trompeta(ac, t + 0.5, n3, 0.5, 0.1);
  trompeta(ac, t + 0.5, n2, 0.5, 0.09);
}

// ---------- Música de fondo ----------
// Un arpegio pentatónico muy suave. No compite con los refuerzos: volumen bajo y sin percusión.
const NOTAS_MUSICA = [261.63, 329.63, 392, 523.25, 392, 329.63, 293.66, 349.23];
const BAJOS_MUSICA = [130.81, 164.81, 196, 146.83];

function pasoDeMusica() {
  if (!musicaPermitida) return;
  const ac = contexto();
  if (!ac) return;
  const t = ac.currentTime + 0.05;
  tono(ac, {
    frecuencia: NOTAS_MUSICA[musicaPaso % NOTAS_MUSICA.length],
    duracion: 0.55,
    tipo: 'sine',
    volumen: 0.035,
    inicio: t,
    ataque: 0.04,
    destino: maestroMusica,
  });
  if (musicaPaso % 4 === 0) {
    tono(ac, {
      frecuencia: BAJOS_MUSICA[(musicaPaso / 4) % BAJOS_MUSICA.length],
      duracion: 1.3,
      tipo: 'sine',
      volumen: 0.028,
      inicio: t,
      ataque: 0.06,
      destino: maestroMusica,
    });
  }
  musicaPaso += 1;
}

export function iniciarMusica() {
  if (!musicaPermitida) return false;
  if (!contexto()) return false;
  if (!musicaTimer) {
    pasoDeMusica();
    musicaTimer = setInterval(pasoDeMusica, 650);
  }
  return true;
}

export function pararMusica() {
  if (musicaTimer) {
    clearInterval(musicaTimer);
    musicaTimer = null;
  }
}

export function alternarMusica() {
  // Si la preferencia ya estaba encendida pero el navegador aún no había dado
  // permiso para sonar (tras recargar), el primer clic la arranca en vez de apagarla.
  if (musicaPermitida && !musicaTimer) {
    asegurarAudio();
    iniciarMusica();
    return musicaPermitida;
  }
  musicaPermitida = !musicaPermitida;
  guardarMusica(musicaPermitida);
  if (musicaPermitida) {
    asegurarAudio();
    iniciarMusica();
  } else {
    pararMusica();
  }
  return musicaPermitida;
}

// El altavoz solo afecta a los efectos; la música sigue sonando si está encendida.
export function alternarEfectos() {
  efectosSilenciados = !efectosSilenciados;
  guardarEfectosSilenciados(efectosSilenciados);
  asegurarAudio();
  aplicarVolumenEfectos();
  return efectosSilenciados;
}
