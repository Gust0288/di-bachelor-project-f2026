export const wizardSteps = [
  {
    label: 'Virksomhedsinformation',
    title: 'Indmeldelse i Dansk Industri',
    description:
      'Tak for din interesse i et DI-medlemskab. For at kunne tilbyde det rette medlemskab skal vi bruge en række oplysninger om virksomheden.',
  },
  {
    label: 'Branche',
    title: 'Hvad laver din virksomhed?',
    description:
      'Vi bruger virksomhedens brancheoplysninger fra CVR til at finde de relevante DI-fællesskaber og medlemsvilkår.',
  },
  {
    label: 'Ønsker og behov',
    title: 'Ønsker og behov',
    description:
      'Vælg de services og ydelser, der er relevante for virksomheden, så vi kan anbefale det rigtige medlemskab.',
  },
  {
    label: 'Virksomhedens ansatte',
    title: 'Virksomhedens ansatte',
    description:
      'Oplys antal ansatte, medarbejdertyper og lønsum. Det bruges til at beregne kontingent og medlemskabstype.',
  },
  {
    label: 'Overenskomst',
    title: 'Overenskomst',
    description:
      'Fortæl om jeres nuværende overenskomstsituation, så indmeldelsen bliver håndteret korrekt.',
  },
  {
    label: 'Fællesskaber og foreninger',
    title: 'Fællesskaber og foreninger',
    description:
      'Se de branchefællesskaber, der matcher virksomheden, og vælg de fællesskaber I ønsker at være en del af.',
  },
  {
    label: 'Medlemskab',
    title: 'Jeres medlemskab',
    description:
      'Gennemgå den anbefalede medlemskabstype baseret på de oplysninger, der er indtastet i flowet.',
  },
  {
    label: 'Kontaktpersoner',
    title: 'Kontaktpersoner',
    description:
      'Tilføj de personer DI skal kontakte om ledelse, personalejura, lønsum, tegningsret og faktura.',
  },
  {
    label: 'Godkendelse',
    title: 'Opsummering og godkendelse',
    description:
      'Her er en opsummering af de oplysninger, du har indtastet. Tjek at alt ser rigtigt ud, og afslut med at godkende indmeldelsen.',
  },
] as const

export const wizardStepLabels = wizardSteps.map((step) => step.label)
