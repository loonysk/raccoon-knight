/* ============ рисование спрайтов и тайлов ============ */
'use strict';

/* ---------------------------------------------------------
   КАМЕННАЯ КЛАДКА — кирпич 16x8, ряды со смещением
--------------------------------------------------------- */
function drawStone(x, X, Y, W, H, seed) {
  const r = rng(seed);
  px(x, X, Y, W, H, PAL.mortar);
  const BW = 16, BH = 8;
  for (let row = 0, gy = Y; gy < Y + H; row++, gy += BH) {
    const off = (row % 2) ? -BW / 2 : 0;
    for (let gx = X + off - BW; gx < X + W + BW; gx += BW) {
      const bx = Math.max(gx + 1, X), by = Math.max(gy + 1, Y);
      const bw = Math.min(gx + BW - 1, X + W) - bx;
      const bh = Math.min(gy + BH - 1, Y + H) - by;
      if (bw <= 0 || bh <= 0) continue;
      const t = r();
      const base = t < .18 ? PAL.stoneL : t < .62 ? PAL.stone : t < .88 ? PAL.stoneD : PAL.stoneDD;
      px(x, bx, by, bw, bh, base);
      px(x, bx, by, bw, 1, shade(base, .16));
      px(x, bx, by + bh - 1, bw, 1, shade(base, -.22));
      if (r() < .5) px(x, bx + 1 + (r() * (bw - 3) | 0), by + 1 + (r() * (bh - 2) | 0), 2, 1, shade(base, -.28));
      if (r() < .35) px(x, bx + 1 + (r() * (bw - 3) | 0), by + 1 + (r() * (bh - 2) | 0), 1, 1, shade(base, .22));
    }
  }
  for (let i = 0; i < W; i++) if (r() < .35) {
    px(x, X + i, Y, 1, 1 + (r() * 3 | 0), r() < .5 ? PAL.moss : PAL.grassD);
  }
  const g = x.createLinearGradient(0, Y, 0, Y + H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(8,14,10,.42)');
  x.fillStyle = g; x.fillRect(X, Y, W, H);
}

/* ---------------------------------------------------------
   ТРАВЯНАЯ ШАПКА поверх камня
--------------------------------------------------------- */
function drawGrassCap(x, X, Y, W, seed) {
  const r = rng(seed);
  const TOP = 7;
  // плотная шапка
  px(x, X, Y - 2, W, TOP + 2, PAL.grass);
  px(x, X, Y - 2, W, 3, PAL.grassL);
  px(x, X, Y + TOP - 3, W, 3, PAL.grassD);
  // рваный верхний край
  for (let i = 0; i < W; i++) {
    const t = r();
    if (t < .38) px(x, X + i, Y - 3, 1, 1, PAL.grassL);
    if (t < .16) px(x, X + i, Y - 4, 1, 1, PAL.grass);
    if (t < .06) px(x, X + i, Y - 6, 1, 3, PAL.grassD);
  }
  // свисающие пряди — крупные капли разной длины
  let i = 0;
  while (i < W) {
    const bw = 2 + (r() * 4 | 0);
    const len = 2 + ((Math.sin((X + i) * .27 + seed) * .5 + .5) * 11 | 0) + (r() * 4 | 0);
    for (let k = 0; k < bw && i + k < W; k++) {
      const ll = len - Math.abs(k - (bw - 1) / 2) * 1.4;
      if (ll <= 0) continue;
      px(x, X + i + k, Y + TOP - 2, 1, ll, PAL.grassD);
      px(x, X + i + k, Y + TOP - 2, 1, Math.max(1, ll * .55), PAL.grass);
      px(x, X + i + k, Y + TOP - 3 + ll, 1, 2, PAL.grassDD);
    }
    i += bw + (r() < .25 ? 1 : 0);
  }
}

/* ---------------------------------------------------------
   ЛИАНА
--------------------------------------------------------- */
function drawVine(x, X, Y, len, seed) {
  const r = rng(seed);
  let cx = X;
  let side = r() < .5 ? -1 : 1;
  for (let i = 0; i < len; i++) {
    if (i % 6 === 5 && r() < .55) cx += r() < .5 ? -1 : 1;
    px(x, cx, Y + i, 3, 1, PAL.vineD);
    px(x, cx, Y + i, 2, 1, PAL.vine);
    px(x, cx, Y + i, 1, 1, PAL.vineL);
    // редкие листья, без ритма
    if (i > 3 && r() < .16) {
      const sd = side; side = -side;
      const lw = 2 + (r() * 2 | 0);
      const lx = sd < 0 ? cx - lw : cx + 3;
      px(x, lx, Y + i, lw, 2, PAL.vineD);
      px(x, lx, Y + i, lw, 1, PAL.vine);
    }
  }
  // кисточка на конце
  px(x, cx - 1, Y + len, 5, 3, PAL.vineD);
  px(x, cx, Y + len, 3, 2, PAL.vine);
  px(x, cx, Y + len + 2, 2, 2, PAL.vineL);
}

/* =========================================================
   ЕНОТ-РЫЦАРЬ — холст 60x56, центр тела x=24, ступни y=55
========================================================= */
const RC = {
  fur: '#9aa3ad', furL: '#c3cad2', furD: '#6d757f', furDD: '#4a515a',
  white: '#eef2f6', mask: '#20242c', nose: '#171a20',
  st: '#aeb8c4', stL: '#dde4ec', stD: '#7d8794', stDD: '#525b67',
  lea: '#6b4a2c', leaD: '#452e1a',
  bl: '#d6dee7', blL: '#f4f8fc', blD: '#98a3b0',
  gemc: '#4fc3f7'
};

function diag(x, x0, y0, x1, y1, t, col) {
  const dx = x1 - x0, dy = y1 - y0;
  const n = Math.max(1, Math.max(Math.abs(dx), Math.abs(dy)));
  for (let i = 0; i <= n; i++) {
    px(x, Math.round(x0 + dx * i / n), Math.round(y0 + dy * i / n), t, t, col);
  }
}

function drawSword(x, hx, hy, ang, len) {
  const c = Math.cos(ang), s = Math.sin(ang);
  const tx = hx + c * len, ty = hy + s * len;
  // рукоять и навершие
  diag(x, hx - c * 8, hy - s * 8, hx - c * 1, hy - s * 1, 4, '#4a3a2c');
  diag(x, hx - c * 7, hy - s * 7, hx - c * 2, hy - s * 2, 3, '#6b5340');
  px(x, Math.round(hx - c * 10 - 1), Math.round(hy - s * 10 - 1), 4, 4, '#3a2f26');
  px(x, Math.round(hx - c * 10), Math.round(hy - s * 10), 3, 3, '#c9a13f');
  // гарда
  const gx = hx + c * 6, gy = hy + s * 6;
  diag(x, gx + s * 7, gy - c * 7, gx - s * 7, gy + c * 7, 3, '#4b5561');
  diag(x, gx + s * 6, gy - c * 6, gx - s * 6, gy + c * 6, 2, '#7d8794');
  px(x, Math.round(gx - 1), Math.round(gy - 1), 3, 3, '#2b6f9c');
  px(x, Math.round(gx), Math.round(gy), 2, 2, RC.gemc);
  // клинок: тёмный контур -> тело -> светлая грань -> блик
  diag(x, hx + c * 9, hy + s * 9, tx, ty, 6, '#5c6773');
  diag(x, hx + c * 9, hy + s * 9, tx, ty, 5, RC.blD);
  diag(x, hx + c * 10 - s, hy + s * 10 + c, tx - s, ty + c, 3, RC.bl);
  diag(x, hx + c * 11 - s * 2, hy + s * 11 + c * 2, tx - s * 2, ty + c * 2, 1, RC.blL);
  diag(x, hx + c * 9 + s * 2, hy + s * 9 - c * 2, tx + s * 2, ty - c * 2, 2, '#7c8794');
  // остриё
  px(x, Math.round(tx), Math.round(ty), 3, 3, RC.bl);
  px(x, Math.round(tx + c), Math.round(ty + s), 2, 2, RC.blL);
}

/* полосатый хвост — плавная дуга влево-вниз с чёткими кольцами */
function drawTail(x, sway) {
  const N = 30, sw = sway * 0.5;
  // тёмная подложка-контур
  for (let i = N - 1; i >= 0; i--) {
    const t = i / (N - 1);
    const cx = 20 - t * 25;
    const cy = 30 + t * 9 + t * t * 9 + sw * (1 - t);
    const th = 15 - t * 4;
    px(x, cx - th / 2 - 1, cy - th / 2 - 1, th + 2, th + 2, '#262b33');
  }
  for (let i = N - 1; i >= 0; i--) {
    const t = i / (N - 1);
    const cx = 20 - t * 25;
    const cy = 30 + t * 9 + t * t * 9 + sw * (1 - t);
    const th = 15 - t * 4;
    const ring = Math.floor(t * 4.6) % 2;
    const col = ring ? RC.mask : '#b0b8c2';
    px(x, cx - th / 2, cy - th / 2, th, th, col);
    px(x, cx - th / 2 + 1, cy - th / 2, th - 2, 2, shade(col, .22));
    px(x, cx - th / 2, cy + th / 2 - 2, th, 2, shade(col, -.28));
  }
  // светлый кончик
  px(x, -6, 44 + sw, 11, 11, '#262b33');
  px(x, -5, 45 + sw, 9, 9, RC.furL);
  px(x, -5, 45 + sw, 7, 3, '#f2f6fa');
}

function drawRaccoon(x, pose) {
  const P = Object.assign({
    legA: [0, 0], legB: [0, 0], body: 0, head: 0, swordAng: -1.15, swordLen: 32,
    tail: 0, armY: 0, hideSword: false
  }, pose);
  const B = P.body, CX = 32;

  drawTail(x, P.tail);

  /* ---- ноги: поножи + сапоги ---- */
  const legs = [[22, P.legA], [34, P.legB]];
  for (let i = 0; i < legs.length; i++) {
    const X = legs[i][0] + legs[i][1][0], Y = 39 + B + legs[i][1][1];
    px(x, X - 1, Y, 10, 9, RC.stDD);
    px(x, X, Y, 8, 8, RC.stD);
    px(x, X + 1, Y, 6, 7, RC.st);
    px(x, X + 1, Y + 1, 2, 5, RC.stL);
    px(x, X - 1, Y + 8, 10, 3, RC.stDD);
    px(x, X, Y + 8, 8, 2, RC.st);
    px(x, X - 1, Y + 11, 10, 4, RC.leaD);
    px(x, X, Y + 11, 8, 2, RC.lea);
    px(x, X - 2, Y + 14, 12, 2, '#2b1f14');
    px(x, X - 2, Y + 14, 12, 1, '#4a3520');
  }

  /* ---- кираса ---- */
  px(x, CX - 12, 23 + B, 24, 17, RC.stDD);
  px(x, CX - 11, 23 + B, 22, 15, RC.stD);
  px(x, CX - 10, 23 + B, 20, 14, RC.st);
  px(x, CX - 10, 23 + B, 5, 13, RC.stL);
  px(x, CX - 10, 23 + B, 20, 2, RC.stL);
  for (let i = 0; i < 8; i++) {
    px(x, CX - 9 + i, 27 + B + i, 2, 1, RC.stDD);
    px(x, CX + 8 - i, 27 + B + i, 2, 1, RC.stDD);
  }
  px(x, CX - 3, 25 + B, 6, 6, RC.stDD);
  px(x, CX - 2, 26 + B, 4, 4, '#2b6f9c');
  px(x, CX - 2, 26 + B, 3, 2, RC.gemc);
  px(x, CX - 1, 26 + B, 1, 1, '#eaf9ff');
  px(x, CX - 9, 24 + B, 1, 1, RC.stL); px(x, CX + 8, 24 + B, 1, 1, RC.stL);
  px(x, CX - 9, 34 + B, 1, 1, RC.stL); px(x, CX + 8, 34 + B, 1, 1, RC.stL);
  px(x, CX - 12, 37 + B, 24, 5, RC.leaD);
  px(x, CX - 12, 37 + B, 24, 3, RC.lea);
  px(x, CX - 3, 36 + B, 7, 6, '#8a6a26');
  px(x, CX - 2, 37 + B, 5, 4, '#e0bb52');
  px(x, CX - 1, 38 + B, 2, 2, '#7a5f1e');

  /* ---- наплечники ---- */
  const sh = [CX - 17, CX + 7];
  for (let i = 0; i < 2; i++) {
    const sx = sh[i];
    px(x, sx + 2, 20 + B, 7, 1, RC.stDD);
    px(x, sx + 1, 21 + B, 9, 1, RC.stDD);
    px(x, sx, 22 + B, 11, 8, RC.stDD);
    px(x, sx + 1, 21 + B, 9, 8, RC.stD);
    px(x, sx + 2, 21 + B, 7, 4, RC.st);
    px(x, sx + 3, 21 + B, 5, 2, RC.stL);
    px(x, sx, 29 + B, 11, 3, RC.stDD);
    px(x, sx + 1, 29 + B, 9, 1, RC.stD);
  }

  /* ---- дальняя рука ---- */
  px(x, CX - 16, 29 + B + P.armY, 7, 9, RC.furDD);
  px(x, CX - 15, 29 + B + P.armY, 5, 8, RC.furD);
  px(x, CX - 17, 36 + B + P.armY, 8, 7, RC.stDD);
  px(x, CX - 16, 36 + B + P.armY, 6, 5, RC.st);
  px(x, CX - 16, 36 + B + P.armY, 6, 1, RC.stL);

  /* ---- ближняя рука и меч ---- */
  const hx = CX + 15, hy = 33 + B + P.armY;
  px(x, CX + 10, 28 + B + P.armY, 7, 9, RC.furDD);
  px(x, CX + 11, 28 + B + P.armY, 5, 8, RC.furD);
  px(x, CX + 11, 28 + B + P.armY, 5, 2, RC.fur);
  if (!P.hideSword) drawSword(x, hx, hy, P.swordAng, P.swordLen);
  px(x, hx - 4, hy - 4, 9, 9, RC.stDD);
  px(x, hx - 3, hy - 3, 7, 7, RC.stD);
  px(x, hx - 3, hy - 3, 7, 3, RC.st);
  px(x, hx - 2, hy - 3, 5, 1, RC.stL);

  /* ---- голова ---- */
  const HY = 2 + B + P.head, HX = CX - 11;
  const ear = (ex, fl) => {
    for (let i = 0; i < 4; i++) {
      const w = Math.round(3 + i * 1.2);
      px(x, fl ? ex + 7 - w : ex, HY - 4 + i, w, 1, RC.furDD);
    }
    px(x, ex, HY, 7, 5, RC.furD);
    px(x, ex + 1, HY - 1, 5, 5, RC.fur);
    px(x, ex + 2, HY, 3, 4, '#6b5757');
    px(x, ex + 2, HY + 1, 2, 2, '#94797a');
  };
  ear(HX + 1, false);
  ear(HX + 14, true);

  // череп
  px(x, HX + 0, HY + 3, 22, 17, RC.furDD);
  px(x, HX + 1, HY + 2, 20, 18, RC.furD);
  px(x, HX + 2, HY + 2, 18, 15, RC.fur);
  px(x, HX + 3, HY + 2, 16, 3, RC.furL);
  px(x, HX + 5, HY + 1, 12, 2, RC.furL);

  // светлые надбровные пятна
  px(x, HX + 2, HY + 5, 7, 3, RC.white);
  px(x, HX + 13, HY + 5, 7, 3, RC.white);

  // маска вокруг глаз
  px(x, HX + 1, HY + 7, 9, 7, RC.mask);
  px(x, HX + 12, HY + 7, 9, 7, RC.mask);
  px(x, HX + 9, HY + 8, 4, 4, RC.mask);
  px(x, HX + 0, HY + 8, 2, 5, RC.mask);
  px(x, HX + 20, HY + 8, 2, 5, RC.mask);
  px(x, HX + 2, HY + 13, 7, 2, '#2f353f');
  px(x, HX + 13, HY + 13, 7, 2, '#2f353f');

  // глаза
  px(x, HX + 3, HY + 8, 5, 4, '#f4f8fc');
  px(x, HX + 14, HY + 8, 5, 4, '#f4f8fc');
  px(x, HX + 5, HY + 9, 3, 3, '#151a22');
  px(x, HX + 16, HY + 9, 3, 3, '#151a22');
  px(x, HX + 5, HY + 9, 1, 1, '#ffffff');
  px(x, HX + 16, HY + 9, 1, 1, '#ffffff');

  // морда
  px(x, HX + 6, HY + 13, 10, 7, RC.white);
  px(x, HX + 7, HY + 19, 8, 2, '#cbd3dc');
  px(x, HX + 8, HY + 12, 6, 4, RC.nose);
  px(x, HX + 9, HY + 13, 2, 1, '#4b525d');
  px(x, HX + 9, HY + 16, 5, 1, RC.nose);
  px(x, HX + 8, HY + 17, 1, 1, RC.nose);
  px(x, HX + 14, HY + 17, 1, 1, RC.nose);
  // бакенбарды
  px(x, HX - 2, HY + 11, 4, 5, RC.furL);
  px(x, HX + 20, HY + 11, 4, 5, RC.furL);
  px(x, HX - 2, HY + 15, 3, 2, RC.furD);
  px(x, HX + 21, HY + 15, 3, 2, RC.furD);
}

function buildHero() {
  const F = {}, W = 72, H = 56;
  const make = (pose) => { const cv = mkc(W, H); drawRaccoon(cv.x, pose); outline(cv, PAL.outline); return cv; };

  F.idle = [
    make({ legA: [-3, 0], legB: [3, 0], swordAng: -1.15, swordLen: 32, tail: 0 }),
    make({ legA: [-3, 0], legB: [3, 0], body: 1, swordAng: -1.10, swordLen: 32, tail: 1, armY: 1 }),
    make({ legA: [-3, 0], legB: [3, 0], body: 1, head: 1, swordAng: -1.05, swordLen: 32, tail: 2, armY: 1 }),
    make({ legA: [-3, 0], legB: [3, 0], body: 0, swordAng: -1.10, swordLen: 32, tail: 1 })
  ];
  F.run = [
    make({ legA: [-5, -2], legB: [5, 1], body: 0, swordAng: -0.95, swordLen: 32, tail: 2, armY: -1 }),
    make({ legA: [-2, 1], legB: [4, 0], body: 1, swordAng: -0.90, swordLen: 32, tail: 1, armY: 0 }),
    make({ legA: [1, 2], legB: [1, 2], body: 2, swordAng: -0.85, swordLen: 32, tail: 0, armY: 1 }),
    make({ legA: [4, 0], legB: [-3, -2], body: 0, swordAng: -0.95, swordLen: 32, tail: -1, armY: -1 }),
    make({ legA: [5, 1], legB: [-1, 1], body: 1, swordAng: -1.0, swordLen: 32, tail: 0, armY: 0 }),
    make({ legA: [2, 2], legB: [2, 2], body: 2, swordAng: -1.05, swordLen: 32, tail: 1, armY: 1 })
  ];
  F.jump = make({ legA: [-4, -3], legB: [4, 1], body: -1, swordAng: -1.35, swordLen: 32, tail: -2, armY: -2 });
  F.fall = make({ legA: [-5, 1], legB: [5, -1], body: 1, swordAng: -0.7, swordLen: 32, tail: 2, armY: 1 });
  F.atk = [
    make({ legA: [-4, 0], legB: [3, 0], body: 0, swordAng: -2.0, swordLen: 32, tail: -2, armY: -3, head: -1 }),
    make({ legA: [-5, 0], legB: [5, 0], body: 1, swordAng: -0.35, swordLen: 36, tail: 1, armY: 0 }),
    make({ legA: [-5, 0], legB: [5, 0], body: 2, swordAng: 0.35, swordLen: 36, tail: 3, armY: 2, head: 1 }),
    make({ legA: [-4, 0], legB: [4, 0], body: 1, swordAng: -0.2, swordLen: 32, tail: 1, armY: 1 })
  ];
  const mir = o => Array.isArray(o) ? o.map(flip) : flip(o);
  F.R = { idle: F.idle, run: F.run, jump: F.jump, fall: F.fall, atk: F.atk };
  F.L = { idle: mir(F.idle), run: mir(F.run), jump: mir(F.jump), fall: mir(F.fall), atk: mir(F.atk) };
  return F;
}

/* =========================================================
   ГОБЛИН — холст 44x40, ступни y=39
========================================================= */
const GB = {
  sk: '#6fa63f', skL: '#95c95e', skD: '#4c7a2a', skDD: '#33561c',
  hair: '#c0492b', hairL: '#e0703f',
  lea: '#6a4527', leaD: '#422b16',
  eye: '#ffcf3a', pup: '#3a1a08',
  bl: '#cfd8e2', blL: '#f0f5fa', blD: '#8e99a6'
};

function drawGoblin(x, p) {
  const P = Object.assign({ legA: [0, 0], legB: [0, 0], body: 0, arm: 0, head: 0, hand: 'rock' }, p);
  const B = P.body, CX = 20, FY = 39;

  const legs = [[CX - 8, P.legA], [CX + 1, P.legB]];
  for (let i = 0; i < 2; i++) {
    const X = legs[i][0] + legs[i][1][0], Y = FY - 12 + B + legs[i][1][1];
    px(x, X, Y, 7, 8, GB.skD);
    px(x, X + 1, Y, 5, 7, GB.sk);
    px(x, X - 1, Y + 8, 9, 4, GB.leaD);
    px(x, X, Y + 8, 7, 2, GB.lea);
  }
  px(x, CX - 8, FY - 22 + B, 16, 12, GB.skD);
  px(x, CX - 7, FY - 22 + B, 14, 11, GB.sk);
  px(x, CX - 6, FY - 21 + B, 4, 9, GB.skL);
  px(x, CX - 8, FY - 16 + B, 16, 3, GB.leaD);
  px(x, CX - 8, FY - 16 + B, 16, 1, GB.lea);
  px(x, CX - 9, FY - 22 + B, 6, 9, GB.lea);
  px(x, CX - 9, FY - 22 + B, 6, 1, shade(GB.lea, .2));
  // дальняя рука — с сумкой камней на поясе
  px(x, CX - 11, FY - 20 + B + P.arm, 5, 9, GB.skD);
  px(x, CX - 12, FY - 14 + B, 7, 7, GB.leaD);
  px(x, CX - 11, FY - 13 + B, 5, 5, GB.lea);
  px(x, CX - 10, FY - 12 + B, 2, 2, '#8c8f93');

  const HY = FY - 34 + B + P.head;
  px(x, CX - 8, HY + 2, 16, 13, GB.skD);
  px(x, CX - 7, HY + 1, 14, 13, GB.sk);
  px(x, CX - 6, HY + 1, 12, 2, GB.skL);
  px(x, CX - 13, HY + 3, 6, 4, GB.skD); px(x, CX - 12, HY + 4, 4, 2, GB.sk);
  px(x, CX - 15, HY + 1, 3, 3, GB.skD);
  px(x, CX + 7, HY + 3, 6, 4, GB.skD); px(x, CX + 8, HY + 4, 4, 2, GB.sk);
  px(x, CX + 12, HY + 1, 3, 3, GB.skD);
  for (let i = 0; i < 7; i++) {
    const h = 3 + ((i * 5) % 4);
    px(x, CX - 6 + i * 2, HY - h, 2, h + 2, GB.hair);
    px(x, CX - 6 + i * 2, HY - h, 1, 2, GB.hairL);
  }
  px(x, CX - 6, HY + 5, 5, 4, GB.eye);
  px(x, CX + 2, HY + 5, 5, 4, GB.eye);
  px(x, CX - 4, HY + 6, 2, 3, GB.pup);
  px(x, CX + 4, HY + 6, 2, 3, GB.pup);
  px(x, CX - 7, HY + 4, 6, 1, GB.skDD);
  px(x, CX + 2, HY + 4, 6, 1, GB.skDD);
  px(x, CX - 1, HY + 8, 3, 3, GB.skD);
  px(x, CX - 5, HY + 11, 10, 2, GB.skDD);
  px(x, CX - 4, HY + 11, 2, 2, '#f2f6e8');
  px(x, CX + 2, HY + 11, 2, 2, '#f2f6e8');

  /* ---- ближняя рука: замах и бросок камня ---- */
  const drawRock = (rx, ry) => {
    px(x, rx, ry, 7, 6, '#5d666e');
    px(x, rx + 1, ry, 5, 5, '#8c959d');
    px(x, rx + 1, ry, 3, 2, '#b3bcc4');
    px(x, rx + 2, ry + 3, 2, 2, '#4a525a');
  };
  if (P.hand === 'back') {                       // рука занесена за голову
    px(x, CX + 4, FY - 26 + B + P.arm, 6, 9, GB.sk);
    px(x, CX + 4, FY - 26 + B + P.arm, 6, 1, GB.skL);
    px(x, CX + 7, FY - 32 + B + P.arm, 5, 7, GB.skD);
    px(x, CX + 8, FY - 32 + B + P.arm, 3, 6, GB.sk);
    drawRock(CX + 8, FY - 38 + B + P.arm);
  } else if (P.hand === 'throw') {               // рука выброшена вперёд
    px(x, CX + 5, FY - 22 + B + P.arm, 7, 6, GB.sk);
    px(x, CX + 5, FY - 22 + B + P.arm, 7, 1, GB.skL);
    px(x, CX + 11, FY - 23 + B + P.arm, 5, 5, GB.skD);
    px(x, CX + 12, FY - 23 + B + P.arm, 3, 4, GB.sk);
  } else if (P.hand === 'none') {                // рука опущена, камня нет
    px(x, CX + 6, FY - 21 + B + P.arm, 6, 10, GB.sk);
    px(x, CX + 6, FY - 21 + B + P.arm, 6, 1, GB.skL);
    px(x, CX + 6, FY - 12 + B + P.arm, 6, 4, GB.skD);
  } else {                                       // несёт камень у пояса
    px(x, CX + 6, FY - 21 + B + P.arm, 6, 9, GB.sk);
    px(x, CX + 6, FY - 21 + B + P.arm, 6, 1, GB.skL);
    px(x, CX + 6, FY - 13 + B + P.arm, 6, 4, GB.skD);
    drawRock(CX + 6, FY - 12 + B + P.arm);
  }
}

function buildGoblin() {
  const mk = p => { const cv = mkc(44, 40); drawGoblin(cv.x, p); outline(cv, PAL.outline); return cv; };
  const idle = [mk({}), mk({ body: 1, arm: 1 }), mk({ body: 1, arm: 0, head: 1 }), mk({ body: 0, arm: 1 })];
  const walk = [
    mk({ legA: [-3, 0], legB: [3, 0], body: 0, arm: -1 }),
    mk({ legA: [-1, 1], legB: [1, 1], body: 1, arm: 0 }),
    mk({ legA: [3, 0], legB: [-3, 0], body: 0, arm: 1 }),
    mk({ legA: [1, 1], legB: [-1, 1], body: 1, arm: 0 })
  ];
  const wind = [                                   // замах
    mk({ legA: [-2, 0], legB: [2, 0], body: 0, hand: 'back', head: -1 }),
    mk({ legA: [-3, 0], legB: [3, 0], body: -1, hand: 'back', head: -1, arm: -1 })
  ];
  const thr = [                                    // бросок
    mk({ legA: [-3, 0], legB: [4, 0], body: 1, hand: 'throw', head: 1 }),
    mk({ legA: [-2, 0], legB: [3, 0], body: 1, hand: 'none', head: 0 })
  ];
  return {
    R: { idle, walk, wind: wind, throw: thr },
    L: { idle: idle.map(flip), walk: walk.map(flip), wind: wind.map(flip), throw: thr.map(flip) }
  };
}

/* летящий камень */
function buildRock() {
  const F = [];
  for (let f = 0; f < 4; f++) {
    const cv = mkc(10, 10), x = cv.x;
    const o = [[0, 0], [1, 0], [1, 1], [0, 1]][f];
    px(x, 1 + o[0], 1 + o[1], 8, 7, '#4d565e');
    px(x, 2 + o[0], 1 + o[1], 6, 6, '#8c959d');
    px(x, 2 + o[0], 1 + o[1], 3, 2, '#b3bcc4');
    px(x, 4 + o[0], 4 + o[1], 3, 2, '#5d666e');
    outline(cv, '#20262b');
    F.push(cv);
  }
  return F;
}

/* =========================================================
   ОРК — холст 72x82, ступни y=81
========================================================= */
const OR = {
  sk: '#5d8f3c', skL: '#82b25c', skD: '#41692a', skDD: '#2c4a1b',
  lea: '#77522e', leaD: '#4a331c', leaL: '#9a6f43',
  eye: '#ffd24a', pup: '#4a1206',
  wood: '#8a6338', woodD: '#5c4023', woodL: '#ab835a'
};

function drawOrc(x, p) {
  const P = Object.assign({ legA: [0, 0], legB: [0, 0], body: 0, arm: 0, head: 0, club: 'side' }, p);
  const B = P.body, CX = 32, FY = 81;

  /* ---- ноги: массивные, слегка расставлены ---- */
  const legs = [[CX - 16, P.legA], [CX + 2, P.legB]];
  for (let i = 0; i < 2; i++) {
    const X = legs[i][0] + legs[i][1][0], Y = FY - 26 + B + legs[i][1][1];
    px(x, X - 1, Y, 16, 19, OR.skDD);
    px(x, X, Y, 14, 18, OR.skD);
    px(x, X + 1, Y, 12, 17, OR.sk);
    px(x, X + 2, Y + 1, 4, 13, OR.skL);
    px(x, X + 1, Y + 12, 12, 2, OR.skD);            // колено
    px(x, X - 2, Y + 18, 18, 8, OR.leaD);           // сапог
    px(x, X - 1, Y + 18, 16, 4, OR.lea);
    px(x, X - 1, Y + 19, 6, 2, OR.leaL);
    px(x, X - 2, Y + 24, 18, 2, '#241708');
  }

  /* ---- набедренная юбка ---- */
  px(x, CX - 19, FY - 32 + B, 38, 12, OR.leaD);
  for (let i = 0; i < 6; i++) px(x, CX - 18 + i * 6, FY - 32 + B, 5, 10 + (i % 2) * 3, OR.lea);
  px(x, CX - 19, FY - 32 + B, 38, 3, OR.leaL);

  /* ---- торс: широкие плечи, узкая талия ---- */
  for (let i = 0; i < 30; i++) {
    const k = i / 29;
    const halfW = 24 - k * 7;
    const Y = FY - 58 + B + i;
    px(x, Math.round(CX - halfW), Y, Math.round(halfW * 2), 1, OR.skD);
    px(x, Math.round(CX - halfW) + 1, Y, Math.round(halfW * 2) - 2, 1, OR.sk);
    px(x, Math.round(CX - halfW) + 2, Y, 5, 1, OR.skL);
  }
  // грудные и пресс
  px(x, CX - 14, FY - 56 + B, 12, 9, OR.skL);
  px(x, CX + 2, FY - 56 + B, 12, 9, OR.skL);
  px(x, CX - 1, FY - 56 + B, 2, 11, OR.skD);
  px(x, CX - 14, FY - 47 + B, 28, 1, OR.skD);
  for (let r2 = 0; r2 < 3; r2++) {
    px(x, CX - 9, FY - 43 + B + r2 * 4, 18, 1, OR.skD);
    px(x, CX - 1, FY - 44 + B + r2 * 4, 2, 4, OR.skD);
  }
  // ремень через грудь
  for (let i = 0; i < 30; i++) {
    px(x, CX - 18 + i, FY - 58 + B + i * .95, 7, 3, OR.leaD);
    px(x, CX - 18 + i, FY - 58 + B + i * .95, 7, 2, i % 7 < 4 ? OR.lea : OR.leaL);
  }
  // пояс
  px(x, CX - 19, FY - 34 + B, 38, 7, OR.leaD);
  px(x, CX - 19, FY - 34 + B, 38, 3, OR.lea);
  px(x, CX - 5, FY - 35 + B, 11, 9, '#8a6a26');
  px(x, CX - 4, FY - 34 + B, 9, 7, '#e0bb52');
  px(x, CX - 2, FY - 32 + B, 5, 3, '#7a5f1e');

  /* ---- дальняя рука ---- */
  const fa = FY - 56 + B + P.arm;
  px(x, CX - 27, fa, 12, 22, OR.skDD);
  px(x, CX - 26, fa, 10, 21, OR.skD);
  px(x, CX - 25, fa + 1, 5, 17, OR.sk);
  px(x, CX - 28, fa + 21, 14, 12, OR.skDD);       // кулак
  px(x, CX - 27, fa + 22, 12, 10, OR.skD);
  px(x, CX - 26, fa + 23, 5, 7, OR.sk);
  for (let i = 0; i < 3; i++) px(x, CX - 26 + i * 4, fa + 24, 1, 6, OR.skDD);

  /* ---- ближняя рука, поднята к плечу ---- */
  const ax = CX + 15, ay = FY - 58 + B + P.arm;
  px(x, ax - 2, ay + 2, 2, 26, OR.skDD);
  px(x, ax, ay, 14, 24, OR.skDD);
  px(x, ax + 1, ay, 12, 23, OR.skD);
  px(x, ax + 2, ay + 1, 5, 19, OR.sk);
  px(x, ax + 3, ay + 2, 3, 8, OR.skL);

  /* ---- дубина: side — у плеча, up — занесена, down — удар вперёд ---- */
  const clubUp = P.club === 'up', clubDown = P.club === 'down';
  const gx = ax + 11 + (clubDown ? 6 : 0), gy = ay + 24 - (clubUp ? 12 : 0) + (clubDown ? 16 : 0);
  const CH = 30;
  const hwAt = k => 5.5 + (1 - k) * 5.5;
  if (clubDown) {
    // рукоять уходит вперёд-вниз, головка перед орком
    for (let i = 0; i < 26; i++) {
      px(x, gx - 5 + i * .55, gy - 12 + i * .5, 11, 3, OR.woodD);
      px(x, gx - 4 + i * .55, gy - 12 + i * .5, 9, 2, OR.wood);
    }
    const hx = gx + 15, hy = gy + 2;
    for (let i = 0; i < CH; i++) {
      const k = i / (CH - 1), hw2 = hwAt(1 - k), X = hx - CH / 2 + i;
      px(x, X, Math.round(hy - hw2), 1, Math.round(hw2 * 2), OR.woodD);
      px(x, X, Math.round(hy - hw2) + 1, 1, Math.round(hw2 * 2) - 2, OR.wood);
    }
    const sp2 = [[0.10, -1], [0.30, 1], [0.52, -1], [0.74, 1], [0.90, -1]];
    for (let i = 0; i < sp2.length; i++) {
      const k = sp2[i][0], dir = sp2[i][1];
      const hw2 = hwAt(1 - k), X = Math.round(hx - CH / 2 + k * CH);
      const by2 = Math.round(hy + dir * hw2);
      for (let n = 0; n < 5; n++) {
        const hh = 6 - n;
        px(x, X - (hh >> 1), by2 + dir * n, hh, 1, '#8d8370');
        if (hh > 2) px(x, X - (hh >> 1) + 1, by2 + dir * n, hh - 2, 1, '#e8dec7');
      }
    }
  } else {
    px(x, gx - 4, gy - 14, 9, 22, OR.woodD);
    px(x, gx - 3, gy - 14, 7, 22, OR.wood);
    px(x, gx - 2, gy - 13, 2, 20, OR.woodL);
    px(x, gx - 5, gy + 6, 11, 5, OR.woodD);
    px(x, gx - 4, gy + 6, 9, 3, OR.wood);
    const CTOP = gy - 42;
    for (let i = 0; i < CH; i++) {
      const k = i / (CH - 1), hw2 = hwAt(k), Y = CTOP + i;
      px(x, Math.round(gx - hw2), Y, Math.round(hw2 * 2), 1, OR.woodD);
      px(x, Math.round(gx - hw2) + 1, Y, Math.round(hw2 * 2) - 2, 1, OR.wood);
      px(x, Math.round(gx - hw2) + 2, Y, 3, 1, OR.woodL);
      if (i % 7 === 3) px(x, Math.round(gx - hw2) + 2, Y, Math.round(hw2 * 2) - 4, 1, shade(OR.wood, -.22));
      if (i === 9 || i === 21) px(x, Math.round(gx - hw2) + 4, Y, 4, 3, OR.woodD);
    }
    px(x, gx - 11, CTOP - 2, 22, 3, OR.woodD);
    px(x, gx - 10, CTOP - 2, 20, 2, OR.woodL);
    const sp = [[0.08, 1], [0.24, 1], [0.42, 1], [0.60, 1], [0.78, 1], [0.16, -1], [0.50, -1]];
    for (let i = 0; i < sp.length; i++) {
      const k = sp[i][0], dir = sp[i][1];
      const hw2 = hwAt(k), Y = Math.round(CTOP + k * CH);
      const bx2 = Math.round(gx + dir * hw2);
      for (let n = 0; n < 5; n++) {
        const hh = 6 - n;
        px(x, bx2 + dir * n, Y - (hh >> 1), 1, hh, '#8d8370');
        if (hh > 2) px(x, bx2 + dir * n, Y - (hh >> 1) + 1, 1, hh - 2, '#e8dec7');
      }
    }
  }

  /* ---- кулак поверх рукояти ---- */
  px(x, ax, ay + 20, 15, 13, OR.skDD);
  px(x, ax + 1, ay + 21, 13, 11, OR.skD);
  px(x, ax + 2, ay + 22, 6, 8, OR.sk);
  for (let i = 0; i < 3; i++) px(x, ax + 3 + i * 4, ay + 23, 1, 7, OR.skDD);

  /* ---- голова поверх всего ---- */
  const HY = FY - 80 + B + P.head;
  px(x, CX - 21, HY + 6, 10, 7, OR.skDD); px(x, CX - 20, HY + 7, 8, 5, OR.skD);
  px(x, CX - 19, HY + 8, 5, 3, OR.sk);
  px(x, CX - 24, HY + 2, 5, 6, OR.skDD); px(x, CX - 23, HY + 3, 3, 4, OR.skD);
  px(x, CX + 11, HY + 6, 10, 7, OR.skDD); px(x, CX + 12, HY + 7, 8, 5, OR.skD);
  px(x, CX + 14, HY + 8, 5, 3, OR.sk);
  px(x, CX + 19, HY + 2, 5, 6, OR.skDD); px(x, CX + 20, HY + 3, 3, 4, OR.skD);
  px(x, CX - 12, HY + 3, 24, 21, OR.skDD);
  px(x, CX - 11, HY + 2, 22, 21, OR.skD);
  px(x, CX - 10, HY + 2, 20, 16, OR.sk);
  px(x, CX - 8, HY + 2, 16, 4, OR.skL);
  px(x, CX - 10, HY + 17, 20, 7, OR.skD);
  px(x, CX - 9, HY + 17, 18, 5, OR.sk);
  px(x, CX - 11, HY + 7, 11, 4, OR.skDD);
  px(x, CX, HY + 7, 11, 4, OR.skDD);
  px(x, CX - 10, HY + 6, 9, 2, OR.skD);
  px(x, CX + 1, HY + 6, 9, 2, OR.skD);
  px(x, CX - 10, HY + 11, 7, 5, OR.eye);
  px(x, CX + 3, HY + 11, 7, 5, OR.eye);
  px(x, CX - 8, HY + 12, 3, 4, OR.pup);
  px(x, CX + 5, HY + 12, 3, 4, OR.pup);
  px(x, CX - 10, HY + 11, 7, 1, '#ffe9a0');
  px(x, CX - 3, HY + 14, 7, 5, OR.skD);
  px(x, CX - 2, HY + 16, 2, 2, OR.skDD);
  px(x, CX + 2, HY + 16, 2, 2, OR.skDD);
  px(x, CX - 9, HY + 19, 18, 5, '#3c1c14');
  px(x, CX - 7, HY + 19, 14, 1, '#5e2c20');
  px(x, CX - 9, HY + 15, 4, 8, '#f4f7e9');
  px(x, CX + 5, HY + 15, 4, 8, '#f4f7e9');
  px(x, CX - 9, HY + 21, 3, 2, '#d8dcc4');
  px(x, CX + 6, HY + 21, 3, 2, '#d8dcc4');
  px(x, CX - 4, HY + 23, 2, 2, '#e8ecd8');
  px(x, CX + 2, HY + 23, 2, 2, '#e8ecd8');
}

function buildOrc() {
  const mk = p => { const cv = mkc(72, 82); drawOrc(cv.x, p); outline(cv, PAL.outline); return cv; };
  const idle = [mk({}), mk({ body: 1, arm: 1 }), mk({ body: 2, arm: 1, head: 1 }), mk({ body: 1, arm: 0 })];
  const walk = [
    mk({ legA: [-4, 0], legB: [4, 0], body: 0, arm: -1 }),
    mk({ legA: [-1, 2], legB: [1, 2], body: 2, arm: 0 }),
    mk({ legA: [4, 0], legB: [-4, 0], body: 0, arm: 1 }),
    mk({ legA: [1, 2], legB: [-1, 2], body: 2, arm: 0 })
  ];
  const wind = [
    mk({ club: 'up', arm: -4, body: -1, head: -1, legA: [-3, 0], legB: [3, 0] }),
    mk({ club: 'up', arm: -6, body: -2, head: -2, legA: [-4, 0], legB: [4, 0] })
  ];
  const hit = [
    mk({ club: 'down', arm: 3, body: 3, head: 2, legA: [-5, 0], legB: [5, 0] }),
    mk({ club: 'down', arm: 4, body: 4, head: 2, legA: [-5, 0], legB: [5, 0] })
  ];
  return {
    R: { idle, walk, wind: wind, hit: hit },
    L: { idle: idle.map(flip), walk: walk.map(flip), wind: wind.map(flip), hit: hit.map(flip) }
  };
}

/* =========================================================
   ПРЕДМЕТЫ
========================================================= */
function buildCoin() {
  const F = [], widths = [12, 9, 6, 3, 6, 9];
  for (let k = 0; k < widths.length; k++) {
    const w = widths[k], cv = mkc(14, 14), x = cv.x, cx = 7, cy = 7, R = 6;
    for (let j = -R; j <= R; j++) {
      // эллипс: полная высота, ширина зависит от фазы вращения
      const q = 1 - (j * j) / (R * R);
      if (q <= 0) continue;
      const hw = Math.max(1, Math.round(Math.sqrt(q) * w / 2));
      px(x, cx - hw, cy + j, hw * 2, 1, PAL.goldD);
      if (hw > 1) px(x, cx - hw + 1, cy + j, hw * 2 - 2, 1, PAL.gold);
      if (hw > 2 && j < 2) px(x, cx - hw + 1, cy + j, Math.max(1, hw - 1), 1, PAL.goldL);
    }
    if (w > 5) {   // гравировка
      px(x, cx - 1, cy - 3, 2, 6, PAL.goldD);
      px(x, cx - 1, cy - 3, 1, 6, shade(PAL.goldD, -.2));
    }
    outline(cv, '#5c3a06');
    F.push(cv);
  }
  return F;
}

function buildGem() {
  const F = [];
  for (let f = 0; f < 4; f++) {
    const cv = mkc(16, 22), x = cv.x, b = [0, -1, 0, 1][f];
    const P = [[6, 1 + b, 4, 3], [5, 4 + b, 6, 4], [4, 8 + b, 8, 5], [5, 13 + b, 6, 4], [6, 17 + b, 4, 3]];
    for (let i = 0; i < P.length; i++) px(x, P[i][0], P[i][1], P[i][2], P[i][3], PAL.gemD);
    for (let i = 0; i < P.length; i++) px(x, P[i][0] + 1, P[i][1], P[i][2] - 2, P[i][3], PAL.gem);
    px(x, 6, 3 + b, 2, 13, PAL.gemL);
    px(x, 9, 6 + b, 1, 8, '#bff0ff');
    px(x, 7, 2 + b, 2, 2, '#ffffff');
    outline(cv, '#0d4a72');
    F.push(cv);
  }
  return F;
}

function buildCrate() {
  const cv = mkc(24, 24), x = cv.x;
  px(x, 0, 0, 24, 24, PAL.woodD);
  px(x, 1, 1, 22, 22, PAL.wood);
  for (let i = 0; i < 22; i += 4) px(x, 1, 1 + i, 22, 1, PAL.woodD);
  px(x, 1, 1, 22, 2, PAL.woodL);
  for (let i = 0; i < 22; i++) { px(x, 1 + i, 1 + i, 2, 2, PAL.woodL); px(x, 22 - i, 1 + i, 2, 2, PAL.woodL); }
  px(x, 0, 0, 24, 3, PAL.woodD); px(x, 0, 21, 24, 3, PAL.woodD);
  px(x, 0, 0, 3, 24, PAL.woodD); px(x, 21, 0, 3, 24, PAL.woodD);
  px(x, 1, 1, 22, 1, PAL.woodL); px(x, 1, 1, 1, 22, PAL.woodL);
  outline(cv, '#2e1c0c');
  return cv;
}

function buildPot() {
  const cv = mkc(20, 20), x = cv.x;
  const rows = [[7, 1, 6, 2], [5, 3, 10, 2], [3, 5, 14, 3], [2, 8, 16, 6], [3, 14, 14, 3], [5, 17, 10, 2]];
  for (let i = 0; i < rows.length; i++) px(x, rows[i][0], rows[i][1], rows[i][2], rows[i][3], PAL.clayD);
  for (let i = 0; i < rows.length; i++) px(x, rows[i][0] + 1, rows[i][1], rows[i][2] - 2, rows[i][3], PAL.clay);
  px(x, 4, 7, 3, 8, PAL.clayL);
  px(x, 5, 1, 2, 2, PAL.clayL);
  px(x, 8, 9, 5, 4, PAL.clayD);
  px(x, 9, 10, 3, 2, shade(PAL.clay, .12));
  outline(cv, '#3d2410');
  return cv;
}

function buildMushroom() {
  const cv = mkc(12, 11), x = cv.x;
  px(x, 2, 1, 8, 4, '#c8392f');
  px(x, 1, 3, 10, 3, '#c8392f');
  px(x, 2, 1, 6, 2, '#e0574a');
  px(x, 3, 2, 2, 1, '#ffe7d8'); px(x, 7, 3, 2, 1, '#ffe7d8');
  px(x, 1, 5, 10, 1, '#8d2019');
  px(x, 4, 6, 4, 5, '#efe0c8');
  px(x, 4, 6, 2, 5, '#fff6e6');
  outline(cv, '#2a1410');
  return cv;
}

function buildBush(seed) {
  const cv = mkc(44, 26), x = cv.x, r = rng(seed);
  for (let i = 0; i < 30; i++) px(x, 2 + r() * 38, 8 + r() * 16, 3 + r() * 5, 3 + r() * 5, r() < .4 ? PAL.grassD : PAL.grassDD);
  for (let i = 0; i < 16; i++) px(x, 4 + r() * 34, 5 + r() * 11, 2 + r() * 4, 2 + r() * 4, r() < .5 ? PAL.grass : PAL.moss);
  for (let i = 0; i < 7; i++) {
    const sx = 6 + r() * 32, len = 9 + r() * 11, dir = r() < .5 ? -1 : 1;
    for (let j = 0; j < len; j++) px(x, sx + dir * j * .5, 18 - j, 1, 2, PAL.grassD);
  }
  return cv;
}

function buildFern(seed) {
  const cv = mkc(28, 32), x = cv.x, r = rng(seed);
  for (let b = 0; b < 8; b++) {
    const dir = (b % 2 ? 1 : -1), len = 13 + r() * 13, sx = 14, sy = 31;
    for (let j = 0; j < len; j++) {
      const X = sx + dir * (j * .55 + Math.sin(j * .2) * 2), Y = sy - j * 1.05;
      px(x, X, Y, 2, 2, b % 3 ? PAL.grassD : PAL.grassDD);
      if (j % 3 === 0) px(x, X + dir * 2, Y, 2, 1, PAL.grass);
    }
  }
  return cv;
}
