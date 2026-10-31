# Publisering på Cloudflare Pages

Prosjektet er et fullstendig kodegrunnlag med uavklarte firma- og driftsopplysninger. Ingen konto, database, e-posttjeneste eller offentlig publisering er opprettet av denne leveransen. Kjør kommandoene under først når de aktuelle opplysningene er verifisert. De som er merket «ekstern endring» oppretter eller endrer ressurser på kontoen din og kan medføre kostnader etter valgt abonnement.

## 1. Fyll ut virksomheten

I `src/data/site.json`: legg inn registrert navn, org.nr, e-post, postadresse og endelig HTTPS-domene uten avsluttende skråstrek. Bekreft rett til navn/domene. Kvalitetssikre `src/data/legal.ts` og fullfør `docs/PRIVACY-REVIEW.md`. Dato, behandlingsgrunnlag, faktisk leverandøroppsett og slettefrister må stemme med driften.

Behold `draft: true` til gjennomgangen er ferdig. Dette gir noindex i både HTML og HTTP-headere og sperrer robots.txt. Noindex er ikke tilgangskontroll; en opplastet forhåndsvisning kan fortsatt leses av andre. Bruk Cloudflare Access hvis forhåndsvisningen må være privat.

## 2. Bygg og test lokalt

Bruk Node 24 eller nyere støttet versjon (minst 22.22).

```sh
npm ci
npm run check
npm test
npm run build
npm run test:site
npx wrangler d1 migrations apply sikt-contact-limits --local
npm run pages:dev
```

I en annen terminal: `npm run test:browser` og `npm run lighthouse`. Chrome kreves av den leverte testkonfigurasjonen. Rapportene skrives til `artifacts/`.

## 3. Opprett ressurser og bind databasen

Logg inn og opprett ett Pages-prosjekt og én D1-database (eksterne endringer):

```sh
npx wrangler login
npx wrangler pages project create sikt-web --production-branch main
npx wrangler d1 create sikt-contact-limits
```

Hvis prosjektnavnet er opptatt, bruk et valgt navn og oppdater `name`/`--project-name` tilsvarende. Kopier database-ID-en som faktisk returneres til **begge** konfigurasjonsfilene: `wrangler.jsonc` og `maintenance/wrangler.jsonc`. Fyll ut `CONTACT_ORIGIN`, `CONTACT_FROM` og `CONTACT_TO` i hovedkonfigurasjonen. Gjør deretter databasemigreringen (ekstern endring):

```sh
npx wrangler d1 migrations apply sikt-contact-limits --remote
```

## 4. E-post og hemmeligheter

Opprett eget Resend-oppsett og verifiser avsenderdomenet med deres faktiske DNS-poster. Bruk sendebegrenset API-nøkkel, og sjekk mottakerinnboks, SPF/DKIM og valgt DMARC-policy. Konfigurer nødvendige databehandler- og overføringsavtaler for Cloudflare, Resend og innboksleverandøren.

Legg inn hemmelighetene via de interaktive kommandoene (ekstern endring):

```sh
npx wrangler pages secret put RESEND_API_KEY --project-name sikt-web
npx wrangler pages secret put RATE_LIMIT_SECRET --project-name sikt-web
```

Generer den andre som en tilfeldig hemmelighet med minst 32 tegn. Oppbevar den i passordbehandler. Ikke legg hemmeligheter i kildekoden, terminalhistorikken, offentlige buildvariabler eller et skjermbilde. Preview-miljø skal ha et eget testoppsett og aldri utilsiktet bruke produksjonsinnboksen.

## 5. Aktiver opprydding

Publiser den lille planlagte Worker-jobben mot samme D1-database (ekstern endring):

```sh
npx wrangler deploy --config maintenance/wrangler.jsonc
```

Den kjører hvert hele UTC-timepunkt pluss syv minutter. Kontroller vellykkede kjøringer i Cloudflare, og sett opp driftsvarsling ved feil. Bekreft databasens faktiske backup- og gjenopprettingsperiode i personvernteksten. Denne jobben sletter bare utløpte rader i `contact_rate_limits`.

