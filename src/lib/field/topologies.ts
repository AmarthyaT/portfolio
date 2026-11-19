/**
 * The Field — seven data topologies.
 *
 * Every substrate is expressed in the same normalized space: x, y ∈ [-1, 1],
 * y pointing up. The renderer maps that to the canvas. Each substrate carries
 * exactly the same number of points so a morph is always a lerp, never a jump.
 */

export const N = 1000;

export type Pt = { x: number; y: number; a: number; r: number };
export type Edge = [number, number];

export type TopoId =
  | 'rag'
  | 'llama'
  | 'qwen'
  | 'tb'
  | 'transit'
  | 'sweety'
  | 'butterfly';

export type OverlayFrame = {
  ctx: CanvasRenderingContext2D;
  sx: number;
  sy: number;
  cx: number;
  cy: number;
  alpha: number;
};

export type Topo = {
  id: TopoId;
  index: number;
  label: string;
  long: string;
  note: string;
  points: Pt[];
  edges: Edge[];
  overlay?: (f: OverlayFrame) => void;
};

/* ---------- deterministic noise ---------- */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(Math.PI * 2 * v);
}

const TAU = Math.PI * 2;

function pad(points: Pt[]): Pt[] {
  while (points.length < N) {
    points.push({ x: 0, y: 0, a: 0, r: 1 });
  }
  return points.slice(0, N);
}

/** k-nearest-neighbour graph, capped distance. n ≤ 1000, so keys are safe. */
function knn(points: Pt[], k: number, maxDist: number): Edge[] {
  const seen = new Set<number>();
  const md = maxDist * maxDist;
  const kk = Math.max(1, k);

  for (let i = 0; i < points.length; i++) {
    const bestJ: number[] = [];
    const bestD: number[] = [];
    const a = points[i];

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const b = points[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = dx * dx + dy * dy;
      if (d > md) continue;

      let pos = bestD.length;
      while (pos > 0 && bestD[pos - 1] > d) pos--;
      if (pos >= kk) continue;

      bestD.splice(pos, 0, d);
      bestJ.splice(pos, 0, j);
      if (bestD.length > kk) {
        bestD.pop();
        bestJ.pop();
      }
    }

    for (const j of bestJ) {
      const lo = Math.min(i, j);
      const hi = Math.max(i, j);
      seen.add(lo * 1000 + hi);
    }
  }

  const out: Edge[] = [];
  for (const key of seen) out.push([Math.floor(key / 1000), key % 1000]);
  return out;
}

function chain(from: number, to: number): Edge[] {
  const out: Edge[] = [];
  for (let i = from; i < to; i++) out.push([i, i + 1]);
  return out;
}

/* ---------- 01 · legal RAG — citation clusters ---------- */

function makeRag(rng: () => number): Topo {
  const centers: [number, number][] = [
    [-0.56, 0.5],
    [0.42, 0.58],
    [-0.24, 0.02],
    [0.6, -0.32],
    [-0.34, -0.62],
  ];
  const points: Pt[] = [];
  for (const [cx, cy] of centers) {
    for (let i = 0; i < 200; i++) {
      if (i === 0) {
        points.push({ x: cx, y: cy, a: 1, r: 2.9 });
        continue;
      }
      points.push({
        x: cx + gauss(rng) * 0.088,
        y: cy + gauss(rng) * 0.084,
        a: 0.62 + rng() * 0.3,
        r: rng() > 0.94 ? 1.9 : 1,
      });
    }
  }
  const edges = knn(points, 2, 0.125);
  return {
    id: 'rag',
    index: 0,
    label: 'Legal RAG',
    long: 'VERDICT',
    note: 'More than a thousand Supreme Court judgments, chunked parent–child. An edge is a retrieval that can ground an answer.',
    points: pad(points),
    edges,
  };
}

/* ---------- 02 · legal llama — causal attention matrix ---------- */

