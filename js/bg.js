/* ============ параллакс-фон: небо, горы, лес, водопад ============ */
'use strict';

/* ---------- ёлка: ярусы лап с зубчатым краем ---------- */
function drawPine(x, cx, baseY, h, w, cD, cL) {
  const T = 5;
  const trunkH = Math.max(3, h * 0.13);
  px(x, cx - 2, baseY - trunkH, 5, trunkH + 1, shade(PAL.trunk, -.2));
  px(x, cx - 1, baseY - trunkH, 3, trunkH + 1, PAL.trunk);

  const step = (h - trunkH) / (T + 0.9);
  for (let t = 0; t < T; t++) {                 // 0 — нижний ярус
    const f = 1 - t / T;                        // 1 внизу, ~0 вверху
    const yB = Math.round(baseY - trunkH - t * step);
    const hw = Math.max(2, w * 0.5 * Math.pow(f, 0.72));
    const tierH = Math.max(4, step * 2.0);
    for (let i = 0; i < tierH; i++) {
      const k = i / tierH;
      let ww = Math.round(hw * 2 * Math.pow(k, 0.85));
      if (ww < 1) continue;
      const yy = Math.round(yB - tierH + i);
      // зубчатый нижний край яруса
      const jag = (i > tierH - 3) ? ((yy + cx) % 3 === 0 ? 1 : 0) : 0;
      const X = Math.round(cx - ww / 2) + jag;
      px(x, X, yy, ww - jag * 2, 1, cD);
      if (ww > 4) px(x, X + 1, yy, Math.max(1, Math.round(ww * 0.34)), 1, cL);
    }
    // тёмная тень под ярусом
    px(x, Math.round(cx - hw), yB - 2, Math.round(hw * 2), 2, shade(cD, -.30));
    px(x, Math.round(cx - hw + 1), yB, Math.round(hw * 2 - 2), 2, shade(cD, -.42));
  }
  // макушка
  px(x, cx, baseY - h, 1, 4, cL);
  px(x, cx - 1, baseY - h + 2, 3, 2, cD);
}

/* ---------- облака ---------- */
function makeClouds(W, H, seed) {
  const cv = mkc(W, H), x = cv.x, r = rng(seed);
  for (let n = 0; n < 8; n++) {
    const cx = r() * W, cy = 6 + r() * (H - 40), s = .55 + r() * .6;
    const blobs = 8 + (r() * 6 | 0), parts = [];
    for (let b = 0; b < blobs; b++) {
      const q = Math.abs(b - blobs / 2) / (blobs / 2);
      parts.push([
        cx + (b - blobs / 2) * 11 * s + (r() - .5) * 7,
        cy + q * 9 * s + (r() - .5) * 4,
        (16 + r() * 22) * s,
        (13 + (1 - q) * 14 + r() * 8) * s
      ]);
    }
    const puff = (X, Y, W2, H2, col) => {
      for (let j = 0; j < H2; j++) {
        const q = 1 - Math.pow((j - H2 / 2) / (H2 / 2), 2) * .55;
        const ww = Math.max(1, Math.round(W2 * q));
        px(x, Math.round(X + (W2 - ww) / 2), Math.round(Y + j), ww, 1, col);
      }
    };
    for (const p of parts) puff(p[0], p[1] + 4, p[2], p[3], PAL.cloudSh);
    for (const p of parts) puff(p[0] + 1, p[1], p[2] - 2, p[3] - 3, PAL.cloud);
    for (const p of parts) px(x, p[0] + 3, p[1] + 1, Math.max(1, p[2] - 8), 3, '#ffffff');
  }
  return cv;
}

/* ---------- горы ---------- */
function makeMountains(W, H, seed, colA, colB, base) {
  const cv = mkc(W, H), x = cv.x, r = rng(seed);
  const peaks = [];
  for (let i = 0; i < 5; i++) {
    peaks.push({ x: (i + .1 + r() * .8) * (W / 5), h: H * (.46 + r() * .48), w: (W / 3.6) * (.7 + r() * .7) });
  }
  peaks.sort((a, b) => a.h - b.h);
  for (const p of peaks) {
    for (let i = -p.w; i < p.w; i++) {
      const t = 1 - Math.abs(i) / p.w;
      if (t <= 0) continue;
      // мягкий, слегка неровный склон
      const hh = p.h * Math.pow(t, .95) * (1 + Math.sin((p.x + i) * .07) * .05 + Math.sin((p.x + i) * .23) * .02);
      const X = Math.round(p.x + i), Y = Math.round(base - hh);
      if (hh <= 1) continue;
      px(x, X, Y, 1, base - Y, colA);
      if (i < 0) px(x, X, Y, 1, Math.min(base - Y, hh * .6), colB);
      if (t > .88) px(x, X, Y, 1, Math.max(1, (t - .88) * 30), '#e4f2fa');
      px(x, X, Y, 1, 1, '#eef7fc');
    }
  }
  return cv;
}

