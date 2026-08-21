/* ============ спрайты уровня: ловушки, усиления, босс ============ */
'use strict';

/* =========================================================
   ШИПЫ
========================================================= */
function buildSpikes(w) {
  const cv = mkc(w, 12), x = cv.x;
  px(x, 0, 8, w, 4, '#4a5560');
  px(x, 0, 8, w, 1, '#6d7a86');
  for (let i = 0; i < w; i += 8) {
    for (let k = 0; k < 4; k++) {
      const hh = 9 - k * 2;
      px(x, i + 3 - k, 9 - hh, 1, hh, '#8a97a4');
      px(x, i + 4 + k, 9 - hh, 1, hh, '#5b6874');
    }
    px(x, i + 3, 0, 2, 2, '#e6eef5');
  }
  outline(cv, '#1a2027');
  return cv;
}

/* =========================================================
   УСИЛЕНИЯ
========================================================= */
const PU_COL = { heart: '#e23b3b', shield: '#4fa8e8', boots: '#c07a34', rage: '#ff7a2f' };

function drawPuHeart(x) {
  const rows = [[3, 2, 3], [8, 2, 3], [2, 3, 10], [1, 4, 12], [1, 5, 12], [1, 6, 12],
  [2, 7, 10], [3, 8, 8], [4, 9, 6], [5, 10, 4], [6, 11, 2]];
  for (const r of rows) px(x, r[0], r[1] + 2, r[2], 1, '#8d1a1a');
  for (const r of rows) px(x, r[0] + 1, r[1] + 2, Math.max(1, r[2] - 2), 1, '#e23b3b');
  px(x, 3, 6, 3, 3, '#ff9b9b');
  px(x, 3, 6, 2, 1, '#ffd6d6');
  px(x, 9, 5, 2, 1, '#ff7d7d');
}

function drawPuShield(x) {
  for (let j = 0; j < 15; j++) {
    const hw = j < 9 ? 7 : Math.max(0, Math.round(7 * (1 - (j - 9) / 6.4)));
    if (hw < 1) continue;
    px(x, 8 - hw, 2 + j, hw * 2, 1, '#1f5f92');
    px(x, 9 - hw, 2 + j, hw * 2 - 2, 1, '#4fa8e8');
    if (j < 7) px(x, 9 - hw, 2 + j, Math.max(1, hw - 1), 1, '#9adcff');
  }
  px(x, 6, 5, 4, 8, '#e8f6ff');
  px(x, 4, 7, 8, 3, '#e8f6ff');
}

function drawPuBoots(x) {
  px(x, 4, 3, 6, 8, '#7c5028');
  px(x, 5, 3, 4, 7, '#a9743c');
  px(x, 5, 4, 2, 4, '#c69258');
  px(x, 2, 10, 11, 4, '#5c3a1e');
  px(x, 3, 10, 9, 2, '#8a5c2e');
  px(x, 2, 13, 12, 2, '#33200f');
  px(x, 9, 4, 6, 2, '#e8f2f8');
  px(x, 10, 6, 5, 2, '#c9dcea');
  px(x, 11, 8, 4, 1, '#a8c2d4');
}

function drawPuRage(x) {
  const f = [[3, 6, 2, 4], [12, 5, 2, 5], [2, 9, 2, 3], [13, 9, 2, 3], [5, 3, 2, 3], [10, 2, 2, 3]];
  for (const p of f) px(x, p[0], p[1], p[2], p[3], '#ff7a2f');
  for (const p of f) px(x, p[0], p[1], p[2], Math.max(1, p[3] - 2), '#ffd23f');
  px(x, 7, 2, 3, 9, '#d6dee7');
  px(x, 7, 2, 1, 9, '#f4f8fc');
  px(x, 8, 1, 1, 2, '#ffffff');
  px(x, 4, 11, 9, 2, '#525b67');
  px(x, 7, 13, 3, 4, '#3a2f26');
}

