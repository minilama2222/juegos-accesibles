/* =====================================================================
   motor.js — Motor único de juegos
   Un solo código de interacción; cada juego es una DEFINICIÓN de datos.
   Ver docs/adr/0001 (capa constante) y 0002 (reglas no negociables).
   ===================================================================== */

const MOTOR = (() => {

  const JUEGOS = {};
  const CLAVE_METRICAS = "juegos.metricas.v2";

  let escena = null;
  let def = null;
  let ayuda = { nivel: 1, subir() { this.nivel = Math.min(1, this.nivel + 0.15); },
                        bajar() { this.nivel = Math.max(0.3, this.nivel - 0.08); } };

  // ---------- Registro de juegos ----------
  function registrar(id, definicion) { JUEGOS[id] = definicion; }
  function listar() { return Object.keys(JUEGOS); }
  function definicion(id) { return JUEGOS[id]; }

  // ---------- Almacén de métricas (por juego) ----------
  function leerTodo() { try { return JSON.parse(localStorage.getItem(CLAVE_METRICAS) || "{}"); } catch (e) { return {}; } }
  function guardarSesion(id, resumen) {
    const todo = leerTodo();
    (todo[id] = todo[id] || []).push(Object.assign({ fecha: new Date().toISOString() }, resumen));
    todo[id] = todo[id].slice(-300);
    try { localStorage.setItem(CLAVE_METRICAS, JSON.stringify(todo)); } catch (e) {}
  }
  function historial(id) { return leerTodo()[id] || []; }
  function acumulado(id) {
    const h = historial(id);
    const n = h.length;
    if (!n) return { sesiones: 0 };
    const suma = (f) => h.reduce((a, s) => a + f(s), 0);
    const aciertos = suma(s => s.aciertos || 0), fallos = suma(s => s.fallos || 0);
    const d = h.filter(s => s.distanciaMedia > 0).map(s => s.distanciaMedia);
    return {
      sesiones: n,
      aciertos, fallos,
      porcentajeDentro: aciertos + fallos ? Math.round(aciertos / (aciertos + fallos) * 100) : 0,
      distanciaMedia: d.length ? Math.round(d.reduce((a, b) => a + b, 0) / d.length) : 0,
      ayudaFinal: h[n - 1].ayudaFinal,
      minutosTotales: Math.round(suma(s => s.duracionSeg || 0) / 60),
    };
  }

  // ---------- Un nivel lleva al siguiente ----------
  // Orden de la escalera tal como está construida hoy. El último vuelve al primero.
  const ORDEN = ["escalon0", "punteria1"];
  function siguiente(id) {
    const i = ORDEN.indexOf(id);
    return ORDEN[(i + 1) % ORDEN.length];
  }

  // ---------- Contexto que recibe cada juego ----------
  function contexto() {
    const rel = (ruta) => ruta;                       // rutas relativas a la raíz del sitio
    return {
      escena,
      ayuda,
      // Al terminar un nivel se pasa al siguiente sin que nadie tenga que elegir nada.
      avanzar: () => { location.href = "juego.html?j=" + encodeURIComponent(siguiente(def && def.id)); },
      sprite: (ruta, tam) => {
        const img = document.createElement("img");
        img.src = ruta; img.alt = ""; img.draggable = false;
        img.style.width = (typeof tam === "number" ? tam + "px" : tam);
        img.style.height = "auto";
        img.style.pointerEvents = "none";
        return img;
      },
      acierto: () => Juego.audio.acierto(),
      metricas: Juego.metricas,
      aleatorio: Juego.aleatorio,
      celebracion: Juego.celebracion,
      cerrarSesion(id, extra) {
        const r = Object.assign(Juego.metricas.resumen(), extra || {});
        guardarSesion(id, r);
        return r;
      },
      reiniciarSesion() {
        Juego.metricas.sesion = { inicio: Date.now(), aciertos: 0, fallos: 0, distancias: [] };
      },
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

    Juego.crearPuntero();
    Juego.crearBotones({ volver: "index.html", fondo: true });

    const H = contexto();
    H.reiniciarSesion();
    if (typeof def.crear === "function") def.crear(H);
  }

  return { registrar, listar, definicion, arrancar, historial, acumulado, ayuda };
})();
