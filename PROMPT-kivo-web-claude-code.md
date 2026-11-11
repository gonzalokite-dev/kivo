# Prompt para Claude Code · Web de Kivo v1

Copia todo lo que hay debajo de la línea en Claude Code. Antes, pon en la raíz del repositorio el archivo `referencia/kivo-landing.html` (la landing actual de Kivo).

---

Vas a construir la web v1 de **Kivo**, un servicio que hace la **transferencia de coches y motos online** en España: cambia el titular en la DGT, liquida el impuesto (ITP) y hace el papeleo por 89 € de honorarios. El objetivo de la web es doble: **convertir** (que el usuario envíe el formulario de solicitud) y **posicionar en Google** para las búsquedas del sector.

Trabaja por fases y enséñame el resultado de cada una antes de pasar a la siguiente:
1. Montaje del proyecto y componentes.
2. Las 5 páginas comerciales.
3. El índice del blog y las 10 guías.
4. SEO técnico y comprobaciones finales.

## 1. Referencia y stack

- **Referencia visual y funcional:** `referencia/kivo-landing.html`. Es la landing actual, con el diseño, los colores, la calculadora de precio (con la lógica del ITP por comunidad), el formulario de solicitud, la sección de documentación con ilustraciones, las preguntas frecuentes y la barra fija en móvil. Reutiliza su CSS, su marcado y su JavaScript; no rediseñes.
- **Stack:** Astro (salida estática), CSS propio con los tokens de la referencia (sin Tailwind) y JavaScript vanilla solo para la calculadora, el formulario y el botón de copiar. Las guías van como Markdown/MDX en una *content collection* de Astro.
- **Fuentes:** Plus Jakarta Sans (titulares) y DM Sans (texto), autoalojadas con `@fontsource`. No cargues Google Fonts desde su CDN.
- **Integraciones:** `@astrojs/sitemap`. Nada más salvo que sea imprescindible.
- **Dominio para canónicas y sitemap:** `https://kivo.es`, en una constante de configuración, porque aún no está comprado.

## 2. Marca (resumen)

- **Colores:**
  - Azul Kivo `#3D5AFE`, para el botón principal; una sola acción azul por pantalla.
  - Amarillo vial `#FFD84D`, solo como acento y nunca como texto sobre blanco.
  - Asfalto `#0E1630` para el texto y los bloques oscuros.
  - El resto de tokens, incluido el modo oscuro, están en la referencia.
- **Voz:**
  - Tutea, frases cortas, voz activa y sin emojis.
  - Cifras exactas ("89 €", "55,70 €").
  - Escribe primero qué hacemos ("transferencia de coche online") y después el guiño.
- **Prohibido:**
  - Prometer plazos que dependen de la DGT o de Hacienda.
  - Decir "la más barata".
  - Inventar opiniones, testimonios o cifras de clientes.
- **Formatos:** "89 €" con espacio, "6.000 €", "4 %", matrícula de ejemplo siempre "1234 MBC".

## 3. Proceso de negocio (importante)

**No hay pago online.** El usuario calcula su precio, envía un **formulario de solicitud** y una persona del equipo le escribe por email **en menos de 24 horas** para empezar.

El formulario (ya está en la referencia) tiene estos campos:
- Rol: quien compra o quien vende.
- Matrícula, nombre, móvil y email.
- Comentario opcional.
- Casilla de privacidad obligatoria.

Haz que envíe por `fetch` a un endpoint configurable por variable de entorno (`PUBLIC_FORM_ENDPOINT`, compatible con Formspree o similar). Si la variable no existe, muestra la pantalla de éxito sin enviar nada y avisa por consola.

## 4. Arquitectura y URLs

Todas las URLs en minúscula, sin tildes y con barra final. **No hay hub del ITP en esta versión.**

