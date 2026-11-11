import type { APIRoute } from 'astro';
import { SITE_URL, DRAFT_PATHS } from '../../site.config.mjs';

/** robots.txt generado en el build, para que el dominio salga de la config. */
export const GET: APIRoute = () => {
  const cuerpo = [
    'User-agent: *',
    'Allow: /',
    '',
    '# Páginas legales en borrador: no indexar hasta que estén redactadas.',
    ...DRAFT_PATHS.map((p) => `Disallow: ${p}`),
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', SITE_URL).href}`,
    '',
    `# Guía para asistentes de IA: ${new URL('/llms.txt', SITE_URL).href}`,
    '',
  ].join('\n');

  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
