// Guarda de cierre: una partida entrega premio una sola vez aunque el motor
// avise del fin más de una vez o el niño pulse de más. La clave es la
// generación de la partida, que cambia al empezar otra.
export function crearGuardaUnica() {
  let ultima = null;
  return {
    reclamar(clave) {
      if (ultima === clave) return false;
      ultima = clave;
      return true;
    },
  };
}
