/* =====================================================================
   comun.js — Juegos accesibles
   Capa CONSTANTE compartida por todos los juegos:
     - puntero propio grande con estela
     - botones fijos: volver e interruptor de sonido
     - audio sintetizado (efectos cortos; fondo suave con bucle)
     - imán de apoyo con DESVANECIMIENTO (ayuda que se retira)
     - métricas de puntería (invisibles para el niño)
   Sin texto en los juegos. Sin dependencias externas.
   ===================================================================== */

const Juego = (() => {

  // ---------- Estado de ayuda (desvanecimiento) ----------
  const ayuda = {
    nivel: 1,            // 1 = ayuda máxima, 0.3 = ayuda mínima
    aciertos: 0,
    fallos: 0,
    subir() { this.nivel = Math.min(1, this.nivel + 0.15); },
    bajar() { this.nivel = Math.max(0.3, this.nivel - 0.08); },
  };

  // ---------- Métricas de puntería ----------
  const metricas = {
    clave: "juegos.metricas.v1",
    sesion: { inicio: Date.now(), aciertos: 0, fallos: 0, distancias: [] },
    registrar(x, y, objetivo) {
      const r = objetivo.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(x - cx, y - cy);
      this.sesion.distancias.push(Math.round(d));
      const dentro = (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
      if (dentro) { this.sesion.aciertos++; ayuda.aciertos++; ayuda.bajar(); }
      else        { this.sesion.fallos++;   ayuda.fallos++;   ayuda.subir(); }
      return { d, dentro };
    },
    resumen() {
      const s = this.sesion;
      const d = s.distancias;
      const media = d.length ? Math.round(d.reduce((a, b) => a + b, 0) / d.length) : 0;
      const total = s.aciertos + s.fallos;
      return {
        aciertos: s.aciertos,
        fallos: s.fallos,
        distanciaMedia: media,
        porcentajeDentro: total ? Math.round((s.aciertos / total) * 100) : 0,
        ayudaFinal: Number(ayuda.nivel.toFixed(2)),
        duracionSeg: Math.round((Date.now() - s.inicio) / 1000),
      };
    },
    guardar() {
      const previos = JSON.parse(localStorage.getItem(this.clave) || "[]");
      previos.push(Object.assign({ fecha: new Date().toISOString() }, this.resumen()));
      localStorage.setItem(this.clave, JSON.stringify(previos.slice(-200)));
    },
  };

  // ---------- Audio (sin ficheros: sintetizado, siempre < 1 s) ----------
  const audio = {
    ctx: null,
    mutado: JSON.parse(localStorage.getItem("juegos.mutado") || "false"),
    fondoNodo: null,
    iniciar() {
      if (!this.ctx) {
        const C = window.AudioContext || window.webkitAudioContext;
        if (C) this.ctx = new C();
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },
    // Efecto de acierto: corto, suave, ascendente (≈0,45 s)
    acierto() {
      if (this.mutado) return;
      this.iniciar();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [660, 880, 1174].forEach((f, i) => {
        const o = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        o.type = "sine";
        o.frequency.value = f;
        const ini = t + i * 0.09;
        g.gain.setValueAtTime(0.0001, ini);
        g.gain.exponentialRampToValueAtTime(0.16, ini + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, ini + 0.22);
        o.connect(g).connect(this.ctx.destination);
        o.start(ini);
        o.stop(ini + 0.25);
      });
    },
    // Fondo: dos tonos muy suaves en bucle continuo, volumen bajo
    fondo(activar) {
      this.iniciar();
      if (!this.ctx) return;
      if (!activar || this.mutado) {
        if (this.fondoNodo) { try { this.fondoNodo.stop(); } catch (e) {} this.fondoNodo = null; }
        return;
      }
      if (this.fondoNodo) return;
      const g = this.ctx.createGain();
      g.gain.value = 0.012;                       // volumen muy bajo
      const lfo = this.ctx.createOscillator();    // respiración lenta
      const lfoG = this.ctx.createGain();
      lfo.frequency.value = 0.07;
      lfoG.gain.value = 0.006;
      lfo.connect(lfoG).connect(g.gain);
      [196, 294].forEach((f) => {
        const o = this.ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        o.connect(g);
        o.start();
      });
      lfo.start();
      g.connect(this.ctx.destination);
      this.fondoNodo = { stop() { g.disconnect(); lfo.stop(); } };
    },
    alternarBoton() {
      this.mutado = !this.mutado;
      localStorage.setItem("juegos.mutado", JSON.stringify(this.mutado));
      const b = document.getElementById("boton-mute");
      if (b) b.textContent = this.mutado ? "🔇" : "🔊";
      if (this.mutado) this.fondo(false); else this.fondo(true);
    },
  };

  // ---------- Puntero propio + estela ----------
  function crearPuntero() {
    if (window.matchMedia("(pointer: coarse)").matches) return;   // táctil: no hay cursor
    document.body.classList.add("con-puntero");

    const p = document.createElement("div");
    p.id = "puntero";
    p.innerHTML =
      '<svg viewBox="0 0 64 64" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="22" fill="#4c9f70" opacity=".22"/>' +
      '<path d="M20 12 L52 32 L34 36 L26 54 Z" fill="#3d3a36" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>' +
      "</svg>";
    document.body.appendChild(p);

    const estelas = [];
    for (let i = 0; i < 6; i++) {
      const e = document.createElement("div");
      e.className = "estela";
      e.style.opacity = String(0.5 - i * 0.07);
      document.body.appendChild(e);
      estelas.push({ el: e, x: innerWidth / 2, y: innerHeight / 2 });
    }

    let x = innerWidth / 2, y = innerHeight / 2;
    addEventListener("mousemove", (ev) => { x = ev.clientX; y = ev.clientY; p.style.transform = `translate(${x}px, ${y}px)`; });

    (function animar() {
      let px = x, py = y;
      estelas.forEach((s) => {
        s.x += (px - s.x) * 0.35;
        s.y += (py - s.y) * 0.35;
        s.el.style.transform = `translate(${s.x}px, ${s.y}px)`;
        px = s.x; py = s.y;
      });
      requestAnimationFrame(animar);
    })();
  }

  // ---------- Imán de apoyo: crece el OBJETIVO al acercarse ----------
  function iman(elemento) {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const radio = () => 70 + 90 * ayuda.nivel;       // se encoge al mejorar
    addEventListener("mousemove", (ev) => {
      const r = elemento.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dentro = Math.hypot(ev.clientX - cx, ev.clientY - cy) < Math.max(r.width, r.height) / 2 + radio();
      elemento.classList.toggle("cerca", dentro);
    });
  }

  // ---------- Capa constante: botones ----------
  function crearBotones({ volver = "index.html", fondo = true } = {}) {
    const v = document.createElement("a");
    v.id = "boton-volver";
    v.className = "boton-sup";
    v.href = volver;
    v.textContent = "↩";
    v.setAttribute("aria-label", "Volver");
    document.body.appendChild(v);

    const m = document.createElement("button");
    m.id = "boton-mute";
    m.className = "boton-sup";
    m.textContent = audio.mutado ? "🔇" : "🔊";
    m.setAttribute("aria-label", "Sonido");
    m.addEventListener("click", () => { audio.iniciar(); audio.alternarBoton(); });
    document.body.appendChild(m);

    // Primer gesto del niño: desbloquea el audio del navegador
    addEventListener("pointerdown", () => { audio.iniciar(); if (fondo) audio.fondo(true); }, { once: true });
  }

  // ---------- Utilidades ----------
  function formaSVG(i, tam) {
    const colores = ["#4c9f70", "#e5a13c", "#5b8fd6", "#c96f8e", "#7cae5a", "#b07ec9"];
    const c = colores[i % colores.length];
    const cara =
      '<circle cx="38" cy="40" r="5" fill="#3d3a36"/><circle cx="62" cy="40" r="5" fill="#3d3a36"/>' +
      '<path d="M38 60 q12 12 24 0" stroke="#3d3a36" stroke-width="5" fill="none" stroke-linecap="round"/>';
    const figuras = [
      `<circle cx="50" cy="50" r="46" fill="${c}"/>`,
      `<rect x="6" y="6" width="88" height="88" rx="20" fill="${c}"/>`,
      `<polygon points="50,6 96,92 4,92" fill="${c}"/>`,
      `<polygon points="50,4 61,38 96,38 68,58 79,92 50,72 21,92 32,58 4,38 39,38" fill="${c}"/>`,
    ];
    return `<svg viewBox="0 0 100 100" width="${tam}" height="${tam}">${figuras[i % figuras.length]}${cara}</svg>`;
  }

  function aleatorio(min, max) { return Math.random() * (max - min) + min; }

  function celebracion() {
    const c = document.createElement("div");
    c.id = "celebracion";
    c.innerHTML = formaSVG(0, 320);
    document.body.appendChild(c);
    requestAnimationFrame(() => c.classList.add("activa"));
    audio.acierto();
    setTimeout(() => audio.acierto(), 380);
  }

  function exportar() {
    metricas.guardar();
    const datos = JSON.stringify(metricas.sesion, null, 2);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([datos], { type: "application/json" }));
    a.download = "metricas.json";
    a.click();
  }

  addEventListener("keydown", (e) => { if (e.key === "e") exportar(); });

  return { ayuda, metricas, audio, crearPuntero, iman, crearBotones, formaSVG, aleatorio, celebracion, exportar };
})();
