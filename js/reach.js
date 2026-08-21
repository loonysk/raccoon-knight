/* ============ аудит достижимости + dev-утилиты ============
   Основной путь уровня проверяется только по статичной геометрии:
   лифты в расчёт не берутся, поэтому площадки, размеченные bonus:true,
   выносятся в отдельный список «доступно только на лифте».
============================================================ */
'use strict';

/* точная копия шага физики героя */
function simStep(s, dir) {
  s.vy = Math.min(MAXFALL, s.vy + GRAV);
  const vx = dir * RUN;
  s.x += vx;
  let b = solidAt(s.x - HW, s.y - HH, HW * 2, HH);
  if (b) s.x = vx > 0 ? b.x - HW : b.x + b.w + HW;
  s.y += s.vy;
  b = solidAt(s.x - HW, s.y - HH, HW * 2, HH);
  if (b) {
    if (s.vy > 0) { s.y = b.y; s.vy = 0; s.onGround = true; return b; }
    s.y = b.y + b.h + HH; s.vy = 0;
  }
  s.onGround = false;
  return null;
}

function simJump(x0, y0, dir, rel, dj, turnAt, touch) {
  const s = { x: x0, y: y0, vy: JUMP, onGround: false };
  let air = 1, d = dir;
  for (let f = 0; f < 260; f++) {
    if (f === rel && s.vy < JUMP * 0.72) s.vy = JUMP * 0.72;
    if (f === dj && air < 2) { s.vy = JUMP2; air = 2; }
    if (f === turnAt) d = -d;
    const land = simStep(s, d);
    if (touch) touch(s.x, s.y);
    if (land) return { land, x: s.x, y: s.y, f };
    if (s.y > VH + 260) return null;
  }
  return null;
}

function simWalkOff(x0, y0, dir, touch) {
  const s = { x: x0, y: y0, vy: 0, onGround: true };
  for (let f = 0; f < 260; f++) {
    const land = simStep(s, dir);
    if (touch) touch(s.x, s.y);
    if (land && f > 2) return { land, x: s.x, y: s.y, f };
    if (s.y > VH + 260) return null;
  }
  return null;
}

