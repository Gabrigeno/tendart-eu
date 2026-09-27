import Hero3D from '@/components/landing/Hero3D';
import SplitScroll from '@/components/landing/SplitScroll';
import Footer from '@/components/Footer';
import { sections } from '@/data/sections';

export default function Landing() {
  return (
    <div className="w-full bg-black text-white" style={{ overflowX: 'clip' }}>
      <Hero3D />

      {/* La CTA fanzine vive DENTRO SplitScroll: è l'ultima sosta della
          sequenza pinnata dell'isola, non più una sezione separata. */}
      <SplitScroll sections={sections} />

      <Footer />
    </div>
  );
}
