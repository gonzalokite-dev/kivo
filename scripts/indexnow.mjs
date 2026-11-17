/**
 * Avisa a IndexNow (Bing, Yandex, Seznam, Naver…) de las URLs de la web para
 * que las rastreen en minutos en vez de días.
 *
 * Se lanza DESPUÉS de desplegar, contra la web en producción:
 *
 *   npm run indexnow                                   # todas las URLs del sitemap
 *   npm run indexnow -- /guias/plazo-transferencia-coche/ /vender-coche/
 *
 * La clave es pública por diseño: está en `public/<clave>.txt` y Bing la
 * descarga para comprobar que el aviso viene del dueño del dominio.
 */
import { SITE_URL, INDEXNOW_KEY } from '../site.config.mjs';

const host = new URL(SITE_URL).host;
const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

/** Lee un sitemap (índice o normal) y devuelve todas sus <loc>. */
async function urlsDelSitemap(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} respondió ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
  if (xml.includes('<sitemapindex')) {
    const hijas = await Promise.all(locs.map(urlsDelSitemap));
    return hijas.flat();
  }
  return locs;
}

/** Sale con error sin process.exit() (en Windows aborta si hay un fetch abierto). */
function fallar(msg) {
  console.error(msg);
  process.exitCode = 1;
}

async function main() {
  // 1. La clave tiene que estar publicada, o IndexNow rechaza el aviso (403).
  const clave = await fetch(keyLocation);
  const textoClave = clave.ok ? (await clave.text()).trim() : '';
  if (textoClave !== INDEXNOW_KEY) {
    return fallar(`La clave no está publicada en ${keyLocation}. ¿Está desplegado?`);
  }

  // 2. URLs: las pasadas como argumento o todas las del sitemap.
  const args = process.argv.slice(2);
  const urlList = args.length
    ? args.map((a) => new URL(a, SITE_URL).href)
    : await urlsDelSitemap(`${SITE_URL}/sitemap-index.xml`);

  if (!urlList.length) {
    return fallar('No hay URLs que enviar.');
  }

  // 3. Aviso. El endpoint común reparte a todos los buscadores adheridos.
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList }),
  });

  if (res.status === 200 || res.status === 202) {
    console.log(`IndexNow: ${urlList.length} URL(s) enviadas (HTTP ${res.status}).`);
  } else {
    return fallar(`IndexNow respondió ${res.status}: ${await res.text()}`);
  }
}

await main();
