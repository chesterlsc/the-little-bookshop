import type { ArtKind } from "@/lib/catalog";
import { useId, type CSSProperties } from "react";

/**
 * Hand-drawn-style SVG illustration system.
 * Everything here is clearly an illustration (never a fake product photo):
 * warm folk shapes, ink outlines, and small storybook details.
 */

const INK = "#43362a";
const CREAM = "#f9f3e3";
const PAGE = "#f3e9d5";
const SAGE = "#a9b694";
const SAGE_D = "#75845c";
const BLUSH = "#eebbaa";
const ROSE = "#ce9490";
const TAUPE = "#cfbfa3";
const BROWN = "#8a6f52";

export const SPINE_COLORS = [
  "#c9d3b4", // sage
  "#efc3b2", // blush
  "#e7d9bc", // cream
  "#c4a97e", // camel
  "#b97d7c", // rose
  "#8f9d84", // deep sage
  "#d9b36a", // gold
  "#a98f74", // brown
];

const drift: CSSProperties = { transformBox: "fill-box", transformOrigin: "center" };

/* ─── Small folk pieces ────────────────────────────────────────────────────── */

export function FolkFlower({ x = 0, y = 0, r = 6, fill = ROSE }: { x?: number; y?: number; r?: number; fill?: string }) {
  // unit circle at 72° steps, pre-rounded so SSR and client markup match exactly
  const petals = [
    [1, 0],
    [0.309, 0.951],
    [-0.809, 0.588],
    [-0.809, -0.588],
    [0.309, -0.951],
  ] as const;
  return (
    <g transform={`translate(${x} ${y})`}>
      {petals.map(([px, py], a) => (
        <circle
          key={a}
          cx={Math.round(px * r * 100) / 100}
          cy={Math.round(py * r * 100) / 100}
          r={Math.round(r * 62) / 100}
          fill={fill}
          stroke={INK}
          strokeWidth={Math.round(r * 14) / 100}
        />
      ))}
      <circle r={r / 2} fill={CREAM} stroke={INK} strokeWidth={Math.round(r * 14) / 100} />
    </g>
  );
}

export function Leaf({ x = 0, y = 0, s = 10, angle = 0, fill = SAGE }: { x?: number; y?: number; s?: number; angle?: number; fill?: string }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path
        d={`M0 0 Q ${s * 0.9} ${-s * 0.7} ${s * 1.8} 0 Q ${s * 0.9} ${s * 0.7} 0 0 Z`}
        fill={fill}
        stroke={INK}
        strokeWidth={s * 0.12}
        strokeLinejoin="round"
      />
      <path d={`M${s * 0.2} 0 H ${s * 1.5}`} stroke={INK} strokeWidth={s * 0.09} />
    </g>
  );
}

export function Sparkle({ x = 0, y = 0, s = 5, fill = "#d9b36a" }: { x?: number; y?: number; s?: number; fill?: string }) {
  return (
    <path
      d={`M${x} ${y - s} Q ${x + s * 0.22} ${y - s * 0.22} ${x + s} ${y} Q ${x + s * 0.22} ${y + s * 0.22} ${x} ${y + s} Q ${x - s * 0.22} ${y + s * 0.22} ${x - s} ${y} Q ${x - s * 0.22} ${y - s * 0.22} ${x} ${y - s} Z`}
      fill={fill}
      opacity={0.9}
    />
  );
}

/** Botanical divider: sprig, flower, sprig */
export function FolkDivider({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 26" className={className} aria-hidden="true" role="presentation">
      <path d="M20 13 H 92" stroke={TAUPE} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 6" />
      <path d="M128 13 H 200" stroke={TAUPE} strokeWidth="2" strokeLinecap="round" strokeDasharray="1 6" />
      <Leaf x={86} y={13} s={7} angle={205} />
      <Leaf x={134} y={13} s={7} angle={-25} />
      <FolkFlower x={110} y={13} r={7} />
    </svg>
  );
}

/* ─── The signature: a little shelf that fills with your titles ───────────── */

/** Which silhouette the sketch draws; mirrors the six shelf products. */
export type ShelfShape =
  | "scalloped"
  | "basic"
  | "fancy"
  | "cube"
  | "arched"
  | "medieval";

export type ShelfSize = "regular" | "miniature";

/** "shelf-arched" (an ArtKind) → "arched"; anything else → scalloped. */
export function shelfShapeFromArt(art: string): ShelfShape {
  const s = art.replace(/^shelf-/, "");
  return (["scalloped", "basic", "fancy", "cube", "arched", "medieval"] as const).includes(
    s as ShelfShape,
  )
    ? (s as ShelfShape)
    : "scalloped";
}

/* deterministic hash → [0,1): integer math only, so the server and every browser agree */
const rnd = (seed: number) => (((seed * 1103515245 + 12345) >>> 16) & 0x7fff) / 0x8000;

/**
 * Wrap a title into at most three short lines for a facing-out mini cover.
 * Words are never cut mid-word (long single words get a soft hyphen split);
 * only a title that cannot fit three lines gets an ellipsis.
 */
