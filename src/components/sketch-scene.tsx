/* stroke + soft fills borrowed from the illustration system */
const INK = "#43362a";
const SAGE = "#a9b694";
const ROSE = "#ce9490";

/** One stroke of the pencil test: draws itself, then holds. */
function Stroke({ d, delay, width = 2.6, color = INK }: { d: string; delay: number; width?: number; color?: string }) {
  return (
    <path
      d={d}
      pathLength={300}
      className="sketch-once"
      style={{ animationDelay: `${delay}ms` }}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/**
 * The shop's open book sketches itself in: outlines first, then rule lines,
 * sprigs and flowers, then a soft wash of color. Pure CSS animation; under
 * prefers-reduced-motion everything simply appears fully drawn.
 */
export function SketchScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 130" className={className} aria-hidden>
      {/* soft color washes, arriving after the linework */}
      <g className="soft-in" style={{ animationDelay: "1500ms" }}>
        <path d="M110 38 C 92 26 62 24 44 32 L44 92 C 62 84 92 86 110 98 Z" fill="#f9f3e3" />
        <path d="M110 38 C 128 26 158 24 176 32 L176 92 C 158 84 128 86 110 98 Z" fill="#f9f3e3" />
        <path d="M36 98 C 60 90 92 92 110 104 C 128 92 160 90 184 98 L 180 106 C 158 100 128 102 110 112 C 92 102 62 100 40 106 Z" fill={ROSE} opacity="0.55" />
      </g>
      {/* the open book */}
      <Stroke d="M110 38 C 92 26 62 24 44 32 L44 92 C 62 84 92 86 110 98" delay={0} />
      <Stroke d="M110 38 C 128 26 158 24 176 32 L176 92 C 158 84 128 86 110 98" delay={150} />
      <Stroke d="M110 38 L110 98" delay={300} width={2.2} />
      {/* cover beneath the pages */}
      <Stroke d="M44 40 L36 98 C 60 90 92 92 110 104 C 128 92 160 90 184 98 L176 40" delay={420} />
      <Stroke d="M110 104 L110 112 C 106 108 106 108 102 107" delay={560} width={2.2} />
      {/* rule lines */}
      <Stroke d="M56 44 C 70 40 84 41 98 46" delay={650} width={1.9} />
      <Stroke d="M56 56 C 70 52 84 53 98 58" delay={740} width={1.9} />
      <Stroke d="M56 68 C 70 64 84 65 98 70" delay={830} width={1.9} />
      <Stroke d="M122 46 C 136 41 150 40 164 44" delay={700} width={1.9} />
      <Stroke d="M122 58 C 136 53 150 52 164 56" delay={790} width={1.9} />
      <Stroke d="M122 70 C 136 65 150 64 164 68" delay={880} width={1.9} />
      {/* sprigs */}
      <Stroke d="M34 76 C 22 68 14 56 12 42" delay={950} width={2.2} color={SAGE} />
      <Stroke d="M28 68 C 20 68 14 64 12 58 M22 56 C 24 48 22 42 18 38" delay={1050} width={2} color={SAGE} />
      <Stroke d="M186 76 C 198 68 206 56 208 42" delay={950} width={2.2} color={SAGE} />
      <Stroke d="M192 68 C 200 68 206 64 208 58 M198 56 C 196 48 198 42 202 38" delay={1050} width={2} color={SAGE} />
      {/* flowers */}
      <Stroke d="M24 84 a 5 5 0 1 0 0.1 0 M24 79 v-3 M29 84 h3 M24 89 v3 M19 84 h-3" delay={1180} width={2} color={ROSE} />
      <Stroke d="M196 84 a 5 5 0 1 0 0.1 0 M196 79 v-3 M201 84 h3 M196 89 v3 M191 84 h-3" delay={1180} width={2} color={ROSE} />
    </svg>
  );
}
