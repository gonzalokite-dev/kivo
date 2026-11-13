/**
 * Tarifas e ITP por comunidad.
 *
 * Única fuente de verdad: de aquí salen a la vez la tabla estática de
 * `/calcular-transferencia-coche/` (HTML renderizado en el build, no generado
 * por JavaScript) y los datos que usa la calculadora en el cliente.
 *
 * Los tipos, las cuotas fijas y las exenciones vienen de
 * `referencia/kivo-landing.html` y NO se modifican.
 */

/** Tramo de cuota fija: [cilindrada máxima en cc, cuota en euros]. */
export type Tramo = [number, number];

export interface Ccaa {
  /** Código interno, el que viaja en `data-ccaa`. */
  id: string;
  /** Nombre corto: selector de la calculadora y textos de aviso. */
  n: string;
  /** Tipo general del ITP para turismos, en porcentaje. */
  r: number;
  /** Cuota fija para coches antiguos. `max` limita por precio de compra. */
  old?: { min: number; max?: number; t: Tramo[] };
  /** Años a partir de los cuales el vehículo está exento. */
  exentoOld?: number;
  /** La comunidad exime a los ciclomotores. */
  ciclo0?: boolean;
  /** Nombre oficial largo, si se usa otro en la tabla. */
  nombreTabla?: string;
  /** Columna «Coches antiguos y casos especiales» de la tabla. */
  nota: string;
}

export const CCAA: Ccaa[] = [
  { id: 'AND', n: 'Andalucía', r: 4, nota: 'Sobre el valor del coche' },
  {
    id: 'ARA',
    n: 'Aragón',
    r: 4,
    old: { min: 10, t: [[1000, 0], [1500, 20], [2000, 30]] },
    nota: '10 años o más: cuota fija según cilindrada',
  },
  { id: 'AST', n: 'Asturias', nombreTabla: 'Principado de Asturias', r: 4, nota: 'Sobre el valor del coche' },
  { id: 'BAL', n: 'Illes Balears', r: 4, ciclo0: true, nota: 'Ciclomotores exentos' },
  {
    id: 'CAN',
    n: 'Canarias',
    r: 5.5,
    old: { min: 10, t: [[1000, 40], [1500, 70], [2000, 115]] },
    nota: '10 años o más: cuota fija según cilindrada',
  },
  {
    id: 'CTB',
    n: 'Cantabria',
    r: 6,
    old: { min: 10, t: [[1000, 45], [1500, 60], [2000, 90]] },
    nota: '10 años o más: cuota fija según cilindrada',
  },
  { id: 'CLM', n: 'Castilla-La Mancha', r: 6, nota: 'Sobre el valor del coche' },
  { id: 'CYL', n: 'Castilla y León', r: 5, nota: 'Sobre el valor del coche' },
  {
    id: 'CAT',
    n: 'Cataluña',
    r: 5,
    exentoOld: 10,
    nota: '10 años o más: exentos (salvo históricos o de alta gama)',
  },
  {
    id: 'VAL',
    n: 'Comunitat Valenciana',
    r: 6,
    old: { min: 12, max: 20000, t: [[1500, 40], [2000, 60], [99999, 140]] },
    nota: '12 años o más y menos de 20.000 €: cuota fija',
  },
  { id: 'EXT', n: 'Extremadura', r: 6, nota: 'Sobre el valor del coche' },
  {
    id: 'GAL',
    n: 'Galicia',
    r: 3,
    old: { min: 15, t: [[1199, 22], [1599, 38]] },
    nota: '15 años o más: cuota fija según cilindrada',
  },
  { id: 'MAD', n: 'Comunidad de Madrid', r: 4, nota: 'Sobre el valor del coche' },
  {
    id: 'MUR',
    n: 'Región de Murcia',
    r: 4,
    old: { min: 12, t: [[1000, 0], [1500, 30], [2000, 50], [99999, 75]] },
    nota: '12 años o más: cuota fija según cilindrada',
  },
  {
    id: 'NAV',
    n: 'Navarra',
    r: 4,
    exentoOld: 10,
    ciclo0: true,
    nota: '10 años o más y ciclomotores: exentos',
  },
  { id: 'PVA', n: 'País Vasco', r: 4, nota: 'Sobre el valor del coche' },
  { id: 'RIO', n: 'La Rioja', r: 4, nota: 'Sobre el valor del coche' },
  { id: 'CEU', n: 'Ceuta', r: 2, nota: 'Sobre el valor del coche' },
  { id: 'MEL', n: 'Melilla', r: 2, nota: 'Sobre el valor del coche' },
];

/** Honorarios de Kivo, IVA incluido. */
export const FEE = 89;

/** Tasa de la DGT en 2026. Tasa 1.5 para coches y motos; 1.2 para ciclomotores. */
export const TASA = { coche: 55.7, moto: 55.7, ciclo: 27.85 } as const;

export type Vehiculo = keyof typeof TASA;

/** Comunidad que viene preseleccionada en la calculadora. */
export const CCAA_POR_DEFECTO = 'MAD';

/** Nombre a mostrar en la tabla del ITP. */
export const nombreTabla = (c: Ccaa) => c.nombreTabla ?? c.n;

/** Las comunidades ordenadas por su nombre de tabla, para la tabla del ITP. */
export const ccaaOrdenadas = (): Ccaa[] =>
  [...CCAA].sort((a, b) => nombreTabla(a).localeCompare(nombreTabla(b), 'es'));

/** Las comunidades ordenadas por su nombre corto, para el selector. */
export const ccaaSelector = (): Ccaa[] =>
  [...CCAA].sort((a, b) => a.n.localeCompare(b.n, 'es'));

/** Formatea un importe como «55,70 €» (brandbook, cap. 4 · Cifras y formatos). */
export const eur = (v: number): string =>
  v.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

/** Formatea un porcentaje como «5,5 %». */
export const pct = (v: number): string => String(v).replace('.', ',') + ' %';

/**
 * El ITP de una compraventa. Misma lógica que la referencia:
 * exención de ciclomotores, exención por antigüedad, cuota fija por
 * cilindrada y, si no aplica nada, el tipo general sobre la base.
 */
export function itpFor(c: Ccaa, veh: Vehiculo, age: number, cc: number, price: number) {
  if (veh === 'ciclo' && c.ciclo0) return { itp: 0, fixed: true };
  if (veh !== 'ciclo' && c.exentoOld && age >= c.exentoOld) return { itp: 0, fixed: true };
  if (veh === 'coche' && c.old && age >= c.old.min && (!c.old.max || price < c.old.max)) {
    const hit = c.old.t.find(([lim]) => cc <= lim);
    if (hit) return { itp: hit[1], fixed: true };
  }
  return { itp: Math.round(price * c.r) / 100, fixed: false };
}

/** Total de una transferencia: honorarios + tasa + impuesto. */
export function total(c: Ccaa, veh: Vehiculo, age: number, cc: number, price: number) {
  const { itp } = itpFor(c, veh, age, cc, price);
  return FEE + TASA[veh] + itp;
}
