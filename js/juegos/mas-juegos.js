/* =====================================================================
   mas-juegos.js — Escalones 1, 2, 3 y parejas (4-6)
   Cada juego es SOLO una definición de datos: el motor hace el resto.
   Reglas: sin texto, un clic, objetivos ≥44px, sin castigo dramático.
   ===================================================================== */

const ANIMALES = [
  "bear", "dog", "giraffe", "hippo", "penguin", "sloth",
  "elephant", "duck", "gorilla", "crocodile", "chicken", "snake",
].map((n) => "assets/recortes/animales/" + n + ".png");

const PELOTAS = Array.from({ length: 8 }, (_, i) => "assets/recortes/pelotas/pelota-" + i + ".png");
const OJOS = Array.from({ length: 5 }, (_, i) => "assets/recortes/ojos/ojo-" + i + ".png");

// Piezas comunes ------------------------------------------------------
function cajaPulsable(H, ruta, tam) {
  const caja = document.createElement("div");
  caja.className = "objetivo";
  const lado = tam > 0 ? tam + "px" : "26vmin";
  caja.style.width = lado;
  caja.style.height = lado;
  caja.appendChild(H.sprite(ruta, "100%"));
  H.escena.appendChild(caja);
  Juego.iman(caja);
  return caja;
}

// ---------------------------------------------------------------- 1 · El que brilla
MOTOR.registrar("escalon1", {
  nombre: "1 · El que brilla",
  escalon: 1,
  arte: "Sports Pack",

  crear(H) {
    let aciertos = 0, acabado = false, brillante = 0;
    const TOPE = 12;

    const zonas = [0, 1].map(() => cajaPulsable(H, H.pick(PELOTAS), 0));
    zonas.forEach((z, i) => {
      const r = Math.min(innerWidth, innerHeight) * 0.34;
      z.style.width = r + "px"; z.style.height = r + "px";
      z.style.left = (i === 0 ? innerWidth * 0.08 : innerWidth * 0.58) + "px";
      z.style.top = (innerHeight - r) / 2 + "px";
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
      if (acabado) return;
      const i = zonas.indexOf(objetivo);
      if (i === brillante) {
        aciertos++;
        Juego.audio.acierto(); Juego.marca(ev.clientX, ev.clientY, "bien");
        H.metricas.registrar(ev.clientX, ev.clientY, objetivo);
        if (aciertos >= TOPE) { acabado = true; H.cerrarSesion("escalon1"); H.celebracion(); setTimeout(() => H.avanzar(), 4600); }
        else setTimeout(repintar, 320);
      } else {
        Juego.audio.mal(); Juego.marca(ev.clientX, ev.clientY, "mal");
        H.metricas.registrar(ev.clientX, ev.clientY, objetivo);
      }
    });
  },
});