function coverLines(title: string): string[] {
  const wrap = (max: number): string[] => {
    const words = title
      .trim()
      .split(/\s+/)
      .flatMap((w) =>
        w.length <= max ? [w] : [w.slice(0, max - 1) + "‑", w.slice(max - 1)],
      );
    const lines: string[] = [];
    for (const w of words) {
      const last = lines[lines.length - 1];
      if (last !== undefined && `${last} ${w}`.length <= max) {
        lines[lines.length - 1] = `${last} ${w}`;
      } else lines.push(w);
    }
    return lines;
  };
  let lines = wrap(8);
  if (lines.length > 3) lines = wrap(10);
  if (lines.length > 3) lines = [...lines.slice(0, 2), lines[2] + "…"];
  return lines;
}

export interface MiniShelfProps {
  titles?: (string | undefined)[];
  shelfColor?: string;
  shape?: ShelfShape;
  size?: ShelfSize;
  accent?: boolean;
  className?: string;
  animate?: boolean;
  label?: string;
}

/* One filler item computed for a stretch of shelf. */
interface Filler {
  kind: "spine" | "stack" | "plant";
  x: number;
  w: number;
  h: number;
  ci: number;
  lean: number;
}

/** Fill a horizontal stretch with spines / a flat stack / maybe a plant. */
function fillStretch(x0: number, x1: number, seed: number, allowPlant: boolean): Filler[] {
  const out: Filler[] = [];
  let x = x0;
  let i = 0;
  while (x1 - x >= 9) {
    const r = rnd(seed + i * 17);
    if (allowPlant && i === 0 && r > 0.55 && x1 - x >= 20) {
      out.push({ kind: "plant", x, w: 16, h: 22, ci: 0, lean: 0 });
      x += 19;
    } else if (r < 0.16 && x1 - x >= 30) {
      out.push({ kind: "stack", x, w: 27, h: 16, ci: (i + 3) % SPINE_COLORS.length, lean: 0 });
      x += 30;
    } else {
      const w = Math.min(7 + rnd(seed + i * 31 + 7) * 7, x1 - x);
      const h = 29 + rnd(seed + i * 13 + 3) * 15;
      const lean = rnd(seed + i * 41 + 11) > 0.88 && x1 - x - w > 8 ? 8 : 0;
      out.push({ kind: "spine", x, w, h, ci: Math.floor(rnd(seed + i * 7 + 5) * SPINE_COLORS.length), lean });
      x += w + 1.5 + (lean ? 2 : 0);
    }
    i += 1;
  }
  const last = out[out.length - 1];
  if (last?.lean) last.lean = 0;
  return out;
}

function FillerArt({ f, base }: { f: Filler; base: number }) {
  const c = SPINE_COLORS[f.ci];
  if (f.kind === "plant") {
    return (
      <g>
        <path d={`M${f.x + 2} ${base - 9} h12 l-1.6 9 h-8.8 Z`} fill={CREAM} stroke={INK} strokeWidth="1.6" />
        <path d={`M${f.x + 8} ${base - 9} Q ${f.x + 2} ${base - 16} ${f.x + 1} ${base - 21}`} fill="none" stroke={SAGE_D} strokeWidth="1.8" strokeLinecap="round" />
        <path d={`M${f.x + 8} ${base - 9} Q ${f.x + 8.5} ${base - 18} ${f.x + 7} ${base - 23}`} fill="none" stroke={SAGE_D} strokeWidth="1.8" strokeLinecap="round" />
        <path d={`M${f.x + 8} ${base - 9} Q ${f.x + 13} ${base - 15} ${f.x + 15} ${base - 20}`} fill="none" stroke={SAGE_D} strokeWidth="1.8" strokeLinecap="round" />
      </g>
    );
  }
  if (f.kind === "stack") {
    return (
      <g>
        {[0, 1, 2].map((k) => (
          <rect
            key={k}
            x={f.x + (k === 1 ? 2.5 : k === 2 ? 1 : 0)}
            y={base - 5.5 * (k + 1)}
            width={f.w - (k === 1 ? 4 : k === 2 ? 2 : 0)}
            height={5.5}
            rx={1.5}
            fill={SPINE_COLORS[(f.ci + k) % SPINE_COLORS.length]}
            stroke={INK}
            strokeWidth="1.4"
          />
        ))}
      </g>
    );
  }
  return (
    <g transform={f.lean ? `rotate(${f.lean} ${f.x + f.w / 2} ${base})` : undefined}>
      <rect x={f.x} y={base - f.h} width={f.w} height={f.h} rx="2" fill={c} stroke={INK} strokeWidth="1.5" />
      <path d={`M${f.x + 1.5} ${base - f.h + 4.5} H ${f.x + f.w - 1.5}`} stroke={INK} strokeWidth="1.1" opacity="0.45" />
    </g>
  );
}

const COVER_W = 31;
const COVER_H = 40;

