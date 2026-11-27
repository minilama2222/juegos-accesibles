import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { chromium } from 'playwright';
import { MECANICAS, ORDEN } from '../js/contenido.js';

let servidor;
let puerto;

// Deja que el sistema elija un puerto libre: así dos worktrees pueden correr
// la suite de navegador a la vez sin pisarse.
function puertoLibre() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

test.before(async () => {
  puerto = await puertoLibre();
  servidor = spawn('python3', ['-m', 'http.server', String(puerto), '--bind', '127.0.0.1'], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'ignore',
  });
  await esperar(`http://127.0.0.1:${puerto}/`);
});

test.after(() => servidor?.kill());

async function esperar(url, intentos = 40) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('servidor no arrancó: ' + url);
}

const URL_BASE = () => `http://127.0.0.1:${puerto}/`;

test('el menú muestra los cuatro mundos y los juegos sin texto visible', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  const mundos = await p.$$eval('[data-mundo]', (n) => n.map((x) => x.dataset.mundo));
  assert.deepEqual(mundos, ['navidad', 'animalitos', 'futbol', 'amarillo']);
  const iconos = await p.$$eval('[data-mundo] img', (n) => n.map((x) => x.getAttribute('src')));
  assert.deepEqual(
    iconos,
    [
      'assets/arasaac/25381.png',
      'assets/arasaac/7114.png',
      'assets/arasaac/2269.png',
      'assets/arasaac/13354.png',
    ],
    'el selector de mundo usa los mismos pictogramas que las bolas',
  );
  const juegos = await p.$$eval('[data-juego]', (n) => n.map((x) => x.dataset.juego));
  assert.deepEqual(
    juegos,
    [
      'causaEfecto',
      'hover',
      'clickEstatico',
      'aparicion',
      'movimientoLento',
      'tiroAPorteria',
      'parejas',
      'parejas',
      'parejas',
      'arrastre',
    ],
    'sólo se ofrecen mecánicas implementadas y de más fácil a más difícil',
  );
  const tableros = await p.$$eval('[data-juego="parejas"]', (n) => n.map((x) => Number(x.dataset.parejas)));
  assert.deepEqual(tableros, [4, 6, 8], 'el menú deja elegir 4, 6 u 8 parejas');
  const textosVisibles = await p.evaluate(() => document.body.innerText.trim());
  assert.equal(textosVisibles, '');
  await b.close();
});

test('elegir un mundo lo guarda y lo refleja en window.juego', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  await p.click('[data-mundo="futbol"]');
  const e = await p.evaluate(() => window.juego);
  assert.equal(e.mundo, 'futbol');
  assert.equal(await p.evaluate(() => localStorage.getItem('juegos.mundo')), 'futbol');
  await b.close();
});

test('quedarse encima del objetivo llena la barra y salirse la vacía', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const o = await p.evaluate(() => window.juego.escena.objetivo);

  await p.mouse.move(o.x, o.y);
  await p.waitForFunction(() => window.juego.escena.hoverLleno > 0.3, null, { timeout: 3000 });
  await p.mouse.move(4, 4);
  await p.waitForFunction(() => window.juego.escena.hoverLleno < 0.15, null, { timeout: 4000 });
  await b.close();
});

test('el botón otro juego siempre visible vuelve al menú', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForSelector('[data-accion="otro-juego"]');
  const vis = await p.isVisible('[data-accion="otro-juego"]');
  assert.equal(vis, true);
  // Regresión: quedaba encogido a ~0,6 por un tween de entrada que no terminaba.
  await p.waitForTimeout(800);
  const caja = await p.evaluate(() => {
    const s = document.querySelector('[data-accion="otro-juego"]');
    const r = s.getBoundingClientRect();
    return { w: r.width, h: r.height, transform: getComputedStyle(s).transform };
  });
  assert.ok(caja.w >= 72 && caja.h >= 72, `el botón debe medir al menos 72px (mide ${caja.w}×${caja.h})`);
  assert.equal(caja.transform, 'none', 'sin transform residual');
  await p.click('[data-accion="otro-juego"]');
  await p.waitForSelector('[data-mundo]');
  assert.equal(await p.evaluate(() => window.juego.vista), 'menu');
  await b.close();
});

test('quedarse encima hasta llenar cuenta un acierto y el objetivo se recoloca lejos', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const antes = await p.evaluate(() => window.juego.escena.objetivo);
  const aciertosPrevios = await p.evaluate(() => window.juego.escena.aciertos);
  await p.mouse.move(antes.x, antes.y);
  await p.mouse.move(antes.x + 1, antes.y);
  await p.mouse.move(antes.x, antes.y);
  await p.waitForFunction(() => window.juego.escena.hoverLleno > 0.5, null, { timeout: 5000 });
  const leido = await p
    .waitForFunction(
      ({ n, o }) => {
        const e = window.juego?.escena;
        if (!e || e.aciertos <= n) return false;
        const d = Math.hypot(e.objetivo.x - o.x, e.objetivo.y - o.y);
        return d > o.radio * 2.5 ? { d } : false;
      },
      { n: aciertosPrevios, o: antes },
      { timeout: 8000 },
    )
    .then((h) => h.jsonValue())
    .catch(() => null);
  assert.ok(leido, 'el objetivo debe moverse lejos del anterior');
  await b.close();
});

test('el objetivo nunca es menor de 44 px', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 800, height: 600 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const o = await p.evaluate(() => window.juego.escena.objetivo);
  assert.ok(o.radio * 2 >= 44);
  await b.close();
});

test('al llegar a la meta el juego termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const meta = await p.evaluate(() => window.juego.escena.meta);

  for (let i = 0; i < meta; i++) {
    const o = await p.evaluate(() => window.juego.escena.objetivo);
    await p.mouse.move(o.x, o.y);
    await p.mouse.move(o.x + 1, o.y);
    await p.mouse.move(o.x, o.y);
    await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 6000 });
  }

  await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  assert.equal(await p.locator('[data-mundo]').count(), 4);
  await b.close();
});

test('tras un acierto el objetivo vuelve a ser visible (no se queda apagado)', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);

  const o = await p.evaluate(() => window.juego.escena.objetivo);
  await p.mouse.move(o.x, o.y);
  await p.mouse.move(o.x + 1, o.y);
  await p.mouse.move(o.x, o.y);
  await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: 1 }, { timeout: 6000 });

  // Antes del arreglo, apareceEn quedaba 240 s en el futuro y la bola no volvía a verse.
  // Se espera a que termine el refuerzo del acierto (480 ms) antes de mirar.
  await p.waitForTimeout(1200);
  const e = await p.evaluate(() => window.juego.escena);
  assert.equal(e.visible, true, 'el objetivo debe volver a verse tras el acierto');
  assert.ok(e.objetivo, 'el objetivo sigue colocado');
  await b.close();
});

