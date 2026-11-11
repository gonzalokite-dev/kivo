// VALIDAR: el dominio. kivo.es aún no está comprado (brandbook, cap. 11:
// «Comprar el dominio (kivo.es o kivo.app) y los perfiles en redes»).
// Cámbialo aquí y se propaga a canónicas, Open Graph, sitemap y robots.txt.
export const SITE_URL = 'https://kivo.es';

// VALIDAR: el usuario de redes. El brandbook lo da como «a confirmar según
// disponibilidad»: @kivo y, por orden, @kivo.es, @kivo_es, @kivotransferencias.
// Hasta que esté confirmado no hay enlaces a redes en el pie.
export const SOCIAL = null;
export const SITE_NAME = 'Kivo';

// VALIDAR: datos de contacto reales. Mientras sean null, no se muestran ni
// se incluyen en el JSON-LD de Organization: no inventamos un teléfono, un
// email ni un número de WhatsApp. En cuanto existan, poner aquí:
//   TELEFONO:  '+34600000000' (formato E.164, el que pide schema.org)
//   EMAIL:     'hola@kivo.es'
//   WHATSAPP:  '34600000000' (sin + ni espacios, el formato que pide wa.me)
// y aparece solo el botón flotante de WhatsApp (<BotonWhatsapp />) y el
// teléfono/email en el JSON-LD de Organization, sin tocar más código.
export const TELEFONO = null;
export const EMAIL = null;
export const WHATSAPP = null;

// VALIDAR: CIF y domicilio social. El brandbook todavía tiene pendiente
// «Registrar Kivo en la OEPM» y no hay sociedad constituida con estos datos,
// así que no se pueden inventar. En cuanto existan, van en Aviso legal,
// Privacidad y en el JSON-LD de Organization (campos `taxID` y `address`).
export const CIF = null;
export const DOMICILIO = null;

// Páginas legales en borrador: fuera del sitemap y con noindex.
export const DRAFT_PATHS = ['/aviso-legal/', '/privacidad/', '/cookies/'];
