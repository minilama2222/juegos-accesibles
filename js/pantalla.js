// Pantalla completa opcional, sin texto visible. La API puede no existir o
// rechazar la petición; en ese caso el juego sigue igual y no se rompe nada.
export function estaEnPantallaCompleta(doc = globalThis.document) {
  try {
    return !!doc?.fullscreenElement;
  } catch {
    return false;
  }
}

export async function alternarPantallaCompleta(doc = globalThis.document) {
  if (!doc?.documentElement) return false;
  try {
    if (estaEnPantallaCompleta(doc)) {
      await doc.exitFullscreen?.();
    } else {
      await doc.documentElement.requestFullscreen?.();
    }
  } catch {}
  return estaEnPantallaCompleta(doc);
}
