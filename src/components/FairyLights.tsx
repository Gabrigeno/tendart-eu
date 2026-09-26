// Lucine di sfondo low-poly: gemme sfaccettate (spicchi a shading piatto, come l'isola)
// con alone morbido e luccichio sfalsato. Disposte lungo due archi appena accennati —
// evocano una catena di luci senza disegnarla. Profondità: le lontane piccole, fioche e
// sfocate, le vicine più grandi e nitide. Solo SVG/CSS, posizioni deterministiche.
const W = 1440;
const H = 900;
// due soli toni: oro caldo (~2/3) + l'accento della fanzine
const WARM = '#ffc865';

// PRNG deterministico: stesse luci a ogni render
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

// schiarisce (amt > 0) o scurisce (amt < 0) un colore hex
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  return `rgb(${ch(n >> 16)},${ch((n >> 8) & 255)},${ch(n & 255)})`;
}

type Light = { x: number; y: number; r: number; sides: number; rot: number; warm: boolean; depth: number; dur: number; delay: number };

const LIGHTS: Light[] = (() => {
  const rand = rng(7);
  const out: Light[] = [];
  // due archi: uno alto e ampio, uno più basso e lontano
  const arcs = [
    { y: 70, sag: 150, count: 13, depth: [0.55, 1] },
    { y: 250, sag: 230, count: 11, depth: [0.15, 0.5] },
  ];
  arcs.forEach((a) => {
    for (let i = 0; i < a.count; i++) {
      const t = (i + 0.5 + (rand() - 0.5) * 0.6) / a.count;
      const depth = a.depth[0] + rand() * (a.depth[1] - a.depth[0]);
      out.push({
        x: t * W,
        // parabola dell'arco + scarto verticale, così non sembra un filo
        y: a.y + 4 * a.sag * t * (1 - t) + (rand() - 0.5) * 70,
        r: 5 + depth * 9,
        sides: rand() > 0.5 ? 6 : 5,
        rot: rand() * 60,
        warm: rand() < 0.66,
        depth,
        dur: 2.6 + rand() * 2.8,
        delay: -rand() * 5,
      });
    }
  });
  // le lontane sotto, le vicine sopra
  return out.sort((l1, l2) => l1.depth - l2.depth);
})();

// gemma: poligono diviso in spicchi dal centro, ogni spicchio una tonalità diversa
function Gem({ l, accent }: { l: Light; accent: string }) {
  const color = l.warm ? WARM : accent;
  const pts = Array.from({ length: l.sides }, (_, i) => {
    const a = ((l.rot + (360 / l.sides) * i) * Math.PI) / 180;
    return [Math.cos(a) * l.r, Math.sin(a) * l.r] as const;
  });
  const facets = [0.55, 0.2, -0.15, -0.35, 0.05, 0.35];
  return (
    <g transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)})`} opacity={0.35 + l.depth * 0.65}>
      <g className="fl-gem" style={{ animationDuration: `${l.dur.toFixed(2)}s`, animationDelay: `${l.delay.toFixed(2)}s` }}>
        <circle r={l.r * 3.2} fill={color} opacity={0.28} filter="url(#fl-glow)" />
        <g filter={l.depth < 0.4 ? 'url(#fl-soft)' : undefined}>
          {pts.map((p, i) => {
            const q = pts[(i + 1) % pts.length];
            return (
              <polygon
                key={i}
                points={`0,0 ${p[0].toFixed(1)},${p[1].toFixed(1)} ${q[0].toFixed(1)},${q[1].toFixed(1)}`}
                fill={shade(color, facets[i % facets.length])}
              />
            );
          })}
        </g>
      </g>
    </g>
  );
}

export default function FairyLights({ accent, className = '' }: { accent: string; className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMin slice"
      className={`pointer-events-none select-none ${className}`}
    >
      <style>{`
        .fl-gem { animation: fl-twinkle ease-in-out infinite alternate; }
        @keyframes fl-twinkle { 0% { opacity: .4 } 55% { opacity: 1 } 100% { opacity: .75 } }
        @media (prefers-reduced-motion: reduce) { .fl-gem { animation: none; } }
      `}</style>
      <defs>
        <filter id="fl-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="fl-soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" />
        </filter>
      </defs>
      {LIGHTS.map((l, i) => (
        <Gem key={i} l={l} accent={accent} />
      ))}
    </svg>
  );
}
