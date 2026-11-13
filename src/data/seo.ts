import { SITE_URL, SITE_NAME, TELEFONO, EMAIL, CIF, DOMICILIO, RAZON_SOCIAL, SOCIAL } from '../../site.config.mjs';

/** Perfiles en redes con URL, para el sameAs de Organization. */
const perfiles = Object.values((SOCIAL ?? {}) as Record<string, string | null>).filter(Boolean) as string[];

export { SITE_URL, SITE_NAME };

/**
 * Imagen para compartir. PNG de 1200×630 generado desde `public/og-kivo.svg`
 * con `node scripts/convertir-og.mjs` (Chrome headless, sin dependencias
 * nuevas) — WhatsApp, X y LinkedIn no leen SVG en las vistas previas.
 * Si cambias el SVG, vuelve a correr el script para regenerar el PNG.
 */
export const OG_IMAGE = '/og-kivo.png';
export const OG_IMAGE_W = 1200;
export const OG_IMAGE_H = 630;

/** URL absoluta a partir de una ruta interna con barra final. */
export const abs = (path: string) => new URL(path, SITE_URL).href;

/** Ficha de la empresa. Se reutiliza en Organization, Service y Article. */
export const ORG = {
  name: SITE_NAME,
  legalName: SITE_NAME,
  url: SITE_URL,
  logo: abs('/favicon.svg'),
  description:
    'Kivo hace el traspaso de coches y motos entre particulares de forma online, en toda España: cambio de titular en la DGT, impuesto y papeleo por 89 € de honorarios.',
  slogan: 'Traspaso de coche online, sin ir a Tráfico.',
  areaServed: 'ES',
} as const;

/**
 * JSON-LD de Organization para la portada.
 *
 * Doble tipo Organization + ProfessionalService: es gestoría, no solo marca.
 * `legalName`, `taxID` y `address` salen de site.config.mjs. `telephone` y
 * `email` solo se añaden si están rellenos
 * en site.config.mjs — mientras sean VALIDAR (null), no se inventan.
 * Fundada por Benavides (benavidesasociados.com).
 */
export const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': ['Organization', 'ProfessionalService'],
  '@id': abs('/') + '#organizacion',
  name: ORG.name,
  url: ORG.url,
  logo: ORG.logo,
  image: abs('/favicon.svg'),
  description: ORG.description,
  slogan: ORG.slogan,
  areaServed: { '@type': 'Country', name: 'España' },
  founder: { '@type': 'Organization', name: 'Benavides', url: 'https://benavidesasociados.com' },
  ...(perfiles.length ? { sameAs: perfiles } : {}),
  ...(TELEFONO ? { telephone: TELEFONO } : {}),
  ...(EMAIL ? { email: EMAIL } : {}),
  legalName: RAZON_SOCIAL,
  ...(CIF ? { taxID: CIF } : {}),
  address: {
    '@type': 'PostalAddress',
    streetAddress: DOMICILIO.calle,
    postalCode: DOMICILIO.cp,
    addressLocality: DOMICILIO.localidad,
    addressRegion: DOMICILIO.provincia,
    addressCountry: 'ES',
  },
});

/** JSON-LD de Service con la oferta de 89 € para la portada. */
export const serviceLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  '@id': abs('/') + '#servicio',
  name: 'Traspaso de coche y moto online',
  serviceType: 'Cambio de titular de vehículo en la DGT',
  description:
    'Cambio de titular en la DGT, liquidación del impuesto de transmisiones patrimoniales (ITP) y papeleo del traspaso, todo online.',
  provider: { '@id': abs('/') + '#organizacion' },
  areaServed: { '@type': 'Country', name: 'España' },
  offers: {
    '@type': 'Offer',
    price: '89',
    priceCurrency: 'EUR',
    description: 'Honorarios de Kivo, IVA incluido, para cualquier coche o moto.',
    availability: 'https://schema.org/InStock',
    url: abs('/calcular-transferencia-coche/'),
  },
});

export interface Miga {
  label: string;
  href: string;
}

/** JSON-LD de BreadcrumbList. Va en todas las páginas menos la portada. */
export const breadcrumbLd = (migas: Miga[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: migas.map((m, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: m.label,
    item: abs(m.href),
  })),
});

export interface Faq {
  q: string;
  a: string;
}

/** JSON-LD de FAQPage para cualquier página con preguntas frecuentes. */
export const faqLd = (faqs: Faq[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
});

/** JSON-LD de Article para las guías. */
export const articleLd = (opts: {
  path: string;
  title: string;
  description: string;
  published: Date;
  modified: Date;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: opts.title,
  description: opts.description,
  mainEntityOfPage: { '@type': 'WebPage', '@id': abs(opts.path) },
  datePublished: opts.published.toISOString().slice(0, 10),
  dateModified: opts.modified.toISOString().slice(0, 10),
  inLanguage: 'es-ES',
  author: { '@type': 'Organization', name: ORG.name, url: ORG.url },
  publisher: {
    '@type': 'Organization',
    name: ORG.name,
    url: ORG.url,
    logo: { '@type': 'ImageObject', url: ORG.logo },
  },
});