## 6. Publiser nettstedet

Fullfør sjekklisten, sett `draft: false` og kjør:

```sh
npm run launch:check
npm run check
npm test
npm run build
npm run test:site
npx wrangler pages deploy dist --project-name sikt-web --branch main
```

Siste kommando publiserer eksternt. Kjør fra prosjektroten så `functions/` følger med. Ikke bruk enkel dra-og-slipp av dist: den metoden kompilerer ikke `functions/`. [Cloudflare Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/).

Legg til det valgte domenet under Pages → Custom domains, sett nødvendige DNS-poster og vent på aktivt HTTPS-sertifikat. Bruk den samme nettadressen i site.json og CONTACT_ORIGIN. Omdiriger alternative vertsnavn til hoveddomenet i Cloudflare. Om domenet er uten `www`, skal `www` ha én permanent redirect til det. Verifiser HTTPS-redirect separat.

Alternativt kan Pages knyttes til Git: prosjektrot `sikt` hvis dette repositoriet lastes opp, byggekommando `npm ci && npm run check && npm test && npm run launch:check && npm run build`, publiseringsmappe `dist`, Node 24. Opprett først databasen og serverinnstillingene. Et Direct Upload-prosjekt kan ikke bare byttes til Git-integrasjon senere; velg arbeidsmåte før første prosjekt opprettes.

## Sikkerhetsheadere

`npm run build` genererer `dist/_headers` etter at HTML er ferdig. CSP inkluderer SHA-256-hasher av nøyaktig inline JSON-LD, og tillater bare egne script, stilark, bilder, skrifttyper og nettverkskall. Ingen unsafe-inline eller eval. Ikke rediger bygde HTML-filer etterpå: bygg på nytt slik at hashene følger innholdet.

HSTS settes til ett år. `includeSubDomains` og preload er med vilje ikke aktivert før alle underdomener er kartlagt og HTTPS er verifisert. X-Content-Type-Options, Referrer-Policy, Permissions-Policy og X-Frame-Options følger med. API-funksjonen setter egne headere fordi Pages `_headers` bare dekker statiske svar. [Cloudflare headers](https://developers.cloudflare.com/pages/configuration/headers/).

`*.pages.dev` har noindex også etter lansering. Bare hoveddomenet skal indekseres. Sitemap og canonical bygges fra site.json. Organization og LocalBusiness deler én identitet; FAQPage gjenspeiler de synlige spørsmålene. Strukturerte data er ingen garanti for utvidede søkeresultater.

## Kontroll etter publisering

1. Kontroller HTTPS og alle headere på forsiden, undersider og API-svar. Sjekk konsollen for CSP-feil.
2. Send én syntetisk henvendelse til kontrollert innboks. Verifiser faktisk mottak og Reply-To. Et API-svar alene dokumenterer ikke innbokslevering.
3. Bekreft valideringsfeil, honeypot, 429 etter flere forsøk og forståelig feil når mailtjenesten er utilgjengelig. Ikke lasttest produksjon.
4. Kontroller mobil, tastatur, VoiceOver/skjermleser og 200–400 % zoom. Kjør Lighthouse på faktisk domene; mål minst 95 i alle kategorier.
5. Test domenet med [Security Headers](https://securityheaders.com/). En god karakter dokumenterer responsheadere, ikke fravær av sårbarheter.
6. Verifiser robots.txt, sitemap.xml, canonical, Open Graph-bildet og søkemotorindeksering. Fjern aldri noindex før innhold og juridiske opplysninger er ferdige.
7. Kontroller at ingen uventede cookies, eksterne script eller analyser er aktivert av vertsleverandøren.
8. Kontroller timejobbens sletting og driftsvarsling. Ved feil: rett jobben og slett utløpte rader, dokumenter avviket.

Pris og kvoter for drift/e-post må kontrolleres hos leverandørene når kontoen velges. Ingen pris eller gratis drift er forutsatt.
