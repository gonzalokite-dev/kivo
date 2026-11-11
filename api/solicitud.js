/**
 * POST /api/solicitud — función de Vercel que recibe los formularios de
 * solicitud (hero y calculadora) y envía dos emails.
 *
 * Envía con el buzón de correo de Arsys del dominio (SMTP). Los
 * destinatarios salen de LEAD_DESTINATARIOS en site.config.mjs.
 *
 * Los dos emails:
 *
 *   1. Al equipo (LEAD_DESTINATARIOS), con todos los datos del lead en
 *      bloques. «Responder» contesta directamente al cliente.
 *   2. Al cliente, un acuse automático: el equipo de Kivo está gestionando
 *      su petición. En inglés si la solicitud viene de /en/.
 *
 * Variables de entorno (Vercel → Settings → Environment Variables):
 *   SMTP_USUARIO        el buzón de Arsys, p. ej. hola@gestoriakivo.com (obligatoria)
 *   SMTP_CLAVE          su contraseña (obligatoria)
 *   SMTP_HOST           por defecto smtp.serviciodecorreo.es (Arsys)
 *   SMTP_PUERTO         por defecto 465 (SSL); 587 para STARTTLS
 *   LEAD_DESTINATARIOS  emails separados por comas; si está, manda sobre
 *                       LEAD_DESTINATARIOS de site.config.mjs
 *   LEAD_RESPONDER_A    a dónde van las respuestas del cliente al acuse
 *                       (por defecto, el primer destinatario)
 *   RESEND_API_KEY      alternativa a Arsys: solo se usa si no hay SMTP
 */
import nodemailer from 'nodemailer';
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

/** Solo para las pruebas automáticas: sustituye el envío real. */
let envioDePrueba = null;
export const __probarCon = (fn) => {
  envioDePrueba = fn;
};

/**
 * Prepara el envío según lo que haya en Vercel:
 *   - SMTP_USUARIO + SMTP_CLAVE: el buzón de Arsys (la opción elegida). El
 *     remitente es ese mismo buzón: Arsys solo deja enviar como el usuario
 *     con el que se entra, y el SPF del dominio ya le autoriza.
 *   - RESEND_API_KEY: Resend, por si algún día se cambia.
 * Cada email es { from, to, replyTo, subject, html, text }.
 * Devuelve null si no hay nada configurado.
 */
function preparaEnvio() {
  if (envioDePrueba) return { remitente: 'Kivo <prueba@gestoriakivo.com>', enviar: envioDePrueba };

  const usuario = process.env.SMTP_USUARIO;
  const clave = process.env.SMTP_CLAVE;
  if (usuario && clave) {
    const puerto = Number(process.env.SMTP_PUERTO || 465);
    const transporte = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.serviciodecorreo.es',
      port: puerto,
      secure: puerto === 465,
      auth: { user: usuario, pass: clave },
    });
    return {
      remitente: process.env.LEAD_REMITENTE || `Kivo <${usuario}>`,
      enviar: (m) => transporte.sendMail(m),
    };
  }

  const claveResend = process.env.RESEND_API_KEY;
  if (claveResend) {
    return {
      remitente: process.env.LEAD_REMITENTE || 'Kivo <hola@gestoriakivo.com>',
      enviar: async (m) => {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${claveResend}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...m, reply_to: m.replyTo, replyTo: undefined }),
        });
        if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
      },
    };
  }
  return null;
}

/** «600123456» → «600 123 456»; «+34600123456» → «+34 600 123 456». Los
 *  extranjeros se dejan como vienen. */
function movilLegible(t) {
  const m = t.replace(/\s/g, '').match(/^(\+34)?(\d{3})(\d{3})(\d{3})$/);
  return m ? `${m[1] ? m[1] + ' ' : ''}${m[2]} ${m[3]} ${m[4]}` : t;
}

const VEHICULOS = { coche: 'Coche', moto: 'Moto', ciclo: 'Ciclomotor' };

