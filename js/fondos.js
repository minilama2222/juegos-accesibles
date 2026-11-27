// Fondos decorativos de cada mundo: SVG propio, estático y sin texto.
// Es una función pura para poder probarla sin navegador. El dibujo del fondo
// no se anima nunca (ADR 0001, regla 6: el idle solo va en piezas jugables).
//
// El fondo no compite con el juego: es un paisaje suave, de dos o tres masas
// grandes y poca textura. Nada de patrones repetidos a la vista, porque detrás
// se juega. Nada de IP real: formas geométricas y pictogramas propios.
//
// Los colores salen de la paleta del mundo y se mezclan con blanco o negro
// (`mezclar`), así cada mundo tiene su luz sin escribir doce colores a mano.

function svg(cuerpo, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" data-fondo="${id}">${cuerpo}</svg>`;
}

function aRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function aHex([r, g, b]) {
  return '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('');
}

// Mezcla `hex` con blanco (`t > 0`) o con negro (`t < 0`), de 0 a 1.
export function mezclar(hex, t) {
  const base = aRgb(hex);
  const hacia = t >= 0 ? [255, 255, 255] : [0, 0, 0];
  const k = Math.abs(t);
  return aHex(base.map((v, i) => v + (hacia[i] - v) * k));
}

// El cielo, la luz del centro y la viñeta que oscurece los bordes para que el
// centro (donde se juega) respire.
function cielo(fondo, claro) {
  return `<linearGradient id="cie" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${mezclar(fondo, 0.16)}"/>
      <stop offset=".62" stop-color="${mezclar(fondo, -0.12)}"/>
      <stop offset="1" stop-color="${mezclar(fondo, -0.3)}"/>
    </linearGradient>
    <radialGradient id="luz" cx="50%" cy="34%" r="55%">
      <stop offset="0" stop-color="${claro}" stop-opacity=".2"/>
      <stop offset="1" stop-color="${claro}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="fin" cx="50%" cy="42%" r="78%">
      <stop offset=".45" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity=".42"/>
    </radialGradient>`;
}

function base(fondo) {
  return `<rect width="1600" height="900" fill="url(#cie)"/><rect width="1600" height="900" fill="url(#luz)"/>`;
}

function vineta() {
  return `<rect width="1600" height="900" fill="url(#fin)"/>`;
}

// Una colina: una elipse muy ancha, con su propia luz arriba.
function colina(cx, cy, rx, ry, color) {
  return `<g>
    <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${color}"/>
    <ellipse cx="${cx}" cy="${cy - ry * 0.18}" rx="${rx * 0.92}" ry="${ry * 0.8}" fill="${mezclar(color, 0.08)}"/>
  </g>`;
}

// Un árbol de árbol: tronco y tres masas de copa. Sin detalle, para que no
// compita con las cartas.
function arbol(x, y, alto, tronco, copa) {
  const r = alto * 0.28;
  return `<g>
    <rect x="${x - alto * 0.045}" y="${y - alto * 0.42}" width="${alto * 0.09}" height="${alto * 0.44}" rx="${alto * 0.03}" fill="${tronco}"/>
    <circle cx="${x}" cy="${y - alto * 0.62}" r="${r}" fill="${copa}"/>
    <circle cx="${x - r * 0.78}" cy="${y - alto * 0.44}" r="${r * 0.76}" fill="${copa}"/>
    <circle cx="${x + r * 0.8}" cy="${y - alto * 0.46}" r="${r * 0.7}" fill="${copa}"/>
  </g>`;
}