function drawPu(kind, x) {
  if (kind === 'heart') drawPuHeart(x);
  else if (kind === 'shield') drawPuShield(x);
  else if (kind === 'boots') drawPuBoots(x);
  else drawPuRage(x);
}

/* иконка с пульсирующим ореолом (4 кадра) */
function buildPickup(kind) {
  const F = [];
  for (let f = 0; f < 4; f++) {
    const cv = mkc(24, 26), x = cv.x;
    const bob = [0, -1, -2, -1][f];
    const halo = [0, 1, 2, 1][f];
    x.globalAlpha = .22 + halo * .07;
    px(x, 3 - halo, 4 + bob - halo, 18 + halo * 2, 18 + halo * 2, PU_COL[kind]);
    x.globalAlpha = 1;
    const inner = mkc(16, 18);
    drawPu(kind, inner.x);
    outline(inner, '#141a1e');
    x.drawImage(inner.c, 4, 4 + bob);
    if (f % 2 === 0) { px(x, 1, 9 + bob, 1, 1, '#ffffff'); px(x, 22, 13 + bob, 1, 1, '#ffffff'); }
    F.push(cv);
  }
  return F;
}

/* плоская иконка для HUD */
function buildPuIcon(kind) {
  const cv = mkc(16, 18);
  drawPu(kind, cv.x);
  outline(cv, '#141a1e');
  return cv;
}

/* =========================================================
   ЧЕКПОИНТ — флаг на шесте
========================================================= */
function buildFlag(active) {
  const F = [];
  for (let f = 0; f < 4; f++) {
    const cv = mkc(24, 40), x = cv.x;
    px(x, 3, 4, 3, 36, '#6b6f78');
    px(x, 3, 4, 1, 36, '#9ba0aa');
    px(x, 1, 37, 7, 3, '#4a4e57');
    px(x, 2, 2, 5, 3, active ? '#ffd23f' : '#5a5f68');
    for (let j = 0; j < 11; j++) {
      const wob = active ? Math.round(Math.sin((j + f * 1.4) * .7) * 1.8) : Math.round(Math.sin(j * .7) * 1.1);
      const w = (active ? 14 : 11) + wob;
      px(x, 6, 6 + j, w, 1, active ? '#e23b3b' : '#4d525c');
      px(x, 6, 6 + j, Math.max(1, Math.round(w * .4)), 1, active ? '#ff6b5c' : '#646a75');
    }
    if (active) px(x, 6, 6, 14, 1, '#ff9b8f');
    outline(cv, '#141a1e');
    F.push(cv);
  }
  return F;
}

/* =========================================================
   УДАРНАЯ ВОЛНА
========================================================= */
function buildShock() {
  const F = [];
  for (let f = 0; f < 4; f++) {
    const cv = mkc(30, 34), x = cv.x;
    const h = 26 - f * 3;
    // земляной гребень
    for (let i = 0; i < 7; i++) {
      const hh = Math.round(h - Math.abs(i - 3) * 5.2);
      if (hh <= 0) continue;
      px(x, 2 + i * 4, 32 - hh, 4, hh, '#a97c3e');
      px(x, 2 + i * 4, 32 - hh, 4, 3, '#e3c078');
      px(x, 2 + i * 4, 32 - hh + 3, 2, hh - 4, '#c99a52');
    }
    // подлетающие комья
    for (let i = 0; i < 7; i++) {
      const s2 = 2 + ((i + f) % 2);
      px(x, 1 + i * 4, Math.max(0, 26 - h - f * 3 + (i % 3) * 3), s2, s2, '#8a6a3c');
    }
    px(x, 0, 31, 30, 3, '#7a5a2e');
    outline(cv, '#3f2c12');
    F.push(cv);
  }
  return F;
}

