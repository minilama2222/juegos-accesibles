/* =====================================================================
   Escalón 0 · Toca y pasa algo — causa-efecto puro
   Arte: Animal Pack Remastered (Kenney, CC0)
   Imposible fallar. Un clic en cualquier parte y aparece un animal.
   ===================================================================== */

MOTOR.registrar("escalon0", {
  nombre: "0 · Toca y pasa algo",
  escalon: 0,
  arte: "Animal Pack Remastered",

  crear(H) {
    // Se eligen los animales disponibles una sola vez, para no repetir el mismo seguidos
    const ANIMALES = [
      "assets/recortes/animales/bear.png",
      "assets/recortes/animales/dog.png",
      "assets/recortes/animales/giraffe.png",
      "assets/recortes/animales/hippo.png",
      "assets/recortes/animales/penguin.png",
      "assets/recortes/animales/sloth.png",
      "assets/recortes/animales/elephant.png",
      "assets/recortes/animales/duck.png",
      "assets/recortes/animales/gorilla.png",
      "assets/recortes/animales/crocodile.png",
      "assets/recortes/animales/chicken.png",
      "assets/recortes/animales/snake.png",
    ];

    let i = 0, toques = 0, acabado = false;
    const TOPE = 12;                      // final natural de la sesión

    function elegir() { return ANIMALES[i++ % ANIMALES.length]; }

    document.body.addEventListener("pointerdown", (ev) => {
      if (acabado) return;

      const tam = Math.round(Math.min(innerWidth, innerHeight) * 0.36);
      const caja = document.createElement("div");
      caja.className = "aparece";
      caja.style.left = (ev.clientX - tam / 2) + "px";
      caja.style.top  = (ev.clientY - tam / 2) + "px";
      caja.appendChild(H.sprite(elegir(), tam));
      H.escena.appendChild(caja);

      H.metricas.registrar(ev.clientX, ev.clientY, caja);   // cuenta aciertos; aquí nunca hay fallo
      H.acierto();

      setTimeout(() => { caja.classList.add("se-va"); }, 900);
      setTimeout(() => caja.remove(), 1300);

      toques++;
      if (toques >= TOPE) {
        acabado = true;
        H.cerrarSesion("escalon0");
        H.celebracion();
        // Terminar un nivel lleva al siguiente, sin que nadie tenga que elegir nada.
        setTimeout(() => H.avanzar(), 4600);
      }
    });
  },
});
