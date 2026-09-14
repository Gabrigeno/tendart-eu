import Hero3D from '@/components/landing/Hero3D';
import SplitScroll from '@/components/landing/SplitScroll';

const SECTIONS: { key: string; title: string; text: string; accent: string }[] = [
  {
    key: 'chi-siamo',
    title: 'Chi siamo',
    text: 'Tendart è un collettivo di promozione artistica. Mostre, eventi, concerti: facciamo spazio a chi ha qualcosa da dire.',
    accent: '#00f5d4',
  },
  {
    key: 'mostre',
    title: 'Mostre',
    text: 'Esposizioni indipendenti, spazi non convenzionali, artisti emergenti.',
    accent: '#ff0054',
  },
  {
    key: 'eventi',
    title: 'Eventi',
    text: 'Serate, performance, incontri. Dove succede qualcosa, ci siamo.',
    accent: '#8cff00',
  },
  {
    key: 'concerti',
    title: 'Concerti',
    text: 'Live, rumore, palchi veri. La musica come la vogliamo noi.',
    accent: '#00f5d4',
  },
];

export default function Landing() {
  return (
    <div className="w-full bg-black text-white" style={{ overflowX: 'clip' }}>
      <Hero3D />

      {/* La CTA fanzine vive DENTRO SplitScroll: è l'ultima sosta della
          sequenza pinnata dell'isola, non più una sezione separata. */}
      <SplitScroll sections={SECTIONS} />

      <footer className="text-sora m-4 border-4 border-white bg-black">
        <div className="mx-auto w-full max-w-screen-xl p-4 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-400 sm:text-center">© 2025 Tendart</span>
          <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-400 sm:mt-0">
            <li>
              <a href="https://instagram.com/_tendart_/?hl=it" className="me-4 hover:underline md:me-6">Insta!</a>
            </li>
            <li>
              <a href="https://www.youtube.com/@TendArtLab" className="me-4 hover:underline md:me-6">YouTube</a>
            </li>
            <li>
              <a href="https://soundcloud.com/tendart" className="me-4 hover:underline md:me-6">SoundCloud</a>
            </li>
            <li>
              <a href="mailto:tendart01@gmail.com" className="hover:underline">Contattaci</a>
            </li>
          </ul>
        </div>
        <div className="p-4 text-left">
          <span className="text-xs text-gray-500">
            Sito realizzato con ⚡ da{' '}
            <a className="hover:underline" href="https://www.linkedin.com/in/gabriele-genovesi-developer/">
              GabriGeno
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
