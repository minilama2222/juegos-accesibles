/* =====================================================================
   Línea de puntería · P1 — Diana estática
   Arte: Shooting Gallery (Kenney, CC0)
   Un objetivo grande y quieto. La ayuda se desvanece según acierta.
   Sin castigo: al fallar, el objetivo crece.
   ===================================================================== */

MOTOR.registrar("punteria1", {
  nombre: "P1 · Diana estática",
  escalon: "P1",
  arte: "Sports Pack (balones)",

  crear(H) {
    const DIANAS = [
      "assets/recortes/futbol/ball_soccer1.png",
      "assets/recortes/futbol/ball_soccer2.png",
      "assets/recortes/futbol/ball_soccer3.png",
      "assets/recortes/futbol/ball_soccer4.png",
      "assets/recortes/futbol/ball_football.png",
    ];

    let i = 0, aciertos = 0, acabado = false;
    const TOPE = 12;

    const diana = document.createElement("div");
    diana.className = "objetivo";
    diana.id = "diana";
    H.escena.appendChild(diana);

    function pintar() {
      diana.innerHTML = "";
      diana.appendChild(H.sprite(DIANAS[i++ % DIANAS.length], "100%"));
    }

    function tamano() {
      // Medianas-grandes, y DISTINTA cada vez. La ayuda las agranda un poco más.
      const base = 26 + H.aleatorio(0, 9);
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

    function siguiente() { pintar(); tamano(); colocar(); }

    pintar(); tamano(); colocar();
    Juego.iman(diana);

    document.body.addEventListener("pointerdown", (ev) => {
      if (acabado) return;
      const res = H.metricas.registrar(ev.clientX, ev.clientY, diana);

      if (res.dentro) {
        aciertos++;
        diana.classList.add("acierto");
        Juego.audio.acierto();                                   // sonido de "bien"
        Juego.marca(ev.clientX, ev.clientY, "bien");             // señal visual de "bien"
        setTimeout(() => diana.classList.remove("acierto"), 520);

        if (aciertos >= TOPE) {
          acabado = true;
          H.cerrarSesion("punteria1");
          H.celebracion();
          // Terminar un nivel lleva al siguiente, sin que nadie tenga que elegir nada.
          setTimeout(() => H.avanzar(), 4600);
        } else {
          setTimeout(siguiente, 320);
        }
      } else {
        // Fallo: sonido y señal claros, pero suaves. El objetivo NO se mueve ni cambia de tamaño.
        Juego.audio.mal();
        Juego.marca(ev.clientX, ev.clientY, "mal");
      }
    });

    addEventListener("resize", colocar);
  },
});
