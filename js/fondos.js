// Fondos decorativos de cada mundo: SVG propio, estático y sin texto.
// Es una función pura para poder probarla sin navegador. El dibujo del fondo
// no se anima nunca (ADR 0001, regla 6: el idle solo va en piezas jugables).
//
// Cada mundo tiene un motivo reconocible de un vistazo y su propia paleta.
// Nada de IP real: son formas geométricas y pictogramas propios.

function svg(cuerpo, id) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" data-fondo="${id}">${cuerpo}</svg>`;
}

function navidad(m) {
  const [fondo, acento, claro] = m.paleta;
  return svg(
    `
    <defs>
      <radialGradient id="nav-brillo" cx="50%" cy="18%" r="85%">
        <stop offset="0" stop-color="${claro}" stop-opacity=".35"/>
        <stop offset="1" stop-color="${fondo}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="nav-copos" width="140" height="140" patternUnits="userSpaceOnUse">
        <circle cx="26" cy="34" r="2.6" fill="#ffffff" opacity=".45"/>
        <circle cx="96" cy="88" r="1.8" fill="#ffffff" opacity=".3"/>
        <circle cx="118" cy="22" r="1.4" fill="#ffffff" opacity=".25"/>
        <path d="M26 34v14M26 41h-7M26 41h7" stroke="#ffffff" stroke-opacity=".28" stroke-width="1.4"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="${fondo}"/>
    <rect width="1600" height="900" fill="url(#nav-brillo)"/>
    <g fill="${claro}" opacity=".28">
      <path d="M120 820 L260 520 L400 820 Z"/>
      <path d="M310 840 L470 470 L630 840 Z"/>
      <path d="M1140 840 L1310 430 L1480 840 Z"/>
      <path d="M1370 830 L1460 640 L1550 830 Z"/>
    </g>
    <g fill="${acento}" opacity=".55">
      <circle cx="260" cy="548" r="9"/><circle cx="470" cy="500" r="11"/><circle cx="1310" cy="462" r="10"/>
      <circle cx="1460" cy="668" r="7"/>
    </g>
    <rect y="820" width="1600" height="80" fill="#ffffff" opacity=".13"/>
    <rect width="1600" height="900" fill="url(#nav-copos)"/>
    `,
    'navidad',
  );
}

function animalitos(m) {
  const [fondo, acento, claro] = m.paleta;
  return svg(
    `
    <defs>
      <pattern id="ani-huellas" width="180" height="180" patternUnits="userSpaceOnUse">
        <g fill="${claro}" opacity=".22">
          <ellipse cx="62" cy="84" rx="22" ry="17"/>
          <circle cx="34" cy="58" r="7"/><circle cx="50" cy="48" r="7"/>
          <circle cx="72" cy="48" r="7"/><circle cx="88" cy="58" r="7"/>
        </g>
        <g fill="${acento}" opacity=".18">
          <ellipse cx="152" cy="164" rx="15" ry="12"/>
          <circle cx="133" cy="146" r="5"/><circle cx="144" cy="140" r="5"/>
          <circle cx="160" cy="140" r="5"/><circle cx="171" cy="146" r="5"/>
        </g>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="${fondo}"/>
    <ellipse cx="800" cy="980" rx="900" ry="300" fill="${claro}" opacity=".22"/>
    <ellipse cx="260" cy="930" rx="360" ry="190" fill="${acento}" opacity=".12"/>
    <ellipse cx="1380" cy="940" rx="420" ry="220" fill="${claro}" opacity=".14"/>
    <g fill="${claro}" opacity=".35">
      <path d="M180 780c8-60 46-96 96-110-6 58-36 96-96 110z"/>
      <path d="M1420 760c-10-58-48-92-98-104 8 56 38 92 98 104z"/>
    </g>
    <rect width="1600" height="900" fill="url(#ani-huellas)"/>
    `,
    'animalitos',
  );
}

function futbol(m) {
  const [fondo, acento, claro] = m.paleta;
  return svg(
    `
    <defs>
      <linearGradient id="fut-hierba" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${fondo}"/>
        <stop offset="1" stop-color="${claro}"/>
      </linearGradient>
      <pattern id="fut-rayas" width="200" height="900" patternUnits="userSpaceOnUse">
        <rect width="100" height="900" fill="#ffffff" opacity=".035"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="url(#fut-hierba)"/>
    <rect width="1600" height="900" fill="url(#fut-rayas)"/>
    <g fill="none" stroke="${acento}" stroke-opacity=".55" stroke-width="6">
      <rect x="70" y="70" width="1460" height="760" rx="8"/>
      <line x1="800" y1="70" x2="800" y2="830"/>
      <circle cx="800" cy="450" r="140"/>
      <circle cx="800" cy="450" r="10" fill="${acento}" fill-opacity=".55"/>
      <rect x="70" y="280" width="180" height="340"/>
      <rect x="1350" y="280" width="180" height="340"/>
      <rect x="70" y="370" width="70" height="160"/>
      <rect x="1460" y="370" width="70" height="160"/>
    </g>
    <g fill="${acento}" opacity=".18">
      <circle cx="800" cy="450" r="250" fill="none" stroke="${acento}" stroke-opacity=".2" stroke-width="3"/>
    </g>
    `,
    'futbol',
  );
}

function amarillo(m) {
  const [fondo, acento, claro] = m.paleta;
  return svg(
    `
    <defs>
      <radialGradient id="ama-foco" cx="50%" cy="44%" r="72%">
        <stop offset="0" stop-color="${acento}" stop-opacity=".28"/>
        <stop offset="1" stop-color="${fondo}" stop-opacity="0"/>
      </radialGradient>
      <pattern id="ama-rayos" width="260" height="260" patternUnits="userSpaceOnUse">
        <path d="M40 20l34 58-22 4 30 52-58-34 20-6z" fill="${acento}" opacity=".16"/>
        <circle cx="210" cy="190" r="5" fill="${claro}" opacity=".4"/>
        <circle cx="180" cy="60" r="3" fill="${claro}" opacity=".32"/>
      </pattern>
    </defs>
    <rect width="1600" height="900" fill="${fondo}"/>
    <rect width="1600" height="900" fill="url(#ama-foco)"/>
    <g fill="none" stroke="${acento}" stroke-opacity=".2" stroke-width="4">
      <path d="M0 720l240-90 180 60 220-130 260 90 230-70 240 100 230-60"/>
      <path d="M0 780l260-70 190 50 230-110 250 80 240-60 220 90 210-40"/>
    </g>
    <g fill="${acento}" opacity=".28">
      <circle cx="180" cy="170" r="5"/><circle cx="420" cy="120" r="3"/>
      <circle cx="1260" cy="160" r="6"/><circle cx="1450" cy="300" r="4"/>
    </g>
    <rect width="1600" height="900" fill="url(#ama-rayos)"/>
    `,
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
