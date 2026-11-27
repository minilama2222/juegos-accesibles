/* =====================================================================
   motor.js — Motor único de juegos
   Un solo código de interacción; cada juego es una DEFINICIÓN de datos.
   Ver docs/adr/0001 (capa constante), 0002 (reglas no negociables) y 0003 (movimiento).
   ===================================================================== */

const MOTOR = (() => {

  const JUEGOS = {};

  let escena = null;
  let def = null;
  // La ayuda es una sola: la posee comun.js, que es quien la mueve al registrar
  // cada clic. Motor no guarda una copia; solo la reexpone a los juegos.

  // ---------- Registro de juegos ----------
  function registrar(id, definicion) { JUEGOS[id] = definicion; }
  function listar() { return Object.keys(JUEGOS); }
  function definicion(id) { return JUEGOS[id]; }

  // ---------- Almacén de métricas (delegado en comun.js) ----------
  // Una sola clave y un solo esquema viven en Juego.metricas.
  function historial(id) { return Juego.metricas.historial(id); }
  function acumulado(id) { return Juego.metricas.acumulado(id); }

  // ---------- Un nivel lleva al siguiente ----------
  // El orden vive en cada definición (`siguiente`), no en una lista aparte.
  // Si un juego no declara siguiente, o el destino no existe, se vuelve al primero.
  function siguiente(id) {
    const actual = JUEGOS[id];
    const destino = actual && actual.siguiente;
    return (destino && JUEGOS[destino]) ? destino : (listar()[0] || id);
  }
  function irAlSiguiente() {
    location.href = "juego.html?j=" + encodeURIComponent(siguiente(def && def.id));
  }

  // ---------- Ronda: cuenta y ceremonia de fin ----------
  // La definición declara cuántos aciertos cierran la ronda; el motor la cierra.
  const ESPERA_FIN = 4600;
  let ronda = { meta: Infinity, aciertos: 0, terminada: false };

  function finalizar() {
    if (ronda.terminada) return;
    ronda.terminada = true;
    Juego.metricas.cerrarSesion(def.id);
    Juego.celebracion();
    setTimeout(irAlSiguiente, ESPERA_FIN);
  }

  // ---------- Capa constante compartida ----------
  // Los juegos usan el refuerzo de acierto (.acierto → pop, en movimiento.css).
  function anima(el, nombre) {
    if (!el) return;
    el.classList.remove(nombre);
    void el.offsetWidth;                              // fuerza el reinicio de la animación
    el.classList.add(nombre);
    const fin = () => el.classList.remove(nombre);
    el.addEventListener("animationend", fin, { once: true });
    setTimeout(fin, 1200);                            // red de seguridad si la animación no corre
  }

  // ---------- Contexto que recibe cada juego ----------
  function contexto() {
    function crearSprite(ruta, tam) {
      const img = document.createElement("img");
      img.src = ruta; img.alt = ""; img.draggable = false;
      img.style.width = (typeof tam === "number" ? tam + "px" : tam);
      img.style.height = "auto";
      img.style.pointerEvents = "none";
      return img;
    }

    // Embudo único de métricas y de ronda: el juego declara el resultado del
    // clic; el motor lo cuenta y cierra la sesión al llegar a la meta.
    function anota(x, y, objetivo, acierto) {
      if (ronda.terminada) return { acierto: false, dentro: false, d: 0, terminada: true };
      const res = Juego.metricas.registrarResultado(x, y, objetivo, acierto);
      if (res.acierto && ++ronda.aciertos >= ronda.meta) finalizar();
      return Object.assign(res, { terminada: ronda.terminada, aciertosRonda: ronda.aciertos });
    }

    // Clic que cuenta para puntería pero cuyo resultado aún no se conoce
    // (la primera carta de una pareja). No toca aciertos, fallos ni la ronda.
    function anotaClic(x, y, objetivo) {
      if (ronda.terminada) return { terminada: true };
      return Juego.metricas.registrarClic(x, y, objetivo);
    }

    // Métricas + feedback estándar. `opciones.marca:false` deja el sonido pero
    // no dibuja la marca (causa-efecto ya tiene su propia pieza).
    function resuelve(x, y, objetivo, acierto, opciones) {
      if (ronda.terminada) return { terminada: true };
      const res = anota(x, y, objetivo, acierto);
      if (res.acierto) {
        Juego.audio.acierto();
        if (!opciones || opciones.marca !== false) Juego.marca(x, y, "bien");
      } else {
        Juego.audio.mal();
        if (!opciones || opciones.marca !== false) Juego.marca(x, y, "mal");
      }
      return res;
    }

    return {
      escena,
      ayuda: Juego.ayuda,
      sprite: crearSprite,
      // Fábrica única de objetivos: clase, tamaño, sprite y padre.
      // El imán es global y no se registra por pieza.
      objetivo: (opciones) => {
        const o = opciones || {};
        const caja = document.createElement("div");
        caja.className = "objetivo" + (o.clase ? " " + o.clase : "");
        if (o.id) caja.id = o.id;
        const lado = (typeof o.tam === "number") ? o.tam + "px" : (o.tam || "26vmin");
        caja.style.width = lado;
        caja.style.height = lado;
        if (o.ruta) caja.appendChild(crearSprite(o.ruta, "100%"));
        (o.padre || escena).appendChild(caja);
        return caja;
      },
      anota,
      anotaClic,
      resuelve,
      // Algunos juegos (parejas) calculan la meta según el tablero.
      meta: (n) => {
        if (Number.isFinite(n) && n > 0) ronda.meta = n;
        if (!ronda.terminada && ronda.aciertos >= ronda.meta) finalizar();
      },
      terminada: () => ronda.terminada,
      aleatorio: Juego.aleatorio,
      // Elige una pieza al azar de una lista (para no repetir siempre la misma)
      pick: (lista) => lista[Math.floor(Math.random() * lista.length)],
      // Refuerzo de acierto sobre un objetivo (ADR 0003: la animación vive en CSS).
      anima,
      // Clic con refuerzo estándar: el juego no decide la animación, la pide.
      toque: (el) => anima(el, "acierto"),
      // Un toque sobre CUALQUIER objetivo de la escena, con el elemento concreto.
      // Escucha en #escena, no en body: botones y celebración quedan fuera.
      toca: (fn) => escena.addEventListener("pointerdown", (ev) => {
        const el = ev.target.closest && ev.target.closest(".objetivo");
        if (el) fn(ev, el);
      }),
      // Cualquier toque dentro del área jugable, acierte o no.
      tocaFondo: (fn) => escena.addEventListener("pointerdown", (ev) => {
        if (ev.target.closest && ev.target.closest(".boton-sup")) return;
        fn(ev);
      }),
    };
  }

  // ---------- Arranque ----------
  function arrancar(id) {
    def = JUEGOS[id];
    if (!def) { document.body.innerHTML = ""; return; }
    def.id = id;
    escena = document.getElementById("escena");
    escena.innerHTML = "";
    document.title = def.nombre || id;
    ronda = {
      meta: typeof def.meta === "number" ? def.meta : Infinity,
      aciertos: 0,
      terminada: false,
    };

    Juego.crearPuntero();
    Juego.crearBotones({ volver: "index.html", fondo: true });

    Juego.ayuda.reiniciar();
    Juego.metricas.reiniciarSesion();
    const H = contexto();
    if (typeof def.crear === "function") def.crear(H);
  }

  return { registrar, listar, definicion, arrancar, historial, acumulado };
})();
