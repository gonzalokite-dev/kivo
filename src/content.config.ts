import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { FUENTES } from './data/nav';

const claves = Object.keys(FUENTES) as [keyof typeof FUENTES, ...Array<keyof typeof FUENTES>];

const guias = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/guias' }),
  schema: z.object({
    /** H1 de la guía. Lleva la palabra clave. */
    title: z.string(),
    /** Etiqueta <title>. Puede ser distinta del H1. */
    seoTitle: z.string().min(30).max(70),
    /** Meta description, de 140 a 155 caracteres. */
    description: z.string().min(140).max(155),
    /** Palabra clave principal. */
    keyword: z.string(),
    /** Respuesta corta, 2 o 3 frases, para el fragmento destacado de Google. */
    short: z.string(),
    /** Resumen de una línea para la tarjeta del índice. */
    summary: z.string(),
    /** Agrupación en el índice del blog. */
    group: z.enum(['Hacer el traspaso', 'Casos especiales', 'Impuestos y tasas']),
    /** Tiempo de lectura en minutos. */
    reading: z.number().int().positive(),
    published: z.coerce.date(),
    updated: z.coerce.date(),
    /** De 4 a 5 preguntas frecuentes. Van a <details> y a FAQPage. */
    faqs: z.array(z.object({ q: z.string(), a: z.string() })).min(4).max(5),
    /** Claves de `FUENTES`: los enlaces salientes oficiales de la guía. */
    sources: z.array(z.enum(claves)).min(2),
    /** Tres guías relacionadas, por id. */
    related: z.array(z.string()).length(3),
    /** Orden dentro de su grupo en el índice. */
    order: z.number().int(),
  }),
});

export const collections = { guias };
