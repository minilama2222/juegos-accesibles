export function crearSesion({ mecanica, mundoId }) {
  const estado = {
    mecanica,
    mundoId,
    aciertos: 0,
    intentos: 0,
    terminada: false,
  };

  return {
    estado() {
      return { ...estado };
    },
    registrarAcierto() {
      if (estado.terminada) return { ...estado };
      estado.intentos += 1;
      estado.aciertos += 1;
      return { ...estado };
    },
    registrarFallo() {
      if (estado.terminada) return { ...estado };
      estado.intentos += 1;
      return { ...estado };
    },
    terminar() {
      estado.terminada = true;
      return { ...estado };
    },
  };
}

export function debeTerminar({ aciertos, meta }) {
  return aciertos >= meta;
}
