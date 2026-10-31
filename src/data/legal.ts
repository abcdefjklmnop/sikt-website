export interface LegalSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
  links?: { label: string; href: string }[];
}

// Keep this visible until the company has completed the deployment review.
export const legalDraftNotice =
  'Utkast – må fylles ut og kvalitetssikres før publisering. Teksten beskriver det planlagte oppsettet. Punkter merket [TODO] er ikke avklart.';

export const legalUpdated = '20. oktober 2026';

export const privacySections: LegalSection[] = [
  {
    id: 'ansvarlig',
    title: 'Hvem har ansvar for opplysningene?',
    paragraphs: [
      'Sikt er navnet vi bruker på nettstedet. Behandlingsansvarlig er [TODO: juridisk foretaksnavn], organisasjonsnummer [TODO: organisasjonsnummer], med adresse [TODO: postadresse]. Behandlingsansvarlig bestemmer hvorfor og hvordan opplysningene brukes.',
      'Spørsmål om personvern og rettighetene dine kan sendes til [TODO: kontrollert kontaktadresse for personvern].',
    ],
  },
  {
    id: 'kontakt',
    title: 'Når du tar kontakt',
    paragraphs: [
      'Vi bruker opplysningene du sender for å forstå henvendelsen, svare deg og avklare en eventuell leveranse. Opplysningene blir ikke brukt til nyhetsbrev eller automatisk markedsføring.',
      'Skjemaet ber om navn, e-postadresse og en kort melding for å kunne forstå og følge opp henvendelsen. Bedriftsnavn er frivillig. E-postadressen er nødvendig for at vi skal kunne svare. Du bestemmer selv om du vil kontakte oss.',
      'Skriv kort om behovet. Ikke send passord, fødselsnummer, helseopplysninger eller konfidensielle sikkerhetsfunn i kontaktskjemaet. Vi avtaler en egnet kanal dersom oppdraget krever slike opplysninger.',
    ],
  },
  {
    id: 'grunnlag',
    title: 'Hvorfor vi kan behandle opplysningene',
    paragraphs: [
      'Når du kontakter oss på vegne av en bedrift, er det foreslåtte grunnlaget vår berettigede interesse i å besvare relevante henvendelser og følge opp forretningskontakt (personvernforordningen artikkel 6 nr. 1 bokstav f). [TODO: dokumenter nødvendighet og interesseavveining før skjemaet åpnes.] Du kan be om informasjon om vurderingen og protestere mot behandlingen.',
      'Hvis du selv skal være avtalepart, for eksempel som innehaver av et enkeltpersonforetak, behandles opplysninger som er nødvendige for å svare på en konkret forespørsel før avtaleinngåelse etter artikkel 6 nr. 1 bokstav b. Dette grunnlaget gjelder bare når vilkårene faktisk er oppfylt.',
    ],
  },
  {
    id: 'drift',
    title: 'Tekniske opplysninger og vern mot misbruk',
    paragraphs: [
      'Driftsleverandøren mottar tekniske opplysninger, blant annet IP-adresse, når nettleseren henter nettsiden eller sender skjemaet. Dette er nødvendig for å levere innholdet og håndtere trafikken.',
      'For å begrense automatisert misbruk bruker skjemaet en kortvarig kode laget fra IP-adressen, sammen med en teller og et utløpstidspunkt. Den opprinnelige IP-adressen lagres ikke i denne telleren. Koden er en pseudonymisert personopplysning, ikke anonyme data. Skjemaets sikkerhetsfelt brukes også til å oppdage automatiserte innsendinger.',
      'Det foreslåtte behandlingsgrunnlaget for misbruksvernet er berettiget interesse i sikker og tilgjengelig drift (artikkel 6 nr. 1 bokstav f). [TODO: dokumenter interesseavveining, faktiske driftslogger og sletting hos leverandørene.]',
      'Nettstedet har ikke annonser, analyseverktøy eller profilering. Vi tar ikke automatiserte avgjørelser med rettslig eller tilsvarende betydelig virkning for deg. Misbruksvernet kan midlertidig avvise en innsending; du kan da bruke den oppgitte e-postadressen.',
    ],
  },
  {
    id: 'mottakere',
    title: 'Hvem mottar opplysningene?',
    paragraphs: [
      'Henvendelser skal bare være tilgjengelige for personer hos Sikt som trenger dem for å svare eller følge opp. Skjemainnholdet sendes som e-post og lagres ikke i nettstedets database for misbruksvern.',
      'Det planlagte oppsettet bruker Cloudflare til nettdrift og håndtering av skjemaet, og Resend til å sende henvendelsen til innboksen vår. Innboksleverandør: [TODO: oppgi e-postleverandør]. Leverandørene behandler opplysninger som del av sine tjenester.',
      '[TODO: kontroller og oppgi avtalepartene, rollene, databehandleravtalene, underleverandørene og relevante lagrings- og behandlingsland for det valgte abonnementet.]',
    ],
  },
  {
    id: 'overforing',
    title: 'Behandling utenfor EØS',
    paragraphs: [
      '[TODO: oppgi om opplysninger behandles eller gjøres tilgjengelige utenfor EØS, hvilke land og mottakere dette gjelder, og hvilket gyldig overføringsgrunnlag som brukes. Ta med hvordan den enkelte kan få informasjon om garantiene.]',
      'Dette må avklares for nettdrift, skjemabehandling, e-postlevering, innboks, støttepersonell og underleverandører før skjemaet tas i bruk. Et europeisk datasenter alene dokumenterer ikke at all behandling skjer i EØS.',
    ],
  },
  {
    id: 'lagring',
    title: 'Hvor lenge lagres opplysningene?',
    paragraphs: [
      'Lagringstiden skal være knyttet til det konkrete formålet. Før publisering fyller vi inn følgende frister og sørger for at sletting faktisk er satt opp:',
    ],
    bullets: [
      'Henvendelser som ikke fører til oppdrag: [TODO: antall måneder etter avsluttet dialog og rutine for sletting fra innboks, sendte meldinger og papirkurv].',
      'Henvendelser som fører til oppdrag: [TODO: hvilke opplysninger som overføres til kundeoppfølging, formål, grunnlag og lagringstid].',
      'Midlertidig teller mot misbruk gjelder i faste vinduer på 15 minutter. Utløpte tellere slettes ved neste skjemaforsøk som passerer konfigurasjons-, opprinnelses- og IP-kontrollen. Det følger også med en planlagt oppryddingsjobb hver time for perioder uten trafikk. [TODO: aktiver og overvåk jobben; bekreft faktisk slettefrist og frist for sikkerhetskopier].',
      'Leverandørenes e-postkopier, leveringsdata, driftslogger og sikkerhetskopier: [TODO: konkrete frister eller forståelige kriterier per leverandør].',
    ],
  },
  {
    id: 'rettigheter',
    title: 'Rettighetene dine',
    paragraphs: [
      'Du kan be om innsyn i opplysninger om deg og om å få feil rettet. Du kan også be om sletting eller begrenset behandling når vilkårene er oppfylt. Du kan protestere mot behandling som bygger på berettiget interesse. I enkelte tilfeller kan du få opplysninger utlevert i et format som kan overføres til andre.',
      'Kontakt oss på adressen over. Vi svarer normalt innen én måned. Hvis vi trenger mer tid i en sak der reglene tillater det, forklarer vi hvorfor. Vi ber bare om informasjon som er nødvendig for å bekrefte identiteten din.',
      'Du har rett til å klage til Datatilsynet. Du kan kontakte oss først dersom du ønsker at vi skal forsøke å løse saken.',
    ],
    links: [
      {
        label: 'Les om rettighetene dine hos Datatilsynet',
        href: 'https://www.datatilsynet.no/rettigheter-og-plikter/den-registrertes-rettigheter/',
      },
      {
        label: 'Kontakt Datatilsynet',
        href: 'https://www.datatilsynet.no/om-datatilsynet/kontakt-oss/',
      },
    ],
  },
];

