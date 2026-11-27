import { svg } from './svg.js';

// Pictogramas propios de los <img> del menú y de las pegatinas.
//
// Aquí ya no viven los dibujos de los objetos: los objetivos, las cartas de
// parejas, la colección y los avatares son pictogramas de ARASAAC (ADR 0002).
// Lo que queda dibujado a mano es lo que no es un objeto que se nombre:
// iconos de mecánica, punteros, refuerzos y controles.
//
// Los de 40–50 px (herramientas, puntero) se dibujan a trazo grueso; los de
// 100–150 px (mecánica, refuerzos) admiten detalle. Uno nunca lleva relleno de
// un solo color: una forma plana se ve como una mancha.

// Icono del menú para elegir tablero: la rejilla de cartas ya dice cuántas
// parejas hay, sin usar texto.
function iconoParejas(filas) {
  const columnas = 4;
  const margen = 9;
  const hueco = 6;
  const ancho = (120 - margen * 2 - hueco * (columnas - 1)) / columnas;
  const alto = (120 - margen * 2 - hueco * (filas - 1)) / filas;
  let cuerpo = '';
  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      const x = margen + c * (ancho + hueco);
      const y = margen + f * (alto + hueco);
      const visible = (f + c) % 3 !== 1;
      cuerpo += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${ancho.toFixed(1)}"
        height="${alto.toFixed(1)}" rx="${Math.min(8, ancho / 5).toFixed(1)}"
        fill="${visible ? '#ffd54f' : '#ffffff'}" stroke="#ffffff"
        stroke-width="${visible ? 2 : 3}" opacity="${visible ? 1 : 0.35}"/>`;
      if (visible) {
        const cx = x + ancho / 2;
        const cy = y + alto / 2;
        cuerpo += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}"
          r="${Math.min(ancho, alto) * 0.2}" fill="#1b5e20"/>`;
      }
    }
  }
  return svg(cuerpo);
}

