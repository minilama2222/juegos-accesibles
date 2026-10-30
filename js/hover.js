export function crearHover({ llenadoMs = 800, vaciadoMs = 1600 } = {}) {
  const estado = { lleno: 0, dentro: false, completado: false };

  function paso(deltaMs) {
    if (estado.dentro) {
      estado.lleno += deltaMs / llenadoMs;
    } else {
      estado.lleno -= deltaMs / vaciadoMs;
    }
    estado.lleno = Math.min(1, Math.max(0, estado.lleno));
    if (estado.lleno >= 1) estado.completado = true;
    return { ...estado };
  }

  return {
    estado() {
      return { ...estado };
    },
    entrar() {
      estado.dentro = true;
      return paso(0);
    },
    salir() {
      estado.dentro = false;
      return paso(0);
    },
    avanzar(deltaMs) {
      if (estado.completado) return { ...estado };
      return paso(deltaMs);
    },
    reiniciar() {
      estado.lleno = 0;
      estado.completado = false;
      return { ...estado };
    },
  };
}