test('el objetivo dibuja el pictograma del mundo elegido', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  const pedidas = [];
  p.on('request', (r) => pedidas.push(r.url()));
  await p.goto(URL_BASE());
  await p.click('[data-mundo="futbol"]');
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
  assert.ok(
    pedidas.some((u) => u.endsWith('/assets/arasaac/2269.png')),
    'debe cargar el balón de ARASAAC del mundo de fútbol',
  );
  await b.close();
});


test('causa-efecto: un clic en cualquier sitio hace aparecer el objeto', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);

  await p.mouse.click(300, 250);
  await p.waitForFunction(() => window.juego.escena.toques === 1);
  const uno = await p.evaluate(() => window.juego.escena);
  assert.equal(uno.brotes, 1, 'ha aparecido un objeto');
  assert.deepEqual(uno.ultimoToque, { x: 300, y: 250 });

  // En cualquier otro punto, sin apuntar a nada.
  await p.mouse.click(1000, 650);
  await p.waitForFunction(() => window.juego.escena.toques === 2);
  const dos = await p.evaluate(() => window.juego.escena);
  assert.deepEqual(dos.ultimoToque, { x: 1000, y: 650 });
  assert.equal(dos.terminada, false);
  await b.close();
});

test('causa-efecto: al llegar a la meta termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const meta = await p.evaluate(() => window.juego.escena.meta);

  for (let i = 0; i < meta; i++) {
    await p.mouse.click(120 + (i % 6) * 160, 200 + Math.floor(i / 6) * 220);
    await p.waitForFunction(({ n }) => window.juego?.escena?.toques === n, { n: i + 1 }, { timeout: 3000 });
  }
  const final = await p.evaluate(() => window.juego.escena);
  assert.equal(final.terminada, true);
  assert.equal(final.toques, meta);

  await p.waitForSelector('.confeti', { timeout: 5000 });
  await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 8000 });
  await b.close();
});


test('click estático: clico el objetivo y avanza, recolocándose lejos', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="clickEstatico"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);
    await p.waitForTimeout(600); // deja terminar la aparición del primer objetivo

    const antes = await p.evaluate(() => window.juego.escena.objetivo);
    assert.ok(antes.radio * 2 >= 44, 'el objetivo es grande');
    await p.mouse.click(antes.x, antes.y);
    await p.waitForFunction(() => window.juego?.escena?.aciertos === 1, null, { timeout: 4000 });

    const e = await p.evaluate(() => window.juego.escena);
    const d = Math.hypot(e.objetivo.x - antes.x, e.objetivo.y - antes.y);
    assert.ok(d >= antes.radio * 3, `el objetivo nuevo queda lejos (${d} px)`);
    assert.equal(e.fallos, 0, 'acertar no cuenta fallo');
    assert.equal(e.terminada, false);
  } finally {
    await b.close();
  }
});

test('click estático: un clic fuera cuenta fallo suave y no mueve el objetivo', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="clickEstatico"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);

    const antes = await p.evaluate(() => window.juego.escena.objetivo);
    // Un punto del borde, lejos del objetivo centrado.
    await p.mouse.click(10, 10);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 1, null, { timeout: 3000 });

    let e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.aciertos, 0, 'el fallo no quita ni da progreso');
    assert.equal(e.objetivo.x, antes.x, 'el objetivo sigue fijo');
    assert.equal(e.objetivo.y, antes.y, 'el objetivo sigue fijo');
    assert.equal(e.terminada, false);
    assert.equal(e.ayuda.nivel, 0, 'un fallo suelto no sube la ayuda');

    // El segundo fallo seguido pide más ayuda: el dibujo se agranda sin moverse.
    await p.waitForTimeout(400); // respeta la pausa anti-rebote de los fallos
    await p.mouse.click(10, 10);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 2, null, { timeout: 3000 });
    e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.ayuda.nivel, 1);
    assert.ok(e.objetivo.radio > e.objetivo.radioBase, 'la ayuda agranda el objetivo');
    assert.equal(e.objetivo.x, antes.x, 'la ayuda no lo mueve de sitio');
  } finally {
    await b.close();
  }
});

test('click estático: al llegar a la meta termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="clickEstatico"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);
    const meta = await p.evaluate(() => window.juego.escena.meta);

    for (let i = 0; i < meta; i++) {
      const o = await p.evaluate(() => window.juego.escena.objetivo);
      await p.mouse.click(o.x, o.y);
      await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 4000 });
    }
    assert.equal(await p.evaluate(() => window.juego.escena.terminada), true);
    await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  } finally {
    await b.close();
  }
});


test('tiro a portería: clico el hueco y el balón entra', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="tiroAPorteria"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const antes = await p.evaluate(() => window.juego.escena);
    assert.equal(antes.huecos.length, 6, 'la portería tiene seis huecos');
    assert.ok(
      antes.huecos.every((h) => h.radio * 2 >= 44),
      'ningún hueco baja de 44 px',
    );

    const hueco = antes.huecos[0];
    await p.mouse.click(hueco.x, hueco.y);
    await p.waitForFunction(() => window.juego?.escena?.aciertos === 1, null, { timeout: 4000 });

    const durante = await p.evaluate(() => window.juego.escena);
    assert.equal(durante.fallos, 0, 'el gol no cuenta como fallo');
    assert.equal(durante.ultimoTiro.acierto, true);
    assert.equal(durante.ultimoTiro.hueco, 0);
    assert.ok(durante.balon, 'el balón está volando');
    assert.equal(durante.terminada, false);
  } finally {
    await b.close();
  }
});

test('tiro a portería: un clic fuera lanza el balón despacio y no penaliza', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="tiroAPorteria"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const antes = await p.evaluate(() => window.juego.escena);
    await p.mouse.click(12, 12);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 1, null, { timeout: 3000 });

    let e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.aciertos, 0, 'el fallo no resta ni da progreso');
    assert.equal(e.ultimoTiro.acierto, false);
    assert.deepEqual(
      e.huecos.map((h) => [h.x, h.y]),
      antes.huecos.map((h) => [h.x, h.y]),
      'los huecos no se mueven',
    );
    assert.equal(e.ayuda.nivel, 0, 'un fallo suelto no sube la ayuda');
    assert.ok(e.balon, 'aun fallando, el balón sale hacia una zona vacía');

    // Dos fallos seguidos piden ayuda: los huecos se agrandan sin moverse.
    await p.waitForTimeout(400);
    await p.mouse.click(12, 12);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 2, null, { timeout: 3000 });
    e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.ayuda.nivel, 1);
    assert.ok(e.huecos.every((h) => h.radio > h.radioBase), 'la ayuda agranda los huecos');
    assert.deepEqual(
      e.huecos.map((h) => [h.x, h.y]),
      antes.huecos.map((h) => [h.x, h.y]),
      'la ayuda no los recoloca',
    );
  } finally {
    await b.close();
  }
});