/* =========================================================
   ВОРОТА АРЕНЫ
========================================================= */
function buildGate(w, h) {
  const cv = mkc(w, h), x = cv.x;
  px(x, 0, 0, w, h, '#3b4149');
  for (let gy = 0; gy < h; gy += 10) {
    for (let gx = 0; gx < w; gx += 12) {
      px(x, gx + 1, gy + 1, 10, 8, '#5a626c');
      px(x, gx + 1, gy + 1, 10, 1, '#7b848f');
      px(x, gx + 1, gy + 8, 10, 1, '#33383f');
    }
  }
  for (let i = 0; i < 3; i++) {
    const yy = Math.round(6 + i * (h / 3));
    px(x, 0, yy, w, 4, '#2b3037');
    px(x, 0, yy, w, 1, '#6d7681');
    for (let k = 3; k < w; k += 10) px(x, k, yy + 1, 2, 2, '#9aa3ad');
  }
  outline(cv, '#141a1e');
  return cv;
}

/* =========================================================
   ФИНАЛЬНЫЙ ПОРТАЛ
========================================================= */
function buildPortal() {
  const F = [];
  for (let f = 0; f < 6; f++) {
    const cv = mkc(44, 60), x = cv.x;
    for (let j = 0; j < 60; j++) {
      px(x, 0, j, 8, 1, j % 8 < 4 ? '#78867a' : '#5d6a60');
      px(x, 36, j, 8, 1, j % 8 < 4 ? '#5d6a60' : '#78867a');
    }
    px(x, 0, 0, 44, 9, '#78867a');
    px(x, 0, 0, 44, 2, '#95a293');
    px(x, 0, 7, 44, 2, '#4a5348');
    for (let j = 9; j < 60; j++) {
      const k = (j - 9) / 51;
      const wob = Math.sin(k * 6.2 + f * 1.05) * 2.4;
      const w2 = Math.max(4, 26 + wob);
      const X = Math.round(22 - w2 / 2);
      px(x, X, j, Math.round(w2), 1, '#2b6f9c');
      px(x, X + 3, j, Math.round(w2) - 6, 1, '#4fc3f7');
      if ((j + f * 3) % 7 === 0) px(x, X + 5, j, Math.max(1, Math.round(w2) - 10), 1, '#dff6ff');
    }
    F.push(cv);
  }
  return F;
}

/* =========================================================
   БОСС — ОРОЧИЙ ВОЖДЬ ГРУМАШ
   холст 128x124, ступни y=123, центр x=64
========================================================= */
const BS = {
  sk: '#4e7f34', skL: '#6fa24f', skD: '#365c22', skDD: '#243f16',
  ir: '#5a636e', irL: '#8b95a1', irD: '#3a424c', irDD: '#252b33',
  lea: '#6b4526', leaD: '#402813', leaL: '#8e6237',
  eye: '#ff5533',
  wood: '#7b5732', woodD: '#4f381f', woodL: '#9c7748'
};

function bossMaceHead(x, hx, hy) {
  const R = 15;
  for (let j = -R; j <= R; j++) {
    const q = 1 - (j * j) / (R * R);
    if (q <= 0) continue;
    const hw = Math.round(Math.sqrt(q) * R);
    px(x, hx - hw, hy + j, hw * 2, 1, BS.irD);
    px(x, hx - hw + 2, hy + j, hw * 2 - 4, 1, BS.ir);
  }
  px(x, hx - 10, hy - 10, 8, 7, BS.irL);
  for (let a = 0; a < 8; a++) {
    const an = a * Math.PI / 4;
    const bx = hx + Math.cos(an) * R, by = hy + Math.sin(an) * R;
    for (let k = 0; k < 6; k++) {
      const w = 5 - k;
      if (w < 1) continue;
      px(x, bx + Math.cos(an) * k - w / 2, by + Math.sin(an) * k - w / 2, w, w, k < 3 ? '#b9c3ce' : '#eef4fa');
    }
  }
}

