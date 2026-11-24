// Pegatinas: premio de final de partida, guardado en el dispositivo.
// La lógica es pura salvo por el almacén inyectable, así se prueba en node.

export const CLAVE_PEGATINAS = 'juegos.pegatinas.v1';

// Catálogo de pictogramas propios. El niño no lee: cada pegatina se reconoce por su dibujo.
export const PEGATINAS = [
  { id: 'estrella', nombre: 'Estrella', icono: 'estrella' },
  { id: 'regalo', nombre: 'Regalo', icono: 'regalo' },
  { id: 'gato', nombre: 'Gato', icono: 'gato' },
  { id: 'balon', nombre: 'Balón', icono: 'balon' },
  { id: 'bicho', nombre: 'Bicho', icono: 'bicho' },
  { id: 'trofeo', nombre: 'Trofeo', icono: 'trofeo' },
  { id: 'pato', nombre: 'Pato', icono: 'pato' },
  { id: 'huevo', nombre: 'Huevo', icono: 'huevo' },
];

function almacenPorDefecto() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Deja solo pegatinas conocidas y con un contador entero positivo.
export function normalizarColeccion(dato) {
  const salida = {};
  if (!dato || typeof dato !== 'object') return salida;
  for (const p of PEGATINAS) {
    const valor = Number(dato[p.id]);
    if (Number.isFinite(valor) && valor > 0) salida[p.id] = Math.floor(valor);
  }
  return salida;
}

export function leerColeccion(almacen = almacenPorDefecto()) {
  try {
    const bruto = almacen?.getItem?.(CLAVE_PEGATINAS);
    if (!bruto) return {};
    return normalizarColeccion(JSON.parse(bruto));
  } catch {
    return {};
  }
}

export function guardarColeccion(coleccion, almacen = almacenPorDefecto()) {
  const limpia = normalizarColeccion(coleccion);
  try {
    almacen?.setItem?.(CLAVE_PEGATINAS, JSON.stringify(limpia));
  } catch {}
  return limpia;
}

// La primera que falta. Si ya están todas, se repite una al azar: repetir no es un castigo.
export function elegirPegatina(coleccion = {}, azar = Math.random) {
  const limpia = normalizarColeccion(coleccion);
  const libre = PEGATINAS.find((p) => !(limpia[p.id] > 0));
  if (libre) return libre.id;
  const indice = Math.min(PEGATINAS.length - 1, Math.max(0, Math.floor(azar() * PEGATINAS.length)));
  return PEGATINAS[indice].id;
}

export function ganarPegatina({ almacen = almacenPorDefecto(), azar = Math.random } = {}) {
  const actual = leerColeccion(almacen);
  const id = elegirPegatina(actual, azar);
  const nueva = !(actual[id] > 0);
  const coleccion = guardarColeccion({ ...actual, [id]: (actual[id] ?? 0) + 1 }, almacen);
  return { id, nueva, coleccion };
}

export function coleccionVisible(coleccion = {}) {
  const limpia = normalizarColeccion(coleccion);
  return PEGATINAS.map((p) => ({
    ...p,
    veces: limpia[p.id] ?? 0,
    ganada: (limpia[p.id] ?? 0) > 0,
  }));
}