function makeLlama(rng: () => number): Topo {
  const cols = 50;
  const rows = 20;
  const points: Pt[] = [];
  for (let r = 0; r < rows; r++) {
    const limit = (r / (rows - 1)) * (cols - 1);
    for (let c = 0; c < cols; c++) {
      const x = -0.9 + (c / (cols - 1)) * 1.8;
      const y = 0.88 - (r / (rows - 1)) * 1.76;
      /* Cells past the causal mask stay as a ghost grid. */
      if (c > limit + 0.35) {
        points.push({ x, y, a: 0.05, r: 1 });
        continue;
      }
      const gap = Math.abs(c - limit);
      const diagonal = Math.exp(-(gap * gap) / 3.2);
      const burst =
        Math.exp(-(((c - 33) ** 2) / 52 + ((r - 6) ** 2) / 5)) +
        0.7 * Math.exp(-(((c - 12) ** 2) / 40 + ((r - 15) ** 2) / 4));
      const w = Math.min(1, diagonal + burst * 0.85 + rng() * 0.16);
      points.push({
        x,
        y,
        a: 0.38 + w * 0.62,
        r: 1.35 + w * 1.45,
      });
    }
  }
  return {
    id: 'llama',
    index: 1,
    label: 'Legal Llama',
    long: 'Indian Legal Llama 3.1',
    note: '8B parameters, 4-bit QLoRA. One cell is one token attending to another; the blank quadrant is the causal mask.',
    points,
    edges: [],
  };
}

/* ---------- 03 · qwen — refusal-vector space ---------- */

function makeQwen(rng: () => number): Topo {
  const dx = Math.SQRT1_2;
  const dy = Math.SQRT1_2;
  const points: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const r = Math.sqrt(rng()) * 0.86;
    const t = rng() * TAU;
    let x = Math.cos(t) * r;
    let y = Math.sin(t) * r;
    const proj = x * dx + y * dy;
    if (Math.abs(proj) < 0.15) {
      const sign = proj >= 0 ? 1 : -1;
      const push = (0.15 - Math.abs(proj) + 0.02) * 1.5 * sign;
      x += dx * push;
      y += dy * push;
      const m = Math.hypot(x, y);
      if (m > 0.94) {
        x = (x / m) * 0.94;
        y = (y / m) * 0.94;
      }
    }
    points.push({ x, y, a: 0.5 + rng() * 0.4, r: rng() > 0.95 ? 1.8 : 1 });
  }
  return {
    id: 'qwen',
    index: 2,
    label: 'Abliteration',
    long: 'Qwen 3.5 2B Abliterated',
    note: 'Refusal directions removed by orthogonalization. The cleared channel is the space the model stops using.',
    points,
    edges: knn(points, 2, 0.085),
    overlay({ ctx, sx, sy, cx, cy, alpha }) {
      const P = (x: number, y: number): [number, number] => [cx + x * sx, cy - y * sy];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(217,58,31,0.75)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      const [x1, y1] = P(-dx * 0.82, -dy * 0.82);
      const [x2, y2] = P(dx * 0.86, dy * 0.86);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);
      // arrowhead
      const ang = Math.atan2(y2 - y1, x2 - x1);
      const h = 7;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h * Math.cos(ang - 0.4), y2 - h * Math.sin(ang - 0.4));
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - h * Math.cos(ang + 0.4), y2 - h * Math.sin(ang + 0.4));
      ctx.stroke();
      ctx.fillStyle = 'rgba(217,58,31,0.85)';
      ctx.font = 'italic 13px Newsreader, Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText('d', x2 + 6, y2 + 4);
      ctx.restore();
    },
  };
}

/* ---------- 04 · TB-AMR — variant peaks ---------- */

