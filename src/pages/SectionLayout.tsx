import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowBackIcon } from '@/components/ui/icons/akar-icons-arrow-back';
import { NightSky } from '@/components/landing/NightSky';
import Footer from '@/components/Footer';
import SectionPanel from '@/components/sections/SectionPanel';
import SectionPhotos from '@/components/sections/SectionPhotos';
import { sections, type Section } from '@/data/sections';

// Layout route delle 4 sezioni: resta montata passando da una all'altra (le route figlie
// non hanno element), così lo stage 3D non si ricrea e la camera vola in continuità.
export default function SectionLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const index = Math.max(0, sections.findIndex((s) => s.href === pathname));
  const section = sections[index];
  const prev = sections[index - 1];
  const next = sections[index + 1];
  const go = (s: Section) => navigate(s.href);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      if (e.key === 'ArrowLeft' && prev) navigate(prev.href);
      if (e.key === 'ArrowRight' && next) navigate(next.href);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [prev, next, navigate]);

  return (
    <div className="relative isolate min-h-screen bg-black text-white">
      {/* stage fisso dietro a tutto: cielo + canvas dell'isola */}
      <div data-stage className="fixed inset-0 -z-10">
        <NightSky dusk={0} night={1} />
      </div>

      <Link
        to="/"
        aria-label="Torna alla home"
        className="fixed top-4 left-4 z-30 flex items-center border-2 border-white bg-black/60 p-2 !text-white transition-all duration-300 hover:bg-white hover:!text-black"
      >
        <ArrowBackIcon />
      </Link>

      {/* primo schermo: desktop riquadro a destra (isola a sinistra), mobile pannello dal basso */}
      <div className="relative flex min-h-screen items-end px-4 pb-6 pt-[62vh] md:items-center md:justify-end md:px-[6%] md:py-16">
        {/* sfumatura sotto al pannello su mobile: niente blur */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black via-black/70 to-transparent md:hidden" />
        <div className="relative w-full md:max-w-md">
          <SectionPanel key={section.key} section={section} index={index} total={sections.length} prev={prev} next={next} onGo={go} />
        </div>
      </div>

      <section className="relative bg-gradient-to-b from-transparent via-[#03061a]/90 to-black px-4 pb-20 pt-10 md:px-[6%]">
        <div className="mx-auto max-w-6xl">
          <SectionPhotos section={section} />
        </div>
      </section>

      <Footer />
    </div>
  );
}
