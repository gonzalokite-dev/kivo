/**
 * Comprueba, para cada guía de `dist/guias/`:
 *  - entre 800 y 1.200 palabras en el cuerpo;
 *  - al menos 2 enlaces salientes a dominios de la lista blanca;
 *  - al menos 3 enlaces internos, con 1 a una página comercial y 2 a guías;
 *  - una caja de respuesta corta y preguntas frecuentes;
 *  - title y meta description dentro de los límites.
 *
 * Y para todas las páginas: title, description, canónica, Open Graph,
 * un solo H1 y los datos estructurados que toquen.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

const LIMITES = {
  palabrasMin: 800,
  palabrasMax: 1200,
  titleMin: 30,
  titleMax: 70,
  descMin: 140,
  descMax: 155,
  salientesMin: 2,
  internosMin: 3,
};

const DOMINIOS_OFICIALES = [
  'sede.dgt.gob.es',
  'www.dgt.es',
  'www.boe.es',
  'www3.agenciatributaria.gob.es',
  'sede.agenciatributaria.gob.es',
  'www.consejogestores.org',
  'www.race.es',
  'clave.gob.es',
];

/** Webs propias: el despacho que hay detrás de Kivo. Se permite enlazarlas
 *  (sin nofollow), pero no cuentan como fuente oficial. Una por guía como mucho. */
const DOMINIOS_PROPIOS = ['benavidesasociados.com'];

const COMERCIALES = [
  '/',
  '/calcular-transferencia-coche/',
  '/documentacion-transferencia-coche/',
  '/transferencia-moto/',
  '/vender-coche/',
  '/gestoria-transferencia-coche/',
  '/transferencia-coche-andalucia/',
  '/transferencia-coche-madrid/',
  '/transferencia-coche-canarias/',
];

const errores = [];
const avisos = [];
const filas = [];

const err = (pagina, msg) => errores.push(`${pagina}: ${msg}`);
const avi = (pagina, msg) => avisos.push(`${pagina}: ${msg}`);