```
/                                          Portada
/precio-transferencia-coche/
/documentacion-transferencia-coche/
/transferencia-moto/
/vender-coche/
/guias/                                    Índice del blog
/guias/como-hacer-transferencia-coche/
/guias/quien-paga-transferencia-coche/
/guias/plazo-transferencia-coche/
/guias/transferencia-coche-sin-certificado-digital/
/guias/transferencia-coche-entre-familiares/
/guias/transferencia-coche-herencia/
/guias/transferencia-coche-reserva-de-dominio/
/guias/notificacion-de-venta-dgt/
/guias/valor-fiscal-coche-hacienda/
/guias/tasa-dgt-transferencia/
/aviso-legal/  /privacidad/  /cookies/     (plantillas marcadas como borrador, noindex)
/404
```

- **Menú:** Cómo funciona (`/#como`), Precio, Documentos, Motos, Si vendes, Guías y el botón "Calcular mi precio".
- **Pie:** todas las comerciales, el índice de guías, las 4 guías principales (cómo hacerla, quién paga, plazo, sin certificado) y las páginas legales.

## 5. Páginas comerciales

### `/` · Portada
- **Palabra clave:** transferencia coche. **Secundarias:** transferencia de coche online, cambio de nombre coche, gestoría transferencia coche.
- **Title:** `Transferencia de coche online, sin ir a Tráfico | Kivo · 89 €`
- **Meta description:** `Hacemos la transferencia de tu coche online: cambio de titular en la DGT, impuesto y papeleo por 89 €. Calcula tu total y te escribimos en menos de 24 h.`
- **H1:** Transferencia de coche online, sin ir a Tráfico.
- **Contenido:** la referencia, pero la sección de documentación se queda en un **resumen** (3 documentos y un enlace a `/documentacion-transferencia-coche/`) y la tabla del ITP **pasa a Precio**.
- **"Cambio de nombre":** incluye un H2 con "cambiar el coche de nombre" para cubrir esa búsqueda en la misma página.
- **Enlaces a guías desde las preguntas frecuentes:** cómo hacerla, plazo y sin certificado.

### `/precio-transferencia-coche/`
- **Palabra clave:** cuánto cuesta la transferencia de un coche. **Secundarias:** coste transferencia coche, precio cambio de nombre coche.
- **Title:** `¿Cuánto cuesta la transferencia de un coche en 2026? | Kivo`
- **H1:** ¿Cuánto cuesta la transferencia de un coche en 2026?
- **H2:**
  - Lo que pagas: honorarios, tasa de la DGT e impuesto.
  - Calcula tu total (calculadora completa).
  - Por qué el impuesto puede salir más alto que tu precio (enlace a la guía de valor fiscal).
  - ITP por comunidad autónoma (la tabla de la referencia, con botones que ponen la comunidad en la calculadora).
  - Tres ejemplos de total.
  - Kivo, gestoría de barrio o hacerlo tú.
  - Garantía.
  - Preguntas frecuentes (enlaces a las guías de quién paga y tasa DGT).

### `/documentacion-transferencia-coche/`
- **Palabra clave:** documentos transferencia coche. **Secundaria:** papeles para cambiar el nombre de un coche.
- **Title:** `Documentos para la transferencia de un coche (2026) | Kivo`
- **H1:** Documentos para la transferencia de un coche.
- **Contenido:** la sección completa de documentación de la referencia (lista por comprador y vendedor, ejemplos ilustrados de DNI, permiso de circulación y ficha técnica, cómo hacer las fotos, cómo enviarlas y casos especiales).
- **Casos especiales:** cada uno enlaza a su guía (herencia, familiares, reserva de dominio).

### `/transferencia-moto/`
- **Palabra clave:** transferencia moto. **Secundarias:** cambio de nombre moto, transferencia ciclomotor.
- **Title:** `Transferencia de moto online, sin ir a Tráfico | Kivo`
- **H1:** Transferencia de moto online.
- **Calculadora:** con "Moto" preseleccionado (atributo `data-veh="moto"`).
- **H2:**
  - Cómo funciona con una moto.
  - Documentos.
  - Cuánto cuesta (tasa de 55,70 € para motos y de 27,85 € para ciclomotores; los ciclomotores están exentos de ITP en Illes Balears y Navarra).
  - Preguntas frecuentes (enlace a la guía de la tasa).