// ---------------------------------------------------------------- 2 · Toca el que suena
MOTOR.registrar("escalon2", {
  nombre: "2 · Toca el que suena",
  escalon: 2,
  arte: "Animal Pack Remastered",

  crear(H) {
    let aciertos = 0, acabado = false, sonoro = 0, reloj = null;
    const TOPE = 12;

    const zonas = [0, 1, 2].map(() => cajaPulsable(H, H.pick(ANIMALES), 0));
    zonas.forEach((z, i) => {
      const r = Math.min(innerWidth * 0.26, innerHeight * 0.42);
      z.style.width = r + "px"; z.style.height = r + "px";
      z.style.left = (innerWidth * (0.06 + i * 0.32)) + "px";
      z.style.top = (innerHeight - r) / 2 + "px";
      z.innerHTML = ""; z.appendChild(H.sprite(H.pick(ANIMALES), "100%"));
    });

    function elegir() {
      sonoro = Math.floor(Math.random() * 3);
      // el elegido emite un tono suave cada 2 s
      clearInterval(reloj);
      const tono = () => { if (!acabado) Juego.audio.sonido(660 + Math.random() * 220); };
      setTimeout(tono, 250);
      reloj = setInterval(tono, 2000);
    }

    elegir();
    H.toca((ev, objetivo) => {
      if (acabado) return;
      const i = zonas.indexOf(objetivo);
      H.metricas.registrar(ev.clientX, ev.clientY, objetivo);
      if (i === sonoro) {
        aciertos++;
        Juego.audio.acierto(); Juego.marca(ev.clientX, ev.clientY, "bien");
        if (aciertos >= TOPE) { acabado = true; clearInterval(reloj); H.cerrarSesion("escalon2"); H.celebracion(); setTimeout(() => H.avanzar(), 4600); }
        else setTimeout(elegir, 320);
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
  arte: "Googly Eyes",

  crear(H) {
    let aciertos = 0, acabado = false, ciclos = 0;
    const TOPE = 12;

    const ojo = cajaPulsable(H, H.pick(OJOS), 0);
    const tam = Math.round(Math.min(innerWidth, innerHeight) * 0.3);
    ojo.style.width = tam + "px"; ojo.style.height = tam + "px";
    ojo.style.transition = "opacity .35s ease, transform .35s ease";
    ojo.appendChild(H.sprite(H.pick(OJOS), "100%"));

    function asomar() {
      if (acabado) return;
      ojo.style.left = H.aleatorio(110, Math.max(120, innerWidth - tam - 110)) + "px";
      ojo.style.top  = H.aleatorio(110, Math.max(120, innerHeight - tam - 110)) + "px";
      ojo.style.opacity = "1"; ojo.style.transform = "scale(1)";
      // se queda visible un tiempo generoso y luego se esconde
      setTimeout(esconder, 4200);
    }
    function esconder() {
      if (acabado) return;
      ojo.style.opacity = "0"; ojo.style.transform = "scale(.7)";
      ciclos++;
      setTimeout(asomar, 1200);
    }

    setTimeout(asomar, 700);

    H.toca((ev, objetivo) => {
      if (acabado || objetivo !== ojo) return;
      if (ojo.style.opacity === "0") { Juego.audio.mal(); Juego.marca(ev.clientX, ev.clientY, "mal"); return; }
      aciertos++;
      Juego.audio.acierto(); Juego.marca(ev.clientX, ev.clientY, "bien");
      H.metricas.registrar(ev.clientX, ev.clientY, ojo);
      if (aciertos >= TOPE) { acabado = true; H.cerrarSesion("escalon3"); H.celebracion(); setTimeout(() => H.avanzar(), 4600); }
      else { ojo.style.opacity = "0"; setTimeout(asomar, 900); }
    });
  },
});

// ---------------------------------------------------------------- 4-6 · Parejas
MOTOR.registrar("parejas", {
  nombre: "4–6 · Parejas",
  escalon: "4-6",
  arte: "Animal Pack Remastered",

  crear(H) {
    const PARES = parseInt(new URLSearchParams(location.search).get("pares") || "2", 10);
    const TOPE = 3;                       // tres tableros por sesión
    let tableros = 0, acabado = false;

    function nuevoTablero() {
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
        const c = document.createElement("div");
        c.className = "objetivo carta";
        c.style.width = lado + "px"; c.style.height = lado + "px";
        c.style.background = "#ffffff";
        c.innerHTML = "";
        const dorso = document.createElement("div");
        dorso.textContent = "";
        dorso.style.cssText = "width:100%;height:100%;border-radius:22px;background:#dfe8f3;" +
          "display:grid;place-items:center;";
        c.appendChild(dorso);
        rejilla.appendChild(c);
        Juego.iman(c);

        c._ruta = ruta;
        c.addEventListener("pointerdown", (ev) => {
          if (bloqueado || c._vista) return;
          H.metricas.registrar(ev.clientX, ev.clientY, c);
          c._vista = true;
          c.innerHTML = "";
          c.appendChild(H.sprite(ruta, "82%"));
          Juego.audio.sonido(520);

          if (!primera) { primera = c; return; }

          if (primera._ruta === ruta) {                       // pareja encontrada
            Juego.audio.acierto();
            Juego.marca(ev.clientX, ev.clientY, "bien");
            primera = null;
            if (--quedan === 0) {
              if (++tableros >= TOPE) {
                acabado = true; H.cerrarSesion("parejas"); H.celebracion();
                setTimeout(() => H.avanzar(), 4600);
              } else setTimeout(nuevoTablero, 900);
            }
          } else {                                            // no son pareja
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
