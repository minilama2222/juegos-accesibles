// Catálogo de pictogramas ARASAAC del juego (docs/adr/0003-arte-arasaac-primero.md).
// Nadie pinta un nombre: lo que se pinta es un id, que apunta a un PNG de
// `assets/arasaac/`. Así un mundo, una carta o una pegatina solo necesitan el
// concepto, y el pictograma elegido vive en un único sitio.
//
// Unos pocos conceptos llevan sufijo `Arasaac` porque el dibujo propio que hacía
// lo mismo se sigue llamando igual en `pictogramas.js` (la estrella del menú no
// es la estrella de la carta; la huella del puntero no es la de la carta).
//
// El fichero se comprueba contra ARASAAC y contra `assets/arasaac/` con
// `npm run arasaac:licencia`.
export const PICTOGRAMAS_ARASAAC = {
  // Objetivos de los cuatro mundos.
  regalo: 25381,
  gato: 7114,
  balon: 2269,
  carita: 13354,

  // Navidad.
  estrellaArasaac: 3100,
  canica: 36507,
  reno: 9069,
  copoArasaac: 38027,
  campana: 5938,
  galleta: 8312,
  calcetin: 8339,

  // Animalitos.
  perro: 7202,
  pato: 2563,
  vaca: 2609,
  huevo: 2427,
  hueso: 6528,
  pez: 2520,
  huellaArasaac: 9071,

  // Fútbol.
  botas: 2287,
  trofeo: 3162,
  bandera: 5918,
  silbatoArasaac: 6182,
  guante: 8595,
  camiseta: 2309,
  cono: 4928,

  // El monstruo amarillo.
  bichoArasaac: 3379,
  // La chispa del refuerzo es la estrella fugaz: el destello real de 2752 es un
  // cuadrado negro lleno de halo y a 50 px no se lee.
  chispaArasaac: 3100,
  corazon: 2715,
  nube: 2883,
  rayo: 34545,
  contento: 3245,
  contenta: 28647,
};

export function idArasaac(nombre) {
  return PICTOGRAMAS_ARASAAC[nombre] ?? null;
}

// Ruta del PNG en el repo. Un nombre desconocido devuelve null: quien pinta
// decide la reserva, pero nunca acaba mostrando un dibujo que no existe.
export function imagenArasaac(nombre) {
  const id = idArasaac(nombre);
  return id === null ? null : `assets/arasaac/${id}.png`;
}