function auditLevel(verbose) {
  const prev = SOLIDS;
  SOLIDS = LEVEL.solids;                       // только статика

  const S = LEVEL.solids;
  const idx = new Map(); S.forEach((b, i) => idx.set(b, i));

  const spots = S.map(() => []);
  S.forEach((b, i) => {
    for (let x = b.x + HW; x <= b.x + b.w - HW; x += 6) {
      if (!solidAt(x - HW, b.y - HH, HW * 2, HH - 1)) spots[i].push(x);
    }
    if (spots[i].length === 0 && b.w > HW * 2) spots[i].push(b.x + b.w / 2);
  });

  const RELS = [-1, 5, 10];
  const DJS = [-1, 12, 20, 30];
  const TURNS = [-1, 26];

  const coinHit = coins.map(() => false);
  const gemHit = gems.map(() => false);
  const puHit = pickups.map(() => false);
  const touch = (x, y) => {
    const cy = y - 22;
    for (let i = 0; i < coins.length; i++)
      if (!coinHit[i] && Math.abs(coins[i].x - x) < 16 && Math.abs(coins[i].y - cy) < 26) coinHit[i] = true;
    for (let i = 0; i < gems.length; i++)
      if (!gemHit[i] && Math.abs(gems[i].x - x) < 18 && Math.abs(gems[i].y - cy) < 28) gemHit[i] = true;
    for (let i = 0; i < pickups.length; i++)
      if (!puHit[i] && Math.abs(pickups[i].x - x) < 20 && Math.abs(pickups[i].y - cy) < 30) puHit[i] = true;
  };

  const edges = S.map(() => new Set());
  S.forEach((b, i) => {
    for (const x of spots[i]) {
      for (const dir of [-1, 1]) {
        const w = simWalkOff(x, b.y, dir, touch);
        if (w) edges[i].add(idx.get(w.land));
      }
      for (const dir of [-1, 0, 1]) {
        for (const rel of RELS) for (const dj of DJS) for (const t of TURNS) {
          if (dir === 0 && t !== -1) continue;
          const r = simJump(x, b.y, dir, rel, dj, t, touch);
          if (r) edges[i].add(idx.get(r.land));
        }
      }
    }
  });

  const start = S.findIndex(b => b.id === 'leftLedge');
  const bfs = (from, g) => {
    const seen = new Set([from]), q = [from];
    while (q.length) {
      const n = q.shift();
      for (const m of g[n]) if (m !== undefined && !seen.has(m)) { seen.add(m); q.push(m); }
    }
    return seen;
  };
  const seen = bfs(start, edges);

  /* ловушка = площадка, с которой уже не добраться до финиша (портала) */
  const back = S.map(() => new Set());
  edges.forEach((set, i) => set.forEach(m => { if (m !== undefined) back[m].add(i); }));
  const goal = S.findIndex(b => LEVEL.portal.x > b.x && LEVEL.portal.x < b.x + b.w &&
    Math.abs(LEVEL.portal.y - b.y) < 4);
  const canFinish = goal >= 0 ? bfs(goal, back) : new Set(S.map((_, i) => i));
  const traps = [];
  S.forEach((b, i) => {
    if (seen.has(i) && !canFinish.has(i)) traps.push({ i, id: b.id || ('#' + i), x: b.x, y: b.y });
  });

  /* чекпоинт должен стоять на свободном месте, а не внутри блока */
  const badFlags = [];
  LEVEL.checkpoints.forEach((c, i) => {
    const inside = solidAt(c.x - HW, c.y - HH, HW * 2, HH - 1);
    const floor = solidAt(c.x - HW, c.y + 1, HW * 2, 4);
    if (inside) badFlags.push({ i, x: c.x, y: c.y, why: 'внутри блока' });
    else if (!floor) badFlags.push({ i, x: c.x, y: c.y, why: 'нет опоры под ногами' });
  });

  /* лифты не должны налезать на статику ни в одной фазе пути */
  const clash = [];
  LEVEL.movers.forEach((m, mi) => {
    for (let k = 0; k <= 20; k++) {
      const t = k / 20;
      const mx = m.x + (m.x2 - m.x) * t, my = m.y + (m.y2 - m.y) * t;
      for (const b of S) {
        if (mx + m.w > b.x && mx < b.x + b.w && my + m.h > b.y && my < b.y + b.h) {
          clash.push({ mover: mi, at: +t.toFixed(2), with: b.id || ('x' + b.x + ',y' + b.y) });
          k = 99; break;
        }
      }
    }
  });

  const bad = [], bonusOnly = [];
  S.forEach((b, i) => {
    if (seen.has(i)) return;
    (b.bonus ? bonusOnly : bad).push({ i, id: b.id || ('#' + i), x: b.x, y: b.y });
  });

  /* бонусные предметы: те, что лежат над bonus-площадками, не считаем провалом */
  const onBonus = (x, y) => S.some(b => b.bonus && x > b.x - 24 && x < b.x + b.w + 24 && y > b.y - 60 && y <= b.y + 4);
  const badCoin = [], badGem = [], badPu = [], bonusItems = [];
  coins.forEach((c, i) => { if (!coinHit[i]) (onBonus(c.x, c.y) ? bonusItems : badCoin).push({ i, x: c.x, y: c.y }); });
  gems.forEach((g, i) => { if (!gemHit[i]) (onBonus(g.x, g.y) ? bonusItems : badGem).push({ i, x: g.x, y: g.y }); });
  pickups.forEach((p, i) => { if (!puHit[i]) (onBonus(p.x, p.y) ? bonusItems : badPu).push({ i, t: p.t, x: p.x, y: p.y }); });

  SOLIDS = prev;

  const res = {
    platforms: S.length,
    reachable: seen.size,
    unreachable: bad,
    bonusOnly: bonusOnly,
    coins: coins.length, unreachableCoins: badCoin,
    gems: gems.length, unreachableGems: badGem,
    powerups: pickups.length, unreachablePowerups: badPu,
    bonusItems: bonusItems.length,
    traps: traps,
    moverClashes: clash,
    badFlags: badFlags,
    jumpUp: 80, doubleJumpUp: 140, jumpRange: 82
  };
  if (verbose) console.log(JSON.stringify(res, null, 1));
  return res;
}
window.__audit = auditLevel;

