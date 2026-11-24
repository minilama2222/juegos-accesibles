// Métricas locales para el padre: se guardan en el dispositivo y solo salen
// por una exportación manual. Nunca se muestran dentro del juego.

export const CLAVE_METRICAS = 'juegos.metricas.v1';

function almacenPorDefecto() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function entero(valor) {
  const n = Math.trunc(Number(valor));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function partidaVacia() {
  return { partidas: 0, aciertos: 0, fallos: 0, duracionMs: 0, ayudaFinal: 0 };
}

function normalizarPartida(dato) {
  const salida = partidaVacia();
  if (!dato || typeof dato !== 'object') return salida;
  salida.partidas = entero(dato.partidas);
  salida.aciertos = entero(dato.aciertos);
  salida.fallos = entero(dato.fallos);
  salida.duracionMs = entero(dato.duracionMs);
  salida.ayudaFinal = entero(dato.ayudaFinal);
  return salida;
}

function tieneDatos(p) {
  return !!(p.partidas || p.aciertos || p.fallos || p.duracionMs || p.ayudaFinal);
}

export function metricasVacias() {
  return {
    partidas: 0,
    aciertos: 0,
    fallos: 0,
    duracionMs: 0,
    cambiosJuego: 0,
    ultimoJuego: null,
    porJuego: {},
  };
}

export function normalizarMetricas(dato) {
  const salida = metricasVacias();
  if (!dato || typeof dato !== 'object') return salida;

  salida.partidas = entero(dato.partidas);
  salida.aciertos = entero(dato.aciertos);
  salida.fallos = entero(dato.fallos);
  salida.duracionMs = entero(dato.duracionMs);
  salida.cambiosJuego = entero(dato.cambiosJuego);
  if (typeof dato.ultimoJuego === 'string' && dato.ultimoJuego) {
    salida.ultimoJuego = dato.ultimoJuego;
  }

  if (dato.porJuego && typeof dato.porJuego === 'object') {
    for (const [juego, valores] of Object.entries(dato.porJuego)) {
      if (typeof juego !== 'string' || juego.length === 0) continue;
      const p = normalizarPartida(valores);
      if (tieneDatos(p)) salida.porJuego[juego] = p;
    }
  }

  return salida;
}

export function leerMetricas(almacen = almacenPorDefecto()) {
  try {
    const bruto = almacen?.getItem?.(CLAVE_METRICAS);
    if (!bruto) return metricasVacias();
    return normalizarMetricas(JSON.parse(bruto));
  } catch {
    return metricasVacias();
  }
}

export function guardarMetricas(metricas, almacen = almacenPorDefecto()) {
  const limpias = normalizarMetricas(metricas);
  try {
    almacen?.setItem?.(CLAVE_METRICAS, JSON.stringify(limpias));
  } catch {}
  return limpias;
}

export function anotarInicio(metricas, { juego, ahora = Date.now() } = {}) {
  const m = normalizarMetricas(metricas);
  if (!juego) return { metricas: m, inicio: ahora };

  m.partidas += 1;
  m.porJuego[juego] ??= partidaVacia();
  m.porJuego[juego].partidas += 1;
  if (m.ultimoJuego && m.ultimoJuego !== juego) m.cambiosJuego += 1;
  m.ultimoJuego = juego;

  return { metricas: m, inicio: ahora };
}

export function anotarFin(
  metricas,
  { juego, aciertos = 0, fallos = 0, duracionMs = 0, ayudaFinal = 0 } = {},
) {
  const m = normalizarMetricas(metricas);
  if (!juego) return m;

  const p = m.porJuego[juego] ?? partidaVacia();
  const a = entero(aciertos);
  const f = entero(fallos);
  const d = entero(duracionMs);
  const ayuda = entero(ayudaFinal);

  m.aciertos += a;
  m.fallos += f;
  m.duracionMs += d;
  p.aciertos += a;
  p.fallos += f;
  p.duracionMs += d;
  p.ayudaFinal = ayuda;
  m.porJuego[juego] = p;

  return m;
}

export function crearMetricas({ almacen = almacenPorDefecto(), ahora = () => Date.now() } = {}) {
  let datos = leerMetricas(almacen);
  let enCurso = null;

  function guardar() {
    datos = guardarMetricas(datos, almacen);
    return datos;
  }

  function terminar({ aciertos = 0, fallos = 0, ayudaFinal = 0 } = {}) {
    if (!enCurso) return datos;
    const duracionMs = Math.max(0, ahora() - enCurso.inicio);
    datos = anotarFin(datos, {
      juego: enCurso.juego,
      aciertos,
      fallos,
      duracionMs,
      ayudaFinal,
    });
    enCurso = null;
    return guardar();
  }

  function empezar(juego) {
    if (enCurso) terminar();
    const inicio = ahora();
    datos = anotarInicio(datos, { juego, ahora: inicio }).metricas;
    enCurso = { juego, inicio };
    guardar();
    return datos;
  }

  return {
    empezar,
    terminar,
    leer: () => normalizarMetricas(datos),
    exportar: () => normalizarMetricas(datos),
  };
}