test('tiro a portería: al llegar a la meta termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="tiroAPorteria"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
    const meta = await p.evaluate(() => window.juego.escena.meta);

    for (let i = 0; i < meta; i++) {
      const h = await p.evaluate((n) => window.juego.escena.huecos[n % 6], i);
      await p.mouse.click(h.x, h.y);
      await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 4000 });
    }
    assert.equal(await p.evaluate(() => window.juego.escena.terminada), true);
    await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  } finally {
    await b.close();
  }
});

test('tiro a portería está disponible en los cuatro mundos', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
    await p.goto(URL_BASE());
    for (const id of ['navidad', 'animalitos', 'futbol', 'amarillo']) {
      await p.click(`[data-mundo="${id}"]`);
      await p.click('[data-juego="tiroAPorteria"]');
      await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
      const e = await p.evaluate(() => window.juego.escena);
      assert.equal(e.mundo, id, `${id}: la escena usa el mundo elegido`);
      assert.equal(e.huecos.length, 6);
      await p.click('[data-accion="otro-juego"]');
      await p.waitForSelector('[data-mundo]');
    }
  } finally {
    await b.close();
  }
});


test('aparición: espero el hueco, aparece y clico; el clic en el hueco no suma', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="aparicion"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);
    await p.waitForFunction(() => window.juego?.escena?.visible === true);

    const primero = await p.evaluate(() => window.juego.escena);
    assert.ok(primero.ventanaMs >= 4000 && primero.ventanaMs <= 8000, 'la ventana está entre 4 y 8 s');
    assert.ok(primero.objetivo.radio * 2 >= 44, 'el objetivo es grande');
    assert.equal(primero.fase, 'visible');

    await p.mouse.click(primero.objetivo.x, primero.objetivo.y);
    await p.waitForFunction(() => window.juego?.escena?.aciertos === 1, null, { timeout: 4000 });
    await p.waitForFunction(() => window.juego?.escena?.fase === 'hueco', null, { timeout: 3000 });
    assert.equal(await p.evaluate(() => window.juego.escena.visible), false, 'en el hueco no hay objetivo');

    // Clicar en el hueco no suma ni resta, pero cuenta como fallo suave.
    const fallosAntes = await p.evaluate(() => window.juego.escena.fallos);
    await p.mouse.click(8, 8);
    await p.waitForFunction(({ n }) => window.juego?.escena?.fallos > n, { n: fallosAntes }, { timeout: 3000 });
    assert.equal(await p.evaluate(() => window.juego.escena.aciertos), 1, 'el hueco no da progreso');

    // Espero a que vuelva a aparecer, en otro sitio, y clico.
    await p.waitForFunction(() => window.juego?.escena?.visible === true, null, { timeout: 6000 });
    const segundo = await p.evaluate(() => window.juego.escena);
    assert.equal(segundo.fase, 'visible');
    const distancia = Math.hypot(
      segundo.objetivo.x - primero.objetivo.x,
      segundo.objetivo.y - primero.objetivo.y,
    );
    assert.ok(distancia > primero.objetivo.radio * 2, `reaparece lejos (${distancia} px)`);

    await p.mouse.click(segundo.objetivo.x, segundo.objetivo.y);
    await p.waitForFunction(() => window.juego?.escena?.aciertos === 2, null, { timeout: 4000 });
    assert.equal(await p.evaluate(() => window.juego.escena.terminada), false);
  } finally {
    await b.close();
  }
});

test('aparición: al llegar a la meta termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="aparicion"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);
    const meta = await p.evaluate(() => window.juego.escena.meta);

    for (let i = 0; i < meta; i++) {
      await p.waitForFunction(() => window.juego?.escena?.visible === true, null, { timeout: 9000 });
      const o = await p.evaluate(() => window.juego.escena.objetivo);
      await p.mouse.click(o.x, o.y);
      await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 4000 });
    }

    assert.equal(await p.evaluate(() => window.juego.escena.terminada), true);
    await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  } finally {
    await b.close();
  }
});

test('aparición funciona en los cuatro mundos desde el menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
    await p.goto(URL_BASE());
    for (const id of ['navidad', 'animalitos', 'futbol', 'amarillo']) {
      await p.click(`[data-mundo="${id}"]`);
      await p.click('[data-juego="aparicion"]');
      await p.waitForFunction(() => window.juego?.escena?.lista === true);
      await p.waitForFunction(() => window.juego?.escena?.visible === true, null, { timeout: 3000 });
      const e = await p.evaluate(() => window.juego);
      assert.equal(e.mundo, id);
      assert.equal(e.escena.mecanica, 'aparicion');
      assert.equal(e.escena.visible, true, `${id}: el objetivo aparece`);
      assert.ok(e.escena.ayuda.nivel >= 0);
      await p.click('[data-accion="otro-juego"]');
      await p.waitForSelector('[data-mundo]');
    }
  } finally {
    await b.close();
  }
});


test('movimiento lento: sigo el objetivo, clico y la velocidad sube con aciertos', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="movimientoLento"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const primero = await p.evaluate(() => window.juego.escena);
    assert.equal(primero.mecanica, 'movimientoLento');
    assert.ok(primero.objetivo, 'window.juego expone la posición del objetivo');
    assert.ok(primero.objetivo.radio * 2 >= 44, 'el objetivo es grande y se puede seguir');
    assert.ok(primero.velocidad > 0, 'window.juego expone la velocidad');
    assert.equal(primero.aciertos, 0);
    assert.equal(primero.fallos, 0);
    assert.equal(primero.terminada, false);
    assert.ok(primero.ayuda);
    const inicio = { x: primero.objetivo.x, y: primero.objetivo.y };

    // El objetivo se mueve solo, con una trayectoria suave.
    await p.waitForFunction(
      (o) => {
        const e = window.juego?.escena;
        return e?.objetivo && Math.hypot(e.objetivo.x - o.x, e.objetivo.y - o.y) > 12;
      },
      inicio,
      { timeout: 4000 },
    );

    // Sigo el objetivo y clico: dos aciertos para notar la subida de velocidad.
    for (let i = 0; i < 2; i++) {
      const o = await p.evaluate(() => window.juego.escena.objetivo);
      await p.mouse.click(o.x, o.y);
      await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 4000 });
    }
    const trasAciertos = await p.evaluate(() => window.juego.escena);
    assert.ok(
      trasAciertos.velocidad > primero.velocidad,
      `acertar acelera un poco (${primero.velocidad} → ${trasAciertos.velocidad})`,
    );

    // Un clic fuera solo cuenta un fallo suave: no resta ni para el paseo.
    const antesFallo = await p.evaluate(() => window.juego.escena);
    await p.mouse.click(8, 8);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 1, null, { timeout: 3000 });
    const trasFallo = await p.evaluate(() => window.juego.escena);
    assert.equal(trasFallo.aciertos, 2, 'el fallo no quita progreso');
    assert.equal(trasFallo.terminada, false);
    assert.ok(trasFallo.velocidad >= antesFallo.velocidad * 0.99, 'el fallo suelto no frena el juego');
  } finally {
    await b.close();
  }
});