### `/vender-coche/`
- **Palabra clave:** vender coche a particular. **Secundarias:** qué hacer al vender un coche, dejar de ser titular.
- **Title:** `Vendes tu coche: deja de ser el titular sin ir a Tráfico | Kivo`
- **H1:** Vendes tu coche: deja de ser el titular.
- **H2:**
  - Qué pasa si el coche sigue a tu nombre (multas, impuesto de circulación del 1 de enero).
  - Qué tienes que hacer tú (DNI, permiso, ficha técnica y firma).
  - Envíale esto al comprador (el bloque de copiar mensaje de la referencia).
  - Notificación de venta o transferencia (enlace a la guía).
  - Plazos (enlace a la guía).
  - Preguntas frecuentes.

## 6. Blog: índice y 10 guías

### `/guias/`
- **Title:** `Guías sobre la transferencia de coches | Kivo`
- **Contenido:** H1, una frase de introducción y las 10 guías en tarjetas (título, resumen de una línea y tiempo de lectura), agrupadas en "Hacer la transferencia", "Casos especiales" e "Impuestos y tasas".

### Plantilla de cada guía (componente `GuideLayout`)

1. Migas de pan (Inicio › Guías › Título).
2. H1 con la palabra clave y "Actualizado: noviembre de 2026" debajo.
3. **Respuesta corta** de 2 o 3 frases, en una caja, para el fragmento destacado de Google.
4. Índice de contenidos generado a partir de los H2.
5. Cuerpo de **800 a 1.200 palabras**, con los H2 indicados abajo. Los enlaces salientes van **dentro del texto**, justo donde se cita el dato.
6. Una caja de llamada a la acción a mitad del texto: "¿Prefieres que lo hagamos nosotros? Calcula tu precio" (enlace a `/#calculadora`).
7. De 4 a 5 preguntas frecuentes en `<details>`, con marcado FAQPage.
8. Bloque "Fuentes oficiales" con todos los enlaces salientes.
9. "Guías relacionadas": 3 tarjetas.
10. Llamada a la acción final.

- **Enlaces salientes:** `target="_blank" rel="noopener"`, sin `nofollow`, solo a DGT, BOE, AEAT, RACE y Consejo de Gestores. Nunca a gestorías de la competencia.
- **Mínimos por guía:** 2 enlaces salientes oficiales y 3 internos (1 a una comercial y 2 a guías).
- **Texto de los enlaces internos:** descriptivo y variado. Hacia la portada alterna "transferencia de coche online", "cambio de nombre del coche", "gestoría online" y "hacerla con Kivo"; nunca "haz clic aquí".

### Las 10 guías

**1. `/guias/como-hacer-transferencia-coche/`**
- **Palabra clave:** cómo hacer la transferencia de un coche.
- **Title:** `Cómo hacer la transferencia de un coche paso a paso (2026)`
- **H2:**
  - Qué es la transferencia.
  - Antes de empezar: comprueba el coche (informe de la DGT, cargas e ITV).
  - Paso 1: contrato de compraventa.
  - Paso 2: pagar el ITP (modelo 620).
  - Paso 3: pagar la tasa de la DGT.
  - Paso 4: presentarla en la DGT (online, presencial o con gestoría).
  - Paso 5: el nuevo permiso de circulación.
  - Cuánto cuesta en total.
- **Salientes:** DGT transferencias y AEAT instrucciones del modelo 620.
- **Internos:** portada, documentación, guía de plazo y guía de tasa.

**2. `/guias/quien-paga-transferencia-coche/`**
- **Palabra clave:** quién paga la transferencia de un coche.
- **H2:**
  - La respuesta legal: el ITP lo paga el comprador.
  - La tasa de la DGT.
  - ¿Se puede pactar otra cosa?
  - Qué le toca al vendedor.
  - Ejemplo de reparto.
  - Qué pasa si el comprador no la hace.
- **Salientes:** AEAT modelo 620 y DGT transferencias.
- **Internos:** precio, guía de valor fiscal y guía de notificación de venta.