function makeTb(rng: () => number): Topo {
  const peaks = Array.from({ length: 13 }, () => ({
    c: -0.9 + rng() * 1.8,
    w: 0.014 + rng() * 0.038,
    h: 0.24 + Math.pow(rng(), 2.1) * 1.28,
  }));
  const points: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const x = -0.92 + (i / (N - 1)) * 1.84 + (rng() - 0.5) * 0.003;
    let y = -0.84 + rng() * 0.018;
    for (const p of peaks) {
      const d = (x - p.c) / p.w;
      y += p.h * Math.exp(-d * d);
    }
    points.push({
      x,
      y: Math.min(y, 0.94),
      a: 0.55 + rng() * 0.35,
      r: y > 0.24 ? 1.9 : 1,
    });
  }
  return {
    id: 'tb',
    index: 3,
    label: 'TB-AMR',
    long: 'TB-AMR Variant ML',
    note: '600 isolates × 158 loci. Each peak is a mutation associated with resistance; the baseline is everything that is not.',
    points,
    edges: knn(points, 2, 0.042),
    overlay({ ctx, sx, sy, cx, cy, alpha }) {
      const y = cy - 0.24 * sy;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(17,17,16,0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);
      ctx.beginPath();
      ctx.moveTo(cx - 0.94 * sx, y);
      ctx.lineTo(cx + 0.94 * sx, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(17,17,16,0.5)';
      ctx.font = '9px "IBM Plex Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText('P = 5 × 10⁻⁸', cx + 0.94 * sx, y - 7);
      ctx.restore();
    },
  };
}

/* ---------- 05 · transit — corridors ---------- */

function makeTransit(rng: () => number): Topo {
  const corridors: [number, number][][] = [
    [[-0.98, -0.46], [-0.6, -0.12], [-0.12, 0.04], [0.4, 0.16], [0.95, 0.5]],
    [[-0.92, 0.62], [-0.5, 0.34], [-0.02, 0.18], [0.48, -0.08], [0.92, -0.44]],
    [[-0.72, -0.94], [-0.34, -0.52], [0.08, -0.32], [0.54, -0.06], [0.9, 0.2]],
    [[-0.96, 0.06], [-0.52, -0.14], [-0.04, -0.22], [0.42, -0.16], [0.86, 0.02]],
    [[-0.5, 0.96], [-0.2, 0.52], [0.06, 0.1], [0.28, -0.34], [0.52, -0.86]],
    [[-0.82, -0.74], [-0.4, -0.56], [0.1, -0.46], [0.58, -0.5], [0.9, -0.68]],
  ];
  const per = 166;
  const at = (way: [number, number][], i: number): [number, number] =>
    way[Math.max(0, Math.min(way.length - 1, i))];
  const points: Pt[] = [];

  for (const way of corridors) {
    const segs = way.length - 1;
    for (let i = 0; i < per; i++) {
      /* Catmull–Rom through the waypoints, so a corridor bends like track. */
      const u = (i / (per - 1)) * segs;
      const si = Math.min(segs - 1, Math.floor(u));
      const t = u - si;
      const p0 = at(way, si - 1);
      const p1 = at(way, si);
      const p2 = at(way, si + 1);
      const p3 = at(way, si + 2);
      const t2 = t * t;
      const t3 = t2 * t;
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);
      const hub = i % 24 === 0;
      points.push({
        x: x + (rng() - 0.5) * 0.006,
        y: y + (rng() - 0.5) * 0.006,
        a: hub ? 1 : 0.55 + rng() * 0.25,
        r: hub ? 2.6 : 1,
      });
    }
  }

  const edges: Edge[] = [];
  for (let c = 0; c < corridors.length; c++) {
    edges.push(...chain(c * per, c * per + per - 1));
  }
  /* lines that cross share a stop — the interchange */
  edges.push(...knn(points, 1, 0.022));

  return {
    id: 'transit',
    index: 4,
    label: 'Transit study',
    long: "Karnataka's bus economics",
    note: 'Six BMTC corridors, drawn from fare tables and audited accounts. Stops are dense; larger nodes are interchanges.',
    points: pad(points),
    edges,
  };
}

/* ---------- 06 · sweety — four readings a day ---------- */

function makeSweety(rng: () => number): Topo {
  const peaks = [
    { c: 0.07, h: 0.3, w: 0.045 },
    { c: 0.33, h: 0.52, w: 0.05 },
    { c: 0.58, h: 0.26, w: 0.042 },
    { c: 0.82, h: 0.44, w: 0.048 },
  ];
  const points: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const day = Math.min(39, Math.floor(i / 25));
    const slot = i % 25;
    const t = slot / 25;
    const x = -0.92 + (i / (N - 1)) * 1.84;
    let y = -0.16 + 0.15 * Math.sin(day * 0.31) + 0.05 * Math.sin(day * 1.7);
    for (const p of peaks) {
      const d = (t - p.c) / p.w;
      y += p.h * Math.exp(-d * d) * (0.85 + 0.25 * Math.sin(day * 0.7 + p.c * 9));
    }
    points.push({
      x,
      y: Math.max(-0.95, Math.min(0.95, y + (rng() - 0.5) * 0.008)),
      a: 0.72,
      r: 1,
    });
  }
  return {
    id: 'sweety',
    index: 5,
    label: 'Sweety',
    long: 'Clinical glucose tracker',
    note: 'Four readings a day for forty days. The spikes are meals, not anomalies — the point is the shape, not any single value.',
    points,
    edges: chain(0, N - 1),
  };
}

