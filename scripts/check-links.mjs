/**
 * Recorre `dist/` y falla si hay enlaces internos rotos o anclas inexistentes.
 *
 * Comprueba también los recursos locales (`src` y `href` de hojas de estilo,
 * imágenes y fuentes) y avisa de las páginas que quedan a más de dos clics de
 * la portada, que es el límite de profundidad que nos hemos puesto.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';

const DIST = 'dist';
const errores = [];
const avisos = [];

if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta primero `npm run build`.');
  process.exit(1);
}

/** Todas las páginas HTML, con su URL pública. */
function paginas(dir = DIST, base = '') {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...paginas(p, `${base}/${e.name}`));
    else if (e.name === 'index.html') out.push({ file: p, url: `${base}/` });
    else if (e.name.endsWith('.html')) out.push({ file: p, url: `${base}/${e.name}` });
  }
  return out;
}

const docs = paginas();
const porUrl = new Map(docs.map((d) => [d.url, d]));

/** Los id y los name de ancla que ofrece cada página. */
const anclas = new Map();
for (const d of docs) {
  const html = readFileSync(d.file, 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(/\sid="([^"]+)"/g)) ids.add(m[1]);
  for (const m of html.matchAll(/<a[^>]+name="([^"]+)"/g)) ids.add(m[1]);
  anclas.set(d.url, ids);
}

/** ¿Existe este recurso estático en dist? */
function existeRecurso(ruta) {
  const limpio = decodeURIComponent(ruta.split('?')[0].split('#')[0]);
  const p = join(DIST, limpio);
  return existsSync(p) && statSync(p).isFile();
}

/** Resuelve una ruta interna a la URL de página que le corresponde. */
function normaliza(href) {
  const [ruta, ancla] = href.split('#');
  return { ruta: ruta || '', ancla: ancla ?? null };
}

const grafo = new Map();

for (const d of docs) {
  const html = readFileSync(d.file, 'utf8');
  const vecinos = new Set();

  // --- enlaces ---
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]*)"/g)) {
    const href = m[1];
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:'))
      continue;

    const { ruta, ancla } = normaliza(href);

    // Ancla en la propia página.
    if (ruta === '') {
      if (ancla && !anclas.get(d.url).has(ancla))
        errores.push(`${d.url} → #${ancla} (ancla inexistente en la propia página)`);
      continue;
    }

    if (!ruta.startsWith('/')) {
      errores.push(`${d.url} → ${href} (ruta relativa: usa rutas absolutas)`);
      continue;
    }

    // Recurso estático (robots.txt, sitemap, favicon, imagen…).
    if (/\.[a-z0-9]{2,5}$/i.test(ruta) && !ruta.endsWith('.html')) {
      if (!existeRecurso(ruta)) errores.push(`${d.url} → ${href} (recurso inexistente)`);
      continue;
    }

    if (!ruta.endsWith('/')) {
      errores.push(`${d.url} → ${href} (falta la barra final)`);
      continue;
    }

    const destino = porUrl.get(ruta);
    if (!destino) {
      errores.push(`${d.url} → ${href} (página inexistente)`);
      continue;
    }

    if (ancla && !anclas.get(ruta).has(ancla))
      errores.push(`${d.url} → ${href} (la página existe, el ancla #${ancla} no)`);

    vecinos.add(ruta);
  }

  // --- recursos: hojas de estilo, scripts, imágenes y fuentes ---
  for (const m of html.matchAll(/<(?:link|script|img|source)\s[^>]*?(?:href|src)="([^"]*)"/g)) {
    const url = m[1];
    if (!url || url.startsWith('http') || url.startsWith('data:') || url.startsWith('#')) continue;
    if (!url.startsWith('/')) {
      errores.push(`${d.url} → ${url} (recurso con ruta relativa)`);
      continue;
    }
    if (!existeRecurso(url)) errores.push(`${d.url} → ${url} (recurso inexistente)`);
  }

  grafo.set(d.url, vecinos);
}

// --- profundidad: ninguna página a más de 2 clics de la portada -------------
const profundidad = new Map([['/', 0]]);
const cola = ['/'];
while (cola.length) {
  const actual = cola.shift();
  for (const v of grafo.get(actual) ?? []) {
    if (!profundidad.has(v)) {
      profundidad.set(v, profundidad.get(actual) + 1);
      cola.push(v);
    }
  }
}

const indexables = docs.filter((d) => {
  const html = readFileSync(d.file, 'utf8');
  return !/name="robots" content="noindex/.test(html);
});

for (const d of indexables) {
  const n = profundidad.get(d.url);
  if (n === undefined) errores.push(`${d.url}: no se llega desde la portada (página huérfana)`);
  else if (n > 2) avisos.push(`${d.url}: está a ${n} clics de la portada, el límite son 2`);
}

// --- informe ----------------------------------------------------------------
console.log(`\ncheck:links · ${docs.length} páginas\n`);

const niveles = [0, 1, 2, 3];
for (const n of niveles) {
  const lista = indexables.filter((d) => profundidad.get(d.url) === n).map((d) => d.url);
  if (lista.length) console.log(`  ${n} clic(s) desde la portada: ${lista.length} páginas`);
}

if (avisos.length) {
  console.log(`\nAvisos (${avisos.length}):`);
  avisos.forEach((a) => console.log('  · ' + a));
}

if (errores.length) {
  console.log(`\n${errores.length} enlace(s) roto(s):`);
  errores.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}

console.log('\n✓ Todos los enlaces internos y las anclas resuelven.\n');
