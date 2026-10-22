/* =====================================================================
   Línea de puntería · P1 — Diana estática
   Arte: Shooting Gallery (Kenney, CC0)
   Un objetivo grande y quieto. La ayuda se desvanece según acierta.
   Sin castigo: al fallar, el objetivo crece.
   ===================================================================== */

MOTOR.registrar("punteria1", {
  nombre: "P1 · Diana estática",
  escalon: "P1",
  arte: "Shooting Gallery",

  crear(H) {
    const DIANAS = [
      "assets/recortes/dianas/shot_yellow_large.png",
      "assets/recortes/dianas/shot_blue_large.png",
      "assets/recortes/dianas/shot_brown_large.png",
      "assets/recortes/dianas/shot_grey_large.png",
      "assets/recortes/dianas/duck_target_yellow.png",
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
      // El tamaño refleja la ayuda: ayuda máxima = objetivo más grande
      const vmin = 30 + 16 * H.ayuda.nivel;
      diana.style.width = vmin + "vmin";
      diana.style.height = vmin + "vmin";
    }

    function colocar() {
      const r = diana.getBoundingClientRect();
      const m = 100;
      diana.style.left = H.aleatorio(m, Math.max(m + 1, innerWidth  - r.width  - m)) + "px";
      diana.style.top  = H.aleatorio(m, Math.max(m + 1, innerHeight - r.height - m)) + "px";
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
        H.acierto();
        setTimeout(() => diana.classList.remove("acierto"), 520);

        if (aciertos >= TOPE) {
          acabado = true;
          H.cerrarSesion("punteria1");
          H.celebracion();
          setTimeout(() => { acabado = false; aciertos = 0; H.reiniciarSesion(); siguiente(); }, 4200);
        } else {
          setTimeout(siguiente, 320);
        }
      } else {
        // Sin castigo: crece el objetivo (más ayuda) y se recoloca
        tamano(); colocar();
      }
    });

    addEventListener("resize", colocar);
  },
});