function drawBoss(x, p) {
  const P = Object.assign({ legA: [0, 0], legB: [0, 0], body: 0, arm: 0, head: 0, club: 'side' }, p);
  const B = P.body, CX = 64, FY = 123;

  /* ноги */
  const legs = [[CX - 26, P.legA], [CX + 4, P.legB]];
  for (let i = 0; i < 2; i++) {
    const X = legs[i][0] + legs[i][1][0], Y = FY - 38 + B + legs[i][1][1];
    px(x, X - 1, Y, 24, 27, BS.skDD);
    px(x, X, Y, 22, 26, BS.skD);
    px(x, X + 1, Y, 20, 25, BS.sk);
    px(x, X + 3, Y + 2, 6, 18, BS.skL);
    px(x, X - 2, Y - 3, 26, 8, BS.leaD);
    px(x, X - 1, Y - 3, 24, 4, BS.lea);
    px(x, X - 3, Y + 26, 28, 10, BS.irD);
    px(x, X - 2, Y + 26, 26, 5, BS.ir);
    px(x, X - 1, Y + 27, 8, 3, BS.irL);
    px(x, X - 3, Y + 34, 28, 3, '#1c2128');
  }

  /* набедренники */
  px(x, CX - 30, FY - 46 + B, 60, 16, BS.leaD);
  for (let i = 0; i < 7; i++) {
    px(x, CX - 29 + i * 9, FY - 46 + B, 7, 12 + (i % 2) * 4, BS.lea);
    px(x, CX - 29 + i * 9, FY - 46 + B, 7, 2, BS.leaL);
  }

  /* торс */
  for (let i = 0; i < 42; i++) {
    const k = i / 41, hw = 34 - k * 9, Y = FY - 84 + B + i;
    px(x, Math.round(CX - hw), Y, Math.round(hw * 2), 1, BS.skD);
    px(x, Math.round(CX - hw) + 2, Y, Math.round(hw * 2) - 4, 1, BS.sk);
    px(x, Math.round(CX - hw) + 3, Y, 7, 1, BS.skL);
  }
  px(x, CX - 22, FY - 82 + B, 19, 14, BS.skL);
  px(x, CX + 3, FY - 82 + B, 19, 14, BS.skL);
  px(x, CX - 2, FY - 82 + B, 4, 17, BS.skD);
  px(x, CX - 22, FY - 68 + B, 44, 2, BS.skD);
  for (let r = 0; r < 4; r++) {
    px(x, CX - 15, FY - 62 + B + r * 5, 30, 2, BS.skD);
    px(x, CX - 2, FY - 64 + B + r * 5, 4, 5, BS.skD);
  }
  px(x, CX + 8, FY - 78 + B, 2, 12, BS.skDD);
  px(x, CX + 12, FY - 74 + B, 2, 8, BS.skDD);

  /* ремни и пояс */
  for (let i = 0; i < 44; i++) {
    px(x, CX - 28 + i, FY - 84 + B + i * .92, 10, 4, BS.leaD);
    px(x, CX - 28 + i, FY - 84 + B + i * .92, 10, 3, i % 9 < 5 ? BS.lea : BS.leaL);
  }
  px(x, CX - 30, FY - 48 + B, 60, 11, BS.leaD);
  px(x, CX - 30, FY - 48 + B, 60, 4, BS.lea);
  px(x, CX - 9, FY - 50 + B, 18, 14, '#8a6a26');
  px(x, CX - 7, FY - 48 + B, 14, 10, '#e0bb52');
  px(x, CX - 3, FY - 45 + B, 7, 5, '#7a5f1e');

  /* наплечники с шипами */
  const pauld = (sx, dir) => {
    px(x, sx, FY - 88 + B, 22, 20, BS.irDD);
    px(x, sx + 1, FY - 88 + B, 20, 17, BS.irD);
    px(x, sx + 2, FY - 87 + B, 18, 8, BS.ir);
    px(x, sx + 3, FY - 87 + B, 16, 3, BS.irL);
    px(x, sx, FY - 70 + B, 22, 4, BS.irDD);
    for (let k = 0; k < 4; k++) {
      const hh = 9 - k * 2;
      px(x, sx + (dir > 0 ? 20 + k : 1 - k), FY - 92 + B + k, 2, hh, '#c9d2dc');
      px(x, sx + (dir > 0 ? 20 + k : 1 - k), FY - 92 + B + k, 1, hh - 1, '#eef4fa');
    }
  };
  pauld(CX - 43, -1);
  pauld(CX + 21, 1);

  /* дальняя рука */
  const fa = FY - 78 + B + P.arm;
  px(x, CX - 45, fa, 17, 32, BS.skDD);
  px(x, CX - 44, fa, 15, 31, BS.skD);
  px(x, CX - 43, fa + 1, 7, 26, BS.sk);
  px(x, CX - 47, fa + 31, 20, 17, BS.skDD);
  px(x, CX - 46, fa + 32, 18, 15, BS.skD);
  px(x, CX - 45, fa + 33, 8, 11, BS.sk);

  /* ближняя рука */
  const ax = CX + 26, ay = FY - 84 + B + P.arm;
  px(x, ax, ay, 19, 34, BS.skDD);
  px(x, ax + 1, ay, 17, 33, BS.skD);
  px(x, ax + 2, ay + 1, 7, 27, BS.sk);
  px(x, ax + 3, ay + 2, 4, 12, BS.skL);

  /* палица */
  if (P.club === 'up') {
    const gx = ax + 9, gy = ay + 8;
    px(x, gx - 5, gy - 4, 11, 42, BS.woodD);
    px(x, gx - 4, gy - 4, 9, 42, BS.wood);
    px(x, gx - 3, gy - 3, 3, 38, BS.woodL);
    bossMaceHead(x, gx, gy - 20);
  } else if (P.club === 'down') {
    const gx = ax + 9, gy = ay + 28;
    for (let i = 0; i < 28; i++) {                 // рукоять вниз-вперёд
      px(x, gx - 5 + i * .42, gy + i, 11, 2, BS.woodD);
      px(x, gx - 4 + i * .42, gy + i, 9, 2, BS.wood);
      px(x, gx - 3 + i * .42, gy + i, 3, 1, BS.woodL);
    }
    bossMaceHead(x, gx + 10, gy + 30);
  } else {
    const gx = ax + 9, gy = ay + 32;
    px(x, gx - 5, gy - 28, 11, 42, BS.woodD);
    px(x, gx - 4, gy - 28, 9, 42, BS.wood);
    px(x, gx - 3, gy - 27, 3, 38, BS.woodL);
    bossMaceHead(x, gx, gy - 42);
  }

  /* кулак поверх рукояти */
  px(x, ax - 1, ay + 30, 21, 19, BS.skDD);
  px(x, ax, ay + 31, 19, 17, BS.skD);
  px(x, ax + 1, ay + 32, 9, 13, BS.sk);
  for (let i = 0; i < 3; i++) px(x, ax + 3 + i * 5, ay + 33, 2, 11, BS.skDD);

  /* голова в рогатом шлеме */
  const HY = FY - 122 + B + P.head;
  const horn = (hx0, dir) => {
    const pts = [[0, 6], [3, 2], [7, 0], [11, 1], [14, 5], [15, 10]];
    for (let i = 0; i < pts.length; i++) {
      const w = 9 - i;
      const X = dir > 0 ? hx0 + pts[i][0] : hx0 - pts[i][0] - w;
      px(x, X, HY + pts[i][1], w, w, '#cfc8b6');
      px(x, X + 1, HY + pts[i][1] + 1, Math.max(1, w - 2), Math.max(1, w - 2), '#f5f1e4');
    }
  };
  horn(CX - 17, -1);
  horn(CX + 17, 1);

  px(x, CX - 19, HY + 8, 38, 30, BS.skDD);
  px(x, CX - 18, HY + 7, 36, 30, BS.skD);
  px(x, CX - 17, HY + 7, 34, 24, BS.sk);
  px(x, CX - 20, HY + 4, 40, 13, BS.irDD);
  px(x, CX - 19, HY + 3, 38, 12, BS.irD);
  px(x, CX - 18, HY + 3, 36, 6, BS.ir);
  px(x, CX - 16, HY + 3, 32, 3, BS.irL);
  px(x, CX - 20, HY + 15, 40, 3, BS.irDD);
  px(x, CX - 3, HY + 6, 6, 15, BS.irD);
  px(x, CX - 2, HY + 6, 4, 14, BS.ir);
  px(x, CX - 15, HY + 18, 11, 7, '#1a0d08');
  px(x, CX + 4, HY + 18, 11, 7, '#1a0d08');
  px(x, CX - 13, HY + 19, 7, 5, BS.eye);
  px(x, CX + 6, HY + 19, 7, 5, BS.eye);
  px(x, CX - 12, HY + 20, 3, 3, '#ffd0a0');
  px(x, CX + 7, HY + 20, 3, 3, '#ffd0a0');
  px(x, CX - 5, HY + 24, 10, 6, BS.skD);
  px(x, CX - 3, HY + 26, 2, 3, BS.skDD);
  px(x, CX + 2, HY + 26, 2, 3, BS.skDD);
  px(x, CX - 14, HY + 31, 28, 7, '#3c1410');
  px(x, CX - 12, HY + 31, 24, 2, '#63241c');
  px(x, CX - 13, HY + 24, 6, 13, '#f4f7e9');
  px(x, CX + 7, HY + 24, 6, 13, '#f4f7e9');
  px(x, CX - 13, HY + 33, 5, 4, '#d5d9c2');
  px(x, CX + 8, HY + 33, 5, 4, '#d5d9c2');
  px(x, CX - 6, HY + 35, 3, 3, '#e8ecd8');
  px(x, CX + 3, HY + 35, 3, 3, '#e8ecd8');
}