/**
 * La ficha del lead, en bloques y en orden de uso: quién es y cómo
 * contactarle, qué vehículo y cuánto le hemos estimado, y de dónde viene.
 * La usan el email al equipo y su versión en texto plano.
 */
function fichaLead(d) {
  const quien = d.rol === 'vendedor' ? 'vende' : 'compra';
  const recibida = new Date().toLocaleString('es-ES', {
    timeZone: 'Europe/Madrid',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  const secciones = [
    {
      titulo: 'Cliente',
      filas: [
        ['Nombre', d.nombre],
        ['Es quien', d.rol === 'vendedor' ? 'Vende el vehículo' : 'Compra el vehículo'],
        ['Móvil', movilLegible(d.telefono)],
        ['Email', d.email],
        ['Comentario', d.mensaje || 'Sin comentario'],
      ],
    },
    {
      titulo: 'Vehículo',
      filas: [
        ['Matrícula', d.matricula || 'Sin indicar (pedírsela al cliente)'],
        ['Tipo', VEHICULOS[d.vehiculo] ?? ''],
        ['Comunidad del comprador', d.comunidad],
        ['ITP estimado', d.itp_estimado],
        ['Total estimado', d.total_estimado ? `${d.total_estimado} (89 € + tasa + ITP)` : ''],
      ],
    },
    {
      titulo: 'Solicitud',
      filas: [
        ['Recibida', recibida],
        ['Desde', `${d.origen === 'hero' ? 'Formulario principal' : 'Calculadora'} · ${d.pagina ? SITE_URL.replace('https://', '') + d.pagina : 'web'}`],
        ['Idioma', d.idioma === 'en' ? 'Inglés (responder en inglés)' : 'Español'],
      ],
    },
  ].map((s) => ({ ...s, filas: s.filas.filter(([, v]) => v) }));

  const resumen = [
    `${d.nombre} (${quien})`,
    d.matricula,
    d.comunidad,
    d.total_estimado ? `total estimado ${d.total_estimado}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    asunto: `Nueva solicitud de traspaso · ${d.matricula || 'sin matrícula'} · ${d.nombre} (${quien})`,
    resumen,
    secciones,
    siguiente: d.matricula
      ? 'Escribir al cliente en menos de 24 h para confirmar el precio exacto con la matrícula y pedirle las fotos de los documentos.'
      : 'Escribir al cliente en menos de 24 h para pedirle la matrícula, confirmar el precio exacto y pedirle las fotos de los documentos.',
  };
}

/** Email al equipo con todos los datos (envío con Resend). */
function emailEquipo(d) {
  const f = fichaLead(d);
  const celda = 'padding:8px 12px;border-bottom:1px solid #e3e7f2;font-size:14px;vertical-align:top';
  const bloques = f.secciones
    .map(
      (s) => `
      <tr><td colspan="2" style="padding:18px 12px 6px;font-size:12px;font-weight:bold;letter-spacing:.08em;text-transform:uppercase;color:#2a44d8">${esc(s.titulo)}</td></tr>
      ${s.filas
        .map(
          ([k, v]) =>
            `<tr><td style="${celda};color:#5a6480;width:38%">${esc(k)}</td><td style="${celda}"><b>${esc(v)}</b></td></tr>`
        )
        .join('')}`
    )
    .join('');

  const html = `
  <div style="font-family:Arial,sans-serif;color:#0e1630;max-width:600px">
    <div style="background:#3d5afe;color:#fff;padding:16px 20px;border-radius:12px 12px 0 0">
      <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.85">Nueva solicitud de traspaso</div>
      <div style="font-size:20px;font-weight:bold;margin-top:4px">${d.matricula ? esc(d.matricula) + ' · ' : ''}${esc(d.nombre)}</div>
    </div>
    <div style="border:1px solid #e3e7f2;border-top:0;border-radius:0 0 12px 12px;padding:6px 8px 14px">
      <table style="border-collapse:collapse;width:100%">${bloques}</table>
      <div style="margin:16px 12px 0;padding:12px 14px;background:#fff7d6;border-radius:10px;font-size:14px">
        <b>Siguiente paso:</b> ${esc(f.siguiente)}
      </div>
    </div>
    <p style="margin-top:12px;font-size:12px;color:#8a93ab">Si respondes a este email, la respuesta le llega directamente al cliente.</p>
  </div>`;

  const text = [
    f.resumen,
    ...f.secciones.flatMap((s) => ['', s.titulo.toUpperCase(), ...s.filas.map(([k, v]) => `${k}: ${v}`)]),
    '',
    `SIGUIENTE PASO: ${f.siguiente}`,
  ].join('\n');
  return { asunto: f.asunto, html, text };
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
        asunto: d.matricula ? `We've received your request · ${d.matricula}` : `We've received your request`,
        parrafos: [
          `Hi ${nombre},`,
          `Thank you for choosing Kivo. We've received your request for the transfer of ${d.matricula ? `vehicle <b>${esc(d.matricula)}</b>` : 'your vehicle'}, and the Kivo team is already working on it.`,
          `Within 24 hours we'll email you to confirm the exact price with the number plate and explain the next steps. There's nothing to pay until then.`,
          `In the meantime you can get these photos ready: ID (DNI, NIE or TIE) of buyer and seller, both sides; the registration certificate (<i>permiso de circulación</i>); and the technical sheet (<i>ficha técnica</i>) with a valid ITV.`,
          `If you want to add anything, just reply to this email${wa}.`,
          `Best regards,<br>The Kivo team`,
        ],
        pie: `${RAZON_SOCIAL} · ${DOMICILIO_TEXTO}. You're receiving this email because you sent a request at ${SITE_URL.replace('https://', '')}.`,
      }
    : {
        asunto: d.matricula ? `Hemos recibido tu solicitud · ${d.matricula}` : 'Hemos recibido tu solicitud',
        parrafos: [
          `Hola ${nombre}:`,
          `Gracias por confiar en Kivo. Hemos recibido tu solicitud para el traspaso ${d.matricula ? `del vehículo <b>${esc(d.matricula)}</b>` : 'de tu vehículo'} y el equipo de Kivo ya está gestionando tu petición.`,
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

  // La matrícula es opcional en el formulario principal: si falta, se pide
  // después por email.
  if (d.nombre.length < 2 || !d.telefono || !RE_EMAIL.test(d.email)) {
    return res.status(400).json({ ok: false, error: 'Faltan datos de la solicitud' });
  }

  const destinatarios = (process.env.LEAD_DESTINATARIOS ?? LEAD_DESTINATARIOS.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter((s) => RE_EMAIL.test(s));
  const responderA = process.env.LEAD_RESPONDER_A || destinatarios[0];

  if (destinatarios.length === 0) {
    console.error('[solicitud] No hay destinatarios: LEAD_DESTINATARIOS vacío.');
    return res.status(500).json({ ok: false, error: 'Envío no configurado' });
  }

  const envio = preparaEnvio();
  if (!envio) {
    console.error('[solicitud] Falta SMTP_USUARIO y SMTP_CLAVE (buzón de Arsys) en Vercel.');
    return res.status(500).json({ ok: false, error: 'Envío no configurado' });
  }

  // 1) Al equipo. Si esto falla, la solicitud no ha llegado: error al cliente.
  try {
    const eq = emailEquipo(d);
    await envio.enviar({
      from: envio.remitente,
      to: destinatarios,
      replyTo: d.email,
      subject: eq.asunto,
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
    await envio.enviar({
      from: envio.remitente,
      to: [d.email],
      replyTo: responderA,
      subject: cl.asunto,
      html: cl.html,
      text: cl.text,
    });
  } catch (e) {
    console.error('[solicitud] No se ha podido enviar el acuse al cliente:', e);
  }

  return res.status(200).json({ ok: true });
}