export const PICTOGRAMAS = {
  /* ---------------- Iconos de las mecánicas (≈150 px) ---------------- */
  // Causa-efecto: un golpe que revienta en chispas, no una estrella.
  destello: svg(`
    <g stroke="#ffd54f" stroke-width="8" stroke-linecap="round" fill="none">
      <path d="M60 8v14M60 98v14M8 60h14M98 60h14"/>
      <path d="M25 25l10 10M85 85l10 10M95 25L85 35M35 85L25 95" stroke="#ffffff" stroke-width="6"/>
    </g>
    <circle cx="60" cy="60" r="22" fill="#4fc3f7" stroke="#ffffff" stroke-width="5"/>
    <path d="M52 52q8-6 16 0" stroke="#ffffff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`),
  // Hover: la bola que hay que aguantar, dentro de un aro que se llena.
  aguantar: svg(`
    <circle cx="60" cy="60" r="49" fill="none" stroke="#ffffff33" stroke-width="9"/>
    <circle cx="60" cy="60" r="49" fill="none" stroke="#ffffff" stroke-width="9"
            stroke-linecap="round" stroke-dasharray="231 308" transform="rotate(-90 60 60)"/>
    <circle cx="60" cy="60" r="29" fill="#ffd54f" stroke="#ffffff" stroke-width="5"/>
    <circle cx="60" cy="60" r="29" fill="none" stroke="#e0a800" stroke-width="3" stroke-dasharray="6 9"/>
    <circle cx="51" cy="50" r="7" fill="#ffffff" opacity="0.55"/>`),
  // Aparición: un reloj que marca la espera y la bola que asoma.
  aparicion: svg(`
    <circle cx="60" cy="60" r="47" fill="none" stroke="#ffffff" stroke-width="7"/>
    <path d="M60 28v32l22 14" fill="none" stroke="#ffffff" stroke-width="7"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="16" fill="#ffd54f" stroke="#ffffff" stroke-width="4"/>`),
  // Movimiento lento: un recorrido en bucle y la bola en marcha.
  movimiento: svg(`
    <path d="M20 64c0-24 18-42 40-42s40 18 40 42-18 34-40 34-32-10-32-26"
          fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="10 13"/>
    <path d="M96 84l8 12-15-1z" fill="#ffffff"/>
    <circle cx="60" cy="64" r="20" fill="#ffd54f" stroke="#ffffff" stroke-width="5"/>
    <circle cx="53" cy="57" r="5" fill="#ffffff" opacity="0.6"/>`),
  // Tiro a portería: el marco con huecos y el balón dentro.
  porteria: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="7" stroke-linejoin="round">
      <path d="M16 24h88v76H16z"/>
      <path d="M16 44h88M16 64h88M16 84h88M38 24v76M60 24v76M82 24v76" stroke-width="2" opacity=".45"/>
    </g>
    <circle cx="38" cy="64" r="13" fill="#08140f" stroke="#ffd54f" stroke-width="4"/>
    <circle cx="82" cy="44" r="13" fill="#08140f" stroke="#ffd54f" stroke-width="4"/>
    <circle cx="60" cy="84" r="8" fill="#ffffff" stroke="#222" stroke-width="3"/>
    <path d="M60 78l5 4-2 6h-6l-2-6z" fill="#222"/>`),
  // Arrastre: un dibujo que se lleva hasta su zona de guiones.
  arrastre: svg(`
    <circle cx="30" cy="60" r="19" fill="#ffd54f" stroke="#ffffff" stroke-width="5"/>
    <path d="M54 60h24" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <path d="M74 48l14 12-14 12z" fill="#ffffff"/>
    <circle cx="94" cy="60" r="20" fill="none" stroke="#ffffff" stroke-width="6"
            stroke-dasharray="8 8"/>
    <circle cx="94" cy="60" r="7" fill="#ffffff" opacity=".7"/>`),
  parejas4: iconoParejas(2),
  parejas6: iconoParejas(3),
  parejas8: iconoParejas(4),

  /* ---------------- Controles del menú (40–50 px) ---------------- */
  // "Lugar": el botón que cambia de mundo. Una casa de trazo grueso, rellenada
  // con el color del mundo (CSS `currentColor`). El pictograma ARASAAC de casa
  // se probó a 48 px y era una mancha: aquí el icono no nombra un objeto, dice
  // «aquí se cambia de sitio».
  lugar: svg(`
    <path d="M12 56L60 14l48 42" fill="none" stroke="currentColor" stroke-width="11"
          stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M24 56v50h72V56" fill="currentColor"/>
    <rect x="52" y="72" width="16" height="34" fill="#0b3d2e" opacity=".5"/>`),
  // Sonido: altavoz con ondas.
  sonido: svg(`
    <path d="M18 46h18l20-16v60L36 74H18z" fill="#ffffff"/>
    <path d="M70 44c8 8 8 24 0 32M82 32c16 16 16 40 0 56" fill="none" stroke="#ffffff"
          stroke-width="7" stroke-linecap="round"/>`),
  // Silencio: el mismo altavoz, tachado.
  silencio: svg(`
    <path d="M18 46h18l20-16v60L36 74H18z" fill="#ffffff"/>
    <path d="M72 44l24 32M96 44L72 76" fill="none" stroke="#e53935" stroke-width="8"
          stroke-linecap="round"/>`),
  musica: svg(`
    <path d="M48 84V30l40-8v54" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="38" cy="88" rx="14" ry="11" fill="#ffffff"/>
    <ellipse cx="78" cy="80" rx="14" ry="11" fill="#ffffff"/>`),
  musicaApagada: svg(`
    <path d="M48 84V30l40-8v54" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
    <ellipse cx="38" cy="88" rx="14" ry="11" fill="#ffffff"/>
    <ellipse cx="78" cy="80" rx="14" ry="11" fill="#ffffff"/>
    <path d="M22 22l76 76" stroke="#e53935" stroke-width="9" stroke-linecap="round"/>`),
  // Pantalla completa: esquinas hacia fuera para entrar, hacia dentro para salir.
  pantalla: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 44V22h22M98 44V22H76M22 76v22h22M98 76v22H76"/>
    </g>`),
  pantallaSalir: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M44 22v22H22M76 22v22h22M44 98V76H22M76 98V76h22"/>
    </g>`),
  // Colección: una caja abierta llena de pegatinas.
  coleccion: svg(`
    <rect x="16" y="42" width="88" height="62" rx="8" fill="#ffffff" opacity=".28"/>
    <path d="M16 52h88" stroke="#ffffff" stroke-width="4" opacity=".7"/>
    <circle cx="42" cy="70" r="9" fill="#ffd54f"/>
    <rect x="60" y="60" width="18" height="18" rx="4" fill="#4fc3f7" transform="rotate(12 69 69)"/>
    <path d="M84 62l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z" fill="#e53935"/>
    <path d="M28 42c6-14 20-22 32-22s26 8 32 22" fill="none" stroke="#ffffff" stroke-width="6"
          stroke-linecap="round"/>`),
  // Aviso táctil: una mano con el dedo índice. Solo en el menú, nunca en partida.
  tactil: svg(`
    <path d="M48 98V58c0-7 10-7 10 0v12-30c0-7 10-7 10 0v30-22c0-7 10-7 10 0v24-14c0-7 10-7 10 0v30c0 14-10 24-24 24H58c-6 0-10-4-10-14z"
          fill="#ffd54f" stroke="#e65100" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="46" cy="34" r="18" fill="none" stroke="#ffffff" stroke-width="5"/>
    <path d="M64 34h18M74 24l8 10-8 10" fill="none" stroke="#ffffff" stroke-width="5"
          stroke-linecap="round" stroke-linejoin="round"/>`),

  /* ---------------- Punteros (≈48 px): trazo gordo, forma inconfundible ---- */
  punteroEstrella: svg(`
    <path d="M60 10l14 32 35 4-26 25 7 35-30-16-30 16 7-35-26-25 35-4z"
          fill="#e53935" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="8" fill="#ffd54f"/>`),
  punteroHuella: svg(`
    <ellipse cx="60" cy="72" rx="24" ry="19" fill="#f9a825" stroke="#ffffff" stroke-width="7"/>
    <g fill="#f9a825" stroke="#ffffff" stroke-width="6">
      <circle cx="32" cy="46" r="9"/><circle cx="50" cy="34" r="9"/>
      <circle cx="70" cy="34" r="9"/><circle cx="88" cy="46" r="9"/>
    </g>`),
  punteroBalon: svg(`
    <circle cx="60" cy="60" r="48" fill="#ffffff" stroke="#1b5e20" stroke-width="7"/>
    <path d="M60 26l20 15-8 24H48l-8-24z" fill="#1b5e20"/>
    <path d="M60 26v-8M80 41l8-4M72 65l6 8M48 65l-6 8M40 41l-8-4" stroke="#1b5e20" stroke-width="6"/>`),
  punteroRayo: svg(`
    <path d="M72 8L30 66h24l-6 46 44-62H68z"
          fill="#ffeb3b" stroke="#ffffff" stroke-width="7" stroke-linejoin="round"/>`),

  /* ---------------- Refuerzos del mundo (≈50 px) ---------------- */
  // Refuerzos de ARASAAC (copo, hueso, silbato, rayo) viven en
  // `assets/arasaac/`; aquí solo queda lo que se dibuja como gesto.
  chispa: svg(`
    <path d="M60 12l11 34 33 14-33 14-11 34-11-34-33-14 33-14z" fill="#ffeb3b" stroke="#ffffff" stroke-width="4"/>`),
  huella: svg(`
    <ellipse cx="60" cy="76" rx="25" ry="20" fill="#f9a825" stroke="#ffffff" stroke-width="5"/>
    <g fill="#f9a825" stroke="#ffffff" stroke-width="4">
      <circle cx="31" cy="47" r="9"/><circle cx="49" cy="35" r="9"/>
      <circle cx="71" cy="35" r="9"/><circle cx="89" cy="47" r="9"/>
    </g>`),
  copo: svg(`
    <g stroke="#ffffff" stroke-width="7" stroke-linecap="round">
      <path d="M60 14v92M20 37l80 46M100 37L20 83"/>
      <path d="M60 30l-12-10M60 30l12-10M60 90l-12 10M60 90l12 10"/>
      <path d="M34 47l-15 3M34 47l-3-15M86 73l15-3M86 73l3 15"/>
      <path d="M34 73l-15-3M34 73l-3 15M86 47l15 3M86 47l3-15"/>
    </g>
    <circle cx="60" cy="60" r="9" fill="#4fc3f7"/>`),

  /* ---------------- Navegación y reservas ---------------- */
  // Volver: una flecha dibujada con trazo gordo; es la única navegación hacia
  // atrás de la app.
  volver: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
      <path d="M94 60H30M48 38L26 60l22 22"/>
    </g>
    <circle cx="98" cy="60" r="8" fill="#ffffff"/>`),
  // Reservas: la estrella sale cuando un nombre no tiene dibujo; el bicho no
  // se usa ya, pero se queda mientras el test de arte lo permita.
  estrella: svg(
    `<path d="M60 16l13 28 30 4-22 22 5 30-26-14-26 14 5-30-22-22 30-4z" fill="#ffd54f" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`,
  ),
  bicho: svg(`
    <path d="M60 30l-14-14 6 18-16-8 10 16-18-2 14 12z" fill="#ffeb3b"/>
    <circle cx="60" cy="62" r="32" fill="#ffeb3b"/>
    <ellipse cx="48" cy="56" rx="7" ry="9" fill="#222"/><ellipse cx="72" cy="56" rx="7" ry="9" fill="#222"/>
    <circle cx="50" cy="54" r="2.5" fill="#fff"/><circle cx="74" cy="54" r="2.5" fill="#fff"/>
    <ellipse cx="44" cy="78" rx="7" ry="5" fill="#e53935"/><ellipse cx="76" cy="78" rx="7" ry="5" fill="#e53935"/>
    <path d="M52 80q8 6 16 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>`),
};

export function pictograma(nombre) {
  return PICTOGRAMAS[nombre] ?? PICTOGRAMAS.estrella;
}

// Data-URI del dibujo propio, listo para un `src` de `<img>`.
export function imagenPictograma(nombre) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pictograma(nombre));
}