function CoverCard({
  x,
  base,
  slot,
  title,
  animate,
}: {
  x: number;
  base: number;
  slot: number;
  title: string | null;
  animate: boolean;
}) {
  if (!title) {
    return (
      <g opacity="0.55">
        <rect x={x} y={base - COVER_H} width={COVER_W} height={COVER_H} rx="3" fill="none" stroke={BROWN} strokeWidth="1.8" strokeDasharray="4.5 4.5" />
        <text x={x + COVER_W / 2} y={base - COVER_H / 2 + 5} textAnchor="middle" fontSize="14" fontWeight={700} fill={BROWN} style={{ fontFamily: "var(--font-sans)" }}>
          {slot + 1}
        </text>
      </g>
    );
  }
  const c = SPINE_COLORS[slot % SPINE_COLORS.length];
  const lines = coverLines(title);
  const cy = base - COVER_H;
  const fs = lines.length === 3 ? 5.8 : 6.8;
  const lh = lines.length === 3 ? 7.6 : 9;
  const y0 = cy + 22.5 - ((lines.length - 1) * lh) / 2;
  return (
    <g
      className={animate ? "animate-slot-in" : undefined}
      style={animate ? { animationDelay: `${slot * 90}ms` } : undefined}
    >
      <rect x={x} y={cy} width={COVER_W} height={COVER_H} rx="3" fill={c} stroke={INK} strokeWidth="1.9" />
      <path d={`M${x + 4} ${cy + 6.5} H ${x + COVER_W - 4}`} stroke={INK} strokeWidth="1.2" opacity="0.5" />
      {lines.map((l, i) => (
        <text
          key={i}
          x={x + COVER_W / 2}
          y={y0 + i * lh}
          textAnchor="middle"
          fontSize={fs}
          fontWeight={700}
          fill={INK}
          style={{ fontFamily: "var(--font-sans)" }}
          {...(l.length > 8 ? { textLength: COVER_W - 5, lengthAdjust: "spacingAndGlyphs" } : {})}
        >
          {l}
        </text>
      ))}
      <path d={`M${x + 7} ${cy + COVER_H - 6} H ${x + COVER_W - 7}`} stroke={INK} strokeWidth="1.2" opacity="0.4" />
    </g>
  );
}

/**
 * A realistic little bookcase in the silhouette and size the user chose:
 * Regular stands four stories tall, Miniature three (and a touch narrower).
 * The six chosen titles face outward as mini covers among filler spines;
 * empty slots wait as dotted covers, so the shelf fills as titles are typed.
 */
