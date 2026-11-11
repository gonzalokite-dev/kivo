/**
 * Convierte public/og-kivo.svg a public/og-kivo.png (1200x630) con una
 * captura de pantalla de Chrome headless. WhatsApp, X y LinkedIn no leen
 * SVG en las vistas previas, así que hace falta el PNG.
 *
 * No añade ninguna dependencia: reutiliza el mismo patrón CDP que
 * check-mobile.mjs y check-lighthouse.mjs.
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const NAVEGADORES = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];

const navegador = NAVEGADORES.find((p) => existsSync(p));
if (!navegador) {
  console.log('No hay Chrome ni Edge instalados; no se puede generar el PNG.');
  process.exit(0);
}

const PUERTO = 9501;
const perfil = mkdtempSync(join(tmpdir(), 'kivo-og-'));
const proc = spawn(
  navegador,
  [
    '--headless=new',
    `--remote-debugging-port=${PUERTO}`,
    `--user-data-dir=${perfil}`,
    '--no-first-run',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    'about:blank',
  ],
  { stdio: 'ignore' }
);

for (let i = 0; i < 80; i++) {
  try {
    await fetch(`http://127.0.0.1:${PUERTO}/json/version`);
    break;
  } catch {
    await new Promise((r) => setTimeout(r, 250));
  }
}

const lista = await (await fetch(`http://127.0.0.1:${PUERTO}/json/list`)).json();
const pagina = lista.find((p) => p.type === 'page');
const ws = new WebSocket(pagina.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));

let id = 0;
const pendientes = new Map();
ws.addEventListener('message', (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pendientes.has(m.id)) {
    pendientes.get(m.id)(m.result);
    pendientes.delete(m.id);
  }
});
const enviar = (method, params = {}) => {
  const i = ++id;
  ws.send(JSON.stringify({ id: i, method, params }));
  return new Promise((r) => pendientes.set(i, r));
};

const svg = readFileSync('public/og-kivo.svg', 'utf8');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0}</style></head><body>${svg}</body></html>`;
const dataUrl = 'data:text/html;base64,' + Buffer.from(html).toString('base64');

await enviar('Page.enable');
await enviar('Emulation.setDeviceMetricsOverride', { width: 1200, height: 630, deviceScaleFactor: 1, mobile: false });
await enviar('Page.navigate', { url: dataUrl });
await new Promise((r) => setTimeout(r, 400));
const shot = await enviar('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 } });

writeFileSync('public/og-kivo.png', Buffer.from(shot.data, 'base64'));
console.log('Generado public/og-kivo.png');

ws.close();
proc.kill();
try { rmSync(perfil, { recursive: true, force: true }); } catch {}
