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
  const iconos = await p.$$eval('[data-mundo] img', (n) => n.map((x) => x.getAttribute('src')));
  assert.deepEqual(
    iconos,
    [
      'assets/arasaac/regalo-25381.png',
      'assets/arasaac/gato-7114.png',
      'assets/arasaac/balon-2269.png',
      'assets/arasaac/carita-13354.png',
    ],
    'el selector de mundo usa los mismos pictogramas que las bolas',
  );
  const juegos = await p.$$eval('[data-juego]', (n) => n.map((x) => x.dataset.juego));
  assert.deepEqual(
    juegos,
    ['causaEfecto', 'hover'],
    'sólo se ofrecen mecánicas implementadas y de más fácil a más difícil',
  );
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
    pedidas.some((u) => u.endsWith('/assets/arasaac/balon-2269.png')),
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