test('movimiento lento: dos fallos seguidos piden ayuda y la ralentizan', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="movimientoLento"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const antes = await p.evaluate(() => window.juego.escena);
    await p.mouse.click(8, 8);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 1, null, { timeout: 3000 });
    await p.waitForTimeout(450); // respeta la pausa anti-rebote de los fallos
    await p.mouse.click(8, 8);
    await p.waitForFunction(() => window.juego?.escena?.fallos === 2, null, { timeout: 3000 });

    const e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.ayuda.nivel, 1);
    assert.ok(
      e.velocidad < antes.velocidad,
      `la ayuda adaptativa ralentiza con factorVelocidad (${antes.velocidad} → ${e.velocidad})`,
    );
    assert.ok(e.objetivo.radio > e.objetivo.radioBase, 'la ayuda también agranda el dibujo');
  } finally {
    await b.close();
  }
});

test('movimiento lento: al llegar a la meta termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="movimientoLento"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
    const meta = await p.evaluate(() => window.juego.escena.meta);

    for (let i = 0; i < meta; i++) {
      const o = await p.evaluate(() => window.juego.escena.objetivo);
      await p.mouse.click(o.x, o.y);
      await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 4000 });
    }
    assert.equal(await p.evaluate(() => window.juego.escena.terminada), true);
    await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  } finally {
    await b.close();
  }
});

test('movimiento lento está disponible en los cuatro mundos', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
    await p.goto(URL_BASE());
    for (const id of ['navidad', 'animalitos', 'futbol', 'amarillo']) {
      await p.click(`[data-mundo="${id}"]`);
      await p.click('[data-juego="movimientoLento"]');
      await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
      const e = await p.evaluate(() => window.juego);
      assert.equal(e.mundo, id, `${id}: la escena usa el mundo elegido`);
      assert.equal(e.escena.mecanica, 'movimientoLento');
      assert.ok(e.escena.objetivo, `${id}: hay objetivo en movimiento`);
      await p.click('[data-accion="otro-juego"]');
      await p.waitForSelector('[data-mundo]');
    }
  } finally {
    await b.close();
  }
});

test('arrastre: pulso el dibujo, lo llevo a su zona y suelto', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="arrastre"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const antes = await p.evaluate(() => window.juego.escena);
    assert.equal(antes.mecanica, 'arrastre');
    assert.ok(antes.arrastre.inicio, 'window.juego expone dónde empieza el dibujo');
    assert.ok(antes.arrastre.zona, 'window.juego expone la zona de destino');
    assert.equal(antes.arrastre.estado, 'inactivo');
    assert.equal(antes.arrastre.soltado, null);
    assert.ok(antes.arrastre.zona.radio * 2 >= 44, 'la zona es grande');
    assert.ok(antes.arrastre.objetivo, 'window.juego expone el dibujo que se arrastra');

    const { inicio, zona } = antes.arrastre;
    await p.mouse.move(inicio.x, inicio.y);
    await p.mouse.down();
    await p.waitForFunction(() => window.juego?.escena?.arrastre?.estado === 'arrastrando');

    // El dibujo sigue a la mano por el camino.
    await p.mouse.move((inicio.x + zona.x) / 2, (inicio.y + zona.y) / 2, { steps: 6 });
    const enMedio = await p.evaluate(() => window.juego.escena.arrastre);
    assert.equal(enMedio.estado, 'arrastrando');
    assert.ok(
      Math.hypot(enMedio.objetivo.x - inicio.x, enMedio.objetivo.y - inicio.y) > 10,
      'el dibujo se mueve con el puntero',
    );

    await p.mouse.move(zona.x, zona.y, { steps: 8 });
    await p.mouse.up();
    await p.waitForFunction(() => window.juego?.escena?.aciertos === 1, null, { timeout: 4000 });

    const e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.arrastre.estado, 'soltado');
    assert.equal(e.arrastre.soltado.acierto, true, 'soltar en la zona acierta');
    assert.equal(e.fallos, 0, 'acertar no cuenta fallo');
    assert.equal(e.terminada, false);
    assert.ok(e.arrastre.inicio, 'queda un nuevo dibujo para seguir jugando');
  } finally {
    await b.close();
  }
});

test('arrastre: soltar fuera es un fallo suave y el dibujo vuelve a su sitio', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="arrastre"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const antes = await p.evaluate(() => window.juego.escena);
    const { inicio } = antes.arrastre;
    await p.mouse.move(inicio.x, inicio.y);
    await p.mouse.down();
    await p.mouse.move(800, 80, { steps: 8 }); // lejos de la zona y de los botones
    await p.mouse.up();
    await p.waitForFunction(() => window.juego?.escena?.fallos === 1, null, { timeout: 3000 });

    const e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.aciertos, 0, 'soltar fuera no da progreso');
    assert.equal(e.terminada, false, 'soltar fuera no termina ni bloquea la partida');
    assert.equal(e.arrastre.estado, 'soltado');
    assert.equal(e.arrastre.soltado.acierto, false);
    assert.equal(e.arrastre.inicio.x, inicio.x, 'el sitio de partida no cambia');
    assert.equal(e.arrastre.inicio.y, inicio.y, 'el sitio de partida no cambia');
    assert.equal(e.objetivo.x, inicio.x, 'el dibujo vuelve a su sitio');
    assert.equal(e.objetivo.y, inicio.y, 'el dibujo vuelve a su sitio');
    assert.equal(e.ayuda.nivel, 0, 'un fallo suelto no sube la ayuda');

    // El segundo fallo seguido sube la ayuda: el reparto y el tamaño nuevos se
    // aplican ya en esta ronda, sin esperar a otro acierto.
    const zonaAntes = e.arrastre.zona.radio;
    const radioAntes = e.objetivo.radio;
    await p.waitForTimeout(450); // respeta la pausa anti-rebote
    const otraVez = await p.evaluate(() => window.juego.escena.arrastre.inicio);
    await p.mouse.move(otraVez.x, otraVez.y);
    await p.mouse.down();
    await p.mouse.move(800, 80, { steps: 8 });
    await p.mouse.up();
    await p.waitForFunction(() => window.juego?.escena?.fallos === 2, null, { timeout: 3000 });

    const conAyuda = await p.evaluate(() => window.juego.escena);
    assert.equal(conAyuda.ayuda.nivel, 1);
    assert.ok(conAyuda.objetivo.radio > radioAntes, 'el dibujo crece en la misma ronda');
    assert.ok(conAyuda.arrastre.zona.radio > zonaAntes, 'la zona también crece ya');
    assert.equal(conAyuda.aciertos, 0, 'seguir fallando no da progreso');
  } finally {
    await b.close();
  }
});

