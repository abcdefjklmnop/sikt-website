# Kontaktskjema: oppsett og grenser

Skjemaet sender til `POST /api/contact`. HTML-skjema fungerer uten JavaScript; vanlig nettleservalidering skjer før sending. Den lille TypeScript-forbedringen sender URL-kodede felt med `Accept: application/json`, viser feltfeil, bevarer tekst ved feil og tømmer først skjemaet etter bekreftet svar. Det legges ikke data i URL, cookies eller localStorage.

## Felter

| Felt | Serverkrav |
| --- | --- |
| `name` | 2–100 tegn, én linje |
| `email` | syntaktisk gyldig adresse, maks 254 tegn, ingen kontrolltegn |
| `company` | valgfritt, maks 120 tegn, én linje |
| `message` | 10–4000 tegn, ingen ugyldige kontrolltegn |
| `website` | tom honeypot; fylt felt avvises |

Serveren håndhever en grense på 65 536 byte også på strømmet forespørsel uten oppgitt lengde. Bare JSON og URL-kodet skjema godtas. Ukjente felt, duplikate URL-felt, ugyldige typer og feil origin avvises. Begrenset ASCII-e-postsyntaks er valgt; adresser med internasjonaliserte tegn i lokaldelen støttes ikke. Bruk en alternativ adresse ved behov.

## Serverinnstillinger

`wrangler.jsonc` inneholder de offentlige konfigurasjonsfeltene. Ingen hemmeligheter skal legges i Astro-koden eller i variabler med `PUBLIC_`-prefiks.

| Navn | Innhold |
| --- | --- |
| `CONTACT_ORIGIN` | Eksakt HTTPS-origin uten avsluttende skråstrek, lik det endelige domenet. HTTP tillates kun for lokal utvikling. |
| `CONTACT_FROM` | En ren e-postadresse fra et verifisert Resend-domene. Ikke visningsnavn med vinkelparenteser. |
| `CONTACT_TO` | Bedriftens faktiske innboks. Ikke styrt av brukeren. |
| `RESEND_API_KEY` | Hemmelig API-nøkkel med bare nødvendig sendetilgang. |
| `RATE_LIMIT_SECRET` | Tilfeldig hemmelighet, minst 32 tegn; generer i passordbehandler eller med Node crypto. |
| `CONTACT_DB` | D1-binding med migreringen i `migrations/`. |

Uten gyldig oppsett blir svaret 503. Dette er forventet i den leverte forhåndsvisningen. Det er ingen demonstrasjonsmodus som hevder å ha sendt e-post.

E-posten har fast avsender, fast mottaker og fast emne. Bare den validerte adressen settes som `reply_to`. Meldingstekst sendes som ren tekst, ikke HTML. API-kallet har åtte sekunders tidsgrense og følger ikke omdirigeringer. En suksess krever både et vellykket HTTP-svar og en gyldig meldings-ID. Et 2xx-svar fra leverandøren betyr akseptert for sending, ikke bekreftet innbokslevering. Se [Resends sende-API](https://resend.com/docs/api-reference/emails/send-email).

## Spamvern og dataminimering

- Fem forsøk per IP i hvert faste 15-minuttersvindu, med én atomisk D1-operasjon. Grensen gjelder også ugyldige skjema og leverandørfeil etter origin-/IP-kontroll.
- IP-adressen hentes fra `CF-Connecting-IP`, som Cloudflare setter ved kanten. `X-Forwarded-For` brukes ikke. I lokal utvikling kan headere forfalskes, derfor er localhost ingen sikkerhetsgrense. Produksjonsvurderingen forutsetter at funksjonen nås via Cloudflare.
- Bare en HMAC-kode av IP + tidsvindu, en teller og et utløp lagres i D1. Verken navn, e-post, melding eller rå IP blir skrevet dit. Hashen er pseudonymisert, ikke anonym.
- Utløpte rader fjernes ved neste gyldig-origin forespørsel med IP. Den medfølgende `maintenance/cleanup.ts` kjøres i tillegg hver time når den er publisert separat. Ved normal drift slettes rader senest ved første vellykkede timejobb etter utløp. Overvåk jobben; teknisk utløp er ikke et løfte om sletting fra sikkerhetskopier.
- Samme melding i samme tidsvindu får samme HMAC-baserte idempotensnøkkel hos Resend. Det reduserer dubletter ved usikre nettverkssvar. Ingen automatisk retry. Overgang mellom tidsvinduer kan gi ny nøkkel og dermed en ny e-post.
- Ingen skjemainnhold eller leverandørfeil logges i koden. Plattform- og leverandørlogger må vurderes separat.

Dette er et grunnvern for et lite kontaktskjema. Distribuert spam fra mange IP-er kan omgå en per-IP-grense, og mange ansatte bak én nettadresse deler grensen. Faste vinduer tillater en kort topp rundt vindusskiftet. Ved faktisk misbruk: avklar global sendekvote og leverandørbudsjett, og vurder Cloudflare-regler uten å innføre unødvendig sporing.

## Lokalt

`npm run dev` viser Astro-sidene; det kjører ikke Pages Functions. Bruk følgende for det bygde nettstedet og funksjonen:

```sh
npm run build
npx wrangler d1 migrations apply sikt-contact-limits --local
npm run pages:dev
```

Åpne `http://127.0.0.1:8788`. Manglende hemmeligheter gir reell feiltilstand. Testene bruker syntetiske data og en falsk e-postleverandør; de sender ingenting. Ønskes en reell sending, må `.dev.vars.example` kopieres til `.dev.vars` og fylles ut med faktisk oppsett. Velg en kontrollert testinnboks og send bare syntetiske opplysninger.

## Svar

JSON bruker 200/400/403/405/422/429/502/503. Uten JSON-Accept får POST en 303 til `/takk/` ved akseptert sending, ellers `/kontakt-feil/?kode=...`. Parameteren er en fast feilkode og inneholder ingen personopplysninger. Vanlig feilside forklarer validering, ventetid og usikker sending uten å gjengi innsendte data.

Statiske `_headers` gjelder ikke Pages Functions. Funksjonen setter derfor egne CSP-, HSTS-, no-store-, nosniff-, frame- og personvernheadere. Se [Cloudflares dokumentasjon](https://developers.cloudflare.com/pages/configuration/headers/).
