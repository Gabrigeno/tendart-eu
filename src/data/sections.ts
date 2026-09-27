// Sezioni del collettivo: testi della landing + pagine di sezione sull'isola.
// Ogni sezione è un "posto" dell'isola (IslandScene): la pagina ci vola sopra con la camera.
// Coordinate in spazio isola (IslandScene senza trasformazioni). Le inquadrature si tarano
// a vista: cambiarle qui, zero codice.
export type CameraView = { position: [number, number, number]; target: [number, number, number] };

export type Section = {
  key: 'chi-siamo' | 'mostre' | 'eventi' | 'concerti';
  href: string;
  title: string;
  text: string;
  accent: string;
  body: string[];
  // link in fondo al testo (es. statuto e manifesto in Chi siamo)
  links?: { label: string; href: string }[];
  photos: string[];
  marker: [number, number, number];
  camera: { desktop: CameraView; mobile: CameraView };
};

// Foto provvisorie: le 12 di "Foto landing 1", 3 per sezione in ordine di nome file.
const photoModules = import.meta.glob('../assets/Foto landing 1/*.{jpg,jpeg,JPG,JPEG,png,webp}', {
  eager: true,
  import: 'default',
});
const PHOTOS = Object.keys(photoModules)
  .sort()
  .map((k) => photoModules[k] as string);
const photosFor = (i: number) => PHOTOS.slice(i * 3, i * 3 + 3);

const LOREM = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse.',
];

// Chi siamo avrà un testo molto più lungo: segnaposto più corposo per tarare l'impaginazione
const LOREM_LONG = [
  ...LOREM,
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus, nulla gravida orci a odio.',
  'Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula.',
  'Donec lobortis risus a elit. Etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi.',
];

// Candidature di artisti e band: Google Form del collettivo (link esterno, nuova scheda).
// TODO contenuti: segnaposto finché il collettivo non crea il Form; incollare qui l'URL.
export const PROPONITI_URL = '#';
const PROPONITI = { label: 'Proponiti', href: PROPONITI_URL };

// inquadratura larga da cui parte il volo all'arrivo sulla pagina
export const WIDE_VIEW: CameraView = { position: [0, 3.4, 6.2], target: [0, 0.2, 0] };

export const sections: Section[] = [
  {
    key: 'chi-siamo',
    href: '/chi-siamo',
    title: 'Chi siamo',
    text: 'Tendart è un collettivo di promozione artistica. Mostre, eventi, concerti: facciamo spazio a chi ha qualcosa da dire.',
    accent: '#00f5d4',
    body: LOREM_LONG,
    // TODO contenuti: href provvisori, da sostituire con i link/PDF veri di statuto e manifesto
    links: [
      { label: 'Statuto', href: '#' },
      { label: 'Manifesto', href: '#' },
    ],
    photos: photosFor(0),
    marker: [-1.05, 1.25, 0.35],
    camera: {
      desktop: { position: [0.35, 1.4, 2.95], target: [-0.55, 0.5, 0.35] },
      mobile: { position: [-0.6, 0.75, 2.95], target: [-1.0, 0.25, 0.35] },
    },
  },
  {
    key: 'mostre',
    href: '/mostre',
    title: 'Mostre',
    text: 'Esposizioni indipendenti, spazi non convenzionali, artisti emergenti.',
    accent: '#ff0054',
    body: LOREM,
    links: [PROPONITI],
    photos: photosFor(1),
    marker: [0.95, 1.05, -0.42],
    camera: {
      desktop: { position: [2.05, 1.3, 2.18], target: [1.45, 0.4, -0.42] },
      mobile: { position: [1.6, 0.8, 2.7], target: [0.95, 0.25, -0.42] },
    },
  },
  {
    key: 'eventi',
    href: '/eventi',
    title: 'Eventi',
    text: 'Serate, performance, incontri. Dove succede qualcosa, ci siamo.',
    accent: '#8cff00',
    body: LOREM,
    links: [PROPONITI],
    photos: photosFor(2),
    marker: [-0.45, 2.1, -1.0],
    camera: {
      desktop: { position: [0.75, 1.25, 2.7], target: [0.1, 1.0, -1.0] },
      mobile: { position: [-0.1, 1.0, 2.9], target: [-0.45, 0.55, -1.0] },
    },
  },
  {
    key: 'concerti',
    href: '/concerti',
    title: 'Concerti',
    text: 'Live, rumore, palchi veri. La musica come la vogliamo noi.',
    accent: '#00f5d4',
    body: LOREM,
    links: [PROPONITI],
    photos: photosFor(3),
    marker: [-0.1, 1.2, 0.55],
    camera: {
      desktop: { position: [1.0, 1.3, 2.95], target: [0.4, 0.55, 0.55] },
      mobile: { position: [0.3, 0.7, 3.0], target: [-0.1, 0.15, 0.55] },
    },
  },
];
