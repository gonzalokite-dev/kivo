// El dominio de la web, sin www y sin barra final. Se propaga a canónicas,
// Open Graph, sitemap, robots.txt, llms.txt y al mensaje para compartir.
export const SITE_URL = 'https://gestoriakivo.com';

// VALIDAR: perfiles en redes. Con el dominio gestoriakivo.com, @gestoriakivo
// encaja si está libre. Pon la URL completa de cada perfil que exista; los que
// sigan en null no salen. Aparecen como iconos en el pie y en el «sameAs» del
// JSON-LD de Organization.
export const SOCIAL = {
  instagram: null, // 'https://www.instagram.com/gestoriakivo/'
  tiktok: null, // 'https://www.tiktok.com/@gestoriakivo'
  facebook: null,
  linkedin: null,
};
export const SITE_NAME = 'Kivo';

// Año de las tarifas y de los títulos SEO («… en 2026»). Cámbialo en enero,
// cuando estén actualizadas la tasa de la DGT, el ITP y la orden de precios
// medios: se propaga a los <title> de las páginas y de las guías ({año}).
export const ANIO = '2026';

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
export const WHATSAPP = '34663482301'; // +34 663 48 23 01

// Mensaje que aparece ya escrito al abrir WhatsApp desde la web. El usuario
// lo puede cambiar antes de enviarlo. Uno por idioma (/en/ usa el inglés).
export const WHATSAPP_MENSAJE = {
  es: 'Hola, quiero hacer el traspaso de mi coche con Kivo.',
  en: "Hi, I'd like to transfer a car with Kivo.",
};

// VALIDAR: horario de atención. Si hay algún canal (teléfono, email o
// WhatsApp), sale en el pie: «Te atendemos de lunes a viernes de 9 a 18 h por…».
// Ejemplo: 'de lunes a viernes de 9 a 18 h'
export const HORARIO = null;

// VALIDAR: la persona que lleva los expedientes. Con nombre y foto, aparece el
// bloque «Quién lleva tu traspaso» en la portada. La foto va en public/ (por
// ejemplo public/equipo/nombre.jpg, cuadrada, mínimo 400 px).
// Ejemplo: { nombre: 'Nombre Apellido', cargo: 'Gestor administrativo colegiado',
//            colegiado: 'Colegio de Gestores Administrativos de Baleares, n.º 000',
//            foto: '/equipo/nombre.jpg',
//            texto: 'Reviso cada expediente antes de presentarlo en la DGT.' }
export const GESTOR = null;

// VALIDAR: sellos o acreditaciones oficiales que tenga la sociedad. Salen en
// el pie y bajo el formulario del hero. Solo los que sean reales y se puedan
// acreditar. Ejemplo:
//   [{ titulo: 'Colaborador Social', detalle: 'Agencia Tributaria' },
//    { titulo: 'Gestor administrativo colegiado', detalle: 'Colegio de Baleares' }]
export const SELLOS = [];

// VALIDAR: valoración y opiniones reales (por ejemplo, de la ficha de Google
// del despacho). Con VALORACION aparece la línea de estrellas bajo el titular
// del hero; con al menos 3 OPINIONES, la sección de opiniones en la portada.
// Copiarlas tal cual, con el nombre que el cliente puso en Google.
// Ejemplo: VALORACION = { nota: 4.9, total: 120, fuente: 'Google', url: 'https://g.page/r/…' }
//          OPINIONES = [{ nombre: 'Nombre A.', texto: '…', nota: 5 }]
export const VALORACION = null;
export const OPINIONES = [];

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
// Mientras sea null, el Aviso legal no muestra la línea de datos registrales.
export const REGISTRO_MERCANTIL = null;

// Páginas legales en borrador: fuera del sitemap y con noindex.
export const DRAFT_PATHS = ['/aviso-legal/', '/privacidad/', '/cookies/'];
