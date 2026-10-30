const S = 120;
const C = 60;

function svg(cuerpo, extra = '') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}">${extra}${cuerpo}</svg>`;
}

function boca(x, y, r) {
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#222"/>`;
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
  huevo: svg(`<ellipse cx="60" cy="66" rx="30" ry="38" fill="#fff" stroke="#222" stroke-width="3"/>
    <circle cx="60" cy="66" r="12" fill="#ffeb3b" stroke="#222" stroke-width="3"/>`),
  cola: svg(`
    <path d="M44 90c-8-28 20-40 16-62 14 14 26 34 12 62z" fill="#ffeb3b" stroke="#e6b800" stroke-width="3"/>`),
};

export function pictograma(nombre) {
  return PICTOGRAMAS[nombre] ?? PICTOGRAMAS.estrella;
}

export function imagenPictograma(nombre) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(pictograma(nombre));
}
