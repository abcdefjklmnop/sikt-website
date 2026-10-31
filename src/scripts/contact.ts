const form = document.querySelector<HTMLFormElement>('#contact-form');
const formStatus = document.querySelector<HTMLParagraphElement>('#form-status');
form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!formStatus || !form.reportValidity()) return;
  const button = form.querySelector<HTMLButtonElement>('button[type=submit]')!;
  if (button.disabled) return;
  form.querySelectorAll('.field-error').forEach((element) => { element.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((element) => element.removeAttribute('aria-invalid'));
  button.disabled = true;
  form.setAttribute('aria-busy', 'true');
  formStatus.textContent = 'Sender henvendelsen …';
  try {
    const body = new URLSearchParams();
    new FormData(form).forEach((value, key) => { if (typeof value === 'string') body.append(key, value); });
    const response = await fetch(form.action, {
      method: 'POST', headers: { Accept: 'application/json' }, body,
      credentials: 'same-origin', signal: AbortSignal.timeout(15000),
    });
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Unexpected response');
    const result = await response.json() as { ok: boolean; message: string; errors?: Record<string, string> };
    if (response.ok && result.ok === true) {
      formStatus.textContent = 'Henvendelsen er sendt til e-posttjenesten vår. Vi følger opp på e-post.';
      form.reset();
    } else {
      formStatus.textContent = result.message || 'Meldingen kunne ikke sendes. Prøv igjen senere.';
      Object.entries(result.errors ?? {}).forEach(([field, message]) => {
        if (!['name', 'email', 'company', 'message'].includes(field)) return;
        const input = form.elements.namedItem(field);
        if (input instanceof HTMLElement) input.setAttribute('aria-invalid', 'true');
        const error = document.getElementById(`${field}-error`);
        if (error) error.textContent = message;
      });
    }
  } catch {
    formStatus.textContent = 'Vi fikk ikke bekreftet sendingen. Teksten din er beholdt her. Prøv igjen senere, eller kontakt oss på e-post.';
  } finally {
    button.disabled = false;
    form.removeAttribute('aria-busy');
    formStatus.focus();
  }
});

export {};