export const cookieSections: LegalSection[] = [
  {
    id: 'oppsett',
    title: 'Et enkelt nettsted uten sporing',
    paragraphs: [
      'Nettstedets egen kode setter ingen informasjonskapsler og bruker ikke lokal lagring i nettleseren. Vi har ikke aktivert besøksanalyse, annonser, sporingspiksler, innebygde kart eller videoer fra andre tjenester. Skrifttyper og illustrasjoner leveres sammen med nettstedet.',
      'Kontaktskjemaet sender opplysningene til vår egen nettadresse. Behandlingen for å levere e-posten skjer hos drifts- og e-postleverandørene. Du finner mer om dette i personvernerklæringen.',
    ],
    links: [{ label: 'Les personvernerklæringen', href: '/personvern/' }],
  },
  {
    id: 'samtykke',
    title: 'Hvorfor vises det ikke et cookie-banner?',
    paragraphs: [
      'Det planlagte oppsettet bruker ingen valgfrie informasjonskapsler eller tilsvarende sporing som krever samtykke. Derfor er det ikke lagt inn et samtykkebanner.',
      '[TODO: kontroller det ferdig publiserte domenet, inkludert sikkerhetsfunksjoner hos Cloudflare. Leverandørinnstillinger kan legge til informasjonskapsler eller skript. Oppgi navn, formål, leverandør og varighet for eventuelle informasjonskapsler, og vurder om de er strengt nødvendige eller krever samtykke.]',
    ],
  },
  {
    id: 'endringer',
    title: 'Hvis nettstedet endres',
    paragraphs: [
      'Før analyseverktøy eller innhold fra andre tjenester aktiveres, må bruken vurderes på nytt og informasjonen her oppdateres. Lagring eller tilgang på enheten som krever samtykke skal ikke starte før du har valgt det.',
      'Reglene gjelder også andre teknologier enn informasjonskapsler. Et verktøy som omtales som «cookiefritt» er derfor ikke automatisk unntatt fra samtykkekrav.',
    ],
    links: [
      {
        label: 'Nkoms veiledning om informasjonskapsler',
        href: 'https://nkom.no/internett/informasjonskapsler-cookies',
      },
    ],
  },
];