/* ---------- лес: плотная стена ёлок ---------- */
function makeForest(W, H, seed, cDark, cLight, minH, maxH, count) {
  const cv = mkc(W, H), x = cv.x, r = rng(seed);
  const trees = [];
  for (let i = 0; i < count; i++) {
    const gx = (i + .5) * (W / count) + (r() - .5) * (W / count) * 1.6;
    trees.push({ x: gx, h: minH + r() * (maxH - minH), b: H - 2 - r() * 16 });
  }
  trees.sort((a, b) => a.h - b.h);
  for (const t of trees) {
    const w = Math.max(5, Math.round(t.h * .40));
    for (const dx of [0, -W, W]) {
      const X = Math.round(t.x + dx);
      if (X < -w || X > W + w) continue;
      drawPine(x, X, Math.round(t.b), Math.round(t.h), w, cDark, cLight);
    }
  }
  return cv;
}

/* ---------- скала с водопадом ---------- */
function makeCliff(W, H, notchX, notchW, seed) {
  const cv = mkc(W, H), x = cv.x, r = rng(seed);
  // тело скалы — рваные природные глыбы, без кирпичной сетки
  px(x, 0, 0, W, H, PAL.rockD);
  for (let n = 0; n < W * H / 26; n++) {
    const bw = 5 + r() * 16, bh = 4 + r() * 11;
    const X = r() * W - bw / 2, Y = r() * H - bh / 2;
    const t = r();
    const base = t < .18 ? PAL.rockL : t < .58 ? PAL.rock : t < .84 ? PAL.rockD : PAL.rockDD;
    px(x, X, Y, bw, bh, shade(base, -.24));
    px(x, X + 1, Y, bw - 2, bh - 1, base);
    px(x, X + 1, Y, bw - 2, 1, shade(base, .2));
  }
  // мох и трава по выступам
  for (let n = 0; n < W * H / 90; n++) {
    const X = r() * W, Y = r() * H;
    px(x, X, Y, 3 + r() * 5, 2 + r() * 2, r() < .5 ? PAL.grassDD : PAL.grassD);
    if (r() < .4) px(x, X, Y, 2 + r() * 3, 1, PAL.moss);
  }
  // вырез под воду с рваным краем
  x.clearRect(notchX, 0, notchW, H);
  for (let i = 0; i < H; i++) {
    const jl = (Math.sin(i * .21 + seed) * 2 + r() * 2) | 0;
    const jr = (Math.cos(i * .17 + seed) * 2 + r() * 2) | 0;
    x.clearRect(notchX - jl, i, jl, 1);
    x.clearRect(notchX + notchW, i, jr, 1);
    px(x, notchX - jl - 3, i, 3, 1, PAL.rockDD);
    px(x, notchX + notchW + jr, i, 3, 1, PAL.rockDD);
  }
  // общее затемнение — дальний план
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(40,80,102,.28)';
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  return cv;
}

/* ---------- анимированная вода ---------- */
function makeWaterfall(W, H, seed) {
  const frames = [];
  for (let f = 0; f < 6; f++) {
    const cv = mkc(W, H), x = cv.x, r = rng(seed);
    // базовые вертикальные полосы
    for (let i = 0; i < W; i++) {
      const q = Math.abs(i - W / 2) / (W / 2);
      px(x, i, 0, 1, H, q > .82 ? PAL.water4 : q > .55 ? PAL.water3 : PAL.water2);
    }
    // струи
    for (let s = 0; s < W * 2.2; s++) {
      const sx = (r() * W) | 0;
      const len = 10 + r() * 46;
      const sy = (((r() * H) | 0) + f * 11) % H;
      const c = r() < .12 ? PAL.foam : (r() < .42 ? PAL.water : (r() < .78 ? PAL.water2 : PAL.water3));
      px(x, sx, sy, 1, len, c);
      if (r() < .25) px(x, sx + 1, sy + 3, 1, len * .6, PAL.water3);
    }
    // блики — светлая сердцевина
    for (let s = 0; s < W * .3; s++) {
      const sx = (W / 2 + (r() - .5) * W * .45) | 0;
      px(x, sx, ((r() * H) + f * 13) % H, 1, 8 + r() * 22, PAL.foam);
    }
    frames.push(cv);
  }
  return frames;
}

/* ---------- руины (колонны на среднем плане) ---------- */
function makeRuin(W, H, seed) {
  const cv = mkc(W, H), x = cv.x, r = rng(seed);
  drawStone(x, 0, 0, W, H, seed);
  for (let i = 0; i < W; i++) {
    const cut = (Math.sin(i * .35 + seed) * 3 + r() * 5) | 0;
    x.clearRect(i, 0, 1, Math.max(0, cut));
  }
  drawGrassCap(x, 0, 6, W, seed + 3);
  for (let i = 0; i < 4; i++) if (r() < .7) drawVine(x, 2 + (r() * (W - 4)) | 0, 10 + r() * H * .4, 10 + r() * 22, seed + i);
  x.globalCompositeOperation = 'source-atop';
  x.fillStyle = 'rgba(168,214,236,.17)';
  x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(74,132,164,.16)';
  x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  return cv;
}