export function MiniShelf({
  titles = [],
  shelfColor = BLUSH,
  shape = "scalloped",
  size = "regular",
  accent = true,
  className = "",
  animate = false,
  label,
}: MiniShelfProps) {
  const clipId = useId();
  const slots = Array.from({ length: 6 }, (_, i) => titles[i]?.trim() || null);

  const mini = size === "miniature";
  const T = mini ? 3 : 4;
  const seed0 = shape.charCodeAt(0) * 131 + shape.length * 17 + (mini ? 29 : 0);

  const tierInner = 46;
  const board = 8;
  const tierH = tierInner + board;

  const fx = mini ? 36 : 18;
  const fw = mini ? 208 : 244;
  const side = 9;
  const inX = fx + side;
  const inW = fw - side * 2;

  const cornice = shape === "fancy" || shape === "medieval";
  const frameTop = 10 + (cornice ? 13 : 0);
  const winTop = frameTop + 8;
  const head = shape === "arched" ? 30 : shape === "medieval" ? 16 : shape === "fancy" ? 13 : 0;

  const tierTop = (i: number) => winTop + head + i * tierH;
  const bookBase = (i: number) => tierTop(i) + tierInner;
  const winBottom = bookBase(T - 1) + board;
  const frameBottom = winBottom + 5;
  const H = frameBottom + 17;

  /* window + frame outlines */
  const ar = 26; // inner arch rise
  const innerArch = `M${inX} ${winBottom} V ${winTop + ar} Q ${inX} ${winTop} ${inX + inW * 0.3} ${winTop} H ${inX + inW * 0.7} Q ${inX + inW} ${winTop} ${inX + inW} ${winTop + ar} V ${winBottom} Z`;
  const outerArch = `M${fx} ${frameBottom} V ${frameTop + ar + 8} Q ${fx} ${frameTop} ${fx + fw * 0.3} ${frameTop} H ${fx + fw * 0.7} Q ${fx + fw} ${frameTop} ${fx + fw} ${frameTop + ar + 8} V ${frameBottom} Q ${fx + fw} ${frameBottom} ${fx + fw - 6} ${frameBottom} H ${fx + 6} Q ${fx} ${frameBottom} ${fx} ${frameBottom} Z`;

  /* per-tier features: [2,2,1,1] on four stories, [2,2,2] on three */
  const perTier = T === 4 ? [2, 2, 1, 1] : [2, 2, 2];
  let slotCursor = 0;
  const tierFeatures: { slot: number; x: number }[][] = perTier.map((n, ti) => {
    const feats: { slot: number; x: number }[] = [];
    const fracs = n === 2 ? [0.14, 0.58] : [0.4];
    for (let k = 0; k < n; k++) {
      feats.push({
        slot: slotCursor,
        x: inX + 4 + fracs[k] * (inW - COVER_W - 8) + rnd(seed0 + ti * 51 + k * 23) * 10,
      });
      slotCursor += 1;
    }
    return feats;
  });

  /* cube layout replaces tiers with a 2-column cubby grid */
  const isCube = shape === "cube";
  const cubbyW = inW / 2;
  const cubeFeatureCubbies = T === 4 ? [0, 1, 3, 4, 6, 7] : [0, 1, 2, 3, 4, 5];

  const scallops = (y: number, key: string) => {
    const n = Math.floor(inW / 15);
    const start = inX + (inW - n * 15) / 2;
    return Array.from({ length: n }).map((_, i) => (
      <path key={`${key}${i}`} d={`M${start + i * 15} ${y} a 7.5 6 0 0 0 15 0 Z`} fill={shelfColor} stroke={INK} strokeWidth="1.8" />
    ));
  };

  /* top valance: rounded openings for fancy, pointed for medieval */
  const valance = (pointed: boolean) => {
    const n = pointed ? 3 : 2;
    const ow = inW / n;
    const depth = head - 1;
    return (
      <g>
        <rect x={inX} y={winTop} width={inW} height={depth} fill={shelfColor} />
        {Array.from({ length: n }).map((_, i) => {
          const ox = inX + i * ow + 3;
          const w = ow - 6;
          return pointed ? (
            <path key={i} d={`M${ox} ${winTop + depth} Q ${ox} ${winTop + 4} ${ox + w / 2} ${winTop + 2} Q ${ox + w} ${winTop + 4} ${ox + w} ${winTop + depth} Z`} fill={CREAM} stroke={INK} strokeWidth="1.6" />
          ) : (
            <path key={i} d={`M${ox} ${winTop + depth} V ${winTop + 9} Q ${ox} ${winTop + 2} ${ox + w / 2} ${winTop + 2} Q ${ox + w} ${winTop + 2} ${ox + w} ${winTop + 9} V ${winTop + depth} Z`} fill={CREAM} stroke={INK} strokeWidth="1.6" />
          );
        })}
        <path d={`M${inX} ${winTop + depth} H ${inX + inW}`} stroke={INK} strokeWidth="1.6" />
      </g>
    );
  };

  const books: React.ReactNode[] = [];
  if (isCube) {
    for (let ci = 0; ci < T * 2; ci++) {
      const row = Math.floor(ci / 2);
      const col = ci % 2;
      const cx0 = inX + col * cubbyW + 5;
      const cx1 = inX + (col + 1) * cubbyW - 7;
      const base = bookBase(row);
      const fi = cubeFeatureCubbies.indexOf(ci);
      if (fi >= 0 && fi < 6) {
        const featX = cx0 + 2 + rnd(seed0 + ci * 13) * 6;
        books.push(<CoverCard key={`f${ci}`} x={featX} base={base} slot={fi} title={slots[fi]} animate={animate} />);
        for (const f of fillStretch(featX + COVER_W + 2, cx1, seed0 + ci * 61 + 5, false))
          books.push(<FillerArt key={`c${ci}-${f.x}`} f={f} base={base} />);
      } else {
        for (const f of fillStretch(cx0, cx1, seed0 + ci * 61 + 5, row === 0))
          books.push(<FillerArt key={`c${ci}-${f.x}`} f={f} base={base} />);
      }
    }
  } else {
    tierFeatures.forEach((feats, ti) => {
      const base = bookBase(ti);
      const sorted = [...feats].sort((a, b) => a.x - b.x);
      let segStart = inX + 4;
      sorted.forEach((f, k) => {
        for (const fl of fillStretch(segStart, f.x - 2, seed0 + ti * 101 + k * 43, ti === 0 && k === 0 && shape !== "arched"))
          books.push(<FillerArt key={`t${ti}-${fl.x}`} f={fl} base={base} />);
        books.push(<CoverCard key={`s${f.slot}`} x={f.x} base={base} slot={f.slot} title={slots[f.slot]} animate={animate} />);
        segStart = f.x + COVER_W + 2;
      });
      for (const fl of fillStretch(segStart, inX + inW - 5, seed0 + ti * 101 + 77, false))
        books.push(<FillerArt key={`t${ti}e-${fl.x}`} f={fl} base={base} />);
    });
  }

  const filled = slots.filter(Boolean);
  return (
    <svg
      viewBox={`0 0 280 ${H}`}
      className={className}
      role="img"
      aria-label={
        label ??
        (filled.length
          ? `${T}-tier mini shelf holding: ${filled.join(", ")}`
          : `An empty ${T}-tier mini shelf with six waiting slots`)
      }
    >
      {/* outer frame */}
      {shape === "arched" ? (
        <path d={outerArch} fill={shelfColor} stroke={INK} strokeWidth="2.5" />
      ) : (
        <rect x={fx} y={frameTop} width={fw} height={frameBottom - frameTop} rx={shape === "basic" || shape === "cube" ? 5 : 9} fill={shelfColor} stroke={INK} strokeWidth="2.5" />
      )}

      {/* cornice */}
      {cornice && (
        <g>
          <rect x={fx - 7} y={frameTop - 13} width={fw + 14} height={9} rx="3" fill={shelfColor} stroke={INK} strokeWidth="2.2" />
          <rect x={fx - 3} y={frameTop - 5} width={fw + 6} height={6} fill={shelfColor} stroke={INK} strokeWidth="1.8" />
          {shape === "medieval" &&
            Array.from({ length: Math.floor((fw - 8) / 14) }).map((_, i) => (
              <rect key={i} x={fx + 6 + i * 14} y={frameTop - 4} width={5} height={4} fill={INK} opacity="0.35" />
            ))}
        </g>
      )}

      {/* inner window (backboard) */}
      {shape === "arched" ? (
        <>
          <path d={innerArch} fill={CREAM} stroke={INK} strokeWidth="2" />
          <clipPath id={clipId}>
            <path d={innerArch} />
          </clipPath>
        </>
      ) : (
        <rect x={inX} y={winTop} width={inW} height={winBottom - winTop} rx={shape === "basic" || shape === "cube" ? 3 : 5} fill={CREAM} stroke={INK} strokeWidth="2" />
      )}

      {/* books */}
      <g clipPath={shape === "arched" ? `url(#${clipId})` : undefined}>{books}</g>

      {/* shelf boards */}
      {Array.from({ length: T }).map((_, i) => (
        <g key={i}>
          <rect x={inX - 3} y={bookBase(i)} width={inW + 6} height={board} rx="2" fill={shelfColor} stroke={INK} strokeWidth="1.9" />
          {shape === "scalloped" && i < T - 1 && scallops(bookBase(i) + board, `s${i}`)}
        </g>
      ))}
      {shape === "scalloped" && scallops(winBottom, "sb")}

      {/* cube grid divider */}
      {isCube && (
        <rect x={inX + cubbyW - 4} y={winTop} width={8} height={winBottom - winTop} fill={shelfColor} stroke={INK} strokeWidth="1.9" />
      )}

      {/* top valances */}
      {shape === "fancy" && valance(false)}
      {shape === "medieval" && valance(true)}

      {/* pilaster detail */}
      {cornice && (
        <g stroke={INK} strokeWidth="1.2" opacity="0.4">
          <path d={`M${fx + 3.5} ${winTop + 4} V ${winBottom - 4}`} />
          <path d={`M${fx + fw - 3.5} ${winTop + 4} V ${winBottom - 4}`} />
        </g>
      )}

      {/* base: plinth for the dressed-up shapes, little feet for the rest */}
      {cornice ? (
        <rect x={fx - 5} y={frameBottom} width={fw + 10} height={8} rx="2.5" fill={shelfColor} stroke={INK} strokeWidth="2" />
      ) : (
        <g>
          <rect x={fx + 8} y={frameBottom} width={13} height={10} rx="3" fill={shelfColor} stroke={INK} strokeWidth="2" />
          <rect x={fx + fw - 21} y={frameBottom} width={13} height={10} rx="3" fill={shelfColor} stroke={INK} strokeWidth="2" />
        </g>
      )}

      {/* leaning library ladder */}
      {shape === "medieval" && (
        <g strokeLinecap="round">
          {[0, 9].map((o) => (
            <path key={o} d={`M${fx + fw - 30 + o} ${frameTop - 8} L ${fx + fw - 12 + o} ${frameBottom + 14}`} stroke={INK} strokeWidth="5" />
          ))}
          {[0, 9].map((o) => (
            <path key={`i${o}`} d={`M${fx + fw - 30 + o} ${frameTop - 8} L ${fx + fw - 12 + o} ${frameBottom + 14}`} stroke={shelfColor} strokeWidth="2.4" />
          ))}
          {Array.from({ length: 5 }).map((_, i) => {
            const t = 0.12 + i * 0.19;
            const x1 = fx + fw - 30 + 18 * t;
            const y1 = frameTop - 8 + (frameBottom + 22 - frameTop) * t;
            return <path key={`r${i}`} d={`M${x1} ${y1} h 9`} stroke={INK} strokeWidth="2.6" />;
          })}
        </g>
      )}

      {accent && (
        <>
          <Leaf x={fx - 16} y={winTop + 12} s={9} angle={-40} />
          <Leaf x={fx + fw + 3} y={winTop + 24} s={9} angle={210} />
          <FolkFlower x={fx - 8} y={winTop + 34} r={6} />
          <FolkFlower x={fx + fw + 9} y={frameTop + 4} r={5} />
          <Sparkle x={140} y={frameTop - (cornice ? 18 : 5)} s={5} />
          <Sparkle x={fx + fw - 36} y={frameTop - (cornice ? 17 : 5)} s={3.5} />
          <Sparkle x={fx + 42} y={frameTop - (cornice ? 16 : 4)} s={3.5} />
        </>
      )}
    </svg>
  );
}