/* ---------- 07 · butterfly — layered hypergraph ---------- */

function makeButterfly(rng: () => number): Topo {
  const points: Pt[] = [];
  const causes = 6;
  const events = 14;
  const impacts = 8;
  const causeCount = 40;
  const eventCount = 40;
  const impactCount = 25;

  for (let c = 0; c < causes; c++) {
    const cx = -0.78 + (c / (causes - 1)) * 1.56;
    for (let i = 0; i < causeCount; i++) {
      points.push({
        x: cx + gauss(rng) * 0.045,
        y: 0.64 + gauss(rng) * 0.04,
        a: i === 0 ? 1 : 0.55 + rng() * 0.3,
        r: i === 0 ? 2.4 : 1,
      });
    }
  }
  for (let e = 0; e < events; e++) {
    const ex = -0.84 + (e / (events - 1)) * 1.68;
    for (let i = 0; i < eventCount; i++) {
      points.push({
        x: ex + gauss(rng) * 0.038,
        y: 0.02 + gauss(rng) * 0.05,
        a: i === 0 ? 1 : 0.55 + rng() * 0.3,
        r: i === 0 ? 2.2 : 1,
      });
    }
  }
  for (let k = 0; k < impacts; k++) {
    const kx = -0.74 + (k / (impacts - 1)) * 1.48;
    for (let i = 0; i < impactCount; i++) {
      points.push({
        x: kx + gauss(rng) * 0.05,
        y: -0.62 + gauss(rng) * 0.045,
        a: i === 0 ? 1 : 0.55 + rng() * 0.3,
        r: i === 0 ? 2.4 : 1,
      });
    }
  }

  const edges: Edge[] = [];
  const causeIdx = (c: number) => c * causeCount;
  const eventIdx = (e: number) => causes * causeCount + e * eventCount;
  const impactIdx = (k: number) => causes * causeCount + events * eventCount + k * impactCount;

  edges.push(...knn(points, 1, 0.2));
  for (let e = 0; e < events; e++) {
    edges.push([eventIdx(e), causeIdx(e % causes)]);
    edges.push([eventIdx(e), causeIdx((e * 3 + 1) % causes)]);
    edges.push([eventIdx(e), impactIdx(e % impacts)]);
    edges.push([eventIdx(e), impactIdx((e * 5 + 2) % impacts)]);
  }

  return {
    id: 'butterfly',
    index: 6,
    label: 'Butterfly',
    long: 'Butterfly Engine',
    note: 'Causes, events, impacts. One disruption, propagated through a supply network that has no single owner.',
    points: pad(points),
    edges,
    overlay({ ctx, sx, sy, cx, cy, alpha }) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(17,17,16,0.42)';
      ctx.font = '8px "IBM Plex Mono", monospace';
      ctx.textAlign = 'left';
      const labels: [string, number][] = [
        ['CAUSES', 0.64],
        ['EVENTS', 0.02],
        ['IMPACTS', -0.62],
      ];
      for (const [text, y] of labels) {
        ctx.fillText(text, cx - 0.965 * sx, cy - y * sy + 3);
      }
      ctx.restore();
    },
  };
}

/* ---------- registry ---------- */

let cache: Topo[] | null = null;

export function topologies(): Topo[] {
  if (cache) return cache;
  const rng = mulberry32(0x5eed1e);
  cache = [
    makeRag(rng),
    makeLlama(rng),
    makeQwen(rng),
    makeTb(rng),
    makeTransit(rng),
    makeSweety(rng),
    makeButterfly(rng),
  ];
  return cache;
}
