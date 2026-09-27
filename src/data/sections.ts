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
  place: string;
  body: string[];
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

// inquadratura larga da cui parte il volo all'arrivo sulla pagina
export const WIDE_VIEW: CameraView = { position: [0, 3.4, 6.2], target: [0, 0.2, 0] };

export const sections: Section[] = [
  {
    key: 'chi-siamo',
    href: '/chi-siamo',
    title: 'Chi siamo',
    text: 'Tendart è un collettivo di promozione artistica. Mostre, eventi, concerti: facciamo spazio a chi ha qualcosa da dire.',
    accent: '#00f5d4',
    place: 'La tenda',
    body: LOREM,
    photos: photosFor(0),
    marker: [-1.05, 1.05, 0.35],
    camera: {
      desktop: { position: [0.6, 1.3, 2.6], target: [-0.35, 0.45, 0.35] },
      mobile: { position: [-0.55, 0.6, 1.9], target: [-1.05, 0.45, 0.35] },
    },
  },
  {
    key: 'mostre',
    href: '/mostre',
    title: 'Mostre',
    text: 'Esposizioni indipendenti, spazi non convenzionali, artisti emergenti.',
    accent: '#ff0054',
    place: 'Le rocce',
    body: LOREM,
    photos: photosFor(1),
    marker: [0.95, 0.95, -0.42],
    camera: {
      desktop: { position: [2.3, 1.2, 1.6], target: [1.55, 0.35, -0.42] },
      mobile: { position: [1.25, 0.5, 0.75], target: [0.95, 0.35, -0.42] },
    },
  },
  {
    key: 'eventi',
    href: '/eventi',
    title: 'Eventi',
    text: 'Serate, performance, incontri. Dove succede qualcosa, ci siamo.',
    accent: '#8cff00',
    place: 'Gli alberi',
    body: LOREM,
    photos: photosFor(2),
    marker: [-0.45, 1.95, -1.0],
    camera: {
      desktop: { position: [0.9, 1.6, 1.4], target: [0.2, 1.0, -1.0] },
      mobile: { position: [-0.2, 0.8, 0.35], target: [-0.45, 1.05, -1.0] },
    },
  },
  {
    key: 'concerti',
    href: '/concerti',
    title: 'Concerti',
    text: 'Live, rumore, palchi veri. La musica come la vogliamo noi.',
    accent: '#00f5d4',
    place: 'Il falò',
    body: LOREM,
    photos: photosFor(3),
    marker: [-0.1, 1.05, 0.55],
    camera: {
      desktop: { position: [1.2, 1.1, 2.3], target: [0.5, 0.4, 0.55] },
      mobile: { position: [0.25, 0.5, 1.55], target: [-0.1, 0.4, 0.55] },
    },
  },
];