**3. `/guias/plazo-transferencia-coche/`**
- **Palabra clave:** plazo transferencia coche.
- **H2:**
  - 30 días para comunicarla a la DGT.
  - 30 días hábiles para pagar el ITP.
  - Qué pasa si te pasas del plazo (recargos de Hacienda; el coche sigue a nombre del vendedor).
  - Cómo protegerte si vendes.
  - Cuánto tarda una vez presentada (sin prometer plazos).
- **Salientes:** BOE Reglamento General de Vehículos y AEAT modelo 620.
- **Internos:** portada, vender coche y guía de cómo hacerla.

**4. `/guias/transferencia-coche-sin-certificado-digital/`**
- **Palabra clave:** transferencia coche sin certificado digital.
- **H2:**
  - ¿Hace falta certificado digital?
  - Opción 1: en persona, con cita en Tráfico.
  - Opción 2: con Cl@ve.
  - Opción 3: con una gestoría que presente por ti.
  - Comparativa de las tres opciones (tabla).
  - Qué firma cada uno.
- **Salientes:** DGT transferencias y clave.gob.es.
- **Internos:** portada, documentación y guía de cómo hacerla.

**5. `/guias/transferencia-coche-entre-familiares/`**
- **Palabra clave:** transferencia coche entre familiares (y "de padre a hijo").
- **H2:**
  - Venta o donación: dos caminos.
  - Si es una venta: ITP sobre el mayor entre el precio y el valor fiscal (un precio simbólico no baja el impuesto).
  - Si es una donación: Impuesto de Sucesiones y Donaciones en la comunidad de quien recibe el coche.
  - Documentos en cada caso.
  - Cuál conviene (depende de la comunidad; sin dar cifras de bonificaciones).
- **Salientes:** DGT donaciones, herencias y divorcios, y Consejo de Gestores, precios medios 2026.
- **Internos:** precio, guía de valor fiscal y guía de herencia.

**6. `/guias/transferencia-coche-herencia/`**
- **Palabra clave:** transferencia coche herencia.
- **H2:**
  - Qué hay que hacer cuando fallece el titular.
  - Varios herederos: uno queda como titular.
  - Documentos (declaración responsable, justificante de Sucesiones, solicitud y tasa).
  - Si el coche está de baja temporal.
  - Si los herederos quieren venderlo.
- **Salientes:** DGT fallecimiento del titular con adjudicatario y RACE heredar un coche.
- **Internos:** documentación, guía de familiares y guía de tasa.

**7. `/guias/transferencia-coche-reserva-de-dominio/`**
- **Palabra clave:** transferencia coche con reserva de dominio.
- **H2:**
  - Qué es la reserva de dominio.
  - Cómo saber si un coche la tiene (informe de la DGT).
  - Por qué bloquea la transferencia.
  - Cómo cancelarla: carta de la financiera y Registro de Bienes Muebles.
  - La alternativa de asumir la deuda (subrogación).
  - Reserva, embargo y precinto no son lo mismo.
  - Qué mirar antes de pagar.
- **Salientes:** DGT transferencia de vehículos con cargas financieras.
- **Internos:** portada (revisamos cargas antes de nada), guía de cómo hacerla y vender coche.

**8. `/guias/notificacion-de-venta-dgt/`**
- **Palabra clave:** notificación de venta DGT.
- **H2:**
  - Qué es.
  - Para qué sirve.
  - No sustituye a la transferencia.
  - Requisitos y documentos.
  - Cuánto cuesta.
  - Cómo hacerla, online o en persona.
  - ¿Hace falta si la transferencia la hace Kivo? (No: el coche pasa directamente al comprador.)
- **Salientes:** DGT notificación de venta.
- **Internos:** vender coche, guía de plazo y guía de quién paga.

**9. `/guias/valor-fiscal-coche-hacienda/`**
- **Palabra clave:** valor fiscal coche Hacienda.
- **H2:**
  - Qué es el valor fiscal.
  - De dónde sale (Orden HAC/1501/2025).
  - La tabla de depreciación por años.
  - Ejemplo de cálculo.
  - Por qué importa: el ITP se calcula sobre el mayor entre el precio y el valor fiscal.
  - Cómo consultar el de tu coche.
  - Qué pasa si declaras menos (complementarias).
