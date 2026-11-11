/**
 * Comprueba en un navegador de verdad, a 390 px de ancho, que:
 *  - ninguna página tiene scroll horizontal;
 *  - la calculadora da 384,70 € con un coche de 6.000 €, 8 años y Madrid;
 *  - los botones de la tabla del ITP ponen la comunidad en la calculadora;
 *  - el formulario valida matrícula, móvil, email y casilla de privacidad,
 *    y llega a la pantalla de éxito.
 *
 * Usa Chrome o Edge por CDP con el WebSocket nativo de Node: ni Playwright
 * ni Puppeteer, cero dependencias nuevas.
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname } from 'node:path';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const DIST = 'dist';
const PUERTO = 4319;
const ANCHO = 390;

const NAVEGADORES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

const errores = [];

// --- servidor estático -----------------------------------------------------
function servidor() {
  return new Promise((res) => {
    const s = createServer(async (req, rep) => {
      let ruta = decodeURIComponent(req.url.split('?')[0]);
      let f = join(DIST, ruta);
      try {
        if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
      } catch {
        f = join(DIST, '404.html');
      }
      try {
        const buf = await readFile(f);
        rep.writeHead(200, { 'Content-Type': TIPOS[extname(f)] ?? 'application/octet-stream' });
        rep.end(buf);
      } catch {
        rep.writeHead(404).end('no');
      }
    });
    s.listen(PUERTO, () => res(s));
  });
}

// --- CDP mínimo ------------------------------------------------------------
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pend = new Map();
    ws.addEventListener('message', (e) => {
      const m = JSON.parse(e.data);
      if (m.id && this.pend.has(m.id)) {
        const { ok, ko } = this.pend.get(m.id);
        this.pend.delete(m.id);
        m.error ? ko(new Error(JSON.stringify(m.error))) : ok(m.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((ok, ko) => this.pend.set(id, { ok, ko }));
  }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' :: ' + expression);
    return r.result.value;
  }
  /** Navega y espera a que el DOM esté listo y el JS haya corrido. */
  async goto(url) {
    await this.send('Page.navigate', { url });
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const listo = await this.eval(
        `document.readyState === 'complete' && location.href.includes(${JSON.stringify(new URL(url).pathname)})`
      ).catch(() => false);
      if (listo) {
        await new Promise((r) => setTimeout(r, 150));
        return;
      }
    }
    throw new Error('No ha cargado: ' + url);
  }
}

