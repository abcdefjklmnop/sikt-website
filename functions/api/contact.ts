/** Cloudflare Pages: the only dynamic endpoint. Never log submitted content. */
export interface ContactStatement {
  bind(...values: (string | number)[]): ContactStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<unknown>;
}

export interface ContactDatabase {
  prepare(sql: string): ContactStatement;
}

export interface ContactEnv {
  CONTACT_DB?: ContactDatabase;
  CONTACT_ORIGIN?: string;
  CONTACT_FROM?: string;
  CONTACT_TO?: string;
  RESEND_API_KEY?: string;
  RATE_LIMIT_SECRET?: string;
}

export interface ContactFields {
  name: string;
  email: string;
  company: string;
  message: string;
  website: string;
}

type FieldErrors = Partial<Record<keyof ContactFields, string>>;
type ErrorCode = 'validation' | 'rate-limit' | 'unavailable' | 'origin';
interface Runtime {
  fetch: typeof globalThis.fetch;
  now: () => number;
}

export const BODY_LIMIT = 65_536;
export const WINDOW_SECONDS = 15 * 60;
export const REQUEST_LIMIT = 5;
export const CLAIM_SQL = `INSERT INTO contact_rate_limits (key, attempts, expires_at)
  VALUES (?1, 1, ?2)
  ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1
  WHERE attempts < ?3
  RETURNING attempts`;
export const CLEANUP_SQL = 'DELETE FROM contact_rate_limits WHERE expires_at <= ?1';

const SINGLE_LINE_CONTROL = /[\u0000-\u001f\u007f]/;
const MESSAGE_CONTROL = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const FIELD_NAMES = new Set(['name', 'email', 'company', 'message', 'website']);

export function validEmail(value: string): boolean {
  if (value.length > 254 || SINGLE_LINE_CONTROL.test(value)) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts as [string, string];
  return local.length > 0 && local.length <= 64 && !local.startsWith('.') &&
    !local.endsWith('.') && !local.includes('..') &&
    /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local) &&
    domain.includes('.') && domain.split('.').every((label) =>
      label.length >= 1 && label.length <= 63 &&
      /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
}

export function validateFields(input: Record<string, unknown>):
  { fields: ContactFields; errors: FieldErrors } {
  const errors: FieldErrors = {};
  const fields: ContactFields = { name: '', email: '', company: '', message: '', website: '' };
  for (const name of Object.keys(fields) as (keyof ContactFields)[]) {
    const value = input[name] ?? '';
    if (typeof value !== 'string') {
      errors[name] = 'Feltet må inneholde tekst.';
      continue;
    }
    fields[name] = value.trim();
  }
  if (fields.name.length < 2 || fields.name.length > 100 || SINGLE_LINE_CONTROL.test(fields.name)) {
    errors.name = 'Skriv navnet ditt, mellom 2 og 100 tegn.';
  }
  if (!validEmail(fields.email)) errors.email = 'Skriv en gyldig e-postadresse.';
  if (fields.company.length > 120 || SINGLE_LINE_CONTROL.test(fields.company)) {
    errors.company = 'Bedriftsnavnet kan være opptil 120 tegn på én linje.';
  }
  fields.message = fields.message.replace(/\r\n?/g, '\n');
  if (fields.message.length < 10 || fields.message.length > 4000 || MESSAGE_CONTROL.test(fields.message)) {
    errors.message = 'Skriv en kort melding, mellom 10 og 4000 tegn.';
  }
  if (fields.website) errors.website = 'Skjemaet kunne ikke sendes. Bruk gjerne e-post.';
  if (Object.keys(input).some((name) => !FIELD_NAMES.has(name))) {
    errors.message = 'Skjemaet inneholder et ukjent felt. Last siden på nytt og prøv igjen.';
  }
  return { fields, errors };
}

function responseHeaders(): Headers {
  // Pages _headers does not apply to Functions responses.
  return new Headers({
    'Cache-Control': 'no-store',
    'Vary': 'Accept',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    'Strict-Transport-Security': 'max-age=31536000',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'X-Robots-Tag': 'noindex, nofollow',
  });
}

function respond(request: Request, status: number, message: string,
  code?: ErrorCode, errors?: FieldErrors, retryAfter?: number): Response {
  const headers = responseHeaders();
  if (retryAfter) headers.set('Retry-After', String(retryAfter));
  if (request.headers.get('accept')?.includes('application/json')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify({ ok: status === 200, message, ...(errors ? { errors } : {}) }),
      { status, headers });
  }
  // Only fixed paths and enumerated error codes; never put personal data in URLs.
  headers.set('Location', status === 200 ? '/takk/' : `/kontakt-feil/?kode=${code ?? 'unavailable'}`);
  return new Response(null, { status: 303, headers });
}

function configIsValid(env: ContactEnv): boolean {
  if (!env.CONTACT_DB || !env.CONTACT_ORIGIN || !env.CONTACT_FROM || !env.CONTACT_TO ||
    !env.RESEND_API_KEY || !env.RATE_LIMIT_SECRET || env.RATE_LIMIT_SECRET.length < 32) return false;
  if (![env.CONTACT_FROM, env.CONTACT_TO].every(validEmail)) return false;
  if ([env.RESEND_API_KEY, env.RATE_LIMIT_SECRET, env.CONTACT_FROM, env.CONTACT_TO]
    .some((value) => /TODO|REPLACE|example\.(com|org|net)|\.invalid/i.test(value))) return false;
  if (!/^re_[A-Za-z0-9_-]+$/.test(env.RESEND_API_KEY)) return false;
  try {
    const url = new URL(env.CONTACT_ORIGIN);
    return url.origin === env.CONTACT_ORIGIN && !url.username && !url.password &&
      (url.protocol === 'https:' ||
        (url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)));
  } catch { return false; }
}

