// Cielo dietro al canvas dell'isola, dal tramonto alla notte: due livelli sovrapposti,
// .sky-dusk (blu da tramonto con orizzonte caldo) e .sky-night (blu notte + stelle SVG,
// poche e piccole, alcune luccicano). La timeline di SplitScroll ne incrocia solo
// l'opacità, quindi costa zero su mobile.
const W = 1440;
const H = 900;

const STARS = (() => {
  let seed = 11;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  return Array.from({ length: 70 }, () => ({
    x: rand() * W,
    // più fitte in alto, rade verso l'orizzonte
    y: rand() ** 1.6 * H * 0.85,
    r: 0.5 + rand() * 1.1,
    twinkle: rand() < 0.3,
    dur: 2 + rand() * 3,
    delay: -rand() * 4,
  }));
})();

// dusk / night: opacità iniziali dei due livelli (0..1)
export function NightSky({ dusk = 1, night = 0 }: { dusk?: number; night?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        className="sky-dusk absolute inset-0"
        style={{
          opacity: dusk,
          // crepuscolo scuro: quasi nero-blu in alto → blu profondo → brace fioca all'orizzonte
          background:
            'radial-gradient(ellipse 80% 35% at 50% 78%, rgba(200,90,60,.28) 0%, rgba(150,50,80,.14) 45%, transparent 75%), linear-gradient(180deg, #03061a 0%, #0a1438 40%, #1a1f4a 62%, #3a2442 80%, #0a0610 100%)',
        }}
      />
      <div className="sky-night absolute inset-0" style={{ opacity: night }}>
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 120% 90% at 50% 0%, #0d1a3a 0%, #070d22 45%, #000 85%)' }}
        />
        <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMin slice" className="absolute inset-0 h-full w-full">
          <style>{`
            .ns-star { animation: ns-twinkle ease-in-out infinite alternate; }
            @keyframes ns-twinkle { from { opacity: .25 } to { opacity: 1 } }
            @media (prefers-reduced-motion: reduce) { .ns-star { animation: none; } }
          `}</style>
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.x.toFixed(1)}
              cy={s.y.toFixed(1)}
              r={s.r.toFixed(2)}
              fill="#dfe8ff"
              opacity={0.8}
              className={s.twinkle ? 'ns-star' : undefined}
              style={s.twinkle ? { animationDuration: `${s.dur.toFixed(2)}s`, animationDelay: `${s.delay.toFixed(2)}s` } : undefined}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}
