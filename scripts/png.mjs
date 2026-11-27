import { deflateSync, inflateSync } from 'node:zlib';

const TABLA = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = TABLA[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function trozo(tipo, datos) {
  const largo = Buffer.alloc(4);
  largo.writeUInt32BE(datos.length);
  const cuerpo = Buffer.concat([Buffer.from(tipo, 'ascii'), datos]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(cuerpo));
  return Buffer.concat([largo, cuerpo, crc]);
}

export function codificar({ ancho, alto, datos }) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(ancho, 0);
  ihdr.writeUInt32BE(alto, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const crudo = Buffer.alloc(alto * (ancho * 4 + 1));
  for (let y = 0; y < alto; y++) {
    datos.copy(crudo, y * (ancho * 4 + 1) + 1, y * ancho * 4, (y + 1) * ancho * 4);
  }
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    trozo('IHDR', ihdr),
    trozo('IDAT', deflateSync(crudo, { level: 9 })),
    trozo('IEND', Buffer.alloc(0)),
  ]);
}

// Devuelve { ancho, alto, datos } en RGBA de 8 bits. Acepta RGBA e indexado
// con transparencia, que son las dos formas en que la API de ARASAAC entrega
// el pictograma.
export function decodificar(buf) {
  let i = 8;
  let ancho = 0;
  let alto = 0;
  let canales = 4;
  let tipo = 6;
  let paleta = null;
  let alfa = null;
  const idat = [];
  while (i < buf.length) {
    const largo = buf.readUInt32BE(i);
    const nombre = buf.toString('ascii', i + 4, i + 8);
    const datos = buf.subarray(i + 8, i + 8 + largo);
    if (nombre === 'IHDR') {
      ancho = datos.readUInt32BE(0);
      alto = datos.readUInt32BE(4);
      if (datos[8] !== 8) throw new Error(`PNG de ${datos[8]} bits no soportado`);
      if (datos[12] !== 0) throw new Error('PNG entrelazado no soportado');
      tipo = datos[9];
      canales = { 6: 4, 3: 1, 2: 3 }[tipo];
      if (!canales) throw new Error(`tipo de color ${tipo} no soportado`);
    } else if (nombre === 'PLTE') {
      paleta = Buffer.from(datos);
    } else if (nombre === 'tRNS') {
      alfa = Buffer.from(datos);
    } else if (nombre === 'IDAT') {
      idat.push(datos);
    }
    i += 12 + largo;
  }
  const crudo = inflateSync(Buffer.concat(idat));
  const paso = ancho * canales;
  const datos = Buffer.alloc(ancho * alto * 4);
  let previa = Buffer.alloc(paso);
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (paso + 1)];
    const fila = Buffer.from(crudo.subarray(y * (paso + 1) + 1, (y + 1) * (paso + 1)));
    for (let x = 0; x < paso; x++) {
      const a = x >= canales ? fila[x - canales] : 0;
      const b = previa[x];
      const c = x >= canales ? previa[x - canales] : 0;
      const p = a + b - c;
      const pa = Math.abs(p - a);
      const pb = Math.abs(p - b);
      const pc = Math.abs(p - c);
      const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      const v = fila[x];
      const suma =
        filtro === 0 ? v : filtro === 1 ? v + a : filtro === 2 ? v + b : filtro === 3 ? v + ((a + b) >> 1) : v + pred;
      fila[x] = suma & 0xff;
    }
    for (let x = 0; x < ancho; x++) {
      const o = (y * ancho + x) * 4;
      const s = x * canales;
      if (tipo === 6) {
        datos[o] = fila[s];
        datos[o + 1] = fila[s + 1];
        datos[o + 2] = fila[s + 2];
        datos[o + 3] = fila[s + 3];
      } else if (tipo === 3) {
        const k = fila[s];
        datos[o] = paleta[k * 3];
        datos[o + 1] = paleta[k * 3 + 1];
        datos[o + 2] = paleta[k * 3 + 2];
        datos[o + 3] = alfa ? (alfa[k] ?? 255) : 255;
      } else {
        datos[o] = fila[s];
        datos[o + 1] = fila[s + 1];
        datos[o + 2] = fila[s + 2];
        datos[o + 3] = 255;
      }
    }
    previa = fila;
  }
  return { ancho, alto, datos };
}
