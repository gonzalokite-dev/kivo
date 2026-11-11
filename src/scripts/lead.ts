/**
 * Lo que comparten los dos formularios de solicitud (el del hero y el de la
 * calculadora): validación, marcado del campo con error y formato de la
 * matrícula. Los ids de un formulario son los del otro con un prefijo
 * (`h-` en el hero, nada en la calculadora).
 */

export interface Lead {
  matricula: string;
  nombre: string;
  telefono: string;
  email: string;
}

const RE_MATRICULA = /^(\d{4}\s?[B-DF-HJ-NP-TV-Z]{3}|[A-Z]{1,2}\s?\d{4}\s?[A-Z]{0,2})$/;
const RE_MOVIL = /^(\+34)?[67]\d{8}$/;
const RE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Lee y valida. Devuelve el primer error y el id del campo que lo tiene. */
export function validarLead(p: string): { datos: Lead; err: string; campo: string } {
  const val = (id: string) => (document.getElementById(p + id) as HTMLInputElement).value;
  const datos: Lead = {
    matricula: val('matricula').trim().toUpperCase(),
    nombre: val('nombre').trim(),
    telefono: val('tel').replace(/[\s.-]/g, ''),
    email: val('email').trim(),
  };

  let err = '';
  let campo = '';
  if (!RE_MATRICULA.test(datos.matricula)) {
    err = 'Revisa la matrícula: por ejemplo 1234 MBC o M 1234 AB.';
    campo = 'matricula';
  } else if (datos.nombre.length < 2) {
    err = 'Escribe tu nombre.';
    campo = 'nombre';
  } else if (!RE_MOVIL.test(datos.telefono)) {
    err = 'Escribe un móvil español de 9 cifras.';
    campo = 'tel';
  } else if (!RE_EMAIL.test(datos.email)) {
    err = 'Revisa el email.';
    campo = 'email';
  } else if (!(document.getElementById(p + 'rgpd') as HTMLInputElement).checked) {
    err = 'Marca la casilla de privacidad para que podamos escribirte.';
    campo = 'rgpd';
  }
  return { datos, err, campo: campo && p + campo };
}

/**
 * Marca el campo con error (borde rojo, `aria-invalid`, mensaje asociado) y
 * le pone el foco. En móvil, el teclado y el scroll llevan justo ahí en vez
 * de dejar al usuario buscando qué ha fallado.
 */
export function marcarError(form: HTMLElement, campo: string, cajaErr: HTMLElement) {
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
  if (!campo) return;
  const el = document.getElementById(campo);
  if (!el) return;
  el.setAttribute('aria-invalid', 'true');
  el.setAttribute('aria-describedby', cajaErr.id);
  el.focus();
}

/** Al corregir un campo, deja de estar marcado como erróneo. */
export function limpiarAlEscribir(form: HTMLElement, cajaErr: HTMLElement) {
  const limpiar = (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.getAttribute('aria-invalid')) {
      t.removeAttribute('aria-invalid');
      t.removeAttribute('aria-describedby');
      cajaErr.hidden = true;
    }
  };
  form.addEventListener('input', limpiar);
  form.addEventListener('change', limpiar);
}

/**
 * Mayúsculas y el espacio de las matrículas actuales mientras se escribe:
 * «1234mbc» se queda en «1234 MBC». Solo toca el texto si el cursor está al
 * final, para no hacerle saltar a quien corrige por en medio.
 */
export function formatearMatricula(el: HTMLInputElement) {
  el.addEventListener('input', () => {
    const alFinal = el.selectionStart === el.value.length;
    let v = el.value.toUpperCase().replace(/[^0-9A-Z ]/g, '');
    const m = v.replace(/\s/g, '').match(/^(\d{4})([A-Z]{1,3})$/);
    if (m) v = `${m[1]} ${m[2]}`;
    if (v !== el.value && alFinal) el.value = v;
  });
}
