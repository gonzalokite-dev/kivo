/** Menú, pie y rutas. Todas las URLs en minúscula, sin tildes y con barra final. */

export interface Enlace {
  href: string;
  label: string;
}

/** Menú principal. El botón «Calcular mi precio» va aparte, en el componente. */
export const MENU: Enlace[] = [
  { href: '/#como', label: 'Cómo funciona' },
  { href: '/precio-traspaso-coche/', label: 'Precio' },
  { href: '/documentacion-traspaso-coche/', label: 'Documentos' },
  { href: '/traspaso-moto/', label: 'Motos' },
  { href: '/vender-coche/', label: 'Si vendes' },
  { href: '/guias/', label: 'Guías' },
];

/** Las 5 comerciales, para el pie y para los enlaces internos. */
export const COMERCIALES: Enlace[] = [
  { href: '/', label: 'Traspaso de coche' },
  { href: '/gestoria-traspaso-coche/', label: 'Gestoría de traspasos' },
  { href: '/precio-traspaso-coche/', label: 'Cuánto cuesta' },
  { href: '/documentacion-traspaso-coche/', label: 'Documentos' },
  { href: '/traspaso-moto/', label: 'Traspaso de moto' },
  { href: '/vender-coche/', label: 'Si vendes tu coche' },
];

/** Las 4 guías principales que van en el pie. */
export const GUIAS_PIE: Enlace[] = [
  { href: '/guias/como-hacer-traspaso-coche/', label: 'Cómo hacerla paso a paso' },
  { href: '/guias/quien-paga-traspaso-coche/', label: 'Quién la paga' },
  { href: '/guias/plazo-traspaso-coche/', label: 'Plazos' },
  { href: '/guias/traspaso-coche-sin-certificado-digital/', label: 'Sin certificado digital' },
];

export const LEGALES: Enlace[] = [
  { href: '/aviso-legal/', label: 'Aviso legal' },
  { href: '/privacidad/', label: 'Privacidad' },
  { href: '/cookies/', label: 'Cookies' },
];

/**
 * Textos variados para enlazar a la portada desde las guías.
 * El brandbook prohíbe «haz clic aquí»; aquí se alterna.
 */
export const ANCLAS_PORTADA = [
  'traspaso de coche online',
  'transferencia de coche online',
  'cambio de nombre del coche',
  'hacerla con Kivo',
] as const;

/** Dominios oficiales a los que sí enlazamos. Nunca a gestorías de la competencia. */
export const DOMINIOS_OFICIALES = [
  'sede.dgt.gob.es',
  'www.dgt.es',
  'www.boe.es',
  'www3.agenciatributaria.gob.es',
  'sede.agenciatributaria.gob.es',
  'www.consejogestores.org',
  'www.race.es',
  'clave.gob.es',
] as const;

/** El despacho que hay detrás de Kivo: se enlaza como mucho una vez por guía,
 *  a la página de su web que trate el mismo tema. No es una fuente oficial. */
export const DOMINIOS_PROPIOS = ['benavidesasociados.com'] as const;

/** Las fuentes ya comprobadas, por clave, para no repetir URLs en todas las guías. */
export const FUENTES = {
  dgtTransferencias: {
    label: 'DGT · Transferencias de vehículos',
    url: 'https://sede.dgt.gob.es/es/vehiculos/transferencias-de-vehiculos/',
  },
  dgtCargas: {
    label: 'DGT · Transferencia de vehículos con cargas financieras',
    url: 'https://sede.dgt.gob.es/es/vehiculos/transferencias-de-vehiculos/transferencia-de-vehiculos-con-cargas-financieras/',
  },
  dgtFallecimiento: {
    label: 'DGT · Transferencia por fallecimiento del titular con adjudicatario',
    url: 'https://sede.dgt.gob.es/es/vehiculos/transferencias-de-vehiculos/transferencia-de-un-vehiculo-por-fallecimiento-del-titular-con-adjudicatario/',
  },
  dgtDonaciones: {
    label: 'DGT · Donaciones, herencias y divorcios o separaciones',
    url: 'https://www.dgt.es/nuestros-servicios/tu-vehiculo/donaciones-herencias-y-divorcios-o-separaciones/index.html',
  },
  dgtNotificacion: {
    label: 'DGT · Notificación de venta',
    url: 'https://sede.dgt.gob.es/es/vehiculos/notificacion-de-venta/',
  },
  boeReglamento: {
    label: 'BOE · Reglamento General de Vehículos (RD 2822/1998)',
    url: 'https://www.boe.es/eli/es/rd/1998/12/23/2822/con',
  },
  aeat620: {
    label: 'AEAT · Instrucciones del modelo 620',
    url: 'https://www3.agenciatributaria.gob.es/static_files/Sede/Procedimiento_ayuda/GC12/620/instrucciones620.pdf',
  },
  gestoresPrecios: {
    label: 'Consejo General de Gestores · Precios medios 2026',
    url: 'https://www.consejogestores.org/noticias/precios-medios-2026-vehiculos-embarcaciones/',
  },
  raceHerencia: {
    label: 'RACE · Trámites para heredar un coche',
    url: 'https://www.race.es/tramites-heredar-coche',
  },
  clave: {
    label: 'Cl@ve · Identificación electrónica de las administraciones',
    url: 'https://clave.gob.es/',
  },
  boeOrdenPrecios: {
    label: 'BOE · Orden HAC/1501/2025, precios medios de venta para 2026',
    url: 'https://www.boe.es/eli/es/o/2025/12/17/hac1501',
  },
  boeCodigoCivil: {
    label: 'BOE · Código Civil (saneamiento por vicios ocultos, arts. 1484 a 1490)',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763',
  },
  dgtInforme: {
    label: 'DGT · Informe de un vehículo',
    url: 'https://sede.dgt.gob.es/es/vehiculos/informacion-de-vehiculos/informe-de-un-vehiculo/',
  },
  boeHaciendasLocales: {
    label: 'BOE · Ley Reguladora de las Haciendas Locales (impuesto de circulación, arts. 92 a 99)',
    url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2004-4214',
  },
  aeatSede: {
    label: 'AEAT · Sede electrónica',
    url: 'https://sede.agenciatributaria.gob.es/',
  },
} as const;

export type ClaveFuente = keyof typeof FUENTES;
