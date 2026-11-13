import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_URL, SITE_NAME } from '../../site.config.mjs';
import { ORG } from '../data/seo';
import { LOCALES } from '../data/nav';

/**
 * llms.txt — guía de la web pensada para que un asistente de IA la lea en
 * lugar de rastrearla entera. Sigue la convención de llmstxt.org: un H1, una
 * cita con el resumen, párrafos de contexto y listas de enlaces por sección.
 *
 * Se genera en el build a partir de los mismos datos que usa el resto de la
 * web (`src/data/nav.ts` y la colección `guias`), así que nunca queda
 * desincronizado del contenido real.
 */
export const GET: APIRoute = async () => {
  const abs = (path: string) => new URL(path, SITE_URL).href;

  const guias = (await getCollection('guias')).sort(
    (a, b) => a.data.group.localeCompare(b.data.group) || a.data.order - b.data.order
  );

  const lineaGuia = (g: (typeof guias)[number]) =>
    `- [${g.data.title}](${abs(`/guias/${g.id}/`)}): ${g.data.summary}`;

  const grupos = ['Hacer el traspaso', 'Casos especiales', 'Impuestos y tasas'] as const;

  const cuerpo = [
    `# ${SITE_NAME}`,
    '',
    `> ${ORG.description}`,
    '',
    'No hay pago online. El usuario calcula su precio con la calculadora, envía un formulario de ' +
      'solicitud y una persona del equipo le escribe por email en menos de 24 horas para empezar. ' +
      'Los honorarios son 89 €, iguales para cualquier coche o moto; la tasa de la DGT y el ITP se ' +
      'pagan íntegros, sin margen, y se muestran al céntimo antes de pedir nada.',
    '',
    '## Páginas comerciales',
    '',
    `- [Transferencia de coche online](${abs('/')}): portada, calculadora de precio con el ITP de las 19 comunidades y formulario de solicitud.`,
    `- [Cuánto cuesta la transferencia de un coche](${abs('/calcular-transferencia-coche/')}): desglose de honorarios, tasa de la DGT e ITP por comunidad autónoma, con ejemplos de total.`,
    `- [Documentos para la transferencia de un coche](${abs('/documentacion-transferencia-coche/')}): qué documentos envían el comprador y el vendedor, con ejemplos ilustrados.`,
    `- [Transferencia de moto online](${abs('/transferencia-moto/')}): precio y documentos para motos y ciclomotores.`,
    `- [Vender coche a particular](${abs('/vender-coche/')}): qué tiene que hacer quien vende para dejar de ser el titular.`,
    `- [Gestoría de traspaso de coche online](${abs('/gestoria-transferencia-coche/')}): qué hace una gestoría en el traspaso, cuánto cobra y la diferencia entre gestoría online y presencial.`,
    '',
    `- [Car ownership transfer in Spain](${abs('/en/')}): la misma oferta en inglés, para residentes extranjeros con NIE.`,
    `- [Fuentes y datos](${abs('/fuentes-y-datos/')}): de dónde sale cada cifra de la web, con enlace a la fuente oficial.`,
    '',
    ...LOCALES.map((l) => `- [Transferencia de coche en ${l.label}](${abs(l.href)}): precio, ITP y cómo hacerla en ${l.label}, con la calculadora de la comunidad.`),
    '',
    '## Guías',
    '',
    `${guias.length} guías en ${abs('/guias/')}, agrupadas en tres bloques:`,
    '',
    ...grupos.flatMap((grupo) => [
      `### ${grupo}`,
      '',
      ...guias.filter((g) => g.data.group === grupo).map(lineaGuia),
    ]),
    '',
    '## Optional',
    '',
    `- [Aviso legal](${abs('/aviso-legal/')}): página legal en borrador, sin indexar.`,
    `- [Privacidad](${abs('/privacidad/')}): página legal en borrador, sin indexar.`,
    `- [Cookies](${abs('/cookies/')}): página legal en borrador, sin indexar.`,
    '',
  ].join('\n');

  return new Response(cuerpo, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