function buildBoss() {
  const mk = p => { const cv = mkc(128, 124); drawBoss(cv.x, p); outline(cv, PAL.outline); return cv; };
  const idle = [mk({}), mk({ body: 1, arm: 1 }), mk({ body: 2, arm: 1, head: 1 }), mk({ body: 1, arm: 0 })];
  const walk = [
    mk({ legA: [-6, 0], legB: [6, 0], body: 0, arm: -1 }),
    mk({ legA: [-2, 3], legB: [2, 3], body: 3, arm: 0 }),
    mk({ legA: [6, 0], legB: [-6, 0], body: 0, arm: 1 }),
    mk({ legA: [2, 3], legB: [-2, 3], body: 3, arm: 0 })
  ];
  const raise = [mk({ club: 'up', arm: -6, body: -2, head: -1 }), mk({ club: 'up', arm: -8, body: -3, head: -2 })];
  const slam = [mk({ club: 'down', arm: 4, body: 4, head: 2, legA: [-4, 0], legB: [4, 0] })];
  const charge = [
    mk({ club: 'side', legA: [-9, 0], legB: [7, 1], body: 2, arm: 2, head: 2 }),
    mk({ club: 'side', legA: [7, 1], legB: [-9, 0], body: 3, arm: 1, head: 2 })
  ];
  const R = { idle, walk, raise, slam, charge };
  const L = {
    idle: idle.map(flip), walk: walk.map(flip), raise: raise.map(flip),
    slam: slam.map(flip), charge: charge.map(flip)
  };
  return { R, L };
}

