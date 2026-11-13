/**
 * Lighthouse en móvil sobre `dist/`. Exige 95 o más en Rendimiento,
 * Accesibilidad, Buenas prácticas y SEO.
 *
 * Lighthouse es una dependencia de desarrollo: al cliente no le llega nada.
 * Las rutas se pueden pasar por argumento; sin argumentos, mide una muestra
 * representativa (portada, dos comerciales, el índice y dos guías).
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join, extname } from 'node:path';
import { existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import lighthouse from 'lighthouse';

const DIST = 'dist';
const PUERTO = 4320;
const PUERTO_CDP = 9355;
const MINIMO = 95;

const NAVEGADORES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

const RUTAS = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [
      '/',
      '/calcular-transferencia-coche/',
      '/documentacion-transferencia-coche/',
      '/guias/',
      '/guias/como-hacer-transferencia-coche/',
      '/guias/valor-fiscal-coche-hacienda/',
    ];

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
};

if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta primero `npm run build`.');
  process.exit(1);
}
const navegador = NAVEGADORES.find((p) => existsSync(p));
if (!navegador) {
  console.log('\ncheck:lighthouse · no hay Chrome ni Edge instalados, se omite.\n');
  process.exit(0);
}

const srv = createServer(async (req, rep) => {
  let f = join(DIST, decodeURIComponent(req.url.split('?')[0]));
  try {
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
  } catch {
    f = join(DIST, '404.html');
  }
  try {
    const buf = await readFile(f);
    rep.writeHead(200, {
      'Content-Type': TIPOS[extname(f)] ?? 'application/octet-stream',
      // Cabeceras que pondría cualquier alojamiento estático decente.
      'Cache-Control': extname(f) === '.html' ? 'no-cache' : 'public,max-age=31536000,immutable',
    });
    rep.end(buf);
  } catch {
    rep.writeHead(404).end('no');
  }
});
await new Promise((r) => srv.listen(PUERTO, r));

const perfil = mkdtempSync(join(tmpdir(), 'kivo-lh-'));
const proc = spawn(
  navegador,
  [
    '--headless=new',
    `--remote-debugging-port=${PUERTO_CDP}`,
    `--user-data-dir=${perfil}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-gpu',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

const limpiar = () => {
  try { proc.kill(); } catch {}
  try { srv.close(); } catch {}
};
process.on('exit', limpiar);

// Esperar a que el navegador abra el puerto.
for (let i = 0; i < 80; i++) {
  try {
    await fetch(`http://127.0.0.1:${PUERTO_CDP}/json/version`);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 250));
  }
}

const CATEGORIAS = {
  performance: 'Rendimiento',
  accessibility: 'Accesibilidad',
  'best-practices': 'Buenas prácticas',
  seo: 'SEO',
};

const errores = [];
const filas = [];

console.log(`\ncheck:lighthouse · móvil, mínimo ${MINIMO}, ${RUTAS.length} páginas\n`);

for (const ruta of RUTAS) {
  const r = await lighthouse(
    `http://127.0.0.1:${PUERTO}${ruta}`,
    { port: PUERTO_CDP, output: 'json', logLevel: 'silent', formFactor: 'mobile', screenEmulation: { mobile: true, width: 390, height: 844, deviceScaleFactor: 2 } },
    undefined
  );

  const notas = {};
  for (const k of Object.keys(CATEGORIAS)) {
    const c = r.lhr.categories[k];
    notas[k] = c ? Math.round(c.score * 100) : null;
    if (notas[k] !== null && notas[k] < MINIMO)
      errores.push(`${ruta}: ${CATEGORIAS[k]} ${notas[k]}, por debajo de ${MINIMO}`);
  }
  filas.push({ ruta, notas, lhr: r.lhr });
}

const ancho = Math.max(...filas.map((f) => f.ruta.length)) + 2;
console.log(
  'Página'.padEnd(ancho) + Object.values(CATEGORIAS).map((c) => c.padEnd(18)).join('')
);
console.log('-'.repeat(ancho + 72));
for (const f of filas) {
  console.log(
    f.ruta.padEnd(ancho) +
      Object.keys(CATEGORIAS)
        .map((k) => String(f.notas[k] ?? '–').padEnd(18))
        .join('')
  );
}

// Lo que haya fallado, con nombre y apellidos.
for (const f of filas) {
  const fallos = Object.values(f.lhr.audits).filter(
    (a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== 'informative' && a.scoreDisplayMode !== 'notApplicable'
  );
  if (fallos.length) {
    console.log(`\n  ${f.ruta}`);
    for (const a of fallos.slice(0, 8))
      console.log(`    · ${a.title}${a.displayValue ? ' — ' + a.displayValue : ''}`);
  }
}

limpiar();

if (errores.length) {
  console.log(`\n${errores.length} nota(s) por debajo de ${MINIMO}:`);
  errores.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}
console.log(`\n✓ Lighthouse móvil: ${MINIMO} o más en las cuatro categorías.\n`);
