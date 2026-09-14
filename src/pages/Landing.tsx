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

      <footer className="text-sora bg-black" style={{ borderTop: '2px solid #00f5d4' }}>
        <div className="mx-auto w-full max-w-screen-xl p-6 md:flex md:items-center md:justify-between">
          <span className="text-sm text-gray-400 sm:text-center">© 2026 Tendart</span>
          <ul className="mt-3 flex flex-wrap items-center text-sm font-medium text-gray-400 sm:mt-0">
            <li>
              <a href="https://instagram.com/_tendart_/?hl=it" className="me-4 transition-colors hover:text-[#ff0054] md:me-6">Insta!</a>
            </li>
            <li>
              <a href="https://www.youtube.com/@TendArtLab" className="me-4 transition-colors hover:text-[#ff0054] md:me-6">YouTube</a>
            </li>
            <li>
              <a href="https://soundcloud.com/tendart" className="me-4 transition-colors hover:text-[#ff0054] md:me-6">SoundCloud</a>
            </li>
            <li>
              <a href="mailto:tendart01@gmail.com" className="transition-colors hover:text-[#ff0054]">Contattaci</a>
            </li>
          </ul>
        </div>
        <div className="px-6 pb-6 text-left">
          <span className="text-xs text-gray-500">
            Sito realizzato con ⚡ da{' '}
            <a className="transition-colors hover:text-[#00f5d4]" href="https://github.com/Gabrigeno">
              GabriGeno
            </a>
          </span>
        </div>
      </footer>
    </div>
  );
}
