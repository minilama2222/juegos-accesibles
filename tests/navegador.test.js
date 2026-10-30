import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORTA = 8199;
let servidor;

test.before(async () => {
  servidor = spawn('python3', ['-m', 'http.server', String(PORTA), '--bind', '127.0.0.1'], {
    cwd: new URL('..', import.meta.url).pathname,
    stdio: 'ignore',
  });
  await esperar(`http://127.0.0.1:${PORTA}/`);
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

const URL_BASE = () => `http://127.0.0.1:${PORTA}/`;

test('el menú muestra los cuatro mundos y los juegos sin texto visible', async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1600, height: 900 } });
  await p.goto(URL_BASE());
  const mundos = await p.$$eval('[data-mundo]', (n) => n.map((x) => x.dataset.mundo));
  assert.deepEqual(mundos, ['navidad', 'animalitos', 'futbol', 'amarillo']);
  const juegos = await p.$$eval('[data-juego]', (n) => n.map((x) => x.dataset.juego));
  assert.deepEqual(juegos, ['hover'], 'sólo se ofrecen mecánicas implementadas');
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
