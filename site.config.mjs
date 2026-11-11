// El dominio de la web, sin www y sin barra final. Se propaga a canónicas,
// Open Graph, sitemap, robots.txt, llms.txt y al mensaje para compartir.
export const SITE_URL = 'https://gestoriakivo.com';

// VALIDAR: el usuario de redes. El brandbook lo da como «a confirmar según
// disponibilidad»: @kivo y, por orden, @kivo.es, @kivo_es, @kivotransferencias.
// Hasta que esté confirmado no hay enlaces a redes en el pie.
export const SOCIAL = null;
export const SITE_NAME = 'Kivo';

// VALIDAR: datos de contacto reales. Mientras sean null, no se muestran ni
// se incluyen en el JSON-LD de Organization: no inventamos un teléfono, un
// email ni un número de WhatsApp. En cuanto existan, poner aquí:
//   TELEFONO:  '+34600000000' (formato E.164, el que pide schema.org)
//   EMAIL:     'hola@gestoriakivo.com'
//   WHATSAPP:  '34600000000' (sin + ni espacios, el formato que pide wa.me)
// y aparece solo el botón flotante de WhatsApp (<BotonWhatsapp />) y el
// teléfono/email en el JSON-LD de Organization, sin tocar más código.
export const TELEFONO = null;
export const EMAIL = null;
export const WHATSAPP = null;

// Titular de la web y del servicio: Kivo es una marca comercial de esta
// sociedad. Sale en el pie, en Aviso legal, Privacidad y Cookies, y en el
// JSON-LD de Organization (campos `legalName`, `taxID` y `address`).
export const RAZON_SOCIAL = 'Alfonso Benavides y Asociados, SL';
export const CIF = 'B57131583';
export const DOMICILIO = {
  calle: 'C/ Cecili Metel, 29',
  cp: '07460',
  localidad: 'Pollença',
  provincia: 'Illes Balears',
};
/** «C/ Cecili Metel, 29, 07460 Pollença (Illes Balears)» */
export const DOMICILIO_TEXTO = `${DOMICILIO.calle}, ${DOMICILIO.cp} ${DOMICILIO.localidad} (${DOMICILIO.provincia})`;

// VALIDAR: datos de inscripción en el Registro Mercantil (tomo, folio, hoja
// e inscripción). La LSSI (art. 10) obliga a ponerlos en el Aviso legal.
// Mientras sea null, el Aviso legal muestra un hueco marcado para rellenar.
export const REGISTRO_MERCANTIL = null;

// Páginas legales en borrador: fuera del sitemap y con noindex.
export const DRAFT_PATHS = ['/aviso-legal/', '/privacidad/', '/cookies/'];
