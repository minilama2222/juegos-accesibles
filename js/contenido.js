// El mundo es un paquete visual y sonoro intercambiable: fondo, paleta,
// objetivo, refuerzo, puntero y sonidos. Cambiar de mundo no cambia reglas.
// Los objetos que se tocan son pictogramas ARASAAC; el resto es SVG propio
// (docs/adr/0002-arte-arasaac.md). Sin IP real.
export const MUNDOS = [
  {
    id: 'navidad',
    nombre: 'Navidad',
    fondo: '#0b3d2e',
    acento: '#e53935',
    paleta: ['#0b3d2e', '#e53935', '#a5d6a7', '#ffffff', '#ffd54f'],
    fondoArte: 'navidad',
    objetivo: 'regalo',
    imagen: 'assets/arasaac/regalo-25381.png',
    refuerzo: 'copo',
    puntero: 'punteroEstrella',
    sprites: ['regalo', 'estrella', 'bolita', 'reno'],
    sonidos: {
      acierto: 660,
      entrada: 880,
      error: 240,
      fanfarria: [261.63, 329.63, 392, 523.25],
    },
  },
  {
    id: 'animalitos',
    nombre: 'Animalitos',
    fondo: '#2e6b3d',
    acento: '#f9a825',
    paleta: ['#2e6b3d', '#f9a825', '#aed581', '#fafafa', '#795548'],
    fondoArte: 'animalitos',
    objetivo: 'gato',
    imagen: 'assets/arasaac/gato-7114.png',
    refuerzo: 'huella',
    puntero: 'punteroHuella',
    sprites: ['gato', 'perro', 'pato', 'vaca'],
    sonidos: {
      acierto: 587,
      entrada: 784,
      error: 196,
      fanfarria: [293.66, 349.23, 440, 587.33],
    },
  },
  {
    id: 'futbol',
    nombre: 'Fútbol',
    fondo: '#1b5e20',
    acento: '#ffffff',
    paleta: ['#1b5e20', '#ffffff', '#2e7d32', '#ffd54f', '#4fc3f7'],
    fondoArte: 'futbol',
    objetivo: 'balon',
    imagen: 'assets/arasaac/balon-2269.png',
    refuerzo: 'silbato',
    puntero: 'punteroBalon',
    sprites: ['balon', 'botas', 'trofeo', 'bandera'],
    sonidos: {
      acierto: 523,
      entrada: 698,
      error: 174,
      fanfarria: [392, 493.88, 587.33, 783.99],
    },
  },
  {
    id: 'amarillo',
    nombre: 'El monstruo amarillo',
    fondo: '#3f51b5',
    acento: '#ffeb3b',
    paleta: ['#3f51b5', '#ffeb3b', '#9fa8da', '#ffffff', '#e53935'],
    fondoArte: 'amarillo',
    objetivo: 'carita',
    imagen: 'assets/arasaac/carita-13354.png',
    refuerzo: 'chispa',
    puntero: 'punteroRayo',
    sprites: ['bicho', 'chispa', 'huevo', 'cola'],
    sonidos: {
      acierto: 784,
      entrada: 1046.5,
      error: 220,
      fanfarria: [523.25, 659.25, 783.99, 1046.5],
    },
  },
];

export function mundoPorId(id) {
  return MUNDOS.find((m) => m.id === id) ?? MUNDOS[0];
}

export const MECANICAS = {
  causaEfecto: {
    id: 'causaEfecto',
    implementada: true,
    meta: 12,
    broteMinVmin: 12,
    broteMaxVmin: 20,
  },
  hover: {
    id: 'hover',
    implementada: true,
    meta: 6,
    llenadoMs: 800,
    vaciadoMs: 1600,
    objetivoMinVmin: 10,
    objetivoMaxVmin: 18,
  },
  clickEstatico: {
    id: 'clickEstatico',
    implementada: true,
    meta: 8,
    // Objetivo grande de partida: es el juego de clicar con blanco fácil.
    objetivoMinVmin: 14,
    objetivoMaxVmin: 22,
  },
  aparicion: {
    id: 'aparicion',
    implementada: true,
    meta: 6,
    // Ventana visible y hueco de partida; la ayuda adaptativa alarga la
    // ventana en la escena (4–8 s, ADR 0001).
    ventanaMs: 4500,
    huecoMs: 1200,
    objetivoMinVmin: 12,
    objetivoMaxVmin: 20,
  },
  movimientoLento: {
    id: 'movimientoLento',
    implementada: true,
    meta: 6,
    // El objetivo se sigue con el ratón: grande y con la velocidad controlada.
    // La velocidad sube cada dos aciertos y nunca pasa del techo humano; la
    // ayuda adaptativa la frena con `factorVelocidad`.
    velocidadBase: 0.5,
    velocidadMax: 1,
    pasoVelocidad: 0.12,
    aciertosPorPaso: 2,
    objetivoMinVmin: 13,
    objetivoMaxVmin: 20,
  },
  tiroAPorteria: {
    id: 'tiroAPorteria',
    implementada: true,
    meta: 6,
    // Huecos de la portería: grandes, en rejilla y nunca por debajo de 44 px.
    // La ayuda adaptativa los agranda sin cambiar de sitio.
    objetivoMinVmin: 9,
    objetivoMaxVmin: 13,
  },
};

// De más fácil a más difícil: primero causa-efecto (cualquier clic vale),
// después hover (hay que acertar y aguantar), click estático, aparición con
// tiempo, movimiento lento (seguir el dibujo) y, por último, tiro a portería.
export const ORDEN = [
  'causaEfecto',
  'hover',
  'clickEstatico',
  'aparicion',
  'movimientoLento',
  'tiroAPorteria',
];

export function siguienteMecanica(id) {
  const i = ORDEN.indexOf(id);
  if (i < 0 || i === ORDEN.length - 1) return ORDEN[0];
  return ORDEN[i + 1];
}
