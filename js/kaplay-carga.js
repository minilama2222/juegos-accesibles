const KAPLAY_URL = new URL('../vendor/kaplay.js', import.meta.url);

let cargada = null;

export function cargarKaplay() {
  if (cargada) return cargada;
  cargada = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = KAPLAY_URL.href;
    s.onload = () =>
      typeof window.kaplay === 'function'
        ? resolve(window.kaplay)
        : reject(new Error('el script cargó sin exportar kaplay'));
    s.onerror = () => reject(new Error('no se pudo cargar kaplay'));
    document.head.appendChild(s);
  });
  return cargada;
}