- **Salientes:** Consejo de Gestores (Orden HAC/1501/2025), BOE de la orden y Sede de la AEAT.
- **Internos:** precio, guía de quién paga y guía de familiares.

**10. `/guias/tasa-dgt-transferencia/`**
- **Palabra clave:** tasa DGT transferencia 2026.
- **H2:**
  - Cuánto es en 2026.
  - Ciclomotores.
  - Otras tasas relacionadas (notificación de venta).
  - Quién la paga.
  - Cómo se paga.
  - Tasa e ITP no son lo mismo.
  - Total aproximado de una transferencia.
- **Salientes:** DGT transferencias y DGT notificación de venta.
- **Internos:** precio, transferencia de moto y guía de notificación de venta.

### URLs de fuentes ya comprobadas
- DGT transferencias: https://sede.dgt.gob.es/es/vehiculos/transferencias-de-vehiculos/
- DGT cargas financieras: https://sede.dgt.gob.es/es/vehiculos/transferencias-de-vehiculos/transferencia-de-vehiculos-con-cargas-financieras/
- DGT fallecimiento del titular con adjudicatario: https://sede.dgt.gob.es/es/vehiculos/transferencias-de-vehiculos/transferencia-de-un-vehiculo-por-fallecimiento-del-titular-con-adjudicatario/
- DGT donaciones, herencias y divorcios: https://www.dgt.es/nuestros-servicios/tu-vehiculo/donaciones-herencias-y-divorcios-o-separaciones/index.html
- DGT notificación de venta (comprueba que existe la versión /es/; si no, usa esta): https://sede.dgt.gob.es/eu/vehiculos/transferencias-de-vehiculos/notificacion-de-venta/
- BOE, Reglamento General de Vehículos: https://www.boe.es/eli/es/rd/1998/12/23/2822/con
- AEAT, instrucciones del modelo 620: https://www3.agenciatributaria.gob.es/static_files/Sede/Procedimiento_ayuda/GC12/620/instrucciones620.pdf
- Consejo de Gestores, precios medios 2026: https://www.consejogestores.org/noticias/precios-medios-2026-vehiculos-embarcaciones/
- RACE, heredar un coche: https://www.race.es/tramites-heredar-coche
- Cl@ve: https://clave.gob.es/

### Datos verificados (úsalos tal cual)
- **Tasa DGT de transferencia:** tasa 1.5, 55,70 € (coches y motos). En presencial se paga solo con tarjeta.
- **Notificación de venta:** tasa 4.1, 8,67 €. La hace el vendedor, online (DNIe, certificado o Cl@ve) o en persona con cita. La responsabilidad pasa al comprador desde la fecha de notificación. Requisitos: vehículo de alta, impuesto de circulación del año anterior pagado y sin sanciones pendientes. No sustituye a la transferencia.
- **Plazo DGT:** el comprador debe hacer la transferencia como máximo 30 días después de firmar el contrato.
- **Modelo 620 (ITP):** 30 días hábiles desde el contrato. El sujeto pasivo es el comprador.
- **Reserva de dominio:** mientras no se cancele, no se puede hacer la transferencia ni la notificación de venta, salvo que el comprador se subrogue en la deuda. Para cancelarla: carta de cancelación de la financiera y trámite en el Registro de Bienes Muebles.
- **Embargo:** se puede transferir si el comprador lo reconoce por escrito o consta en el contrato.
- **Precinto:** se puede transferir, pero no se emite el permiso de circulación hasta cancelarlo.
- **Herencia:**
  - Varios herederos deben acordar uno como titular y firmar una declaración responsable.
  - Hay que justificar el pago, la exención o la no sujeción del Impuesto de Sucesiones en la comunidad del fallecido.
  - La tasa es la misma de 55,70 €.
  - Si el coche está de baja temporal, primero hay que darlo de alta.