/* ─── Self-drawing line-art doodles for the category cards ────────────────── */

const DOODLE_PATHS: Record<string, string[]> = {
  bookshelves: [
    "M8 34 V14 Q8 6 20 6 Q32 6 32 14 V34 Z",
    "M8 24 H32",
    "M12 24 V15 M17 24 V13 M22 24 V15 M27 24 V14",
    "M12 34 V27 M19 34 V26 M26 34 V27",
  ],
  "mini-books": [
    "M8 34 V12 H15 V34 Z",
    "M17 34 V8 H24 V34 Z",
    "M26 34 L31 10 L37 11 L33 34 Z",
    "M10 17 H13 M19 13 H22",
  ],
  keychains: [
    "M20 4 a 6 6 0 1 0 0.01 0",
    "M20 16 V20",
    "M12 20 H28 V36 H12 Z",
    "M15 25 H25 M15 29 H22",
  ],
  stickers: [
    "M8 8 H30 Q34 8 34 12 V28 L26 36 H12 Q8 36 8 32 Z",
    "M26 36 L26 28 L34 28",
    "M14 16 H28 M14 21 H25 M14 26 H22",
  ],
  accessories: [
    "M13 24 H27 L25 35 H15 Z",
    "M20 24 Q14 17 12 8",
    "M20 24 Q20 14 20 7",
    "M20 24 Q26 16 29 9",
    "M12 8 Q16 10 16 13 M20 7 Q23 9 22 12 M29 9 Q25 11 25 14",
  ],
};