function navidad(m) {
  const [fondo, , claro] = m.paleta;
  return svg(
    `<defs>${cielo(fondo, claro)}</defs>
    ${base(fondo)}
    ${colina(300, 960, 620, 260, mezclar(fondo, 0.1))}
    ${colina(1320, 975, 700, 300, mezclar(fondo, 0.06))}
    ${colina(800, 1010, 900, 230, mezclar(fondo, 0.02))}
    <g fill="${mezclar(claro, -0.35)}" opacity=".5">
      ${[140, 118, 132, 104, 126].map((h, i) => {
        const x = 90 + i * 92;
        const pie = 840; // la base de los pinos se pierde dentro de la nieve
        return `<path d="M${x} ${pie} L${x + h * 0.42} ${pie - h * 2.1} L${x + h * 0.84} ${pie} Z"/>`;
      }).join('')}
      ${[150, 112, 140].map((h, i) => {
        const x = 1270 + i * 105;
        const pie = 875;
        return `<path d="M${x} ${pie} L${x + h * 0.42} ${pie - h * 2.2} L${x + h * 0.84} ${pie} Z"/>`;
      }).join('')}
    </g>
    ${colina(800, 1012, 940, 190, mezclar(claro, -0.18))}
    <path d="M0 900 L0 830 C 260 800 420 850 640 838 S 1040 800 1230 830 S 1500 850 1600 822 L1600 900 Z"
          fill="${mezclar(fondo, -0.28)}" opacity=".55"/>
    <g fill="#ffffff">
      ${[[210, 180, 2.6], [520, 120, 2], [980, 160, 2.4], [1400, 210, 2], [760, 90, 1.8], [1180, 320, 1.6], [360, 320, 1.6], [1500, 90, 2.2]]
        .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}" opacity=".6"/>`)
        .join('')}
    </g>
    ${vineta()}`,
    'navidad',
  );
}

function animalitos(m) {
  const [fondo, , claro] = m.paleta;
  return svg(
    `<defs>
      ${cielo(fondo, claro)}
      <linearGradient id="suelo" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${mezclar(fondo, 0.14)}"/>
        <stop offset="1" stop-color="${mezclar(fondo, 0.02)}"/>
      </linearGradient>
    </defs>
    ${base(fondo)}
    <ellipse cx="800" cy="915" rx="1150" ry="330" fill="url(#suelo)"/>
    ${colina(200, 870, 470, 200, mezclar(fondo, 0.08))}
    ${colina(1440, 890, 520, 220, mezclar(fondo, 0.05))}
    ${arbol(120, 720, 210, mezclar(fondo, -0.42), mezclar(claro, 0.06))}
    ${arbol(1500, 745, 240, mezclar(fondo, -0.42), mezclar(claro, 0.02))}
    ${arbol(1420, 700, 160, mezclar(fondo, -0.42), mezclar(claro, 0.1))}
    <g fill="${mezclar(fondo, 0.24)}" opacity=".5">
      <ellipse cx="640" cy="880" rx="70" ry="12"/><ellipse cx="900" cy="920" rx="54" ry="10"/>
    </g>
    ${vineta()}`,
    'animalitos',
  );
}

function futbol(m) {
  const [fondo, , claro] = m.paleta;
  return svg(
    `<defs>
      ${cielo(fondo, claro)}
      <pattern id="rayas" width="200" height="900" patternUnits="userSpaceOnUse">
        <rect width="100" height="900" fill="#ffffff" opacity=".03"/>
      </pattern>
    </defs>
    ${base(fondo)}
    <rect width="1600" height="900" fill="url(#rayas)"/>
    <g fill="none" stroke="#ffffff" stroke-opacity=".3" stroke-width="5">
      <rect x="90" y="80" width="1420" height="740" rx="6"/>
      <line x1="800" y1="80" x2="800" y2="820"/>
      <circle cx="800" cy="450" r="130"/>
      <circle cx="800" cy="450" r="8" fill="#ffffff" fill-opacity=".3"/>
      <path d="M90 300h170v300H90M1510 300h-170v300h170"/>
      <path d="M90 370h70v160H90M1510 370h-70v160h70"/>
    </g>
    <g opacity=".16">
      <ellipse cx="800" cy="450" rx="330" ry="330" fill="${claro}"/>
    </g>
    ${vineta()}`,
    'futbol',
  );
}

function amarillo(m) {
  const [fondo, acento, claro] = m.paleta;
  return svg(
    `<defs>
      ${cielo(fondo, acento)}
      <radialGradient id="foco" cx="50%" cy="46%" r="60%">
        <stop offset="0" stop-color="${acento}" stop-opacity=".26"/>
        <stop offset="1" stop-color="${acento}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    ${base(fondo)}
    <rect width="1600" height="900" fill="url(#foco)"/>
    <g fill="none" stroke="${mezclar(acento, -0.25)}" stroke-opacity=".22" stroke-width="4" stroke-linejoin="round">
      <path d="M-40 830 L240 770 L470 812 L740 748 L1010 806 L1250 762 L1480 812 L1640 780"/>
      <path d="M-40 872 L260 826 L520 860 L800 806 L1060 856 L1300 818 L1640 866"/>
    </g>
    ${colina(-60, 930, 520, 210, mezclar(fondo, -0.22))}
    ${colina(1660, 950, 560, 230, mezclar(fondo, -0.26))}
    ${colina(800, 1060, 1000, 230, mezclar(fondo, -0.34))}
    <g fill="${acento}" opacity=".5">
      ${[[250, 200, 6], [1330, 170, 5], [560, 110, 4], [1120, 260, 4], [1460, 380, 3], [160, 420, 3]]
        .map(([cx, cy, r]) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`)
        .join('')}
    </g>
    ${vineta()}`,
    'amarillo',
  );
}

const MOTIVOS = { navidad, animalitos, futbol, amarillo };

export function fondoSvg(mundo) {
  const motivo = MOTIVOS[mundo?.fondoArte] ?? navidad;
  return motivo(mundo ?? { paleta: ['#10231d', '#ffd54f', '#2e6b3d'] });
}

// Cadena CSS lista para `background-image`, útil fuera de la escena.
export function fondoCss(mundo) {
  return `url("data:image/svg+xml;charset=utf-8,${encodeURIComponent(fondoSvg(mundo))}")`;
}
