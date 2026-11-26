/* =====================================================================
   mas-juegos.js — Escalones 1, 2, 3 y parejas (4-6)
   Cada juego es SOLO una definición de datos: el motor hace el resto.
   Reglas: sin texto, un clic, objetivos ≥44px, sin castigo dramático.
   ===================================================================== */

const ANIMALES = ARTE.rutas("animales");
const PELOTAS = ARTE.rutas("pelotas");
const OJOS = ARTE.rutas("ojos");

// Piezas comunes ------------------------------------------------------
// La creación de objetivos vive en H.objetivo(); el imán es global.

// ---------------------------------------------------------------- 1 · El que brilla
MOTOR.registrar("escalon1", {
  nombre: "1 · El que brilla",
  escalon: 1,
  arte: "pelotas",
  descripcion: "Dos pelotas grandes; toca la que brilla.",
  meta: 12,
  siguiente: "escalon2",

  crear(H) {
    let brillante = 0;

    const r = Math.min(innerWidth, innerHeight) * 0.34;
    const zonas = [0, 1].map((_, i) => {
      const z = H.objetivo({ ruta: H.pick(PELOTAS), tam: r });
      z.style.left = (i === 0 ? innerWidth * 0.08 : innerWidth * 0.58) + "px";
      z.style.top = (innerHeight - r) / 2 + "px";
      return z;
    });

    function repintar() {
      brillante = Math.floor(Math.random() * 2);
      zonas.forEach((z, i) => {
        z.innerHTML = "";
        z.appendChild(H.sprite(H.pick(PELOTAS), "100%"));
        z.style.boxShadow = i === brillante
          ? "0 0 0 14px rgba(229,161,60,.85), 0 10px 0 rgba(0,0,0,.08)"   // la que brilla
          : "0 8px 0 rgba(0,0,0,.06)";
      });
    }

    repintar();
    H.toca((ev, objetivo) => {
      if (H.terminada()) return;
      const i = zonas.indexOf(objetivo);
      const res = H.anota(ev.clientX, ev.clientY, objetivo, i === brillante);

      if (res.acierto) {
        Juego.audio.acierto(); Juego.marca(ev.clientX, ev.clientY, "bien");
        if (!res.terminada) setTimeout(repintar, 320);
      } else {
        Juego.audio.mal(); Juego.marca(ev.clientX, ev.clientY, "mal");
      }
    });
  },
});

// ---------------------------------------------------------------- 2 · Toca el que suena
MOTOR.registrar("escalon2", {
  nombre: "2 · Toca el que suena",
  escalon: 2,
  arte: "animales",
  descripcion: "Tres animales; toca el que suena.",
  meta: 12,
  siguiente: "escalon3",

  crear(H) {
    let sonoro = 0, reloj = null;

    const r = Math.min(innerWidth * 0.26, innerHeight * 0.42);
    const zonas = [0, 1, 2].map((_, i) => {
      const z = H.objetivo({ ruta: H.pick(ANIMALES), tam: r });
      z.style.left = (innerWidth * (0.06 + i * 0.32)) + "px";
      z.style.top = (innerHeight - r) / 2 + "px";
      return z;
    });

    function elegir() {
      if (H.terminada()) return;
      sonoro = Math.floor(Math.random() * 3);
      // el elegido emite su pista cada 2 s
      clearInterval(reloj);
      const tono = () => { if (!H.terminada()) Juego.audio.pista(sonoro, zonas.length); };
      setTimeout(tono, 250);
      reloj = setInterval(tono, 2000);
    }

    elegir();
    H.toca((ev, objetivo) => {
      if (H.terminada()) return;
      const i = zonas.indexOf(objetivo);
      const res = H.anota(ev.clientX, ev.clientY, objetivo, i === sonoro);

      if (res.acierto) {
        Juego.audio.acierto(); Juego.marca(ev.clientX, ev.clientY, "bien");
        if (res.terminada) { clearInterval(reloj); return; }
        setTimeout(elegir, 320);
      } else {
        // Se señala el fallo, pero NO se cambia el objetivo: puede reintentar en el sitio.
        Juego.audio.mal(); Juego.marca(ev.clientX, ev.clientY, "mal");
      }
    });
  },
});

