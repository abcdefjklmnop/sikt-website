# Personvern og informasjonskapsler før lansering

Vurdert 20. oktober 2026. Dette er et arbeidsnotat for det planlagte oppsettet, ikke en erklæring om at virksomheten eller en publisert tjeneste oppfyller alle krav. Nettstedsteksten i `src/data/legal.ts` er et synlig utkast med avklaringer merket `[TODO]`. Foretaket må fylle dem ut, kontrollere dem mot faktisk drift og kvalitetssikre teksten før publisering.

## Avgrensning

Planlagt løsning: statiske sider, egne skrifttyper og SVG-er, ingen markedsføring eller besøksanalyse i nettleseren, kontaktskjema til en serverfunksjon hos Cloudflare, Resend for e-postlevering, og en kortvarig teller i D1 for å begrense misbruk. Ingen kundedata skal legges inn i kildekode eller publiserte filer. Sikkerhetssjekker for kunder omfattes ikke av denne personvernerklæringen og trenger en egen avklaring av oppdrag, tilganger og roller.

## Datatilgang som må bekreftes

| Flyt | Opplysninger | Formål | Mottaker / ansvarlig oppfølging |
| --- | --- | --- | --- |
| Besøk | IP-adresse og tekniske forespørselsdata | Levere nettstedet og håndtere trafikk | Cloudflare; avklar logger og land |
| Kontaktskjema | Navn, e-post og melding; frivillig bedriftsnavn | Svare på henvendelsen | Cloudflare-funksjon, Resend, valgt innboksleverandør, relevant person hos Sikt |
| Misbruksvern | HMAC-basert IP-kode, teller og utløp | Begrense automatiserte innsendinger | D1 hos Cloudflare; verifiser fysisk sletting |
| E-postdrift | Meldingsinnhold og leveringsdata | Levere, lese og følge opp henvendelsen | Resend, innboksleverandør og eventuelle underleverandører |

Tabellen er en modell for valgt arkitektur. Endelig funksjonskode, konsollinnstillinger, tjenestevilkår og leverandøravtaler må kontrolleres samlet. Bruk kun syntetiske testopplysninger under utvikling.

## Grunnlag og informasjon ved skjemaet

Avtalebehandling etter artikkel 6 nr. 1 bokstav b forutsetter at personen er avtalepart, eller har bedt om nødvendige tiltak før en slik avtale. En ansatt som spør på vegne av et aksjeselskap er ikke automatisk personlig avtalepart. For den vanlige B2B-kontakten foreslås derfor bokstav f etter en konkret interesseavveining. Dette er anvendelse av reglene på den planlagte tjenesten, ikke en myndighetsgodkjenning. [Datatilsynet om avtalegrunnlaget](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/om-behandlingsgrunnlag/nodvendig-for-a-oppfylle-en-avtale/).

Dokumenter for kontaktoppfølging og sikkerhetsdrift hver for seg: reell interesse, nødvendighet, mindre inngripende alternativer, forventninger, konsekvenser og tiltak. Sett navngitt ansvarlig og vurderingsdato. Ikke skriv at en vurdering er utført før den er det. [Datatilsynet om interesseavveining](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/om-behandlingsgrunnlag/nodvendig-for-a-ivareta-legitime-interesser---interesseavveiing/).

Ingen obligatorisk «jeg samtykker til personvernerklæringen»-boks er lagt til for vanlig kontakthåndtering. Vis heller formål og lenke før Send-knappen. Foreslått korttekst: «Vi bruker opplysningene for å svare på henvendelsen din. Les personvernerklæringen. Ikke send passord eller sensitive opplysninger.» Markedsføring er et annet formål og skal ikke kobles inn automatisk. Virksomheten må velge og opplyse korrekt grunnlag før innsamling. [Datatilsynet om behandlingsgrunnlag](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/om-behandlingsgrunnlag/).

## Lagring, dataminimering og sikkerhet

- Bare e-postadresse er teknisk nødvendig for et svar; dersom navn kreves, dokumenter hvorfor. Bedriftsnavn er frivillig. Løsningen krever en kort melding for å forstå henvendelsen; vurder nødvendigheten før lansering. Ikke legg til telefon, vedlegg, fødselsnummer eller skjult markedsføringsregistrering.
- HMAC er et tiltak for å redusere eksponering. Nøkkelen må være hemmelig og koden tidsavgrenset. Dette er pseudonymisering; ikke kall dataene anonyme eller helt uten personopplysninger.
- Utløpstid i en tabell er ikke automatisk fysisk sletting. Kontroller opprydding også når det ikke kommer nye forespørsler. Dokumenter dessuten backup-/gjenopprettingsperiode for databasen. Ikke lov sletting innen 15 minutter dersom opprydding bare skjer ved neste besøk.
- Ikke logg innsendt melding, e-postadresse, rå IP-adresse, fulle HTTP-headere, API-nøkler eller leverandørfeil som inneholder personopplysninger. Kontroller også automatisk logging i plattformen.
- Bestem en konkret frist etter siste relevante kontakt for saker uten oppdrag. Sett opp rutiner for innboks, sendte meldinger, papirkurv og andre kopier. Bestem særskilt hva som overføres til kundeoppfølging. Ikke begrunn lagring av alle henvendelser med regnskapskrav.
- Bruk tilgang etter behov og flerfaktorinnlogging for driftskonto og innboks. Bekreft at leverandørene tilbyr nødvendige slette- og rettighetsprosesser.

