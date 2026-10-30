export function crearMarcador({ meta = 6 } = {}) {
  let aciertos = 0;
  let terminada = false;

  const leer = () => ({ meta, aciertos, terminada });

  return {
    leer,
    anotarAcierto() {
      if (!terminada) {
        aciertos += 1;
        if (aciertos >= meta) terminada = true;
      }
      return leer();
    },
  };
}
