// Per aggiungere una fanzine: metti copertina (public/carousel/) e PDF (public/) e aggiungi
// un elemento qui. Route, Library, lettore sfogliabile e icona 3D si aggiornano da soli.
// pdf = versione da sfogliare (pagine singole), download = versione da scaricare.
export const fanzines = [
  { href: '/fanzine_1', title: 'FuoriRottaZine vol 1', sub: '(Evento Solaio)', cover: '/carousel/resize1.jpg', pdf: '/laprima.pdf', download: '/laprima.pdf', accent: '#00f5d4' },
  { href: '/fanzine_2', title: 'FuoriRottaZine vol 2', sub: '(Evento Nimbus)', cover: '/carousel/resizezine.jpg', pdf: '/noland.pdf', download: '/fuorirottazinev2.pdf', accent: '#ff0054' },
  { href: '/fanzine_3', title: 'FuoriRottaZine: Viaggio nel Regno del Terrore!', sub: '(Speciale di Halloween 🧛)', cover: '/carousel/resizehallo.jpg', pdf: '/hallow.pdf', download: '/halloweenzinevf.pdf', accent: '#8cff00' },
];

export type Fanzine = (typeof fanzines)[number];
