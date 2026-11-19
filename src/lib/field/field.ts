import { N, topologies, type Topo, type TopoId } from './topologies';

type Options = {
  onSelect?: (topo: Topo, index: number) => void;
  autoplay?: boolean;
};

export type FieldApi = {
  select: (id: TopoId) => void;
  destroy: () => void;
};

const REDUCED =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const INK = '17,17,16';
const ACCENT = '217,58,31';

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function initField(canvas: HTMLCanvasElement, options: Options = {}): FieldApi {
  const context = canvas.getContext('2d');
  if (!context) throw new Error('The Field needs a 2D context.');
  /* Annotated so closures keep the non-null type. */
  const ctx: CanvasRenderingContext2D = context;

  const list = topologies();

  /* ---------- state ---------- */
  let active = 0;
  let previous = -1;
  let start = performance.now();
  let duration = REDUCED ? 0 : 940;
  let w = 1;
  let h = 1;
  let raf = 0;
  let visible = true;
  let hovering = false;
  let interacted = false;
  let timer: number | undefined;

  const fromX = new Float32Array(N);
  const fromY = new Float32Array(N);
  const fromA = new Float32Array(N);
  const fromR = new Float32Array(N);

  const px = new Float32Array(N);
  const py = new Float32Array(N);
  const curX = new Float32Array(N);
  const curY = new Float32Array(N);
  const curA = new Float32Array(N);
  const curR = new Float32Array(N);

  let parX = 0;
  let parY = 0;
  let targetParX = 0;
  let targetParY = 0;

  const target = () => list[active];

  /* Capture wherever the points are *right now*, so a morph interrupted
     mid-flight continues from its current geometry instead of snapping. */
  function capture() {
    for (let i = 0; i < N; i++) {
      fromX[i] = curX[i];
      fromY[i] = curY[i];
      fromA[i] = curA[i];
      fromR[i] = curR[i];
    }
  }

  function select(id: TopoId, fromUser = false) {
    const next = list.findIndex((t) => t.id === id);
    if (next < 0 || next === active) return;
    if (fromUser) interacted = true;
    capture();
    previous = active;
    active = next;
    start = performance.now();
    duration = REDUCED ? 0 : 940;
    options.onSelect?.(list[active], active);
  }

  /* ---------- sizing ---------- */

  function resize() {
    const box = canvas.parentElement?.getBoundingClientRect();
    if (!box) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = Math.max(1, box.width);
    h = Math.max(1, box.height);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const ro = new ResizeObserver(resize);
  if (canvas.parentElement) ro.observe(canvas.parentElement);

  /* ---------- pointer ---------- */

  function onPointer(e: PointerEvent) {
    const box = canvas.getBoundingClientRect();
    targetParX = ((e.clientX - box.left) / box.width - 0.5) * 14;
    targetParY = ((e.clientY - box.top) / box.height - 0.5) * 10;
  }

  function onEnter() {
    hovering = true;
  }

  function onLeave() {
    hovering = false;
    targetParX = 0;
    targetParY = 0;
  }

  canvas.addEventListener('pointermove', onPointer);
  canvas.addEventListener('pointerenter', onEnter);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', () => {
    interacted = true;
  });

  /* ---------- visibility ---------- */

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.05 }
  );
  io.observe(canvas);

  /* ---------- draw ---------- */

  function drawEdges(topo: Topo, alpha: number) {
    if (alpha <= 0.001) return;
    ctx.strokeStyle = `rgba(${INK},${0.15 * alpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of topo.edges) {
      ctx.moveTo(px[a], py[a]);
      ctx.lineTo(px[b], py[b]);
    }
    ctx.stroke();
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;

    const t = target();
    const p = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
    const e = easeInOutCubic(p);

    parX += (targetParX - parX) * 0.06;
    parY += (targetParY - parY) * 0.06;

    const sx = (w / 2) * 0.9;
    const sy = (h / 2) * 0.9;
    const cx = w / 2 + (REDUCED ? 0 : parX);
    const cy = h / 2 + (REDUCED ? 0 : parY);

    const drift = p === 1 && !REDUCED;

    for (let i = 0; i < N; i++) {
      const pt = t.points[i];
      let nx = fromX[i] + (pt.x - fromX[i]) * e;
      let ny = fromY[i] + (pt.y - fromY[i]) * e;
      if (drift) {
        nx += Math.sin(now * 0.0006 + i * 0.37) * 0.0013;
        ny += Math.cos(now * 0.00052 + i * 0.29) * 0.0013;
      }
      curX[i] = nx;
      curY[i] = ny;
      curA[i] = fromA[i] + (pt.a - fromA[i]) * e;
      curR[i] = fromR[i] + (pt.r - fromR[i]) * e;
      px[i] = cx + nx * sx;
      py[i] = cy - ny * sy;
    }

    ctx.clearRect(0, 0, w, h);

    if (previous >= 0 && p < 1) {
      drawEdges(list[previous], 1 - e);
    }
    drawEdges(t, previous >= 0 ? e : 1);

    /* points — squares, because this is plotted data, not a network diagram */
    for (let i = 0; i < N; i++) {
      const a = curA[i];
      if (a <= 0.02) continue;
      const r = curR[i];
      const hub = r > 1.6;
      const size = hub ? 2.6 + (r - 1.8) * 0.7 : 1.5 + (r - 1) * 0.9;
      ctx.fillStyle = hub
        ? `rgba(${ACCENT},${0.9 * a})`
        : `rgba(${INK},${0.64 * a})`;
      ctx.fillRect(px[i] - size / 2, py[i] - size / 2, size, size);
    }

    /* overlays crossfade with the morph */
    if (previous >= 0 && list[previous].overlay && p < 1) {
      list[previous].overlay!({ ctx, sx, sy, cx, cy, alpha: 1 - e });
    }
    if (t.overlay) t.overlay({ ctx, sx, sy, cx, cy, alpha: previous >= 0 ? e : 1 });

    if (p >= 1) previous = -1;

    if (!canvas.dataset.ready) canvas.dataset.ready = 'true';
  }

  /* ---------- autoplay ---------- */

  function tick() {
    if (interacted || hovering || REDUCED) return;
    const next = list[(active + 1) % list.length];
    select(next.id);
  }

  if (options.autoplay !== false && !REDUCED) {
    timer = window.setInterval(tick, 6800);
  }

  /* seed: start from the active geometry, not from zero */
  const seed = target();
  for (let i = 0; i < N; i++) {
    fromX[i] = seed.points[i].x;
    fromY[i] = seed.points[i].y;
    fromA[i] = seed.points[i].a;
    fromR[i] = seed.points[i].r;
    curX[i] = seed.points[i].x;
    curY[i] = seed.points[i].y;
    curA[i] = seed.points[i].a;
    curR[i] = seed.points[i].r;
  }

  resize();
  raf = requestAnimationFrame(frame);
  options.onSelect?.(list[active], active);

  return {
    select: (id) => select(id, true),
    destroy() {
      cancelAnimationFrame(raf);
      if (timer) clearInterval(timer);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointermove', onPointer);
      canvas.removeEventListener('pointerenter', onEnter);
      canvas.removeEventListener('pointerleave', onLeave);
    },
  };
}