test('arrastre está disponible en los cuatro mundos', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
    await p.goto(URL_BASE());
    for (const id of ['navidad', 'animalitos', 'futbol', 'amarillo']) {
      await p.click(`[data-mundo="${id}"]`);
      await p.click('[data-juego="arrastre"]');
      await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
      const e = await p.evaluate(() => window.juego);
      assert.equal(e.mundo, id, `${id}: la escena usa el mundo elegido`);
      assert.equal(e.escena.mecanica, 'arrastre');
      assert.ok(e.escena.arrastre.zona, `${id}: hay zona de destino`);

      const { inicio, zona } = e.escena.arrastre;
      await p.mouse.move(inicio.x, inicio.y);
      await p.mouse.down();
      await p.mouse.move(zona.x, zona.y, { steps: 8 });
      await p.mouse.up();
      await p.waitForFunction(() => window.juego?.escena?.aciertos === 1, null, { timeout: 4000 });

      await p.click('[data-accion="otro-juego"]');
      await p.waitForSelector('[data-mundo]');
    }
  } finally {
    await b.close();
  }
});

test('el avatar se elige con un clic y se recuerda al recargar', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  const antes = await p.evaluate(() => window.juego.avatar);
  await p.click('[data-accion="avatar"]');
  const despues = await p.evaluate(() => window.juego.avatar);
  assert.notEqual(despues, antes, 'el avatar cambia');
  assert.equal(await p.evaluate(() => localStorage.getItem('juegos.avatar')), despues);

  await p.reload();
  await p.waitForFunction(() => !!window.juego);
  assert.equal(await p.evaluate(() => window.juego.avatar), despues, 'se recuerda al recargar');
  assert.equal(
    await p.$eval('[data-accion="avatar"]', (n) => n.dataset.avatar),
    despues,
    'el dibujo del menú es el avatar guardado',
  );
  await b.close();
});

test('el botón de efectos corta solo los efectos y la preferencia persiste', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  assert.equal(await p.evaluate(() => window.juego.sonido.efectos), false);
  await p.click('[data-accion="efectos"]');
  assert.equal(await p.evaluate(() => window.juego.sonido.efectos), true);
  assert.equal(await p.evaluate(() => localStorage.getItem('juegos.efectos.v1')), 'apagado');
  assert.equal(await p.$eval('[data-accion="efectos"]', (n) => n.dataset.estado), 'apagado');

  await p.reload();
  await p.waitForFunction(() => !!window.juego);
  assert.equal(await p.evaluate(() => window.juego.sonido.efectos), true, 'se recuerda al recargar');

  await p.click('[data-accion="efectos"]');
  assert.equal(await p.evaluate(() => window.juego.sonido.efectos), false);
  assert.equal(await p.evaluate(() => localStorage.getItem('juegos.efectos.v1')), 'encendido');
  await b.close();
});

test('el altavoz y la nota de música son controles distintos', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());

  await p.click('[data-accion="musica"]');
  let s = await p.evaluate(() => window.juego.sonido);
  assert.equal(s.musica, true);
  assert.equal(s.reproduciendo, true);
  assert.equal(s.efectos, false, 'encender la música no silencia los efectos');

  await p.click('[data-accion="efectos"]');
  s = await p.evaluate(() => window.juego.sonido);
  assert.equal(s.efectos, true);
  assert.equal(s.musica, true, 'silenciar los efectos no apaga la música');
  assert.equal(s.reproduciendo, true);

  await p.click('[data-accion="musica"]');
  s = await p.evaluate(() => window.juego.sonido);
  assert.equal(s.musica, false);
  assert.equal(s.reproduciendo, false);
  assert.equal(s.efectos, true, 'apagar la música no reactiva los efectos');
  await b.close();
});

test('la música es opcional, se enciende a mano y se recuerda', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  assert.equal(await p.evaluate(() => window.juego.sonido.musica), false, 'apagada por defecto');
  await p.click('[data-accion="musica"]');
  assert.equal(await p.evaluate(() => window.juego.sonido.musica), true);
  assert.equal(await p.evaluate(() => localStorage.getItem('juegos.musica.v1')), 'si');
  await p.reload();
  await p.waitForFunction(() => !!window.juego);
  assert.equal(await p.evaluate(() => window.juego.sonido.musica), true, 'se recuerda al recargar');
  await b.close();
});

test('al terminar una partida se gana una pegatina que aparece en la colección', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const meta = await p.evaluate(() => window.juego.escena.meta);
  for (let i = 0; i < meta; i++) {
    await p.mouse.click(120 + (i % 6) * 160, 200 + Math.floor(i / 6) * 220);
    await p.waitForFunction(({ n }) => window.juego?.escena?.toques === n, { n: i + 1 }, { timeout: 3000 });
  }

  await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  const guardadas = await p.evaluate(() => window.juego.pegatinas);
  assert.equal(Object.values(guardadas).reduce((a, n) => a + n, 0), 1, 'se guarda una pegatina');
  assert.equal(await p.evaluate(() => window.juego.ultimaPegatina.nueva), true);

  await p.click('[data-accion="coleccion"]');
  await p.waitForFunction(() => window.juego?.vista === 'coleccion');
  assert.equal(await p.locator('[data-pegatina][data-ganada="true"]').count(), 1);
  assert.equal(await p.locator('[data-pegatina]').count(), 8, 'la colección enseña también las que faltan');

  await p.click('[data-accion="volver"]');
  await p.waitForFunction(() => window.juego?.vista === 'menu');
  await b.close();
});

test('la pegatina del balón usa el pictograma ARASAAC, no el SVG propio', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());
  // Deja ganadas las tres primeras para que la siguiente sea el balón.
  await p.evaluate(() =>
    localStorage.setItem('juegos.pegatinas.v1', JSON.stringify({ estrella: 1, regalo: 1, gato: 1 })),
  );
  await p.reload();
  await p.click('[data-mundo="futbol"]');
  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const meta = await p.evaluate(() => window.juego.escena.meta);
  for (let i = 0; i < meta; i++) {
    await p.mouse.click(120 + (i % 6) * 160, 200 + Math.floor(i / 6) * 220);
    await p.waitForFunction(({ n }) => window.juego?.escena?.toques === n, { n: i + 1 }, { timeout: 3000 });
  }

  await p.waitForSelector('.premio img', { timeout: 5000 });
  const enPremio = await p.$eval('.premio img', (n) => n.getAttribute('src'));
  assert.equal(enPremio, 'assets/arasaac/2269.png');

  await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  await p.click('[data-accion="coleccion"]');
  await p.waitForFunction(() => window.juego?.vista === 'coleccion');
  const enColeccion = await p.$eval('[data-pegatina="balon"] img', (n) => n.getAttribute('src'));
  assert.equal(enColeccion, 'assets/arasaac/2269.png');
  await b.close();
});