/**
 * A little line drawing that sketches itself in a loop. Pure decoration:
 * every path normalizes to pathLength 300 so one CSS rhythm animates all.
 */
export function SketchDoodle({
  kind,
  className = "",
  delay = 0,
}: {
  kind: keyof typeof DOODLE_PATHS | string;
  className?: string;
  delay?: number;
}) {
  const paths = DOODLE_PATHS[kind] ?? DOODLE_PATHS.bookshelves;
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" role="presentation">
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          pathLength={300}
          className="sketch-path"
          style={{ animationDelay: `${delay + i * 350}ms` }}
          fill="none"
          stroke={INK}
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

/** A row of n mini spines standing on baseline y (used by the ProductArt icons). */
function Spines({ x, y, n, h, w = 12 }: { x: number; y: number; n: number; h: number; w?: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => (
        <rect
          key={i}
          x={x + i * (w + 2)}
          y={y - h + (i % 3) * 3}
          width={w}
          height={h - (i % 3) * 3}
          rx="2.5"
          fill={SPINE_COLORS[i % SPINE_COLORS.length]}
          stroke={INK}
          strokeWidth="1.8"
        />
      ))}
    </g>
  );
}

function ShelfFrame({ kind }: { kind: ArtKind }) {
  const scallop = kind === "shelf-scalloped";
  const arched = kind === "shelf-arched";
  const fancy = kind === "shelf-fancy" || kind === "shelf-medieval";
  const color = kind === "shelf-medieval" ? "#c4a97e" : kind === "shelf-fancy" ? "#dcc7c0" : BLUSH;
  return (
    <g>
      {arched ? (
        <path d="M40 78 a60 60 0 0 1 120 0 V 168 H 40 Z" fill={color} stroke={INK} strokeWidth="3" />
      ) : (
        <rect x="40" y="30" width="120" height="138" rx="8" fill={color} stroke={INK} strokeWidth="3" />
      )}
      <rect x="50" y={arched ? 84 : 42} width="100" height={arched ? 74 : 112} rx="4" fill={CREAM} stroke={INK} strokeWidth="2.4" />
      {!arched && <path d="M50 98 H 150" stroke={INK} strokeWidth="2.4" />}
      <Spines x={55} y={arched ? 152 : 96} n={7} h={40} />
      {!arched && <Spines x={55} y={152} n={7} h={40} />}
      {scallop &&
        Array.from({ length: 5 }).map((_, i) => (
          <path key={i} d={`M${44 + i * 22.4} 30 a 11.2 10 0 0 0 22.4 0 Z`} fill={color} stroke={INK} strokeWidth="2.2" transform="translate(0 68)" />
        ))}
      {fancy && (
        <path d="M40 30 q 20 -14 60 -14 q 40 0 60 14" fill="none" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      )}
      {kind === "shelf-medieval" && (
        <g>
          <path d="M166 60 l 14 -26 v 130" stroke={BROWN} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M168 92 h 11 M166 120 h 12 M165 148 h 13" stroke={BROWN} strokeWidth="3.4" strokeLinecap="round" />
        </g>
      )}
      <rect x="36" y="168" width="128" height="10" rx="4" fill={color} stroke={INK} strokeWidth="2.6" />
    </g>
  );
}

function CubeShelf() {
  return (
    <g>
      <rect x="42" y="40" width="116" height="116" rx="8" fill={BLUSH} stroke={INK} strokeWidth="3" />
      {[
        [52, 50],
        [104, 50],
        [52, 102],
        [104, 102],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x} y={y} width="44" height="44" rx="4" fill={CREAM} stroke={INK} strokeWidth="2.2" />
          {i === 2 ? (
            <g transform={`translate(${x + 10} ${y + 14})`}>
              <path d="M0 22 h22 l-3 8 h-16 Z" fill={ROSE} stroke={INK} strokeWidth="1.8" />
              <path d="M11 20 C 6 10 0 8 -3 12 M11 20 C 11 6 8 4 11 0 M11 20 C 16 10 22 8 25 12" stroke={SAGE_D} strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </g>
          ) : (
            <Spines x={x + 5} y={y + 40} n={3} h={30} w={10} />
          )}
        </g>
      ))}
      <rect x="38" y="156" width="124" height="10" rx="4" fill={BLUSH} stroke={INK} strokeWidth="2.6" />
    </g>
  );
}