Publisert informasjon må angi tilstrekkelig konkrete lagringstider eller forståelige kriterier. «Så lenge det er nødvendig» alene er ikke tilstrekkelig. Oppgi også ansvarlig foretak, kontakt, formål, grunnlag, mottakere, relevante overføringer og rettigheter. [Datatilsynet om informasjonens innhold](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/informasjon-og-apenhet/hva-skal-virksomheten-gi-informasjon-om/).

## Leverandører og behandling utenfor EØS

Innhent og vurder databehandleravtale for hver faktisk databehandler. Kontroller avtaleparter, datatyper, underleverandører, sikkerhet, varsling av avvik, bistand ved rettighetskrav og sletting. Lagre en datert kopi av avtalegrunnlaget. En lenke til generelle vilkår erstatter ikke virksomhetens vurdering. [Datatilsynets veiledning om databehandleravtaler](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/hvordan-lage-en-databehandleravtale/).

Resends publiserte DPA identifiserer Plus Five Five, Inc. og beskriver behandling og underleverandører. Dette bekrefter ikke at en bestemt kundekonto har ferdig vurderte overføringer eller rett lagringstid. Sjekk den faktiske avtalen og alle e-postkopier, inkludert mottakerens innboks. [Resend DPA](https://resend.com/legal/dpa).

Kartlegg lagring, behandling og eventuell tilgang fra land utenfor EØS. Kontroller gjeldende overføringsgrunnlag for aktuelle mottakere og relevante garantier før innsamling. Et EU-valg i et kontrollpanel er ikke alene tilstrekkelig dokumentasjon; støtte- og konserntilgang kan også være relevant. Ikke skriv «alle data lagres i Norge/EU» uten dokumentasjon. [Datatilsynet om overføring ut av EØS](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/overforing-av-personopplysninger-ut-av-eos/).

## Informasjonskapsler og ekomloven

Ekomloven § 3-15 regulerer lagring i eller tilgang til opplysninger på brukerens enhet. Reglene gjelder mer enn cookies. Hovedregelen er gyldig forhåndssamtykke; unntakene er snevre. Fravær av analyse og valgfri enhetslagring gjør et banner unødvendig i det beskrevne oppsettet, forutsatt at den publiserte løsningen faktisk fungerer slik. Dette er en vurdering av oppsettet, ikke en garanti for enhver Cloudflare-konfigurasjon. [Nkoms veiledning](https://nkom.no/internett/informasjonskapsler-cookies).

Cloudflare kan legge til cookies gjennom blant annet Bot Management, utfordringssider og enkelte rate-limit-innstillinger. Ikke aktiver slike tjenester uten å kontrollere personvernkonsekvenser og oppdatere cookie-teksten. Ikke bruk leverandørens generelle merkelapp «strictly necessary» som eneste juridiske vurdering. [Cloudflares cookie-dokumentasjon](https://developers.cloudflare.com/fundamentals/reference/policies-compliances/cloudflare-cookies/).

Kontroller alle sider og skjemaets suksess-/feilsvar i en ren nettleserprofil på det endelige domenet. Se på `Set-Cookie`, lagring, nettverksforespørsler, injiserte skript og sikkerhetsutfordringer. Hvis cookies brukes, dokumenter navn, formål, leverandør, varighet og vurderingen av samtykkekrav. Vurder også HTTP-caching, eventuelle identifikatorer og ekstern innlasting.

## Dersom statistikk blir aktuelt

Ingen statistikk er aktivert. Vurder eksempelvis Plausible eller egen drift av Umami som mulige kandidater, først etter at behovet er definert. «Cookiefri» betyr ikke automatisk samtykkefri. Før et verktøy velges, undersøk den konkrete versjonen og konfigurasjonen: enhetstilgang, eventuelle identifikatorer/fingeravtrykk, rådata, leverandørrolle, behandlingsgrunnlag, land, tilgang og sletting. Vurder dette mot Nkoms teknologinøytrale regler og personvernreglene. Oppdater personvern- og cookie-informasjon og tekniske tillatelser. Hvis samtykke kreves, må analyse være av helt til et gyldig samtykke foreligger, og tilbaketrekking må være enkel.

## Punkter som blokkerer offentlig lansering

- [ ] Fyll inn og verifiser juridisk foretaksnavn, organisasjonsnummer, postadresse og tilgjengelig kontaktadresse. Avklar også retten til navn og domene.
- [ ] Kvalitetssikre personvern- og cookie-tekst, fjern alle `[TODO]` først etter faktisk avklaring, og oppdater dato.
- [ ] Dokumenter formål og behandlingsgrunnlag for kontakt og sikkerhetsdata. Fullfør interesseavveiningene.
- [ ] Navngi innboksleverandør; fullfør avtaler, rolleavklaring, land og overføringsvurderinger for hele kjeden.
- [ ] Fastsett og gjennomfør slettefrister for hver datatype, inkludert leverandørkopier og sikkerhetskopier.
- [ ] Kontroller det endelige domenet for cookies, enhetslagring, eksterne kall og logging. Juster teksten etter observerte forhold.
- [ ] Test rettighetsrutine, kontaktadresse, feil/suksess i skjema og misbruksvern med syntetiske data. Behold formuleringer om levering og sletting som det faktisk finnes belegg for.

Offentlige sider bør ha korte, konkrete avsnitt som forklarer brukerens faktiske situasjon. Teksten bør ikke fylles med interne driftsdetaljer etter at avklaringene er gjort. [Datatilsynet om klart språk og åpenhet](https://www.datatilsynet.no/rettigheter-og-plikter/virksomhetenes-plikter/informasjon-og-apenhet/).