test('el menú ofrece pantalla completa con icono y sin texto', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  const boton = p.locator('[data-accion="pantalla-completa"]');
  assert.equal(await boton.count(), 1, 'hay un botón de pantalla completa en el menú');
  assert.equal(await boton.isVisible(), true);
  assert.match(await boton.getAttribute('aria-label'), /pantalla completa/i);
  assert.equal((await boton.innerText()).trim(), '', 'sin texto visible');

  // En headless la API real puede no estar disponible: se comprueba que el clic la pide.
  await p.evaluate(() => {
    window.__pantallaPedida = 0;
    document.documentElement.requestFullscreen = () => {
      window.__pantallaPedida += 1;
      return Promise.resolve();
    };
  });
  await boton.click();
  await p.waitForFunction(() => window.__pantallaPedida === 1);
  await b.close();
});

test('en pantalla táctil el menú avisa al padre con un icono, sin texto', async () => {
  const b = await chromium.launch();
  try {
    const contexto = await b.newContext({
      viewport: { width: 800, height: 600 },
      isMobile: true,
      hasTouch: true,
    });
    const p = await contexto.newPage();
    await p.goto(URL_BASE());
    const grueso = await p.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (!grueso) return; // Chromium headless no siempre emula la consulta; sin señal no hay aviso.
    const aviso = p.locator('.aviso--tactil');
    assert.equal(await aviso.count(), 1, 'hay un aviso táctil en el menú');
    assert.match(await aviso.getAttribute('aria-label'), /ratón/i);
    assert.equal((await aviso.innerText()).trim(), '', 'sin texto visible');
  } finally {
    await b.close();
  }
});

test('todas las escenas dejan ver el arte del mundo', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    const implementadas = ORDEN.filter((id) => MECANICAS[id]?.implementada);
    for (const id of implementadas) {
      await p.locator(`[data-juego="${id}"]`).first().click();
      await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 10000 });
      await p.waitForTimeout(350);
      const alpha = await p.evaluate(() => {
        const lienzo = document.getElementById('lienzo');
        const gl = lienzo.getContext('webgl');
        const px = new Uint8Array(4);
        // Una esquina sin objetivos: si el canvas fuera opaco taparía el fondo SVG.
        gl.readPixels(2, 2, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
        return px[3];
      });
      assert.equal(alpha, 0, `${id}: el canvas es transparente y deja ver el mundo`);
      await p.click('[data-accion="otro-juego"]');
      await p.waitForSelector('[data-mundo]');
    }
  } finally {
    await b.close();
  }
});

test('cada mundo cambia fondo, refuerzo, puntero y sonido en la partida', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());

  const vistos = [];
  for (const id of ['navidad', 'animalitos', 'futbol', 'amarillo']) {
    await p.click(`[data-mundo="${id}"]`);
    await p.click('[data-juego="causaEfecto"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);
    const e = await p.evaluate(() => window.juego);
    assert.equal(e.apariencia.fondoArte, id);
    assert.ok(e.apariencia.refuerzo, `${id}: refuerzo propio`);
    assert.ok(e.apariencia.puntero, `${id}: puntero propio`);
    assert.ok(e.apariencia.sonidos.acierto > 0);

    const fondo = await p.$eval('.fondo svg', (n) => n.outerHTML);
    assert.ok(fondo.length > 100, `${id}: el fondo es arte, no un color plano`);
    const puntero = await p.$eval('#puntero img', (n) => n.dataset.puntero);
    assert.equal(puntero, e.apariencia.puntero);

    await p.mouse.click(620, 420);
    await p.waitForFunction(() => !!window.juego?.ultimoRefuerzo);
    const refuerzo = await p.evaluate(() => window.juego.ultimoRefuerzo);
    assert.equal(refuerzo.refuerzo, e.apariencia.refuerzo, `${id}: el refuerzo es el del mundo`);

    vistos.push(`${e.apariencia.fondoArte}|${e.apariencia.refuerzo}|${e.apariencia.puntero}|${e.apariencia.sonidos.acierto}`);
    await p.click('[data-accion="otro-juego"]');
    await p.waitForSelector('[data-mundo]');
  }
  assert.equal(new Set(vistos).size, 4, 'los cuatro paquetes visuales son distintos');
  await b.close();
});

test('pulsar muy rápido al final no rompe la partida ni duplica pegatinas', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const meta = await p.evaluate(() => window.juego.escena.meta);

  // Más clics que la meta, disparados en el mismo instante: el desahogo no rompe nada.
  await p.evaluate((n) => {
    for (let i = 0; i < n; i++) {
      document.dispatchEvent(new MouseEvent('click', { clientX: 200 + (i % 30) * 20, clientY: 300, bubbles: true }));
    }
  }, meta + 24);

  await p.waitForFunction(() => window.juego?.ultimaPegatina, null, { timeout: 5000 });
  assert.equal(await p.evaluate(() => window.juego.ultimaPegatina.nueva), true);
  await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  const total = await p.evaluate(() =>
    Object.values(window.juego.pegatinas).reduce((a, n) => a + n, 0),
  );
  assert.equal(total, 1, 'una partida entrega una sola pegatina aunque se pulse de más');
  await b.close();
});

test('pulsar muy rápido en click estático tampoco rompe ni duplica el premio', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="clickEstatico"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true);
    await p.waitForTimeout(600);
    const meta = await p.evaluate(() => window.juego.escena.meta);

    // Una ráfaga de clics en el mismo instante sobre el primer objetivo: solo
    // uno puede acertar y el resto no rompe la partida.
    await p.evaluate((n) => {
      const o = window.juego.escena.objetivo;
      for (let i = 0; i < n; i++) {
        document.dispatchEvent(new MouseEvent('click', { clientX: o.x, clientY: o.y, bubbles: true }));
      }
    }, meta + 24);
    await p.waitForTimeout(120);
    const trasRafaga = await p.evaluate(() => window.juego.escena);
    assert.equal(trasRafaga.aciertos, 1, 'la ráfaga solo suma el primer acierto');
    assert.equal(trasRafaga.terminada, false);

    // Ahora termina la partida con clics normales, uno por objetivo.
    for (let i = 1; i < meta; i++) {
      const o = await p.evaluate(() => window.juego.escena.objetivo);
      await p.mouse.click(o.x, o.y);
      await p.waitForFunction(({ n }) => window.juego?.escena?.aciertos === n, { n: i + 1 }, { timeout: 4000 });
    }
    assert.equal(await p.evaluate(() => window.juego.escena.terminada), true);
    await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
    const total = await p.evaluate(() =>
      Object.values(window.juego.pegatinas).reduce((a, n) => a + n, 0),
    );
    assert.equal(total, 1, 'una partida entrega una sola pegatina aunque haya ráfaga');
  } finally {
    await b.close();
  }
});