function BooksSet({ custom = false }: { custom?: boolean }) {
  return (
    <g>
      {/* six-slot card suggestion */}
      <rect x="30" y="26" width="140" height="150" rx="10" fill={CREAM} stroke={INK} strokeWidth="3" />
      <path d="M30 54 H 170" stroke={INK} strokeWidth="2" opacity="0.5" />
      {Array.from({ length: 6 }).map((_, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        const x = 42 + col * 42;
        const y = 66 + row * 52;
        return custom && i >= 4 ? (
          <g key={i}>
            <rect x={x} y={y} width="32" height="42" rx="4" fill="none" stroke={BROWN} strokeWidth="2" strokeDasharray="4 4" />
            <text x={x + 16} y={y + 27} textAnchor="middle" fontSize="16" fontWeight={700} fill={BROWN} style={{ fontFamily: "var(--font-sans)" }}>?</text>
          </g>
        ) : (
          <g key={i}>
            <rect x={x} y={y} width="32" height="42" rx="4" fill={SPINE_COLORS[i % SPINE_COLORS.length]} stroke={INK} strokeWidth="2.2" />
            <rect x={x + 4} y={y + 4} width="24" height="34" rx="2.5" fill={PAGE} opacity="0.5" />
            <path d={`M${x + 8} ${y + 12} h 16 M${x + 8} ${y + 18} h 16 M${x + 8} ${y + 24} h 10`} stroke={INK} strokeWidth="1.6" opacity="0.6" />
          </g>
        );
      })}
      <text x="100" y="46" textAnchor="middle" fontSize="12" fontWeight={800} fill={INK} letterSpacing="2" style={{ fontFamily: "var(--font-sans)" }}>
        SET OF SIX
      </text>
      <Leaf x={18} y={40} s={8} angle={-35} />
      <Leaf x={182} y={150} s={8} angle={160} />
      <FolkFlower x={176} y={36} r={6} />
    </g>
  );
}

function KeychainBook() {
  return (
    <g>
      <circle cx="100" cy="42" r="16" fill="none" stroke={BROWN} strokeWidth="5" />
      <path d="M100 58 v 14" stroke={BROWN} strokeWidth="5" strokeLinecap="round" />
      <g transform="rotate(-6 100 120)">
        <rect x="66" y="74" width="68" height="92" rx="8" fill={ROSE} stroke={INK} strokeWidth="3" />
        <rect x="74" y="82" width="52" height="76" rx="4" fill={PAGE} stroke={INK} strokeWidth="2" />
        <path d="M82 98 h 36 M82 110 h 36 M82 122 h 24" stroke={INK} strokeWidth="2" opacity="0.55" />
        <path d="M112 74 v 20 l 8 -7 8 7 v -20" fill={BLUSH} stroke={INK} strokeWidth="2" transform="translate(-16 0)" />
      </g>
      <Sparkle x={48} y={80} s={5} />
      <Sparkle x={156} y={110} s={4} />
      <FolkFlower x={150} y={168} r={6} />
    </g>
  );
}

function KeychainAcrylic() {
  return (
    <g>
      <circle cx="100" cy="38" r="13" fill="none" stroke={BROWN} strokeWidth="4.5" />
      <path d="M100 51 v 10" stroke={BROWN} strokeWidth="4.5" strokeLinecap="round" />
      <rect x="56" y="61" width="88" height="102" rx="16" fill="#ffffff" opacity="0.55" stroke={INK} strokeWidth="3" />
      <g transform="translate(68 88)">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={i * 6} y={44 - i * 18} width={64 - i * 12} height="16" rx="4" fill={SPINE_COLORS[(i * 2 + 1) % 8]} stroke={INK} strokeWidth="2.2" />
        ))}
        <path d="M30 4 q 4 -10 12 -2" stroke={SAGE_D} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </g>
      <Sparkle x={150} y={70} s={4.5} />
    </g>
  );
}

function StickerStack() {
  return (
    <g>
      <g transform="rotate(-4 100 110)">
        <rect x="42" y="46" width="116" height="116" rx="14" fill="#ffffff" stroke={INK} strokeWidth="3" />
        <g transform="translate(58 74)">
          {[0, 1, 2, 3].map((i) => (
            <rect key={i} x={i * 5} y={60 - i * 17} width={84 - i * 10} height="15" rx="4" fill={SPINE_COLORS[(i * 3) % 8]} stroke={INK} strokeWidth="2.2" />
          ))}
          <path d="M40 -4 q 5 -12 14 -3" stroke={SAGE_D} strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <FolkFlower x={66} y={-6} r={5} />
        </g>
      </g>
      <path d="M42 150 l -10 12 M158 58 l 10 -10" stroke={TAUPE} strokeWidth="2.5" strokeLinecap="round" />
      <Sparkle x={36} y={40} s={5} />
    </g>
  );
}

function StickerSheet() {
  return (
    <g>
      <rect x="48" y="30" width="104" height="148" rx="10" fill="#ffffff" stroke={INK} strokeWidth="3" />
      {[
        [64, 46], [104, 46], [64, 86], [104, 86], [64, 126], [104, 126],
      ].map(([x, y], i) =>
        i % 3 === 0 ? (
          <g key={i} transform={`translate(${x} ${y})`}>
            <rect width="30" height="24" rx="4" fill={SPINE_COLORS[i % 8]} stroke={INK} strokeWidth="2" />
            <path d="M5 8 h 20 M5 14 h 14" stroke={INK} strokeWidth="1.6" opacity="0.6" />
          </g>
        ) : i % 3 === 1 ? (
          <FolkFlower key={i} x={x + 15} y={y + 12} r={8} />
        ) : (
          <Leaf key={i} x={x + 2} y={y + 12} s={9} angle={-16} />
        ),
      )}
      <path d="M48 30 l -8 -8 M152 178 l 8 8" stroke={TAUPE} strokeWidth="2.5" strokeLinecap="round" />
    </g>
  );
}

