let ctx = null;

function contexto() {
  if (!ctx) {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
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

  osc.connect(filtro).connect(gan).connect(ac.destination);
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
  osc.connect(gan).connect(ac.destination);
  osc.start(inicio);
  osc.stop(inicio + 0.32);
}

export function fanfarria() {
  const ac = contexto();
  if (!ac) return;
  const t = ac.currentTime + 0.02;
  const do4 = 261.63;
  const mi4 = 329.63;
  const sol4 = 392;
  const do5 = 523.25;

  bombo(ac, t);
  trompeta(ac, t, do4, 0.14, 0.16);
  trompeta(ac, t + 0.16, mi4, 0.14, 0.16);
  trompeta(ac, t + 0.32, sol4, 0.14, 0.18);
  bombo(ac, t + 0.5);
  trompeta(ac, t + 0.5, do5, 0.5, 0.2);
  trompeta(ac, t + 0.5, sol4, 0.5, 0.1);
  trompeta(ac, t + 0.5, mi4, 0.5, 0.09);
}

export function asegurarAudio() {
  contexto();
}
