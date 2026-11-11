/**
 * POST /api/solicitud — función de Vercel que recibe los formularios de
 * solicitud (hero y calculadora) y envía dos emails.
 *
 * Cómo envía:
 *   - Sin RESEND_API_KEY (ahora): con FormSubmit, sin cuenta. Los
 *     destinatarios salen de LEAD_DESTINATARIOS en site.config.mjs.
 *   - Con RESEND_API_KEY en Vercel: con Resend, con los emails con diseño
 *     de abajo y remitente @gestoriakivo.com.
 *
 * Los dos emails:
 *
 *   1. Al equipo (LEAD_DESTINATARIOS), con todos los datos del lead.
 *      «Responder» contesta directamente al cliente.
 *   2. Al cliente, un acuse automático: el equipo de Kivo está gestionando
 *      su petición. En inglés si la solicitud viene de /en/.
 *
 * Variables de entorno, todas opcionales (Vercel → Settings → Environment
 * Variables):
 *   RESEND_API_KEY      clave de Resend; sin ella se usa FormSubmit
 *   LEAD_DESTINATARIOS  emails separados por comas; si está, manda sobre
 *                       LEAD_DESTINATARIOS de site.config.mjs
 *   LEAD_REMITENTE      solo con Resend: «Kivo <hola@gestoriakivo.com>»,
 *                       con el dominio verificado en Resend
 *   LEAD_RESPONDER_A    a dónde van las respuestas del cliente al acuse
 *                       (por defecto, el primer destinatario)
 */
import {
  SITE_URL,
  WHATSAPP,
  RAZON_SOCIAL,
  DOMICILIO_TEXTO,
  LEAD_DESTINATARIOS,
} from '../site.config.mjs';

const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Texto seguro para meter en el HTML del email. */
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Recorta y limpia un campo de texto libre. */
const campo = (v, max = 200) => String(v ?? '').trim().slice(0, max);

const whatsappTexto = WHATSAPP ? `+${WHATSAPP.slice(0, 2)} ${WHATSAPP.slice(2, 5)} ${WHATSAPP.slice(5, 7)} ${WHATSAPP.slice(7, 9)} ${WHATSAPP.slice(9)}` : null;

async function enviar(clave, email) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(email),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Email al equipo con todos los datos. */
function emailEquipo(d) {
  const filas = [
    ['Rol', d.rol === 'vendedor' ? 'Vende' : 'Compra'],
    ['Matrícula', d.matricula],
    ['Nombre', d.nombre],
    ['Móvil', d.telefono],
    ['Email', d.email],
    ['Comentario', d.mensaje || '—'],
    ['Vehículo', d.vehiculo],
    ['Comunidad', d.comunidad],
    ['ITP estimado', d.itp_estimado],
    ['Total estimado', d.total_estimado],
    ['Idioma', d.idioma === 'en' ? 'Inglés' : 'Español'],
    ['Formulario', d.origen === 'hero' ? 'Formulario principal' : 'Calculadora'],
    ['Página', d.pagina ? SITE_URL + d.pagina : ''],
  ].filter(([, v]) => v);

  const html = `
  <div style="font-family:Arial,sans-serif;color:#0e1630;max-width:560px">
    <h2 style="margin:0 0 4px">Nueva solicitud de traspaso</h2>
    <p style="margin:0 0 16px;color:#5a6480">${esc(d.matricula)} · ${esc(d.nombre)}</p>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      ${filas
        .map(
          ([k, v]) =>
            `<tr><td style="padding:8px 10px;border-bottom:1px solid #e3e7f2;color:#5a6480;width:35%">${esc(k)}</td><td style="padding:8px 10px;border-bottom:1px solid #e3e7f2"><b>${esc(v)}</b></td></tr>`
        )
        .join('')}
    </table>
    <p style="margin-top:16px;font-size:13px;color:#5a6480">Si respondes a este email, la respuesta le llega directamente al cliente. Se ha comprometido una respuesta en menos de 24 horas.</p>
  </div>`;
  const text = filas.map(([k, v]) => `${k}: ${v}`).join('\n');
  return { html, text };
}