test('con reducedMotion reduce baja la animación y el resultado no cambia', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 }, reducedMotion: 'reduce' });
  await p.goto(URL_BASE());
  assert.equal(await p.evaluate(() => window.juego.movimiento.reducido), true);

  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const meta = await p.evaluate(() => window.juego.escena.meta);
  for (let i = 0; i < meta; i++) {
    await p.mouse.click(120 + (i % 6) * 160, 200 + Math.floor(i / 6) * 220);
    await p.waitForFunction(({ n }) => window.juego?.escena?.toques === n, { n: i + 1 }, { timeout: 3000 });
  }

  const confeti = await p
    .waitForFunction(() => Number.isInteger(window.juego?.movimiento?.confeti), null, { timeout: 5000 })
    .then((h) => h.jsonValue());
  assert.ok(confeti > 0 && confeti <= 40, `se recorta el confeti (${confeti} piezas)`);
  assert.equal(await p.evaluate(() => window.juego.estallidos), 0, 'sin partículas de estallido');

  await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  const total = await p.evaluate(() =>
    Object.values(window.juego.pegatinas).reduce((a, n) => a + n, 0),
  );
  assert.equal(total, 1, 'el resultado de la partida es el mismo: una pegatina');
  await b.close();
});

// Deja que la barra de hover empiece a llenarse y luego se vacíe del todo:
// eso es un fallo suave para la ayuda, sin quitar progreso.
async function provocarFallo(p) {
  const o = await p.evaluate(() => window.juego.escena.objetivo);
  const fallosAntes = await p.evaluate(() => window.juego.escena.fallos);
  await p.mouse.move(o.x, o.y);
  await p.waitForFunction(() => window.juego?.escena?.hoverLleno > 0.25, null, { timeout: 3000 });
  await p.mouse.move(6, 6);
  await p.waitForFunction(({ n }) => window.juego?.escena?.fallos > n, { n: fallosAntes }, { timeout: 5000 });
}

test('fallar repetidamente agranda el objetivo y la ayuda persiste', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
  await p.goto(URL_BASE());
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);

  assert.equal(await p.evaluate(() => window.juego.escena.ayuda.nivel), 0);
  await provocarFallo(p);
  assert.equal(
    await p.evaluate(() => window.juego.escena.ayuda.nivel),
    0,
    'un fallo suelto no sube la ayuda',
  );
  await provocarFallo(p);

  const escena = await p.evaluate(() => window.juego.escena);
  assert.equal(escena.fallos, 2);
  assert.equal(escena.ayuda.nivel, 1);
  assert.ok(escena.ayuda.factorTamano > 1);
  assert.ok(
    escena.objetivo.radio > escena.objetivo.radioBase,
    'el objetivo se agranda de forma observable en window.juego',
  );
  assert.deepEqual(await p.evaluate(() => JSON.parse(localStorage.getItem('juegos.ayuda.v1'))), {
    hover: 1,
  });

  await p.reload();
  await p.click('[data-juego="hover"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  const otra = await p.evaluate(() => window.juego.escena);
  assert.equal(otra.ayuda.nivel, 1, 'la ayuda se recuerda entre sesiones');
  assert.ok(otra.objetivo.radio > otra.objetivo.radioBase);
  await b.close();
});

test('las métricas se guardan por juego y se exportan sin verse en el juego', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1200, height: 800 }, acceptDownloads: true });
  await p.goto(URL_BASE());
  await p.click('[data-juego="causaEfecto"]');
  await p.waitForFunction(() => window.juego?.escena?.lista === true);
  await p.mouse.click(300, 250);
  await p.mouse.click(700, 450);
  await p.waitForFunction(() => window.juego.escena.toques === 2);

  assert.equal(await p.evaluate(() => document.body.innerText.trim()), '', 'nada visible en el juego');
  assert.equal(await p.locator('[data-accion="exportar"]').count(), 0, 'sin botón de exportar');

  await p.click('[data-accion="otro-juego"]');
  await p.waitForFunction(() => window.juego.vista === 'menu');

  const guardadas = await p.evaluate(() => JSON.parse(localStorage.getItem('juegos.metricas.v1')));
  assert.equal(guardadas.partidas, 1);
  assert.equal(guardadas.aciertos, 2);
  assert.equal(guardadas.porJuego.causaEfecto.partidas, 1);
  assert.equal(guardadas.porJuego.causaEfecto.aciertos, 2);
  assert.equal(guardadas.porJuego.causaEfecto.ayudaFinal, 0);
  assert.ok(guardadas.duracionMs >= 0);

  const exportado = await p.evaluate(() => window.juego.exportarMetricas());
  assert.equal(exportado.aciertos, 2);
  assert.ok(exportado.exportadoEn);

  const [descarga] = await Promise.all([p.waitForEvent('download'), p.keyboard.press('e')]);
  assert.ok(descarga.suggestedFilename().startsWith('juegos-metricas-'));
  await b.close();
});

test('parejas: elijo 6 parejas, giro dos iguales y se quedan visibles', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="parejas"][data-parejas="6"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const antes = await p.evaluate(() => window.juego.escena);
    assert.equal(antes.mecanica, 'parejas');
    assert.equal(antes.parejas, 6);
    assert.equal(antes.cartas.length, 12);
    assert.equal(antes.encontradas, 0);
    assert.equal(antes.terminada, false);
    assert.ok(antes.cartas.every((c) => c.lado >= 44), 'las cartas son grandes');
    assert.equal(await p.evaluate(() => window.juego.cartas.length), 12, 'el tablero también en window.juego');
    assert.equal(await p.evaluate(() => window.juego.parejas), 6);
    assert.equal(await p.evaluate(() => window.juego.encontradas), 0);
    assert.equal(await p.evaluate(() => window.juego.terminada), false);
    assert.ok(await p.evaluate(() => window.juego.ayuda));
    assert.ok(
      antes.cartas.every((c) => c.x - c.lado / 2 >= 0 && c.x + c.lado / 2 <= 1600),
      'el tablero cabe a lo ancho',
    );
    assert.ok(
      antes.cartas.every((c) => c.y - c.lado / 2 >= 0 && c.y + c.lado / 2 <= 900),
      'el tablero cabe a lo alto',
    );

    const pareja = antes.cartas.find((c) => c.pareja === antes.cartas[0].pareja && c.id !== antes.cartas[0].id);
    const primera = antes.cartas[0];
    await p.mouse.click(primera.x, primera.y);
    await p.waitForFunction(({ id }) => window.juego.escena.cartas[id].estado === 'visible', { id: primera.id });
    await p.mouse.click(pareja.x, pareja.y);
    await p.waitForFunction(() => window.juego.escena.encontradas === 1, null, { timeout: 3000 });

    const despues = await p.evaluate(() => window.juego.escena);
    assert.equal(despues.cartas[primera.id].estado, 'encontrada');
    assert.equal(despues.cartas[pareja.id].estado, 'encontrada');
    assert.equal(despues.fallos, 0);
    assert.equal(despues.terminada, false);
  } finally {
    await b.close();
  }
});

