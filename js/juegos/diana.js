/* =====================================================================
   Línea de puntería · P1 — Diana estática
   Arte: ARASAAC (CC BY-NC-SA) · set "pelotas" en js/arte.js
   Un objetivo grande y quieto. La ayuda se desvanece según acierta.
   Sin castigo: al fallar, el objetivo crece.
   ===================================================================== */

MOTOR.registrar("punteria1", {
  nombre: "P1 · Diana estática",
  escalon: "P1",
  arte: "pelotas",
  descripcion: "Un objetivo grande y quieto; entrena la puntería con ayuda que se retira.",
  meta: 12,
  siguiente: "escalon0",

  crear(H) {
    const DIANAS = ARTE.rutas("pelotas");

    let i = 0;

    const diana = H.objetivo({ id: "diana" });

    function pintar() {
      diana.innerHTML = "";
      diana.appendChild(H.sprite(DIANAS[i++ % DIANAS.length], "100%"));
    }

    let base = 26;

    function tamano() {
      // Medianas-grandes, y DISTINTA cada vez. La ayuda las agranda un poco más.
      // La base se fija al pintar la pieza: un fallo recalcula solo la ayuda,
      // así que el objetivo no puede encogerse por una base nueva.
      const vmin = base * (0.92 + 0.18 * H.ayuda.nivel);
      diana.style.width = vmin + "vmin";
      diana.style.height = vmin + "vmin";
    }

    let anterior = null;

    function colocar() {
      // Se separan entre sí todo lo posible: se prueban varias posiciones y se elige la más lejana.
      const r = diana.getBoundingClientRect();
      const m = 110;
      const maxX = Math.max(m + 1, innerWidth - r.width - m);
      const maxY = Math.max(m + 1, innerHeight - r.height - m);
      const minimo = Math.min(innerWidth, innerHeight) * 0.42;   // separación deseada

      let mejor = null, mejorD = -1;
      for (let intento = 0; intento < 14; intento++) {
        const x = H.aleatorio(m, maxX), y = H.aleatorio(m, maxY);
        const d = anterior ? Math.hypot(x - anterior.x, y - anterior.y) : 1e6;
        if (d > mejorD) { mejorD = d; mejor = { x: x, y: y }; }
        if (d >= minimo) break;                                   // ya está suficientemente lejos
      }
      diana.style.left = mejor.x + "px";
      diana.style.top  = mejor.y + "px";
      anterior = mejor;
    }

    function siguiente() { pintar(); base = 26 + H.aleatorio(0, 9); tamano(); colocar(); }

    pintar(); base = 26 + H.aleatorio(0, 9); tamano(); colocar();

    H.tocaFondo((ev) => {
      if (H.terminada()) return;
      const res = H.resuelve(ev.clientX, ev.clientY, diana);

      if (res.acierto) {
        H.toque(diana);                                          // refuerzo estándar (pop)
        if (!res.terminada) setTimeout(siguiente, 320);
      } else {
        // Fallo: el objetivo NO se mueve; la ayuda sube si queda margen
        // y el tamaño se recalcula en el sitio.
        tamano();
      }
    });

    addEventListener("resize", colocar);
  },
});
