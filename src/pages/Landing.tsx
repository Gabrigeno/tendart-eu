import Hero3D from '@/components/landing/Hero3D';
import SplitScroll from '@/components/landing/SplitScroll';
import Footer from '@/components/Footer';

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

      <Footer />
    </div>
  );
}
