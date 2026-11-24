// Ayuda adaptativa: una escalera por juego, guardada en el dispositivo.
// La lógica es pura salvo por el almacén inyectable, así se prueba en node.

export const CLAVE_AYUDA = 'juegos.ayuda.v1';

// Techo de la escalera. Cada nivel agranda el objetivo, alarga la ventana
// y ralentiza el movimiento; nunca cambia las reglas visibles.
export const NIVEL_MAX = 5;
export const FALLOS_PARA_SUBIR = 2;
export const ACIERTOS_PARA_BAJAR = 4;

const TAMANO_POR_NIVEL = 0.12;
const VENTANA_POR_NIVEL = 0.15;
const VELOCIDAD_POR_NIVEL = 0.12;

export function normalizarNivel(nivel) {
  const n = Math.trunc(Number(nivel));
  if (!Number.isFinite(n)) return 0;
  return Math.min(NIVEL_MAX, Math.max(0, n));
}

export function parametrosDeAyuda(nivel) {
  const n = normalizarNivel(nivel);
  return {
    nivel: n,
    factorTamano: 1 + TAMANO_POR_NIVEL * n,
    factorVentana: 1 + VENTANA_POR_NIVEL * n,
    factorVelocidad: 1 / (1 + VELOCIDAD_POR_NIVEL * n),
  };
}

export function estadoAyudaInicial(nivel = 0) {
  return { nivel: normalizarNivel(nivel), aciertosSeguidos: 0, fallosSeguidos: 0 };
}

function racha(valor) {
  const n = Math.trunc(Number(valor));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// Un evento solo puede subir o bajar un nivel; el resto de la escalera se
// mantiene entre sesiones. Las rachas son de la sesión actual.
export function aplicarEventoAyuda(estado, evento) {
  const actual = {
    nivel: normalizarNivel(estado?.nivel),
    aciertosSeguidos: racha(estado?.aciertosSeguidos),
    fallosSeguidos: racha(estado?.fallosSeguidos),
  };

  if (evento === 'acierto') {
    actual.aciertosSeguidos += 1;
    actual.fallosSeguidos = 0;
    if (actual.aciertosSeguidos >= ACIERTOS_PARA_BAJAR) {
      actual.nivel = Math.max(0, actual.nivel - 1);
      actual.aciertosSeguidos = 0;
    }
  } else if (evento === 'fallo') {
    actual.fallosSeguidos += 1;
    actual.aciertosSeguidos = 0;
    if (actual.fallosSeguidos >= FALLOS_PARA_SUBIR) {
      actual.nivel = Math.min(NIVEL_MAX, actual.nivel + 1);
      actual.fallosSeguidos = 0;
    }
  }

  return actual;
}

function almacenPorDefecto() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

// Solo se guardan niveles conocidos y mayores que 0: el nivel 0 es el estado
// por defecto y no necesita entrada.
export function normalizarAyuda(dato) {
  const salida = {};
  if (!dato || typeof dato !== 'object') return salida;
  for (const [juego, nivel] of Object.entries(dato)) {
    if (typeof juego !== 'string' || juego.length === 0) continue;
    const n = normalizarNivel(nivel);
    if (n > 0) salida[juego] = n;
  }
  return salida;
}

export function leerAyuda(almacen = almacenPorDefecto()) {
  try {
    const bruto = almacen?.getItem?.(CLAVE_AYUDA);
    if (!bruto) return {};
    return normalizarAyuda(JSON.parse(bruto));
  } catch {
    return {};
  }
}

export function guardarAyuda(ayuda, almacen = almacenPorDefecto()) {
  const limpia = normalizarAyuda(ayuda);
  try {
    almacen?.setItem?.(CLAVE_AYUDA, JSON.stringify(limpia));
  } catch {}
  return limpia;
}

export function crearAyuda({ juego, almacen = almacenPorDefecto(), nivel } = {}) {
  const guardado = juego ? leerAyuda(almacen)[juego] : 0;
  let estado = estadoAyudaInicial(nivel ?? guardado ?? 0);

  const leer = () => ({ ...estado, ...parametrosDeAyuda(estado.nivel) });

  function persistir() {
    if (!juego) return;
    const mapa = leerAyuda(almacen);
    if (estado.nivel > 0) mapa[juego] = estado.nivel;
    else delete mapa[juego];
    guardarAyuda(mapa, almacen);
  }

  function evento(tipo) {
    const antes = estado.nivel;
    estado = aplicarEventoAyuda(estado, tipo);
    if (estado.nivel !== antes) persistir();
    return leer();
  }

  return {
    leer,
    parametros: () => parametrosDeAyuda(estado.nivel),
    anotarAcierto: () => evento('acierto'),
    anotarFallo: () => evento('fallo'),
  };
}
