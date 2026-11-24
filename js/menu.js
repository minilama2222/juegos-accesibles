const CLAVE_MUNDO = 'juegos.mundo';

export function leerMundo() {
  try {
    return localStorage.getItem(CLAVE_MUNDO);
  } catch {
    return null;
  }
}

export function guardarMundo(id) {
  try {
    localStorage.setItem(CLAVE_MUNDO, id);
  } catch {}
}

export function accionDeDestino(evento, seleccion) {
  const destino = evento.target;
  if (!destino || typeof destino.closest !== 'function') return null;
  const elemento = destino.closest(seleccion);
  return elemento ? elemento : null;
}

const CLAVE_AVATAR = 'juegos.avatar';

export function leerAvatar() {
  try {
    return localStorage.getItem(CLAVE_AVATAR);
  } catch {
    return null;
  }
}

export function guardarAvatar(id) {
  try {
    localStorage.setItem(CLAVE_AVATAR, id);
  } catch {}
}

// Siguiente de la lista, en ciclo. Si el guardado ya no existe, empieza por el primero.
export function siguienteAvatar(actual, ids) {
  if (!Array.isArray(ids) || ids.length === 0) return actual;
  const i = ids.indexOf(actual);
  return ids[(i + 1) % ids.length];
}
