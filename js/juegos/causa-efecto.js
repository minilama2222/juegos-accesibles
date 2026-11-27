/* =====================================================================
   Escalón 0 · Toca y pasa algo — causa-efecto puro
   Arte: ARASAAC (CC BY-NC-SA) · set "animales" en js/arte.js
   Imposible fallar. Un clic en cualquier parte y aparece un animal.
   ===================================================================== */

MOTOR.registrar("escalon0", {
  nombre: "0 · Toca y pasa algo",
  escalon: 0,
  arte: "animales",
  descripcion: "Causa-efecto puro: un toque en cualquier parte y aparece un animal. Imposible fallar.",
  meta: 12,
  siguiente: "escalon1",

  crear(H) {
    // Se eligen los animales disponibles una sola vez, para no repetir el mismo seguidos
    const ANIMALES = ARTE.rutas("animales");

    let i = 0;

    function elegir() { return ANIMALES[i++ % ANIMALES.length]; }

    H.tocaFondo((ev) => {
      if (H.terminada()) return;

      const tam = Math.round(Math.min(innerWidth, innerHeight) * 0.36);
      const caja = document.createElement("div");
      caja.className = "aparece";
      caja.style.width = tam + "px";
      caja.style.height = tam + "px";
      caja.style.left = (ev.clientX - tam / 2) + "px";
      caja.style.top  = (ev.clientY - tam / 2) + "px";
      caja.appendChild(H.sprite(elegir(), tam));
      H.escena.appendChild(caja);

      H.resuelve(ev.clientX, ev.clientY, caja, true, { marca: false }); // aquí nunca hay fallo

      setTimeout(() => { caja.classList.add("se-va"); }, 900);
      setTimeout(() => caja.remove(), 1300);
    });
  },
});