/** Texto visible de un fragmento de HTML. */
function texto(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const palabras = (s) => (s ? s.split(/\s+/).filter(Boolean).length : 0);

const meta = (html, re) => {
  const m = html.match(re);
  return m ? m[1] : null;
};

/** Todas las páginas HTML de dist, con su ruta pública. */
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

if (!existsSync(DIST)) {
  console.error('No existe dist/. Ejecuta primero `npm run build`.');
  process.exit(1);
}

const todas = paginas();

// --- comprobaciones comunes a todas las páginas -----------------------------
for (const { file, url } of todas) {
  const html = readFileSync(file, 'utf8');
  const nombre = url;

  const title = meta(html, /<title>([\s\S]*?)<\/title>/);
  const desc = meta(html, /<meta name="description" content="([^"]*)"/);
  const canon = meta(html, /<link rel="canonical" href="([^"]*)"/);
  const noindex = /name="robots" content="noindex/.test(html);
  const h1 = (html.match(/<h1[\s>]/g) || []).length;

  if (!title) err(nombre, 'sin <title>');
  if (!desc) err(nombre, 'sin meta description');
  if (!canon) err(nombre, 'sin canónica');
  if (canon && !canon.startsWith('https://')) err(nombre, 'canónica no absoluta');
  if (h1 !== 1) err(nombre, `tiene ${h1} H1 y debe tener exactamente 1`);

  if (!/property="og:title"/.test(html)) err(nombre, 'sin Open Graph');
  if (!/name="twitter:card"/.test(html)) err(nombre, 'sin Twitter Card');
  // /en/ es la versión en inglés; el resto, en español.
  const idioma = url.startsWith('/en/') ? 'en' : 'es';
  if (!new RegExp(`<html lang="${idioma}"`).test(html)) err(nombre, `sin lang="${idioma}"`);

  if (title) {
    const n = title.length;
    // En las páginas noindex (legales en borrador y 404) solo vigilamos el máximo.
    const min = noindex ? 1 : LIMITES.titleMin;
    if (n < min || n > LIMITES.titleMax)
      err(nombre, `title de ${n} caracteres, fuera de ${min}–${LIMITES.titleMax}`);
  }
  if (desc) {
    const n = desc.length;
    if (n < LIMITES.descMin || n > LIMITES.descMax)
      err(nombre, `meta description de ${n} caracteres, fuera de ${LIMITES.descMin}–${LIMITES.descMax}`);
  }

  // BreadcrumbList en todas menos la portada (y menos el 404).
  // /en/ es la portada en inglés: como la portada, sin migas de pan.
  const esPortada = url === '/' || url === '/en/';
  const es404 = url === '/404.html';
  const esPrecio = url === '/calcular-transferencia-coche/';
  // El @type de Organization puede ir solo o en array (["Organization","ProfessionalService"]).
  const tieneTipo = (tipo) => new RegExp(`"@type":(?:"${tipo}"|\\[[^\\]]*"${tipo}"[^\\]]*\\])`).test(html);
  if (!esPortada && !es404 && !tieneTipo('BreadcrumbList'))
    err(nombre, 'sin JSON-LD de BreadcrumbList');
  if (esPortada) {
    if (!tieneTipo('Organization')) err(nombre, 'sin JSON-LD de Organization');
    if (!tieneTipo('Service')) err(nombre, 'sin JSON-LD de Service');
    if (!/"price":"89"/.test(html)) err(nombre, 'la Offer no declara 89 EUR');
  }
  if (esPrecio) {
    if (!tieneTipo('Service')) err(nombre, 'la página de precio no tiene JSON-LD de Service con la Offer');
    if (!/"price":"89"/.test(html)) err(nombre, 'la Offer de la página de precio no declara 89 EUR');
  }
  // Si hay <details> de preguntas, tiene que haber FAQPage.
  const tieneFaq = /<section class="gfaq"|class="wrap faq"/.test(html);
  if (tieneFaq && !/"@type":"FAQPage"/.test(html)) err(nombre, 'tiene preguntas pero no FAQPage');

  if (noindex && !url.match(/aviso-legal|privacidad|cookies|404/))
    avi(nombre, 'tiene noindex y no es legal ni 404');
}

// --- comprobaciones de las guías -------------------------------------------
const guias = todas.filter((p) => p.url.startsWith('/guias/') && p.url !== '/guias/');

if (guias.length === 0) err('/guias/', 'no se ha generado ninguna guía');