async function boundedText(request: Request): Promise<string> {
  const declaredLength = request.headers.get('content-length');
  if (declaredLength && (!/^\d+$/.test(declaredLength) || Number(declaredLength) > BODY_LIMIT)) {
    throw new Error('body-limit');
  }
  if (!request.body) throw new Error('empty-body');
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > BODY_LIMIT) {
        await reader.cancel();
        throw new Error('body-limit');
      }
      chunks.push(chunk.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

async function readFields(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
  if (!['application/x-www-form-urlencoded', 'application/json'].includes(type ?? '')) {
    throw new Error('content-type');
  }
  const text = await boundedText(request);
  if (type === 'application/json') {
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid-object');
    return parsed as Record<string, unknown>;
  }
  const params = new URLSearchParams(text);
  const result: Record<string, unknown> = Object.create(null);
  for (const [key, value] of params) {
    if (Object.hasOwn(result, key)) throw new Error('duplicate-field');
    result[key] = value;
  }
  return result;
}

async function hmac(secret: string, value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function handleContact(request: Request, env: ContactEnv,
  runtime: Runtime = { fetch: globalThis.fetch, now: Date.now }): Promise<Response> {
  if (request.method !== 'POST') {
    const headers = responseHeaders();
    headers.set('Allow', 'POST');
    headers.set('Content-Type', 'application/json; charset=utf-8');
    return new Response(JSON.stringify({ ok: false, message: 'Bruk kontaktskjemaet for å sende en melding.' }),
      { status: 405, headers });
  }
  if (!configIsValid(env)) {
    return respond(request, 503, 'Kontaktskjemaet er ikke tilgjengelig. Bruk e-postadressen på siden.', 'unavailable');
  }
  if (new URL(request.url).origin !== env.CONTACT_ORIGIN ||
    request.headers.get('origin') !== env.CONTACT_ORIGIN ||
    request.headers.get('sec-fetch-site') === 'cross-site') {
    return respond(request, 403, 'Last siden på nytt før du sender skjemaet.', 'origin');
  }
  const address = request.headers.get('cf-connecting-ip');
  // Cloudflare supplies this header at the edge. Never trust X-Forwarded-For.
  if (!address || address.length > 45 || !/^[0-9a-f:.]+$/i.test(address)) {
    return respond(request, 503, 'Skjemaet kunne ikke behandles. Prøv igjen senere.', 'unavailable');
  }
  const now = Math.floor(runtime.now() / 1000);
  const window = Math.floor(now / WINDOW_SECONDS);
  const expiresAt = (window + 1) * WINDOW_SECONDS;
  try {
    const rateKey = await hmac(env.RATE_LIMIT_SECRET!, `rate:${window}:${address}`);
    const db = env.CONTACT_DB!;
    await db.prepare(CLEANUP_SQL).bind(now).run();
    // One atomic conditional UPSERT: concurrent requests cannot bypass the counter.
    const claimed = await db.prepare(CLAIM_SQL).bind(rateKey, expiresAt, REQUEST_LIMIT)
      .first<{ attempts: number }>();
    if (!claimed) return respond(request, 429,
      'Det er sendt flere forsøk fra dette nettverket. Vent opptil 15 minutter eller bruk e-post.',
      'rate-limit', undefined, expiresAt - now);
  } catch {
    // Fail closed when the rate-limit store is unavailable.
    return respond(request, 503, 'Skjemaet er midlertidig utilgjengelig. Prøv igjen senere.', 'unavailable');
  }
  let result: ReturnType<typeof validateFields>;
  try { result = validateFields(await readFields(request)); }
  catch {
    return respond(request, 400, 'Skjemaet kunne ikke leses. Kontroller feltene og prøv igjen.', 'validation');
  }
  if (Object.keys(result.errors).length) {
    return respond(request, 422, 'Kontroller de markerte feltene.', 'validation', result.errors);
  }
  const { name, email, company, message } = result.fields;
  const payload = JSON.stringify({
    from: env.CONTACT_FROM,
    to: [env.CONTACT_TO],
    reply_to: email,
    subject: 'Ny henvendelse fra nettsiden til Sikt',
    text: `Navn: ${name}\nE-post: ${email}\nBedrift: ${company || 'Ikke oppgitt'}\n\nMelding:\n${message}`,
  });
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const key = await hmac(env.RATE_LIMIT_SECRET!, `send:${window}:${payload}`);
    const sent = await runtime.fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json',
        'Idempotency-Key': `sikt-contact-${window}-${key}` },
      body: payload,
      signal: controller.signal,
      redirect: 'error',
    });
    if (!sent.ok) throw new Error('provider-rejected');
    const accepted = await sent.json() as { id?: unknown };
    if (typeof accepted.id !== 'string' || !accepted.id.trim()) throw new Error('invalid-provider-response');
    return respond(request, 200, 'Henvendelsen er sendt til e-posttjenesten vår. Takk for at du tar kontakt.');
  } catch {
    // A timeout may occur after provider acceptance. Do not retry automatically or claim non-delivery.
    return respond(request, 502,
      'Vi kunne ikke bekrefte sendingen. Vent litt før du prøver igjen, eller kontakt oss på e-post.', 'unavailable');
  } finally { clearTimeout(timeout); }
}

export const onRequest = (context: { request: Request; env: ContactEnv }): Promise<Response> =>
  handleContact(context.request, context.env);
