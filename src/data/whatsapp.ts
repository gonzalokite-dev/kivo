/**
 * Enlace de WhatsApp con el mensaje predeterminado ya escrito. Todos los
 * enlaces de la web salen de aquí, así el número y los textos se cambian en
 * un solo sitio (site.config.mjs). Devuelve null si no hay número.
 */
import { WHATSAPP, WHATSAPP_MENSAJE } from '../../site.config.mjs';

export function waLink(lang: 'es' | 'en' = 'es', mensaje?: string): string | null {
  if (!WHATSAPP) return null;
  const texto = mensaje ?? WHATSAPP_MENSAJE[lang];
  return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
}