for (const { file, url } of guias) {
  const html = readFileSync(file, 'utf8');

  const cuerpo = html.match(/<div class="prose guide-body">([\s\S]*?)<\/div>\s*<section class="gfaq"/);
  if (!cuerpo) {
    err(url, 'no se encuentra el cuerpo .guide-body');
    continue;
  }
  const htmlCuerpo = cuerpo[1];
  const n = palabras(texto(htmlCuerpo));

  if (n < LIMITES.palabrasMin || n > LIMITES.palabrasMax)
    err(url, `${n} palabras, fuera de ${LIMITES.palabrasMin}–${LIMITES.palabrasMax}`);

  // Enlaces del cuerpo: los salientes y los internos se cuentan aquí,
  // no en la cabecera ni en el bloque de fuentes.
  const hrefs = [...htmlCuerpo.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);

  const salientes = hrefs.filter((h) => h.startsWith('http'));
  const oficiales = salientes.filter((h) => DOMINIOS_OFICIALES.some((d) => h.includes(`//${d}/`)));
  const propios = salientes.filter((h) => DOMINIOS_PROPIOS.some((d) => h.includes(`//${d}/`)));
  const ajenos = salientes.filter(
    (h) => !DOMINIOS_OFICIALES.some((d) => h.includes(`//${d}/`)) && !propios.includes(h)
  );
  if (propios.length > 1) err(url, `${propios.length} enlaces a webs propias, máximo 1 por guía`);

  if (oficiales.length < LIMITES.salientesMin)
    err(url, `${oficiales.length} enlaces salientes oficiales en el texto, mínimo ${LIMITES.salientesMin}`);
  if (ajenos.length) err(url, `enlaces salientes fuera de la lista blanca: ${ajenos.join(', ')}`);

  // Los salientes tienen que abrir en pestaña nueva y sin nofollow.
  for (const m of htmlCuerpo.matchAll(/<a\s[^>]*href="(https?:[^"]+)"[^>]*>/g)) {
    const tag = m[0];
    if (!/target="_blank"/.test(tag)) err(url, `enlace saliente sin target="_blank": ${m[1]}`);
    if (!/rel="[^"]*noopener/.test(tag)) err(url, `enlace saliente sin rel="noopener": ${m[1]}`);
    if (/nofollow/.test(tag)) err(url, `enlace saliente con nofollow: ${m[1]}`);
  }

  const internos = hrefs.filter((h) => h.startsWith('/'));
  if (internos.length < LIMITES.internosMin)
    err(url, `${internos.length} enlaces internos en el texto, mínimo ${LIMITES.internosMin}`);

  const aComercial = internos.filter((h) => COMERCIALES.includes(h.split('#')[0] || '/'));
  const aGuias = internos.filter((h) => h.startsWith('/guias/'));
  if (aComercial.length < 1) err(url, 'ningún enlace a una página comercial en el texto');
  if (aGuias.length < 2) err(url, `${aGuias.length} enlaces a otras guías en el texto, mínimo 2`);

  // Estructura obligatoria de la plantilla.
  if (!/<div class="short">/.test(html)) err(url, 'sin caja de respuesta corta');
  // Solo las preguntas: <details><summary>. El menú de móvil también es un
  // <details>, pero lleva clase y no cuenta.
  const detalles = (html.match(/<details><summary/g) || []).length;
  if (detalles < 4) err(url, `${detalles} preguntas frecuentes, mínimo 4`);
  if (detalles > 5) err(url, `${detalles} preguntas frecuentes, máximo 5`);
  if (!/"@type":"Article"/.test(html)) err(url, 'sin JSON-LD de Article');
  if (!/<section class="sources">/.test(html)) err(url, 'sin bloque de fuentes oficiales');
  if (!/class="cta-box"/.test(html)) err(url, 'sin caja de llamada a la acción a mitad del texto');
  if (!/<aside class="toc"/.test(html)) err(url, 'sin índice de contenidos');

  const title = meta(html, /<title>([\s\S]*?)<\/title>/) ?? '';
  filas.push({
    url,
    palabras: n,
    salientes: oficiales.length,
    internos: internos.length,
    faqs: detalles,
    title: title.length,
  });
}

// --- informe ----------------------------------------------------------------
console.log(`\ncheck:content · ${todas.length} páginas, ${guias.length} guías\n`);

if (filas.length) {
  const cab = ['Guía', 'Palabras', 'Salientes', 'Internos', 'FAQ', 'Title'];
  const anchos = [52, 9, 10, 9, 4, 6];
  console.log(cab.map((c, i) => c.padEnd(anchos[i])).join(''));
  console.log('-'.repeat(anchos.reduce((a, b) => a + b, 0)));
  for (const f of filas.sort((a, b) => a.url.localeCompare(b.url))) {
    console.log(
      [
        f.url.replace('/guias/', '').replace(/\/$/, ''),
        String(f.palabras),
        String(f.salientes),
        String(f.internos),
        String(f.faqs),
        String(f.title),
      ]
        .map((c, i) => c.padEnd(anchos[i]))
        .join('')
    );
  }
}

if (avisos.length) {
  console.log(`\nAvisos (${avisos.length}):`);
  avisos.forEach((a) => console.log('  · ' + a));
}

if (errores.length) {
  console.log(`\n${errores.length} error(es):`);
  errores.forEach((e) => console.log('  ✗ ' + e));
  process.exit(1);
}

console.log('\n✓ Contenido correcto.\n');