/* короткая сводка одной строкой */
window.__auditText = function () {
  const a = auditLevel();
  const ok = a.unreachable.length === 0 && a.unreachableCoins.length === 0 &&
    a.unreachableGems.length === 0 && a.unreachablePowerups.length === 0 &&
    a.traps.length === 0 && a.moverClashes.length === 0 && a.badFlags.length === 0;
  return (ok ? 'OK  ' : 'ПРОБЛЕМЫ  ') +
    'платформы ' + a.reachable + '/' + (a.platforms - a.bonusOnly.length) +
    ' (+' + a.bonusOnly.length + ' на лифте), монеты ' + (a.coins - a.unreachableCoins.length) + '/' + a.coins +
    ', кристаллы ' + (a.gems - a.unreachableGems.length) + '/' + a.gems +
    ', усиления ' + (a.powerups - a.unreachablePowerups.length) + '/' + a.powerups +
    (a.unreachable.length ? '  НЕДОСТУПНЫ: ' + JSON.stringify(a.unreachable) : '') +
    (a.unreachableCoins.length ? '  монеты: ' + JSON.stringify(a.unreachableCoins) : '') +
    (a.unreachableGems.length ? '  кристаллы: ' + JSON.stringify(a.unreachableGems) : '') +
    (a.unreachablePowerups.length ? '  усиления: ' + JSON.stringify(a.unreachablePowerups) : '') +
    ', чекпоинты ' + (LEVEL.checkpoints.length - a.badFlags.length) + '/' + LEVEL.checkpoints.length +
    (a.traps.length ? '  ТУПИКИ (не дойти до финиша): ' + JSON.stringify(a.traps) : '') +
    (a.badFlags.length ? '  ЧЕКПОИНТЫ: ' + JSON.stringify(a.badFlags) : '') +
    (a.moverClashes.length ? '  ЛИФТ ПЕРЕСЕКАЕТ СТАТИКУ: ' + JSON.stringify(a.moverClashes) : '');
};

/* ============ dev-снимки ============ */
const __post = (n, o) => fetch('/shot?n=' + n, { method: 'POST', body: (o.c || o).toDataURL('image/png') }).then(r => r.text());

window.__shot = function (n, k) {
  k = k || 3;
  const o = mkc(cvs.width * k, cvs.height * k);
  o.x.drawImage(cvs, 0, 0, o.w, o.h);
  return __post(n || 'shot', o);
};

window.__zoom = function (n, sp, k) {
  k = k || 8;
  const o = mkc(sp.w * k, sp.h * k);
  o.x.fillStyle = '#c94fd0'; o.x.fillRect(0, 0, o.w, o.h);
  o.x.drawImage(sp.c, 0, 0, o.w, o.h);
  return __post(n, o);
};

/* поставить камеру и героя в произвольную точку уровня и отрисовать */
window.__at = function (x, y) {
  G.mode = MODE.PLAY;
  hero.x = x; hero.y = y === undefined ? 168 : y; hero.vy = 0;
  G.cam = Math.max(0, Math.min(LEVEL.width - VW, x - VW * .38));
  SOLIDS = activeSolids();
  draw();
  return 'cam=' + Math.round(G.cam);
};

/* эталонная поза стартового кадра */
window.__pose = function () {
  G.mode = MODE.PLAY;
  resetRun(true);
  G.cam = 0;
  hero.dir = 1; hero.st = 'idle'; hero.anim = 0;
  foes.forEach((f, i) => { const e = LEVEL.enemies[i]; if (e) { f.x = e.x; f.dir = -1; f.anim = 0; } });
  G.t = 0;
  SOLIDS = activeSolids();
  draw();
  return 'posed';
};