/** Acuse automático para el cliente. */
function emailCliente(d) {
  const nombre = d.nombre.split(' ')[0];
  const en = d.idioma === 'en';
  const wa = whatsappTexto
    ? en
      ? ` or message us on WhatsApp at ${whatsappTexto}`
      : ` o escríbenos por WhatsApp al ${whatsappTexto}`
    : '';

  const T = en
    ? {
        asunto: `We've received your request · ${d.matricula}`,
        parrafos: [
          `Hi ${nombre},`,
          `Thank you for choosing Kivo. We've received your request for the transfer of vehicle <b>${esc(d.matricula)}</b>, and the Kivo team is already working on it.`,
          `Within 24 hours we'll email you to confirm the exact price with the number plate and explain the next steps. There's nothing to pay until then.`,
          `In the meantime you can get these photos ready: ID (DNI, NIE or TIE) of buyer and seller, both sides; the registration certificate (<i>permiso de circulación</i>); and the technical sheet (<i>ficha técnica</i>) with a valid ITV.`,
          `If you want to add anything, just reply to this email${wa}.`,
          `Best regards,<br>The Kivo team`,
        ],
        pie: `${RAZON_SOCIAL} · ${DOMICILIO_TEXTO}. You're receiving this email because you sent a request at ${SITE_URL.replace('https://', '')}.`,
      }
    : {
        asunto: `Hemos recibido tu solicitud · ${d.matricula}`,
        parrafos: [
          `Hola ${nombre}:`,
          `Gracias por confiar en Kivo. Hemos recibido tu solicitud para el traspaso del vehículo <b>${esc(d.matricula)}</b> y el equipo de Kivo ya está gestionando tu petición.`,
          `En menos de 24 horas te escribiremos para confirmarte el precio exacto con la matrícula y explicarte los siguientes pasos. No tienes que pagar nada hasta entonces.`,
          `Mientras, puedes ir preparando las fotos: DNI o NIE de comprador y vendedor (por las dos caras), el permiso de circulación y la ficha técnica con la ITV en vigor.`,
          `Si quieres añadir algo, responde a este email${wa}.`,
          `Un saludo,<br>El equipo de Kivo`,
        ],
        pie: `${RAZON_SOCIAL} · ${DOMICILIO_TEXTO}. Recibes este email porque has enviado una solicitud en ${SITE_URL.replace('https://', '')}.`,
      };

  // El nombre lo escribe el cliente: se escapa antes de meterlo en el HTML.
  const parrafosHtml = T.parrafos.map((p, i) => (i === 0 ? esc(p) : p));
  const html = `
  <div style="font-family:Arial,sans-serif;color:#0e1630;max-width:560px;font-size:15px;line-height:1.55">
    <div style="background:#3d5afe;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;font-weight:bold;font-size:20px">kivo</div>
    <div style="border:1px solid #e3e7f2;border-top:0;border-radius:0 0 14px 14px;padding:22px">
      ${parrafosHtml.map((p) => `<p style="margin:0 0 14px">${p}</p>`).join('')}
    </div>
    <p style="font-size:12px;color:#8a93ab;margin-top:14px">${esc(T.pie)}</p>
  </div>`;
  const text = T.parrafos
    .map((p) => p.replace(/<br>/g, '\n').replace(/<[^>]+>/g, ''))
    .concat(['', T.pie])
    .join('\n\n');
  return { asunto: T.asunto, html, text };
}

/**
 * Envío por FormSubmit (formsubmit.co), sin cuenta: reenvía la solicitud al
 * primer destinatario con copia al resto, y manda la respuesta automática al
 * email del cliente (campo «email» + `_autoresponse`).
 *
 * La primera vez, FormSubmit manda un email de «Activate form» al primer
 * destinatario: hasta que no se pulsa, no reenvía nada.
 */
