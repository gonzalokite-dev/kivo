# Kivo · web v1

Transferencia de coches y motos online en España. Cambio de titular en la DGT,
liquidación del ITP y papeleo por 89 € de honorarios.

La web tiene dos trabajos: **convertir** (que el usuario envíe el formulario de
solicitud) y **posicionar** para las búsquedas del sector.

## Arrancar

```bash
npm install
npm run dev          # http://localhost:4321
```

## Comprobaciones

```bash
npm run build          # Astro, salida estática en dist/
npm run check:links    # enlaces internos, anclas y profundidad
npm run check:content   # palabras, enlaces y metadatos de cada guía
npm run check:mobile    # 390 px, calculadora y formulario, en Chrome
npm run check           # todo lo anterior, en orden
```

`check:mobile` levanta un servidor sobre `dist/`, abre Chrome o Edge en modo
headless por CDP y mide de verdad: scroll horizontal a 390 px, el total de la
calculadora, los botones de la tabla del ITP y las cinco validaciones del
formulario. Si no hay navegador instalado, se salta sin fallar.

`check:lighthouse` (dependencia de desarrollo, no se envía al cliente) mide
Rendimiento, Accesibilidad, Buenas prácticas y SEO en móvil:

```bash
node scripts/check-lighthouse.mjs                       # muestra representativa
node scripts/check-lighthouse.mjs /vender-coche/        # rutas concretas
```

## Configuración

| Dónde | Qué |
| --- | --- |
| `site.config.mjs` | Dominio (`gestoriakivo.com`) para canónicas, Open Graph, sitemap y robots. |
| `.env` | `PUBLIC_FORM_ENDPOINT`, el endpoint del formulario (Formspree o similar). Copia `.env.example`. |
| `src/data/tarifas.ts` | Honorarios, tasas de la DGT y el ITP de las 19 comunidades. |
| `src/data/nav.ts` | Menú, pie y las fuentes oficiales a las que enlazamos. |
| `src/data/seo.ts` | Generadores de JSON-LD y la imagen para compartir. |

**Sin `PUBLIC_FORM_ENDPOINT` el formulario no envía nada**: valida, muestra la
pantalla de éxito y deja un aviso en la consola con los datos que habría
enviado. Así se puede probar el flujo completo sin endpoint.

### Bloques que aparecen solos al rellenar un dato

En `site.config.mjs` hay datos que hoy están vacíos. Mientras lo estén, su
bloque no se pinta: la web nunca enseña un teléfono, una reseña o un sello
inventados. En cuanto se rellenan, aparecen sin tocar más código.

| Dato | Qué aparece |
| --- | --- |
| `WHATSAPP` | Botón flotante, «¿Prefieres hablar antes?» en el hero, enlace en las FAQ y en el cierre, y en el pie. |
| `TELEFONO`, `EMAIL` | Contacto en las FAQ, en el pie, en Aviso legal y Privacidad, y en el JSON-LD. |
| `HORARIO` | «Te atendemos de lunes a viernes…» en el pie (si hay algún canal). |
| `GESTOR` | Bloque «Quién lleva tu traspaso» con foto, nombre y colegiación. |
| `SELLOS` | Sellos oficiales bajo el formulario del hero y en el pie. |
| `VALORACION` | Línea de estrellas bajo el titular del hero. |
| `OPINIONES` (3 o más) | Sección de opiniones en la portada. |
| `SOCIAL` | Iconos de redes en el pie y `sameAs` en el JSON-LD. |
| `REGISTRO_MERCANTIL` | Datos registrales en el Aviso legal. |

### Versión en inglés

`/en/` es una página única en inglés para residentes extranjeros con NIE, con
el formulario en inglés (acepta móviles extranjeros con prefijo internacional),
y enlazada con la portada mediante `hreflang`. Las páginas legales y las guías
siguen solo en español.

## Cómo está montado

- **Astro** con salida estática y `trailingSlash: 'always'`.
- **CSS propio** en un único `src/styles/global.css`, con los tokens del
  brandbook. Sin Tailwind.
- **JavaScript vanilla** solo para la calculadora, el formulario y el botón de
  copiar. Ninguna librería de terceros llega al cliente.
- **Fuentes autoalojadas** con `@fontsource-variable` (Plus Jakarta Sans y
  DM Sans). Nada de CDN de Google Fonts. Los dos ficheros latinos se precargan.
- **Guías** como MDX en una *content collection*, con el esquema validado en
  `src/content.config.ts`: si una guía se queda corta de metadatos, el build
  falla.
- **Integraciones:** `@astrojs/sitemap` y `@astrojs/mdx`. Nada más.
- **`llms.txt`** en la raíz, para que los asistentes de IA (ChatGPT, Claude,
  Perplexity…) lean un resumen de la web en vez de rastrearla entera. Sigue la
  convención de [llmstxt.org](https://llmstxt.org): un H1, un resumen en cita
  y las páginas por sección, con las legales en `## Optional`. Se genera en
  `src/pages/llms.txt.ts` a partir de la misma colección de guías y del mismo
  `src/data/nav.ts` que usa el resto de la web, así que nunca queda
  desincronizado. `robots.txt` lo enlaza igual que el sitemap.

### La tabla del ITP, en un solo sitio

`src/data/tarifas.ts` es la única fuente de verdad. De ahí salen a la vez la
tabla estática de `/precio-traspaso-coche/` (renderizada en el build, no
generada por JavaScript) y los datos que usa la calculadora en el navegador.
Los tipos, las cuotas fijas y las exenciones vienen de
`referencia/kivo-landing.html` y no se han tocado.

Caso de referencia: un coche de 6.000 €, de 8 años, en la Comunidad de Madrid
paga 240 € de ITP + 55,70 € de tasa + 89 € de honorarios = **384,70 €**.

### Enlaces salientes

Solo a DGT, BOE, Agencia Tributaria, RACE, Consejo General de Gestores y Cl@ve.
Van con `target="_blank" rel="noopener"` y **sin** `nofollow`, escritos a mano
dentro del texto, justo donde se cita el dato. `check:content` comprueba que
cada guía tiene al menos dos y que ninguno se sale de la lista blanca.

Nunca se enlaza a gestorías de la competencia.

## Lo que falta por validar

Todo lo que necesita que alguien lo confirme está marcado con `VALIDAR` en el
código. Para verlos:

```bash
grep -rn "VALIDAR" src/ public/ site.config.mjs
```

Hoy son cinco cosas: el usuario de redes, la colegiación de los
gestores, las dos garantías (devolución y cobertura frente a errores), la
imagen para compartir (hay que exportarla a PNG) y la revisión de las
tres páginas legales, ya redactadas con los datos de la sociedad pero pendientes
de revisar y de los datos del Registro Mercantil.

Las páginas legales van en `noindex` y fuera del sitemap mientras sean borrador.
La lista está en `DRAFT_PATHS`, en `site.config.mjs`: cuando se publiquen, se
quitan de ahí y entran en el sitemap solas.