test('parejas: fallar un par no quita progreso y la ayuda alarga el tiempo visible', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="parejas"][data-parejas="4"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    const cartas = await p.evaluate(() => window.juego.escena.cartas);
    const a = cartas[0];
    const b1 = cartas.find((c) => c.pareja !== a.pareja);
    const c = cartas.find((x) => x.pareja !== a.pareja && x.pareja !== b1.pareja);

    await p.mouse.click(a.x, a.y);
    await p.mouse.click(b1.x, b1.y);
    await p.waitForFunction(() => window.juego.escena.fallos === 1, null, { timeout: 3000 });
    let e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.bloqueada, true, 'el par fallido se queda a la vista un momento');
    assert.equal(e.encontradas, 0, 'fallar no da ni quita progreso');
    assert.equal(e.tiempoVisibleMs, 1500);

    await p.waitForFunction(() => window.juego.escena.bloqueada === false, null, { timeout: 5000 });
    e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.cartas[a.id].estado, 'oculta', 'las cartas se vuelven a esconder');

    // Segundo fallo seguido: sube la ayuda y el próximo par se ve más tiempo.
    await p.waitForTimeout(200);
    const d = cartas.find((x) => x.pareja !== c.pareja && x.pareja !== a.pareja);
    await p.mouse.click(c.x, c.y);
    await p.mouse.click(d.x, d.y);
    await p.waitForFunction(() => window.juego.escena.fallos === 2, null, { timeout: 3000 });
    e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.ayuda.nivel, 1);
    assert.ok(e.tiempoVisibleMs > 1500, `la ayuda alarga el tiempo visible (${e.tiempoVisibleMs} ms)`);
    assert.equal(e.encontradas, 0);
  } finally {
    await b.close();
  }
});

test('parejas: un acierto que baja la ayuda recalcula el tiempo visible en la misma partida', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="parejas"][data-parejas="6"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
    const cartas = await p.evaluate(() => window.juego.escena.cartas);

    // Dos fallos seguidos suben la ayuda y alargan el tiempo visible.
    const a = cartas[0];
    const b1 = cartas.find((c) => c.pareja !== a.pareja);
    await p.mouse.click(a.x, a.y);
    await p.mouse.click(b1.x, b1.y);
    await p.waitForFunction(() => window.juego.escena.fallos === 1, null, { timeout: 3000 });
    await p.waitForFunction(() => window.juego.escena.bloqueada === false, null, { timeout: 5000 });
    await p.waitForTimeout(200);
    const c = cartas.find((x) => x.pareja !== a.pareja && x.pareja !== b1.pareja);
    const d = cartas.find((x) => x.pareja !== a.pareja && x.pareja !== b1.pareja && x.pareja !== c.pareja);
    await p.mouse.click(c.x, c.y);
    await p.mouse.click(d.x, d.y);
    await p.waitForFunction(() => window.juego.escena.fallos === 2, null, { timeout: 3000 });
    await p.waitForFunction(() => window.juego.escena.bloqueada === false, null, { timeout: 5000 });

    let e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.ayuda.nivel, 1);
    assert.ok(e.tiempoVisibleMs > 1500, 'el fallo alargó el tiempo visible');

    // Cuatro aciertos seguidos bajan la ayuda: el tiempo se recalcula sin
    // esperar a otro fallo.
    for (let n = 0; n < 4; n++) {
      const dos = await p.evaluate((i) => window.juego.escena.cartas.filter((x) => x.pareja === i), n);
      await p.mouse.click(dos[0].x, dos[0].y);
      await p.mouse.click(dos[1].x, dos[1].y);
      await p.waitForFunction(({ i }) => window.juego.escena.encontradas === i, { i: n + 1 }, { timeout: 3000 });
    }
    e = await p.evaluate(() => window.juego.escena);
    assert.equal(e.ayuda.nivel, 0, 'cuatro aciertos seguidos bajan la ayuda');
    assert.equal(e.tiempoVisibleMs, 1500, 'el tiempo visible vuelve al valor del nivel 0');
  } finally {
    await b.close();
  }
});

test('parejas: al encontrar todas las parejas termina y vuelve al menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1400, height: 900 } });
    await p.goto(URL_BASE());
    await p.click('[data-juego="parejas"][data-parejas="4"]');
    await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });

    for (let pareja = 0; pareja < 4; pareja++) {
      const dos = await p.evaluate((n) => window.juego.escena.cartas.filter((c) => c.pareja === n), pareja);
      await p.mouse.click(dos[0].x, dos[0].y);
      await p.mouse.click(dos[1].x, dos[1].y);
      await p.waitForFunction(({ n }) => window.juego.escena.encontradas === n, { n: pareja + 1 }, { timeout: 3000 });
    }
    assert.equal(await p.evaluate(() => window.juego.escena.terminada), true);
    await p.waitForFunction(() => window.juego?.vista === 'menu', null, { timeout: 10000 });
  } finally {
    await b.close();
  }
});

test('parejas está disponible en los cuatro mundos desde el menú', async () => {
  const b = await chromium.launch();
  try {
    const p = await b.newPage({ viewport: { width: 1200, height: 800 } });
    await p.goto(URL_BASE());
    for (const id of ['navidad', 'animalitos', 'futbol', 'amarillo']) {
      await p.click(`[data-mundo="${id}"]`);
      await p.click('[data-juego="parejas"][data-parejas="8"]');
      await p.waitForFunction(() => window.juego?.escena?.lista === true, null, { timeout: 8000 });
      const e = await p.evaluate(() => window.juego.escena);
      assert.equal(e.mundo, id, `${id}: usa el mundo elegido`);
      assert.equal(e.parejas, 8);
      assert.equal(e.cartas.length, 16);
      await p.click('[data-accion="otro-juego"]');
      await p.waitForSelector('[data-mundo]');
    }
  } finally {
    await b.close();
  }
});