async function esperaWs(intentos = 60) {
  for (let i = 0; i < intentos; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:9333/json/list`);
      const l = await r.json();
      const p = l.find((x) => x.type === 'page');
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('El navegador no ha abierto el puerto de depuración');
}

// --- rutas a comprobar -----------------------------------------------------
const RUTAS = [
  '/',
  '/precio-traspaso-coche/',
  '/documentacion-traspaso-coche/',
  '/traspaso-moto/',
  '/vender-coche/',
  '/guias/',
  '/en/',
  '/fuentes-y-datos/',
  '/guias/como-hacer-traspaso-coche/',
  '/guias/quien-paga-traspaso-coche/',
  '/guias/plazo-traspaso-coche/',
  '/guias/traspaso-coche-sin-certificado-digital/',
  '/guias/traspaso-coche-entre-familiares/',
  '/guias/traspaso-coche-herencia/',
  '/guias/traspaso-coche-reserva-de-dominio/',
  '/guias/notificacion-de-venta-dgt/',
  '/guias/valor-fiscal-coche-hacienda/',
  '/guias/tasa-dgt-transferencia/',
  '/aviso-legal/',
  '/privacidad/',
  '/cookies/',
  '/404.html',
];

const navegador = NAVEGADORES.find((p) => existsSync(p));
if (!navegador) {
  console.log('\ncheck:mobile · no hay Chrome ni Edge instalados, se omite.\n');
  process.exit(0);
}
if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta primero `npm run build`.');
  process.exit(1);
}

const srv = await servidor();
const perfil = mkdtempSync(join(tmpdir(), 'kivo-cdp-'));
const proc = spawn(
  navegador,
  [
    '--headless=new',
    '--remote-debugging-port=9333',
    `--user-data-dir=${perfil}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-gpu',
    `--window-size=${ANCHO},844`,
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const limpiar = () => {
  try { proc.kill(); } catch {}
  try { srv.close(); } catch {}
  try { rmSync(perfil, { recursive: true, force: true }); } catch {}
};
process.on('exit', limpiar);

try {
  const wsUrl = await esperaWs();
  const ws = new WebSocket(wsUrl);
  await new Promise((ok, ko) => {
    ws.addEventListener('open', ok);
    ws.addEventListener('error', ko);
  });
  const cdp = new Cdp(ws);
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: ANCHO,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  // --- 1) scroll horizontal -----------------------------------------------
  console.log(`\ncheck:mobile · ${ANCHO} px de ancho, ${RUTAS.length} páginas\n`);
  const filas = [];
  for (const ruta of RUTAS) {
    await cdp.goto(`http://127.0.0.1:${PUERTO}${ruta}`);
    const r = await cdp.eval(`(() => {
      const d = document.documentElement;
      const desbordan = [];
      for (const el of document.querySelectorAll('body *')) {
        const c = getComputedStyle(el);
        if (c.position === 'fixed' || c.display === 'none' || c.visibility === 'hidden') continue;
        const b = el.getBoundingClientRect();
        if (b.width === 0) continue;
        if (b.right > d.clientWidth + 1.5) {
          // ¿Lo contiene algún antecesor con scroll propio?
          let p = el.parentElement, contenido = false;
          while (p && p !== document.body) {
            const pc = getComputedStyle(p);
            if (pc.overflowX === 'auto' || pc.overflowX === 'scroll' || pc.overflowX === 'hidden') { contenido = true; break; }
            p = p.parentElement;
          }
          if (!contenido) {
            const cadena = [];
            let q = el;
            while (q && q !== document.body) {
              const qb = q.getBoundingClientRect();
              cadena.push(q.tagName.toLowerCase() + (q.className ? '.' + q.className.toString().trim().split(/s+/).join('.') : '') + '[w=' + Math.round(qb.width) + ',x=' + Math.round(qb.left) + ']');
              q = q.parentElement;
            }
            desbordan.push('«' + (el.textContent || '').trim().slice(0, 24) + '» ' + cadena.reverse().join(' > '));
          }
        }
      }
      return { scrollW: d.scrollWidth, clientW: d.clientWidth, desbordan: desbordan.slice(0, 4) };
    })()`);

    const ok = r.scrollW <= r.clientW + 1;
    filas.push({ ruta, scrollW: r.scrollW, clientW: r.clientW, ok });
    if (!ok)
      errores.push(
        `${ruta}: scroll horizontal (scrollWidth ${r.scrollW} > ${r.clientW}). Culpables: ${r.desbordan.join(' | ') || 'sin identificar'}`
      );
  }

  const anchoCol = Math.max(...filas.map((f) => f.ruta.length)) + 2;
  for (const f of filas)
    console.log(`  ${f.ok ? 'ok ' : 'NO '} ${f.ruta.padEnd(anchoCol)} scrollWidth ${f.scrollW}`);

  // --- 2) la calculadora ---------------------------------------------------
  console.log('\n  Calculadora');
  await cdp.goto(`http://127.0.0.1:${PUERTO}/`);

  const total = await cdp.eval(`(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change', {bubbles:true})); };
    const precio = document.getElementById('precio-compra');
    precio.value = '6000';
    precio.dispatchEvent(new Event('input', {bubbles:true}));
    set('ccaa', 'MAD');
    set('edad', '8');
    return {
      total: document.getElementById('total').textContent.trim(),
      itp: document.getElementById('itp').textContent.trim(),
      tasa: document.getElementById('tasa').textContent.trim(),
    };
  })()`);
  console.log(`    6.000 € · 8 años · Madrid → ${total.total} (ITP ${total.itp} + tasa ${total.tasa} + 89,00 €)`);
  if (total.total !== '384,70 €')
    errores.push(`La calculadora da ${total.total} y debería dar 384,70 €`);

  // Exención de Cataluña a los 10 años.
  const cat = await cdp.eval(`(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change', {bubbles:true})); };
    set('ccaa','CAT'); set('edad','10');
    return { itp: document.getElementById('itp').textContent.trim(), total: document.getElementById('total').textContent.trim() };
  })()`);
  console.log(`    Cataluña · 10 años → ITP ${cat.itp}, total ${cat.total}`);
  if (cat.itp !== '0,00 €') errores.push(`Cataluña a 10 años debería estar exenta y da ${cat.itp}`);

  // Ciclomotor en Illes Balears: exento y tasa reducida.
  const ciclo = await cdp.eval(`(() => {
    const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change', {bubbles:true})); };
    document.getElementById('veh-ciclo').checked = true;
    document.getElementById('veh-ciclo').dispatchEvent(new Event('change', {bubbles:true}));
    set('ccaa','BAL'); set('edad','6');
    return { itp: document.getElementById('itp').textContent.trim(), tasa: document.getElementById('tasa').textContent.trim(), total: document.getElementById('total').textContent.trim() };
  })()`);
  console.log(`    Ciclomotor · Illes Balears → ITP ${ciclo.itp}, tasa ${ciclo.tasa}, total ${ciclo.total}`);
  if (ciclo.tasa !== '27,85 €') errores.push(`La tasa del ciclomotor debería ser 27,85 € y da ${ciclo.tasa}`);
  if (ciclo.itp !== '0,00 €') errores.push(`El ciclomotor en Illes Balears debería estar exento y da ${ciclo.itp}`);

  // --- 3) los botones de la tabla del ITP ---------------------------------
  console.log('\n  Tabla del ITP → calculadora');
  await cdp.goto(`http://127.0.0.1:${PUERTO}/precio-traspaso-coche/`);
  const tabla = await cdp.eval(`(() => {
    const b = document.querySelector('[data-ccaa="GAL"]');
    if (!b) return { error: 'no hay botón para Galicia' };
    b.click();
    const sel = document.getElementById('ccaa');
    return { ccaa: sel.value, texto: sel.options[sel.selectedIndex].textContent, nota: document.getElementById('itpNote').textContent.slice(0,40) };
  })()`);
  console.log(`    Clic en «Calcular» de Galicia → selector = ${tabla.ccaa} (${tabla.texto})`);
  if (tabla.ccaa !== 'GAL') errores.push(`El botón de Galicia no pone la comunidad: ${JSON.stringify(tabla)}`);

  // --- 4) el formulario ----------------------------------------------------
  console.log('\n  Formulario de solicitud');
  await cdp.goto(`http://127.0.0.1:${PUERTO}/`);

  const casos = [
    { nombre: 'matrícula mal', m: 'XXXX', n: 'Javi', t: '600000000', e: 'a@b.es', rgpd: true, espera: 'matrícula' },
    { nombre: 'sin nombre', m: '1234 MBC', n: '', t: '600000000', e: 'a@b.es', rgpd: true, espera: 'nombre' },
    { nombre: 'móvil mal', m: '1234 MBC', n: 'Javi', t: '123', e: 'a@b.es', rgpd: true, espera: 'móvil' },
    { nombre: 'email mal', m: '1234 MBC', n: 'Javi', t: '600000000', e: 'javi@', rgpd: true, espera: 'email' },
    { nombre: 'sin privacidad', m: '1234 MBC', n: 'Javi', t: '600000000', e: 'a@b.es', rgpd: false, espera: 'privacidad' },
  ];

  for (const c of casos) {
    const r = await cdp.eval(`(async () => {
      document.getElementById('calcView').hidden || document.getElementById('go').click();
      const v = (id, val) => document.getElementById(id).value = val;
      v('matricula', ${JSON.stringify(c.m)}); v('nombre', ${JSON.stringify(c.n)});
      v('tel', ${JSON.stringify(c.t)}); v('email', ${JSON.stringify(c.e)});
      document.getElementById('rgpd').checked = ${c.rgpd};
      document.getElementById('leadView').dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
      await new Promise(r => setTimeout(r, 120));
      const box = document.getElementById('leadErr');
      return { oculto: box.hidden, texto: box.textContent, exito: !document.getElementById('doneView').hidden };
    })()`);
    const bien = !r.oculto && r.texto.toLowerCase().includes(c.espera) && !r.exito;
    console.log(`    ${bien ? 'ok ' : 'NO '} ${c.nombre.padEnd(18)} → "${r.texto}"`);
    if (!bien) errores.push(`El formulario no rechaza bien «${c.nombre}»: ${JSON.stringify(r)}`);
  }

  // Caso válido: tiene que llegar a la pantalla de éxito.
  const bueno = await cdp.eval(`(async () => {
    const avisos = [];
    const orig = console.warn; console.warn = (...a) => { avisos.push(a.join(' ')); orig(...a); };
    const v = (id, val) => document.getElementById(id).value = val;
    v('matricula','1234 MBC'); v('nombre','Javi Pérez'); v('tel','600123456'); v('email','javi@ejemplo.es');
    document.getElementById('rgpd').checked = true;
    document.getElementById('leadView').dispatchEvent(new Event('submit', {bubbles:true, cancelable:true}));
    await new Promise(r => setTimeout(r, 300));
    console.warn = orig;
    return {
      exito: !document.getElementById('doneView').hidden,
      matricula: document.getElementById('donePlate').textContent,
      nombre: document.getElementById('doneName').textContent,
      avisoSinEndpoint: avisos.some(a => a.includes('PUBLIC_FORM_ENDPOINT')),
    };
  })()`);
  console.log(
    `    ${bueno.exito ? 'ok ' : 'NO '} datos válidos      → pantalla de éxito (${bueno.matricula}, ${bueno.nombre}); aviso por consola sin endpoint: ${bueno.avisoSinEndpoint}`
  );
  if (!bueno.exito) errores.push('El formulario válido no llega a la pantalla de éxito');
  if (!bueno.avisoSinEndpoint)
    errores.push('Sin PUBLIC_FORM_ENDPOINT debería avisar por consola y no lo hace');

  // --- 5) lo añadido para móvil y conversión -----------------------------
  console.log('\n  Móvil y conversión');
  await cdp.goto(`http://127.0.0.1:${PUERTO}/`);
  const extra = await cdp.eval(`(async () => {
    const espera = (ms) => new Promise(r => setTimeout(r, ms));
    const r = {};

    // Menú de móvil: visible, se abre y enseña los enlaces.
    const menu = document.querySelector('.menu-movil');
    r.menuVisible = !!menu && getComputedStyle(menu).display !== 'none';
    menu.querySelector('summary').click();
    await espera(50);
    r.menuEnlaces = [...menu.querySelectorAll('nav a')].filter(a => a.getBoundingClientRect().height > 0).length;
    menu.open = false;

    // Botones del hero, visibles sin hacer scroll.
    const hc = document.querySelector('.hero-cta a');
    const b = hc.getBoundingClientRect();
    r.heroCta = getComputedStyle(hc.parentElement).display !== 'none' && b.bottom <= innerHeight;

    // Matrícula: «1234mbc» se queda en «1234 MBC».
    const mat = document.getElementById('h-matricula');
    mat.focus(); mat.value = '1234mbc';
    mat.setSelectionRange(7, 7);
    mat.dispatchEvent(new Event('input', { bubbles: true }));
    r.matricula = mat.value;

    // Error en el móvil: el foco va a ese campo y queda marcado.
    const v = (id, val) => document.getElementById(id).value = val;
    v('h-nombre', 'Javi'); v('h-tel', '123'); v('h-email', 'a@b.es');
    document.getElementById('h-rgpd').checked = true;
    document.getElementById('h-formView').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await espera(50);
    r.foco = document.activeElement.id;
    r.invalido = document.getElementById('h-tel').getAttribute('aria-invalid');

    // Contador del plazo: compra hace 10 días → quedan 20.
    const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - 10);
    const iso = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    const f = document.getElementById('plazo-fecha');
    f.value = iso; f.dispatchEvent(new Event('change', { bubbles: true }));
    r.plazo = document.getElementById('plazo-num').textContent;
    document.getElementById('h-msg').value = '';
    document.getElementById('plazo-cta').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    r.plazoEnForm = document.getElementById('h-msg').value;

    // Barra fija: escondida con el formulario a la vista, visible más abajo.
    document.documentElement.style.scrollBehavior = 'auto';
    document.getElementById('solicitud').scrollIntoView();
    await espera(80);
    r.stickyConForm = document.getElementById('sticky').classList.contains('show');
    document.getElementById('faq').scrollIntoView();
    await espera(80);
    r.stickyEnFaq = document.getElementById('sticky').classList.contains('show');
    r.stickyDestino = document.querySelector('#sticky a').getAttribute('href');
    return r;
  })()`);

  const pruebas = [
    ['menú de móvil visible y con enlaces', extra.menuVisible && extra.menuEnlaces >= 6, `${extra.menuEnlaces} enlaces`],
    ['botones del hero sin hacer scroll', extra.heroCta, ''],
    ['matrícula con formato', extra.matricula === '1234 MBC', extra.matricula],
    ['foco en el campo con error', extra.foco === 'h-tel' && extra.invalido === 'true', `foco en #${extra.foco}`],
    ['contador del plazo', extra.plazo === 'Te quedan 20 días', extra.plazo],
    ['la fecha pasa al formulario', extra.plazoEnForm.startsWith('Fecha de compra:'), extra.plazoEnForm],
    ['barra fija oculta sobre el formulario', !extra.stickyConForm, ''],
    ['barra fija visible más abajo, al formulario', extra.stickyEnFaq && extra.stickyDestino === '#solicitud', extra.stickyDestino],
  ];
  for (const [nombre, ok, det] of pruebas) {
    console.log(`    ${ok ? 'ok ' : 'NO '} ${nombre.padEnd(44)} ${det}`);
    if (!ok) errores.push(`Móvil y conversión: falla «${nombre}» (${det})`);
  }

  // --- 6) la versión en inglés ---------------------------------------------
  console.log('\n  Versión en inglés');
  await cdp.goto(`http://127.0.0.1:${PUERTO}/en/`);
  const en = await cdp.eval(`(async () => {
    const espera = (ms) => new Promise(r => setTimeout(r, ms));
    const v = (id, val) => document.getElementById(id).value = val;
    const enviar = () => document.getElementById('h-formView').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    v('h-matricula', '1234 MBC'); v('h-nombre', 'John Smith'); v('h-tel', '123'); v('h-email', 'john@example.com');
    document.getElementById('h-rgpd').checked = true;
    enviar(); await espera(60);
    const errTel = document.getElementById('h-leadErr').textContent;
    v('h-tel', '+44 7700 900123');
    enviar(); await espera(300);
    return {
      lang: document.documentElement.lang,
      hreflang: [...document.querySelectorAll('link[rel=alternate]')].map(l => l.hreflang).join(','),
      errTel,
      exito: !document.getElementById('h-doneView').hidden,
      gracias: document.querySelector('#h-doneView h2').textContent.trim(),
    };
  })()`);
  const pruebasEn = [
    ['lang="en" y hreflang es/en', en.lang === 'en' && en.hreflang.includes('es') && en.hreflang.includes('en'), en.hreflang],
    ['error del móvil en inglés', /mobile/i.test(en.errTel), en.errTel],
    ['acepta un móvil británico (+44)', en.exito, en.gracias],
  ];
  for (const [nombre, ok, det] of pruebasEn) {
    console.log(`    ${ok ? 'ok ' : 'NO '} ${nombre.padEnd(44)} ${det}`);
    if (!ok) errores.push(`Inglés: falla «${nombre}» (${det})`);
  }

  ws.close();
} catch (e) {
  errores.push('Fallo del navegador: ' + e.message);
}

limpiar();

if (errores.length) {
  console.log(`\n${errores.length} problema(s):`);
  errores.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log('\n✓ Sin scroll horizontal a 390 px; calculadora y formulario correctos.\n');