window.__hudShot = async function (scale, bg) {
  scale = scale || 1.5; bg = bg || '#42708c';
  const hud = document.getElementById('hud');
  const w = hud.offsetWidth, h = hud.offsetHeight;
  const clone = hud.cloneNode(true);
  const srcC = hud.querySelectorAll('canvas'), dstC = clone.querySelectorAll('canvas');
  for (let i = 0; i < srcC.length; i++) {
    const img = document.createElement('img');
    img.setAttribute('src', srcC[i].toDataURL());
    img.setAttribute('class', dstC[i].className);
    img.setAttribute('style', 'width:' + srcC[i].offsetWidth + 'px;height:' + srcC[i].offsetHeight +
      'px;display:block;image-rendering:pixelated');
    dstC[i].parentNode.replaceChild(img, dstC[i]);
  }
  clone.setAttribute('style', 'position:relative;left:0;top:0;transform:none;width:' + w + 'px;height:' + h +
    'px;--u:' + (h / 100) + 'px');
  const xml = new XMLSerializer().serializeToString(clone);
  let css = await fetch('css/style.css').then(r => r.text());
  css = css.replace(/animation:[^;}]*;?/g, '');   // в статичном SVG анимации застывают на 0-м кадре
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(w * scale) + '" height="' +
    Math.round(h * scale) + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">' +
    '<style>' + css.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</style>' +
    '<div style="position:relative;width:' + w + 'px;height:' + h + 'px;background:' + bg + '">' + xml + '</div>' +
    '</div></foreignObject></svg>';
  const img = new Image();
  const ok = await new Promise(res => { img.onload = () => res(1); img.onerror = () => res(0); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  if (!ok) return 'svg failed';
  const o = mkc(Math.round(w * scale), Math.round(h * scale));
  o.x.drawImage(img, 0, 0, o.w, o.h);
  return __post('hud', o);
};

/* снимок любого DOM-экрана (старт/финал/пауза) */
window.__scrShot = async function (id, scale) {
  scale = scale || 1.3;
  const el = document.getElementById(id);
  const st = document.getElementById('stage');
  const w = st.offsetWidth, h = st.offsetHeight;
  const clone = el.cloneNode(true);
  const srcCv = el.querySelectorAll('canvas');
  clone.querySelectorAll('canvas').forEach((c, ci) => {
    const src = c.id ? el.querySelector('#' + CSS.escape(c.id)) : srcCv[ci];
    const img = document.createElement('img');
    img.setAttribute('src', src ? src.toDataURL() : '');
    img.setAttribute('class', c.className);
    img.setAttribute('style', 'width:' + (src ? src.offsetWidth : 60) + 'px;height:' +
      (src ? src.offsetHeight : 60) + 'px;display:block;margin:0 auto;image-rendering:pixelated');
    c.parentNode.replaceChild(img, c);
  });
  clone.setAttribute('style', 'position:relative;display:grid;width:' + w + 'px;height:' + h +
    'px;--u:' + (h / 100) + 'px');
  const xml = new XMLSerializer().serializeToString(clone);
  let css = await fetch('css/style.css').then(r => r.text());
  css = css.replace(/animation:[^;}]*;?/g, '');   // в статичном SVG анимации застывают на 0-м кадре
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(w * scale) + '" height="' +
    Math.round(h * scale) + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">' +
    '<style>' + css.replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</style>' + xml +
    '</div></foreignObject></svg>';
  const img = new Image();
  const ok = await new Promise(res => { img.onload = () => res(1); img.onerror = () => res(0); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  if (!ok) return 'svg failed';
  const o = mkc(Math.round(w * scale), Math.round(h * scale));
  o.x.fillStyle = '#12212c'; o.x.fillRect(0, 0, o.w, o.h);
  o.x.drawImage(img, 0, 0, o.w, o.h);
  return __post(id, o);
};

window.__full = async function (scale) {
  scale = scale || 1.5;
  const hud = document.getElementById('hud');
  const w = hud.offsetWidth, h = hud.offsetHeight;
  await window.__hudShot(scale, 'transparent');
  const o = mkc(Math.round(w * scale), Math.round(h * scale));
  o.x.imageSmoothingEnabled = false;
  o.x.drawImage(cvs, 0, 0, o.w, o.h);
  const hi = new Image();
  await new Promise(res => { hi.onload = res; hi.src = '/shots/hud.png?' + Math.round(performance.now()); });
  o.x.drawImage(hi, 0, 0, o.w, o.h);
  return __post('full', o);
};