/* =========================================================
   ОРОЧИЙ ТОТЕМ — шест с черепом и перьями
========================================================= */
function buildTotem() {
  const cv = mkc(22, 56), x = cv.x;
  px(x, 9, 10, 5, 46, '#5c4023');            // шест
  px(x, 9, 10, 2, 46, '#7b5732');
  px(x, 6, 52, 11, 4, '#3f2c18');
  // перевязь
  px(x, 7, 22, 9, 3, '#8a1f18');
  px(x, 7, 30, 9, 2, '#c9a13f');
  // череп
  px(x, 5, 1, 13, 12, '#cfc9b4');
  px(x, 6, 0, 11, 12, '#eae4d0');
  px(x, 7, 4, 3, 4, '#2a2622');              // глазницы
  px(x, 13, 4, 3, 4, '#2a2622');
  px(x, 10, 7, 3, 3, '#b8b19c');
  px(x, 7, 10, 9, 3, '#cfc9b4');
  for (let i = 0; i < 4; i++) px(x, 7 + i * 2, 10, 1, 3, '#8f897a');
  // клыки
  px(x, 4, 6, 3, 6, '#eae4d0');
  px(x, 16, 6, 3, 6, '#eae4d0');
  // перья
  px(x, 1, 14, 4, 9, '#8a1f18');
  px(x, 2, 15, 2, 7, '#c93b2e');
  px(x, 17, 16, 4, 9, '#2b6f9c');
  px(x, 18, 17, 2, 7, '#4fa8e8');
  outline(cv, '#141a1e');
  return cv;
}