- **Donación:** se paga el Impuesto de Sucesiones y Donaciones en la comunidad de quien recibe el coche. Hace falta un documento de donación firmado por ambos, con los datos del vehículo, la fecha y la hora.
- **Valor fiscal 2026:**
  - Lo fija la Orden HAC/1501/2025 (BOE del 23 de diciembre de 2025, en vigor desde el 1 de enero de 2026) y se aplica en el ITP, Sucesiones y Donaciones y el impuesto de matriculación.
  - Es el precio medio del modelo nuevo multiplicado por un porcentaje según los años.
  - Porcentajes: 100 % hasta 1 año, 84 %, 67 %, 56 %, 47 %, 39 %, 34 %, 28 %, 24 % y 19 % en los tramos siguientes, y 10 % en el último.
- **ITP por comunidad:** la tabla y la lógica de cuotas fijas y exenciones están en la referencia. No las cambies.

### Verifica en la fuente oficial antes de publicar (y avísame si algo no cuadra)
- El tramo final de la tabla de depreciación. Una fuente indica "más de 12 años: 10 %" y otra "más de 10 años: 10 %": revisa el Anexo IV de la orden en el BOE y usa la tabla completa.
- La tasa de ciclomotores (27,85 €, tasa 1.2) en la sede de la DGT.
- El plazo general del Impuesto de Sucesiones, si lo mencionas en la guía de herencia.
- Que cada URL saliente responde con código 200.

## 7. SEO técnico

- **Por página:** `<title>`, meta description de 140 a 155 caracteres, canónica absoluta, Open Graph y Twitter Card, y `lang="es"`.
- **Datos estructurados JSON-LD:**
  - Portada: `Organization` y `Service`, con una `Offer` de 89 EUR y `areaServed` España.
  - Todas las páginas menos la portada: `BreadcrumbList`.
  - Páginas con preguntas frecuentes: `FAQPage`.
  - Guías: `Article`, con `author` y `publisher` Kivo, `datePublished` y `dateModified`.
- **Sitemap y robots:** `sitemap.xml` automático (sin las páginas legales en borrador) y `robots.txt` que lo enlace.
- **Encabezados:** un solo H1 por página y H2 o H3 en orden.
- **Imágenes:** con `alt` descriptivo, `width`/`height` y carga diferida fuera del primer pantallazo. Las ilustraciones de documentos van como SVG inline, como en la referencia.
- **Calculadora:** las cifras de la tabla del ITP están en el HTML estático, no solo generadas por JavaScript.
- **Profundidad:** ninguna página a más de 2 clics de la portada.
- **Rendimiento:** Lighthouse en móvil de 95 o más en Rendimiento, Accesibilidad, Buenas prácticas y SEO. Sin librerías de terceros en el cliente.

## 8. Contenido que NO debes inventar

Pon estos textos con un comentario `<!-- VALIDAR -->` para que los revise:
- "Tramitado por gestores administrativos colegiados".
- La garantía de devolución de los 89 €.
- El rango de precios de las gestorías (100–160 €).
- El usuario de redes y el dominio.
- Las páginas legales: estructura y encabezados, sin redactar la política.

No añadas testimonios, valoraciones, número de clientes ni sellos de terceros.

## 9. Criterios de aceptación

- `npm run build` sin errores ni avisos.
- Un script `npm run check:links` que recorre `dist/` y falla si hay enlaces internos rotos o anclas inexistentes.
- Un script `npm run check:content` que comprueba, para cada guía:
  - Entre 800 y 1.200 palabras.
  - Al menos 2 enlaces salientes a dominios de la lista blanca.
  - Al menos 3 enlaces internos.
  - Una caja de respuesta corta y preguntas frecuentes.
  - Title y meta description dentro de los límites.
- A 390 px de ancho no hay scroll horizontal en ninguna página.
- La calculadora da 384,70 € para un coche de 6.000 €, 8 años y Comunidad de Madrid; y la tabla del ITP de Precio pone la comunidad en la calculadora.
- El formulario valida matrícula, móvil, email y casilla de privacidad, y muestra la pantalla de éxito.

Al terminar, dame un resumen con:
- El árbol de archivos.
- La lista de páginas con title y palabra clave.
- Los resultados de los checks.
- Todo lo marcado como `VALIDAR`.
- Cualquier dato que no hayas podido verificar.
