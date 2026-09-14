import { useEffect, useState } from "react";
import { ArrowBackIcon } from "@/components/ui/icons/akar-icons-arrow-back";
import EjectTwoToneIcon from '@mui/icons-material/EjectTwoTone';
import FlyingPosters from "@/components/FlyingPosters";

const items = [
  'carousel/resizezine.jpg',
  'carousel/resize1.jpg',
  'carousel/resizehallo.jpg',
];

const fanzines = [
  { href: '/fanzine_1', label: 'FuoriRottaZine vol 1', sub: '(Evento Solaio)', accent: '#00f5d4' },
  { href: '/fanzine_2', label: 'FuoriRottaZine vol 2', sub: '(Evento Nimbus)', accent: '#ff0054' },
  { href: '/fanzine_3', label: 'FuoriRottaZine: Viaggio nel Regno del Terrore!', sub: '(Speciale di Halloween 🧛)', accent: '#8cff00' },
];

export default function Library() {
  const [showHint, setShowHint] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full h-screen flex flex-col md:flex-row items-center justify-between overflow-hidden bg-black p-4 md:p-8">
      <div className="w-full h-screen flex flex-col md:flex-row items-center justify-between p-4 md:p-8">

        {/* Testo a sinistra */}
        <div className="flex flex-col items-start gap-6 w-full max-w-xl p-6">
          <h1
            className="text-bbh text-white font-extrabold uppercase text-3xl md:text-5xl leading-tight"
            style={{ color: '#ff0054', textShadow: '4px 4px 0 #000' }}
          >
            Gustati le fanzine!
          </h1>

          <div className="w-full flex flex-col gap-4">
            {fanzines.map((fz) => (
              <a
                key={fz.href}
                href={fz.href}
                className="group block w-full text-sora border-2 bg-black/60 p-4 !text-white transition-all duration-300 hover:bg-black hover:scale-[1.02]"
                style={{
                  borderColor: fz.accent,
                  boxShadow: `4px 4px 0 #000`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = `0 0 18px ${fz.accent}, 4px 4px 0 #000`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = `4px 4px 0 #000`;
                }}
              >
                <span className="flex items-center gap-2 font-bold" style={{ color: fz.accent }}>
                  &#9670; {fz.label}
                </span>
                {fz.sub && <span className="block text-sm text-gray-300 mt-1">{fz.sub}</span>}
              </a>
            ))}
          </div>

          <a
            href="/"
            className="group flex items-center gap-2 border-2 border-white bg-black/60 p-2 !text-white transition-all duration-300 hover:bg-white hover:!text-black"
          >
            <ArrowBackIcon />
          </a>
        </div>


        {/* Posters a destra */}
        <div className="relative hidden md:flex w-full md:w-1/2 h-64 md:h-screen mt-6 md:mt-0 justify-center items-center">
          {showHint && (
            <div
              className="absolute top-10 md:top-20 z-[9999] text-sora px-4 py-2 text-white font-bold bg-black/80 border-2 animate-pulse flex items-center gap-1"
              style={{ borderColor: '#00f5d4', boxShadow: '0 0 14px #00f5d4' }}
            >
              Scrolla un po'
              <EjectTwoToneIcon sx={{ color: '#00f5d4' }} />
            </div>
          )}
          <FlyingPosters items={items} distortion={0.6} />
        </div>

      </div>
    </div>
  );
}
