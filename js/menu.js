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
