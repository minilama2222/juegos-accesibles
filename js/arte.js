/* =====================================================================
   arte.js — Catálogo único de arte y licencias
   Cada juego declara un set (`arte: "animales"`); las páginas resuelven
   nombre, licencia, miniaturas y rutas desde aquí. Ver ADR 0001: el arte
   es variable, pero se declara en un solo sitio.
   ===================================================================== */

const ARTE = (() => {
  const BASE = "assets/recortes/arasaac/";
  const LICENCIA = "ARASAAC · CC BY-NC-SA";
  const URL = "https://arasaac.org";
  const ATRIBUCION =
    "The pictographic symbols used are the property of the Government of Aragón " +
    "and have been created by Sergio Palao for ARASAAC (http://www.arasaac.org), " +
    "that distributes them under Creative Commons License BY-NC-SA.";

  const pieza = (nombre, archivo) => ({ nombre, ruta: BASE + archivo });

  const SETS = {
    animales: {
      id: "animales",
      nombre: "Animales",
      descripcion: "Pictogramas de animales para el causa-efecto, la elección y las parejas.",
      licencia: LICENCIA,
      url: URL,
      atribucion: ATRIBUCION,
      miniatura: pieza("perro", "perro.png").ruta,
      piezas: [
        pieza("perro", "perro.png"),
        pieza("gato", "gato.png"),
        pieza("león", "leon.png"),
        pieza("vaca", "vaca.png"),
        pieza("pato", "pato.png"),
        pieza("elefante", "elefante.png"),
        pieza("caballo", "caballo.png"),
        pieza("oveja", "oveja.png"),
        pieza("conejo", "conejo.png"),
        pieza("ratón", "raton.png"),
        pieza("tortuga", "tortuga.png"),
        pieza("pájaro", "pajaro.png"),
      ],
    },
    pelotas: {
      id: "pelotas",
      nombre: "Pelotas",
      descripcion: "Pelota y balón para el juego de la que brilla y la diana de puntería.",
      licencia: LICENCIA,
      url: URL,
      atribucion: ATRIBUCION,
      miniatura: pieza("pelota", "pelota.png").ruta,
      piezas: [
        pieza("pelota", "pelota.png"),
        pieza("balón", "balon.png"),
      ],
    },
    ojos: {
      id: "ojos",
      nombre: "Ojos",
      descripcion: "Un ojo grande para aparecer, mirar y esconderse.",
      licencia: LICENCIA,
      url: URL,
      atribucion: ATRIBUCION,
      miniatura: pieza("ojo", "ojo.png").ruta,
      piezas: [
        pieza("ojo", "ojo.png"),
      ],
    },
  };

  function ficha(id) { return SETS[id] || null; }
  function rutas(id) {
    const set = ficha(id);
    return set ? set.piezas.map((p) => p.ruta) : [];
  }
  function miniaturas(id, cuantas) {
    const set = ficha(id);
    if (!set) return [];
    const n = cuantas || 2;
    const mini = set.miniatura || (set.piezas[0] && set.piezas[0].ruta);
    const salida = mini ? [mini] : [];
    set.piezas.forEach((p) => {
      if (salida.length < n && salida.indexOf(p.ruta) === -1) salida.push(p.ruta);
    });
    return salida;
  }
  function lista() { return Object.keys(SETS).map((id) => SETS[id]); }
  function atribuciones() {
    const vistas = [];
    lista().forEach((set) => {
      if (vistas.indexOf(set.atribucion) === -1) vistas.push(set.atribucion);
    });
    return vistas;
  }

  return { ficha, rutas, miniaturas, lista, atribuciones };
})();
