export const MUNDOS = [
  {
    id: 'navidad',
    nombre: 'Navidad',
    fondo: '#0b3d2e',
    acento: '#e53935',
    objetivo: 'regalo',
    imagen: 'assets/arasaac/regalo-25381.png',
    sprites: ['regalo', 'estrella', 'bolita', 'reno'],
    sonidoAcierto: 660,
  },
  {
    id: 'animalitos',
    nombre: 'Animalitos',
    fondo: '#2e6b3d',
    acento: '#f9a825',
    objetivo: 'gato',
    imagen: 'assets/arasaac/gato-7114.png',
    sprites: ['gato', 'perro', 'pato', 'vaca'],
    sonidoAcierto: 587,
  },
  {
    id: 'futbol',
    nombre: 'Fútbol',
    fondo: '#1b5e20',
    acento: '#ffffff',
    objetivo: 'balon',
    imagen: 'assets/arasaac/balon-2269.png',
    sprites: ['balon', 'botas', 'trofeo', 'bandera'],
    sonidoAcierto: 523,
  },
  {
    id: 'amarillo',
    nombre: 'El monstruo amarillo',
    fondo: '#3f51b5',
    acento: '#ffeb3b',
    objetivo: 'carita',
    imagen: 'assets/arasaac/carita-13354.png',
    sprites: ['bicho', 'chispa', 'huevo', 'cola'],
    sonidoAcierto: 784,
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
  clickEstatico: { id: 'clickEstatico' },
};

// De más fácil a más difícil: primero causa-efecto (cualquier clic vale),
// después hover (hay que acertar y aguantar) y al final click estático.
export const ORDEN = ['causaEfecto', 'hover', 'clickEstatico'];

export function siguienteMecanica(id) {
  const i = ORDEN.indexOf(id);
  if (i < 0 || i === ORDEN.length - 1) return ORDEN[0];
  return ORDEN[i + 1];
}
