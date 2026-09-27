// Cielo notturno dietro al canvas dell'isola: velo blu notte + stelle SVG, poche e
// piccole, alcune luccicano. La timeline di SplitScroll ne anima solo l'opacità
// (.night-sky), quindi costa zero su mobile.
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

export function NightSky({ className = '' }: { className?: string }) {
  return (
    <div className={`night-sky pointer-events-none absolute inset-0 ${className}`}>
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
  );
}
