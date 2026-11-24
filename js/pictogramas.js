const S = 120;
const C = 60;

function svg(cuerpo, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${extra}${cuerpo}</svg>`;
}

function boca(x, y, r) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#222"/>`;
}

// Icono del menú para elegir tablero: la rejilla de cartas ya dice cuántas
// parejas hay, sin usar texto.
function iconoParejas(filas) {
  const columnas = 4;
  const margen = 9;
  const hueco = 6;
  const ancho = (S - margen * 2 - hueco * (columnas - 1)) / columnas;
  const alto = (S - margen * 2 - hueco * (filas - 1)) / filas;
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
  regalo: svg(`
    <rect x="22" y="46" width="76" height="54" rx="6" fill="#e53935"/>
    <rect x="18" y="34" width="84" height="18" rx="4" fill="#b71c1c"/>
    <rect x="54" y="34" width="12" height="66" fill="#ffd54f"/>
    <path d="M60 34c-10-14-26-16-26-4 0 8 14 8 26 4z" fill="#ffd54f"/>
    <path d="M60 34c10-14 26-16 26-4 0 8-14 8-26 4z" fill="#ffd54f"/>`),
  estrella: svg(
    `<path d="M60 16l13 28 30 4-22 22 5 30-26-14-26 14 5-30-22-22 30-4z" fill="#ffd54f" stroke="#fff" stroke-width="4" stroke-linejoin="round"/>`,
  ),
  bolita: svg(
    `<circle cx="60" cy="60" r="38" fill="#e53935"/><rect x="48" y="20" width="24" height="80" fill="#fff" opacity=".5"/>`,
  ),
  reno: svg(`
    <path d="M40 34c-6-14-18-18-18-18M40 34c-2-12-10-20-10-20M80 34c6-14 18-18 18-18M80 34c2-12 10-20 10-20" stroke="#8d6e63" stroke-width="5" fill="none" stroke-linecap="round"/>
    <circle cx="60" cy="66" r="30" fill="#a1887f"/>
    <circle cx="50" cy="60" r="5" fill="#fff"/><circle cx="70" cy="60" r="5" fill="#fff"/>
    <circle cx="50" cy="61" r="2.5" fill="#222"/><circle cx="70" cy="61" r="2.5" fill="#222"/>
    <circle cx="60" cy="80" r="8" fill="#e53935"/>`),
  gato: svg(`
    <path d="M30 40l6-22 18 12zM90 40l-6-22-18 12z" fill="#f9a825"/>
    <circle cx="60" cy="66" r="32" fill="#f9a825"/>
    <circle cx="48" cy="60" r="6" fill="#fff"/><circle cx="72" cy="60" r="6" fill="#fff"/>
    ${boca(48, 61, 3)}${boca(72, 61, 3)}
    <path d="M54 78q6 6 12 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  perro: svg(`
    <ellipse cx="26" cy="64" rx="12" ry="20" fill="#795548"/>
    <ellipse cx="94" cy="64" rx="12" ry="20" fill="#795548"/>
    <circle cx="60" cy="66" r="30" fill="#a1887f"/>
    <circle cx="50" cy="60" r="5" fill="#fff"/><circle cx="70" cy="60" r="5" fill="#fff"/>
    ${boca(50, 61, 2.5)}${boca(70, 61, 2.5)}
    <circle cx="60" cy="76" r="7" fill="#222"/>`),
  pato: svg(`
    <ellipse cx="60" cy="78" rx="36" ry="22" fill="#ffd54f"/>
    <circle cx="62" cy="46" r="22" fill="#ffe082"/>
    <path d="M80 46l22 8-22 8z" fill="#fb8c00"/>
    <circle cx="66" cy="42" r="4" fill="#222"/>`),
  vaca: svg(`
    <circle cx="60" cy="64" r="34" fill="#fafafa" stroke="#222" stroke-width="3"/>
    <ellipse cx="44" cy="50" rx="12" ry="9" fill="#222"/>
    <ellipse cx="78" cy="76" rx="10" ry="8" fill="#222"/>
    <circle cx="46" cy="66" r="6" fill="#222"/><circle cx="74" cy="66" r="6" fill="#222"/>
    <ellipse cx="60" cy="80" rx="12" ry="8" fill="#f48fb1"/>`),
  balon: svg(`
    <circle cx="60" cy="60" r="38" fill="#fff" stroke="#222" stroke-width="3"/>
    <path d="M60 34l16 12-6 18H50l-6-18z" fill="#222"/>
    <circle cx="30" cy="66" r="9" fill="#222"/><circle cx="90" cy="66" r="9" fill="#222"/>
    <circle cx="60" cy="94" r="9" fill="#222"/>`),
  botas: svg(`
    <path d="M22 40h26v30h18v22H22z" fill="#e53935"/>
    <path d="M74 40h24v42h14v10H74z" fill="#e53935"/>`),
  trofeo: svg(`
    <path d="M40 26h40v20c0 16-9 26-20 26S40 62 40 46z" fill="#ffd54f" stroke="#b8860b" stroke-width="3"/>
    <rect x="54" y="70" width="12" height="14" fill="#b8860b"/>
    <rect x="40" y="84" width="40" height="10" rx="3" fill="#b8860b"/>`),
  bandera: svg(`
    <rect x="34" y="18" width="6" height="84" fill="#8d6e63"/>
    <path d="M40 20l40 16-40 16z" fill="#e53935"/>`),
  bicho: svg(`
    <path d="M60 30l-14-14 6 18-16-8 10 16-18-2 14 12z" fill="#ffeb3b"/>
    <circle cx="60" cy="62" r="32" fill="#ffeb3b"/>
    <ellipse cx="48" cy="56" rx="7" ry="9" fill="#222"/><ellipse cx="72" cy="56" rx="7" ry="9" fill="#222"/>
    <circle cx="50" cy="54" r="2.5" fill="#fff"/><circle cx="74" cy="54" r="2.5" fill="#fff"/>
    <ellipse cx="44" cy="78" rx="7" ry="5" fill="#e53935"/><ellipse cx="76" cy="78" rx="7" ry="5" fill="#e53935"/>
    <path d="M52 80q8 6 16 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>`),
  chispa: svg(
    `<path d="M60 18l10 28 28 10-28 10-10 28-10-28-28-10 28-10z" fill="#ffeb3b" stroke="#fff" stroke-width="3"/>`,
  ),
  // Icono del hover: la bola que hay que aguantar, con el aro que se llena.
  aguantar: svg(`
    <circle cx="60" cy="60" r="49" fill="none" stroke="#ffffff33" stroke-width="9"/>
    <circle cx="60" cy="60" r="49" fill="none" stroke="#ffffff" stroke-width="9"
            stroke-linecap="round" stroke-dasharray="231 308" transform="rotate(-90 60 60)"/>
    <circle cx="60" cy="60" r="29" fill="#ffd54f" stroke="#ffffff" stroke-width="5"/>
    <circle cx="51" cy="50" r="7" fill="#ffffff" opacity="0.55"/>`),
  // Icono de la mecánica "causa-efecto": un golpe con chispas, no una estrella.
  // Tiene que distinguirse de un vistazo del de hover sin usar texto.
  destello: svg(`
    <g stroke="#4fc3f7" stroke-width="9" stroke-linecap="round">
      <path d="M60 12v16M60 92v16M12 60h16M92 60h16"/>
      <path d="M26 26l11 11M83 83l11 11M94 26L83 37M37 83L26 94"/>
    </g>
    <circle cx="60" cy="60" r="17" fill="#4fc3f7" stroke="#fff" stroke-width="4"/>`),
  // Icono de "aparición con tiempo": un reloj que marca la espera y una bola
  // que asoma, para que se distinga del click estático sin usar texto.
  aparicion: svg(`
    <circle cx="60" cy="60" r="47" fill="none" stroke="#ffffff" stroke-width="7"/>
    <path d="M60 28v32l22 14" fill="none" stroke="#ffffff" stroke-width="7"
          stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="16" fill="#ffd54f" stroke="#ffffff" stroke-width="4"/>`),
  huevo: svg(`<ellipse cx="60" cy="66" rx="30" ry="38" fill="#fff" stroke="#222" stroke-width="3"/>
    <circle cx="60" cy="66" r="12" fill="#ffeb3b" stroke="#222" stroke-width="3"/>`),
  cola: svg(`
    <path d="M44 90c-8-28 20-40 16-62 14 14 26 34 12 62z" fill="#ffeb3b" stroke="#e6b800" stroke-width="3"/>`),
  // Controles de sonido: altavoz con ondas, altavoz tachado y nota musical.
  sonido: svg(`
    <path d="M18 46h18l20-16v60L36 74H18z" fill="#ffffff"/>
    <path d="M70 44c8 8 8 24 0 32M82 32c16 16 16 40 0 56" fill="none" stroke="#ffffff"
          stroke-width="7" stroke-linecap="round"/>`),
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
  // Colección: una caja de pegatinas con una estrella, sin texto.
  coleccion: svg(`
    <rect x="18" y="30" width="84" height="68" rx="10" fill="#ffffff" opacity=".22"/>
    <rect x="18" y="30" width="84" height="16" rx="8" fill="#ffd54f"/>
    <path d="M60 58l7 15 16 2-12 12 3 16-14-8-14 8 3-16-12-12 16-2z" fill="#ffffff"/>`),
  // Icono del movimiento lento: un recorrido en bucle y la bola en marcha.
  // Se distingue del reloj de aparición y del marco del tiro a portería.
  movimiento: svg(`
    <path d="M20 64c0-24 18-42 40-42s40 18 40 42-18 34-40 34-32-10-32-26"
          fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"
          stroke-dasharray="10 13"/>
    <path d="M96 84l8 12-15-1z" fill="#ffffff"/>
    <circle cx="60" cy="64" r="20" fill="#ffd54f" stroke="#ffffff" stroke-width="5"/>
    <circle cx="53" cy="57" r="5" fill="#ffffff" opacity="0.6"/>`),
  // Icono del tiro a portería: un marco con huecos y el balón dentro.
  porteria: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="7" stroke-linejoin="round">
      <path d="M16 24h88v76H16z"/>
      <path d="M16 44h88M16 64h88M16 84h88M38 24v76M60 24v76M82 24v76" stroke-width="2" opacity=".45"/>
    </g>
    <circle cx="38" cy="64" r="13" fill="#08140f" stroke="#ffd54f" stroke-width="4"/>
    <circle cx="82" cy="44" r="13" fill="#08140f" stroke="#ffd54f" stroke-width="4"/>
    <circle cx="60" cy="84" r="8" fill="#ffffff" stroke="#222" stroke-width="3"/>
    <path d="M60 78l5 4-2 6h-6l-2-6z" fill="#222"/>`),
  // Icono del arrastre: un dibujo que se lleva hasta su zona de guiones.
  // Se distingue del recorrido en bucle de movimiento lento y del marco del tiro.
  arrastre: svg(`
    <circle cx="30" cy="60" r="19" fill="#ffd54f" stroke="#ffffff" stroke-width="5"/>
    <path d="M54 60h24" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
    <path d="M74 48l14 12-14 12z" fill="#ffffff"/>
    <circle cx="94" cy="60" r="20" fill="none" stroke="#ffffff" stroke-width="6"
            stroke-dasharray="8 8"/>
    <circle cx="94" cy="60" r="7" fill="#ffffff" opacity=".7"/>`),
  // Refuerzos propios de cada mundo: no son el objetivo, son la celebración.
  copo: svg(`
    <g stroke="#ffffff" stroke-width="7" stroke-linecap="round">
      <path d="M60 14v92M20 37l80 46M100 37L20 83"/>
      <path d="M60 30l-12-10M60 30l12-10M60 90l-12 10M60 90l12 10"/>
      <path d="M34 47l-15 3M34 47l-3-15M86 73l15-3M86 73l3 15"/>
      <path d="M34 73l-15-3M34 73l-3 15M86 47l15 3M86 47l3-15"/>
    </g>
    <circle cx="60" cy="60" r="9" fill="#4fc3f7"/>`),
  huella: svg(`
    <ellipse cx="60" cy="76" rx="25" ry="20" fill="#f9a825" stroke="#ffffff" stroke-width="5"/>
    <g fill="#f9a825" stroke="#ffffff" stroke-width="4">
      <circle cx="31" cy="47" r="9"/><circle cx="49" cy="35" r="9"/>
      <circle cx="71" cy="35" r="9"/><circle cx="89" cy="47" r="9"/>
    </g>`),
  silbato: svg(`
    <path d="M22 48h46c14 0 24 8 24 20 0 12-10 20-24 20H46c-14 0-24-8-24-20z"
          fill="#ffffff" stroke="#222" stroke-width="4"/>
    <rect x="22" y="52" width="20" height="10" rx="5" fill="#e53935"/>
    <circle cx="70" cy="60" r="7" fill="#222"/>
    <path d="M92 62h16" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>`),
  // Punteros propios: una forma distinta por mundo, siempre con contorno claro.
  punteroEstrella: svg(`
    <path d="M60 10l14 32 35 4-26 25 7 35-30-16-30 16 7-35-26-25 35-4z"
          fill="#e53935" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="60" cy="60" r="8" fill="#ffd54f"/>`),
  punteroHuella: svg(`
    <ellipse cx="60" cy="72" rx="24" ry="19" fill="#f9a825" stroke="#ffffff" stroke-width="6"/>
    <g fill="#f9a825" stroke="#ffffff" stroke-width="5">
      <circle cx="32" cy="46" r="9"/><circle cx="50" cy="34" r="9"/>
      <circle cx="70" cy="34" r="9"/><circle cx="88" cy="46" r="9"/>
    </g>`),
  punteroBalon: svg(`
    <circle cx="60" cy="60" r="44" fill="#ffffff" stroke="#1b5e20" stroke-width="5"/>
    <path d="M60 33l18 13-7 21H49l-7-21z" fill="#1b5e20"/>
    <circle cx="28" cy="68" r="9" fill="#1b5e20"/>
    <circle cx="92" cy="68" r="9" fill="#1b5e20"/>
    <circle cx="60" cy="98" r="9" fill="#1b5e20"/>`),
  punteroRayo: svg(`
    <path d="M72 8L30 66h24l-6 46 44-62H68z"
          fill="#ffeb3b" stroke="#ffffff" stroke-width="6" stroke-linejoin="round"/>`),
  // Pantalla completa: esquinas hacia fuera para entrar, hacia dentro para salir.
  pantalla: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 44V22h22M98 44V22H76M22 76v22h22M98 76v22H76"/>
    </g>`),
  pantallaSalir: svg(`
    <g fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M44 22v22H22M76 22v22h22M44 98V76H22M76 98V76h22"/>
    </g>`),
  // Dibujos de las parejas: completan el paquete de cada mundo hasta ocho.
  campana: svg(`
    <path d="M38 78c4-10 6-20 6-30 0-14 7-24 16-24s16 10 16 24c0 10 2 20 6 30z"
          fill="#ffd54f" stroke="#b8860b" stroke-width="4" stroke-linejoin="round"/>
    <rect x="34" y="76" width="52" height="8" rx="4" fill="#b8860b"/>
    <circle cx="60" cy="90" r="7" fill="#b8860b"/>`),
  galleta: svg(`
    <circle cx="60" cy="62" r="38" fill="#d7a86e" stroke="#8d6e63" stroke-width="4"/>
    <g fill="#6d4c41">
      <circle cx="45" cy="48" r="6"/><circle cx="74" cy="54" r="5"/>
      <circle cx="54" cy="76" r="6"/><circle cx="80" cy="74" r="4"/>
      <circle cx="36" cy="66" r="4"/>
    </g>`),
  calcetin: svg(`
    <path d="M42 18h30v48c0 6 6 10 16 14 12 4 14 16 4 22-12 8-34 4-46-8-6-6-4-14-4-22z"
          fill="#e53935" stroke="#ffffff" stroke-width="4" stroke-linejoin="round"/>
    <rect x="38" y="16" width="38" height="12" rx="6" fill="#ffffff"/>`),
  hueso: svg(`
    <path d="M30 44c-10-8-6-22 6-22 6 0 10 4 12 8h24c2-4 6-8 12-8 12 0 16 14 6 22 4 4 4 12 0 16 10 8 6 22-6 22-6 0-10-4-12-8H48c-2 4-6 8-12 8-12 0-16-14-6-22-4-4-4-12 0-16z"
          fill="#fafafa" stroke="#222" stroke-width="4" stroke-linejoin="round"/>`),
  pez: svg(`
    <path d="M20 60c14-20 30-28 50-28 18 0 32 12 36 28-4 16-18 28-36 28-20 0-36-8-50-28z"
          fill="#4fc3f7" stroke="#01579b" stroke-width="4"/>
    <path d="M104 60l16-18v36z" fill="#4fc3f7" stroke="#01579b" stroke-width="4"/>
    <circle cx="82" cy="52" r="6" fill="#fff"/><circle cx="82" cy="52" r="3" fill="#222"/>`),
  guante: svg(`
    <path d="M34 78V40c0-6 8-6 8 0v12-26c0-6 8-6 8 0v24-30c0-6 8-6 8 0v30-24c0-6 8-6 8 0v38l10-10c5-5 12 0 8 7L66 92c-4 6-10 8-16 6L34 92z"
          fill="#ffd54f" stroke="#e65100" stroke-width="4" stroke-linejoin="round"/>`),
  camiseta: svg(`
    <path d="M40 26l20 8 20-8 22 14-10 18-12-6v44H40V52l-12 6-10-18z"
          fill="#4fc3f7" stroke="#01579b" stroke-width="4" stroke-linejoin="round"/>
    <path d="M60 34v12" stroke="#ffffff" stroke-width="5"/>`),
  cono: svg(`
    <path d="M60 16l26 74H34z" fill="#fb8c00" stroke="#e65100" stroke-width="4" stroke-linejoin="round"/>
    <path d="M44 58h32M38 76h44" stroke="#ffffff" stroke-width="7"/>
    <rect x="26" y="88" width="68" height="12" rx="6" fill="#e65100"/>`),
  corazon: svg(`
    <path d="M60 96C30 76 18 60 18 44c0-14 10-24 24-24 10 0 16 6 18 12 2-6 8-12 18-12 14 0 24 10 24 24 0 16-12 32-42 52z"
          fill="#e53935" stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>`),
  nube: svg(`
    <path d="M28 76c-12 0-16-16-4-22-2-14 12-24 24-18 6-12 24-12 30 0 14-2 22 12 14 22 10 4 6 18-6 18z"
          fill="#ffffff" stroke="#90a4ae" stroke-width="4" stroke-linejoin="round"/>`),
  rayo: svg(`
    <path d="M68 12L30 66h22l-6 42 40-58H62z" fill="#ffeb3b" stroke="#ffffff" stroke-width="5"
          stroke-linejoin="round"/>`),
  parejas4: iconoParejas(2),
  parejas6: iconoParejas(3),
  parejas8: iconoParejas(4),
};

export function pictograma(nombre) {
  return PICTOGRAMAS[nombre] ?? PICTOGRAMAS.estrella;
}

export function imagenPictograma(nombre) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pictograma(nombre));
}