// ---------------------------------------------------------------- 3 · ¿Dónde está?
MOTOR.registrar("escalon3", {
  nombre: "3 · ¿Dónde está?",
  escalon: 3,
  arte: "ojos",
  descripcion: "Un ojo aparece y se esconde; tócalo mientras se ve.",
  meta: 12,
  siguiente: "parejas",

  crear(H) {
    const tam = Math.round(Math.min(innerWidth, innerHeight) * 0.3);
    const ojo = H.objetivo({ ruta: H.pick(OJOS), tam, clase: "asoma" });

    function asomar() {
      if (H.terminada()) return;
      ojo.style.left = H.aleatorio(110, Math.max(120, innerWidth - tam - 110)) + "px";
      ojo.style.top  = H.aleatorio(110, Math.max(120, innerHeight - tam - 110)) + "px";
      ojo.style.opacity = "1"; ojo.style.transform = "scale(1)";
      // se queda visible un tiempo generoso y luego se esconde
      setTimeout(esconder, 4200);
    }
    function esconder() {
      if (H.terminada()) return;
      ojo.style.opacity = "0"; ojo.style.transform = "scale(.7)";
      setTimeout(asomar, 1200);
    }

    setTimeout(asomar, 700);

    H.toca((ev, objetivo) => {
      if (H.terminada() || objetivo !== ojo) return;
      if (ojo.style.opacity === "0") {
        H.anota(ev.clientX, ev.clientY, ojo, false);
        Juego.audio.mal(); Juego.marca(ev.clientX, ev.clientY, "mal"); return;
      }
      const res = H.anota(ev.clientX, ev.clientY, ojo, true);
      Juego.audio.acierto(); Juego.marca(ev.clientX, ev.clientY, "bien");
      if (!res.terminada) { ojo.style.opacity = "0"; setTimeout(asomar, 900); }
    });
  },
});

// ---------------------------------------------------------------- 4-6 · Parejas
MOTOR.registrar("parejas", {
  nombre: "4–6 · Parejas",
  escalon: "4-6",
  arte: "animales",
  descripcion: "Encuentra las parejas de animales en tres tableros.",
  meta: 6,
  siguiente: "punteria1",

  crear(H) {
    const PARES = Math.max(1, parseInt(new URLSearchParams(location.search).get("pares") || "2", 10) || 2);
    const TABLEROS = 3;                   // tres tableros por sesión
    let tableros = 0;
    H.meta(TABLEROS * PARES);             // una meta por pareja encontrada

    function nuevoTablero() {
      if (H.terminada()) return;
      H.escena.innerHTML = "";
      const elegidos = [];
      while (elegidos.length < PARES) {
        const a = ANIMALES[Math.floor(Math.random() * ANIMALES.length)];
        if (elegidos.indexOf(a) === -1) elegidos.push(a);
      }
      const cartas = elegidos.concat(elegidos).sort(() => Math.random() - 0.5);

      const cols = PARES <= 2 ? 2 : (PARES <= 4 ? 3 : 4);
      const filas = Math.ceil(cartas.length / cols);
      const lado = Math.round(Math.min(innerWidth / cols, innerHeight / filas) * 0.82);

      const rejilla = document.createElement("div");
      rejilla.style.cssText = "position:absolute;inset:0;display:grid;place-items:center;gap:14px;" +
        "grid-template-columns:repeat(" + cols + "," + lado + "px);align-content:center;justify-content:center;";
      H.escena.appendChild(rejilla);

      let primera = null, bloqueado = false, quedan = PARES;

      cartas.forEach((ruta) => {
        const c = H.objetivo({ clase: "carta", tam: lado, padre: rejilla });
        const dorso = document.createElement("div");
        dorso.textContent = "";
        dorso.style.cssText = "width:100%;height:100%;border-radius:22px;background:#dfe8f3;" +
          "display:grid;place-items:center;";
        c.appendChild(dorso);

        c._ruta = ruta;
        c.addEventListener("pointerdown", (ev) => {
          if (bloqueado || c._vista || H.terminada()) return;
          c._vista = true;
          c.innerHTML = "";
          c.appendChild(H.sprite(ruta, "82%"));
          Juego.audio.sonido(520);

          if (!primera) {
            H.anotaClic(ev.clientX, ev.clientY, c);
            primera = c;
            return;
          }

          if (primera._ruta === ruta) {                       // pareja encontrada
            H.anota(ev.clientX, ev.clientY, c, true);
            Juego.audio.acierto();
            Juego.marca(ev.clientX, ev.clientY, "bien");
            primera = null;
            if (--quedan === 0 && ++tableros < TABLEROS) {
              setTimeout(nuevoTablero, 900);
            }
          } else {                                            // no son pareja
            H.anota(ev.clientX, ev.clientY, c, false);
            bloqueado = true;
            Juego.audio.mal();
            const a = primera;
            setTimeout(() => {
              [a, c].forEach((x) => { x._vista = false; x.innerHTML = ""; const d = document.createElement("div");
                d.style.cssText = "width:100%;height:100%;border-radius:22px;background:#dfe8f3;"; x.appendChild(d); });
              primera = null; bloqueado = false;
            }, 900);
          }
        });
      });
    }

    nuevoTablero();
  },
});