/* =========================================================
   ИКОНКИ ЛАВКИ И ПИСТОЛЬ
========================================================= */
function buildIconSword() {
  const cv = mkc(16, 18), x = cv.x;
  px(x, 6, 1, 4, 11, '#b3bcc7');
  px(x, 6, 1, 2, 11, '#eef4fa');
  px(x, 7, 0, 2, 2, '#ffffff');
  px(x, 6, 11, 4, 2, '#8b95a1');
  px(x, 3, 12, 10, 2, '#525b67');
  px(x, 3, 12, 10, 1, '#7d8794');
  px(x, 7, 14, 2, 3, '#4a3a2c');
  px(x, 6, 16, 4, 2, '#c9a13f');
  outline(cv, '#141a1e');
  return cv;
}

function buildIconPistol() {
  const cv = mkc(18, 14), x = cv.x;
  px(x, 1, 3, 14, 4, '#5a636e');          // ствол
  px(x, 1, 3, 14, 2, '#8b95a1');
  px(x, 0, 2, 4, 6, '#3a424c');
  px(x, 9, 7, 5, 6, '#6b4526');           // рукоять
  px(x, 10, 7, 3, 6, '#8e6237');
  px(x, 13, 1, 3, 4, '#8b95a1');          // курок
  px(x, 12, 5, 4, 3, '#3a424c');
  px(x, 5, 1, 4, 3, '#c9a13f');           // замок
  outline(cv, '#141a1e');
  return cv;
}

/* пуля с дымным следом */
function buildBullet() {
  const F = [];
  for (let f = 0; f < 3; f++) {
    const cv = mkc(14, 8), x = cv.x;
    px(x, 8, 2, 5, 4, '#ffd23f');
    px(x, 9, 3, 4, 2, '#fff6c4');
    px(x, 4 - f, 3, 5, 2, 'rgba(255,190,90,.75)');
    px(x, 1 - f, 3, 3, 2, 'rgba(255,160,70,.45)');
    F.push(cv);
  }
  return F;
}

/* вспышка выстрела */
function buildFlash() {
  const cv = mkc(14, 12), x = cv.x;
  px(x, 0, 4, 8, 4, '#ffd23f');
  px(x, 0, 5, 11, 2, '#fff6c4');
  px(x, 2, 2, 4, 2, '#ffb03a');
  px(x, 2, 8, 4, 2, '#ffb03a');
  px(x, 6, 3, 3, 6, '#ffe9a0');
  return cv;
}
