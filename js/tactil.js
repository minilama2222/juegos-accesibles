// El juego está pensado para ratón. En una pantalla táctil no se bloquea
// nada: solo se enseña al padre un aviso discreto en el menú, con icono y
// aria-label, sin añadir texto visible ni cambiar las reglas del juego.
export const CONSULTA_PUNTERO_GRUESO = '(pointer: coarse)';
export const AVISO_TACTIL =
  'Este juego está pensado para ratón; en una pantalla táctil puede costar apuntar';

export function hayPunteroGrueso(consulta = globalThis.matchMedia?.(CONSULTA_PUNTERO_GRUESO)) {
  return Boolean(consulta?.matches);
}