async function enviarFormSubmit(d, destinatarios, responderA) {
  const [principal, ...copias] = destinatarios;
  const acuse = emailCliente(d);
  const datos = {
    _subject: `Nueva solicitud · ${d.matricula} · ${d.nombre}`,
    _template: 'table',
    _captcha: 'false',
    ...(copias.length ? { _cc: copias.join(',') } : {}),
    _autoresponse: acuse.text,
    Rol: d.rol === 'vendedor' ? 'Vende' : 'Compra',
    Matrícula: d.matricula,
    Nombre: d.nombre,
    Móvil: d.telefono,
    email: d.email,
    Comentario: d.mensaje || '—',
    ...(d.comunidad ? { Vehículo: d.vehiculo, Comunidad: d.comunidad, 'ITP estimado': d.itp_estimado, 'Total estimado': d.total_estimado } : {}),
    Idioma: d.idioma === 'en' ? 'Inglés' : 'Español',
    Formulario: d.origen === 'hero' ? 'Formulario principal' : 'Calculadora',
    Página: d.pagina ? SITE_URL + d.pagina : '',
    'Responder al cliente': `Responde a este email o escribe a ${d.email}. Las respuestas del cliente al acuse van a ${responderA}.`,
  };
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(principal)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      // FormSubmit asocia el formulario a la web desde la que se envía.
      Origin: SITE_URL,
      Referer: SITE_URL + '/',
    },
    body: JSON.stringify(datos),
  });
  const cuerpo = await res.json().catch(() => ({}));
  if (!res.ok || String(cuerpo.success) !== 'true') {
    throw new Error(`FormSubmit ${res.status}: ${cuerpo.message ?? 'sin respuesta'}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método no permitido' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ ok: false, error: 'JSON no válido' });
    }
  }
  body = body ?? {};

  // Trampa para bots: el campo «web» está oculto a las personas. Si viene
  // relleno, se responde «ok» sin enviar nada para que el bot no reintente.
  if (campo(body.web)) return res.status(200).json({ ok: true });

  const d = {
    rol: campo(body.rol, 20),
    matricula: campo(body.matricula, 12).toUpperCase(),
    nombre: campo(body.nombre, 120),
    telefono: campo(body.telefono, 20),
    email: campo(body.email, 200),
    mensaje: campo(body.mensaje, 2000),
    vehiculo: campo(body.vehiculo, 20),
    comunidad: campo(body.comunidad, 60),
    itp_estimado: campo(body.itp_estimado, 20),
    total_estimado: campo(body.total_estimado, 20),
    idioma: body.idioma === 'en' ? 'en' : 'es',
    origen: campo(body.origen, 20),
    pagina: campo(body.pagina, 200),
  };

  if (!d.matricula || d.nombre.length < 2 || !d.telefono || !RE_EMAIL.test(d.email)) {
    return res.status(400).json({ ok: false, error: 'Faltan datos de la solicitud' });
  }

  const clave = process.env.RESEND_API_KEY;
  const destinatarios = (process.env.LEAD_DESTINATARIOS ?? LEAD_DESTINATARIOS.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter((s) => RE_EMAIL.test(s));
  const remitente = process.env.LEAD_REMITENTE || 'Kivo <hola@gestoriakivo.com>';
  const responderA = process.env.LEAD_RESPONDER_A || destinatarios[0];

  if (destinatarios.length === 0) {
    console.error('[solicitud] No hay destinatarios: LEAD_DESTINATARIOS vacío.');
    return res.status(500).json({ ok: false, error: 'Envío no configurado' });
  }

  // Sin cuenta de Resend todavía: FormSubmit hace los dos envíos (al equipo y
  // el acuse al cliente) en una sola llamada.
  if (!clave) {
    try {
      await enviarFormSubmit(d, destinatarios, responderA);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('[solicitud] FormSubmit no ha aceptado la solicitud:', e);
      return res.status(502).json({ ok: false, error: 'No se ha podido enviar' });
    }
  }

  // 1) Al equipo. Si esto falla, la solicitud no ha llegado: error al cliente.
  try {
    const eq = emailEquipo(d);
    await enviar(clave, {
      from: remitente,
      to: destinatarios,
      reply_to: d.email,
      subject: `Nueva solicitud · ${d.matricula} · ${d.nombre}`,
      html: eq.html,
      text: eq.text,
    });
  } catch (e) {
    console.error('[solicitud] No se ha podido enviar al equipo:', e);
    return res.status(502).json({ ok: false, error: 'No se ha podido enviar' });
  }

  // 2) Acuse al cliente. Si falla, la solicitud ya está en manos del equipo:
  //    se registra el error pero el cliente ve el éxito igualmente.
  try {
    const cl = emailCliente(d);
    await enviar(clave, {
      from: remitente,
      to: [d.email],
      reply_to: responderA,
      subject: cl.asunto,
      html: cl.html,
      text: cl.text,
    });
  } catch (e) {
    console.error('[solicitud] No se ha podido enviar el acuse al cliente:', e);
  }

  return res.status(200).json({ ok: true });
}