function Plant() {
  return (
    <g>
      <path d="M72 122 h 56 l -8 40 h -40 Z" fill={ROSE} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <path d="M100 118 C 84 84 64 80 52 90 M100 118 C 100 72 88 62 96 44 M100 118 C 116 82 136 78 148 88 M100 118 C 108 90 122 84 128 62" stroke={SAGE_D} strokeWidth="4" fill="none" strokeLinecap="round" />
      <Leaf x={44} y={86} s={9} angle={-30} />
      <Leaf x={150} y={84} s={9} angle={200} />
      <Leaf x={88} y={42} s={8} angle={-75} />
      <Leaf x={126} y={58} s={8} angle={-45} />
      <FolkFlower x={100} y={36} r={6} />
      <path d="M84 134 h 32" stroke={INK} strokeWidth="2" opacity="0.4" />
    </g>
  );
}

function FishTank() {
  return (
    <g>
      <rect x="46" y="60" width="108" height="86" rx="12" fill="#dcebe7" stroke={INK} strokeWidth="3" />
      <path d="M46 76 q 27 -8 54 0 t 54 0" stroke="#b9d0c4" strokeWidth="4" fill="none" />
      <g className="animate-drift" style={drift}>
        <path d="M84 106 q 14 -12 30 0 q -14 12 -30 0 Z" fill="#e8a06c" stroke={INK} strokeWidth="2.4" />
        <path d="M114 106 l 12 -8 v 16 Z" fill="#e8a06c" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
        <circle cx="92" cy="104" r="1.8" fill={INK} />
      </g>
      <path d="M62 146 q 6 -18 0 -34 M138 146 q -6 -16 0 -30" stroke={SAGE_D} strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="74" cy="88" r="3" fill="#ffffff" opacity="0.8" />
      <circle cx="70" cy="78" r="2" fill="#ffffff" opacity="0.8" />
      <rect x="40" y="146" width="120" height="10" rx="5" fill={TAUPE} stroke={INK} strokeWidth="2.6" />
    </g>
  );
}

function BeanBag() {
  return (
    <g>
      <path d="M100 66 q 44 0 52 44 q 6 34 -18 42 q -34 10 -68 0 q -24 -8 -18 -42 q 8 -44 52 -44 Z" fill={SAGE} stroke={INK} strokeWidth="3" />
      <path d="M64 108 q 36 18 72 0" stroke={INK} strokeWidth="2.4" fill="none" opacity="0.5" />
      <g transform="rotate(-10 76 84)">
        <rect x="58" y="70" width="36" height="28" rx="8" fill={BLUSH} stroke={INK} strokeWidth="2.6" />
        <path d="M64 76 l 6 6 M88 74 l -6 6" stroke={INK} strokeWidth="2" opacity="0.5" />
      </g>
      <Sparkle x={150} y={70} s={4.5} />
      <FolkFlower x={46} y={140} r={6} />
    </g>
  );
}

function Rug() {
  return (
    <g>
      <ellipse cx="100" cy="112" rx="72" ry="40" fill={BLUSH} stroke={INK} strokeWidth="3" />
      <ellipse cx="100" cy="112" rx="54" ry="29" fill="none" stroke={INK} strokeWidth="2" strokeDasharray="4 6" opacity="0.6" />
      <ellipse cx="100" cy="112" rx="34" ry="18" fill={CREAM} stroke={INK} strokeWidth="2.2" />
      <FolkFlower x={100} y={112} r={7} />
      <Leaf x={72} y={112} s={7} angle={180} />
      <Leaf x={112} y={112} s={7} angle={0} />
    </g>
  );
}

const ART: Record<ArtKind, () => React.ReactNode> = {
  "shelf-scalloped": () => <ShelfFrame kind="shelf-scalloped" />,
  "shelf-basic": () => <ShelfFrame kind="shelf-basic" />,
  "shelf-fancy": () => <ShelfFrame kind="shelf-fancy" />,
  "shelf-cube": () => <CubeShelf />,
  "shelf-arched": () => <ShelfFrame kind="shelf-arched" />,
  "shelf-medieval": () => <ShelfFrame kind="shelf-medieval" />,
  "books-set": () => <BooksSet />,
  "books-custom": () => <BooksSet custom />,
  "keychain-book": () => <KeychainBook />,
  "keychain-acrylic": () => <KeychainAcrylic />,
  "sticker-stack": () => <StickerStack />,
  "sticker-sheet": () => <StickerSheet />,
  plant: () => <Plant />,
  fishtank: () => <FishTank />,
  beanbag: () => <BeanBag />,
  rug: () => <Rug />,
};

export function ProductArt({
  kind,
  className = "",
  title,
}: {
  kind: ArtKind;
  className?: string;
  title?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={title ? `Illustration of ${title}` : "Product illustration"}>
      {ART[kind]()}
    </svg>
  );
}
