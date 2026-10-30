export const MUNDOS = [
  {
    id: 'navidad',
    nombre: 'Navidad',
    fondo: '#0b3d2e',
    acento: '#e53935',
    objetivo: 'regalo',
    sprites: ['regalo', 'estrella', 'bolita', 'reno'],
    sonidoAcierto: 660,
  },
  {
    id: 'animalitos',
    nombre: 'Animalitos',
    fondo: '#2e6b3d',
    acento: '#f9a825',
    objetivo: 'gato',
    sprites: ['gato', 'perro', 'pato', 'vaca'],
    sonidoAcierto: 587,
  },
  {
    id: 'futbol',
    nombre: 'Fútbol',
    fondo: '#1b5e20',
    acento: '#ffffff',
    objetivo: 'balon',
    sprites: ['balon', 'botas', 'trofeo', 'bandera'],
    sonidoAcierto: 523,
  },
  {
    id: 'amarillo',
    nombre: 'El monstruo amarillo',
    fondo: '#3f51b5',
    acento: '#ffeb3b',
    objetivo: 'bicho',
    sprites: ['bicho', 'chispa', 'huevo', 'cola'],
    sonidoAcierto: 784,
  },
];

export function mundoPorId(id) {
  return MUNDOS.find((m) => m.id === id) ?? MUNDOS[0];
}

export const MECANICAS = {
  causaEfecto: { id: 'causaEfecto' },
  hover: {
    id: 'hover',
    implementada: true,
    meta: 6,
    llenadoMs: 800,
    vaciadoMs: 1600,
    objetivoVmin: 32,
  },
  clickEstatico: { id: 'clickEstatico' },
};

export const ORDEN = ['causaEfecto', 'hover', 'clickEstatico'];

export function siguienteMecanica(id) {
  const i = ORDEN.indexOf(id);
  if (i < 0 || i === ORDEN.length - 1) return ORDEN[0];
  return ORDEN[i + 1];
}
