/* ============ движок игры ============ */
'use strict';

const cvs = document.getElementById('game');
const ctx = cvs.getContext('2d');
cvs.width = VW; cvs.height = VH;
ctx.imageSmoothingEnabled = false;

/* ---------------- ресурсы ---------------- */
const SPR = {};
function buildAssets() {
  SPR.hero = buildHero();
  SPR.gob = buildGoblin();
  SPR.rock = buildRock();
  SPR.bullet = buildBullet();
  SPR.flash = buildFlash();
  SPR.icoSword = buildIconSword();
  SPR.icoPistol = buildIconPistol();
  SPR.orc = buildOrc();
  SPR.boss = buildBoss();
  SPR.coin = buildCoin();
  SPR.gem = buildGem();
  SPR.crate = buildCrate();
  SPR.pot = buildPot();
  SPR.mush = buildMushroom();
  SPR.bush = {}; SPR.fern = {};
  SPR.spike = {};
  SPR.flagOn = buildFlag(true);
  SPR.flagOff = buildFlag(false);
  SPR.shock = buildShock();
  SPR.portal = buildPortal();
  SPR.gate = buildGate(LEVEL.boss.gate.w, LEVEL.boss.gate.h);
  SPR.pu = { heart: buildPickup('heart'), shield: buildPickup('shield'), boots: buildPickup('boots'), rage: buildPickup('rage') };

  SPR.clouds = makeClouds(720, 96, 101);
  SPR.mtnFar = makeMountains(720, 120, 202, PAL.mtnFar, PAL.mtnFar2, 120);
  SPR.mtnNear = makeMountains(720, 138, 303, PAL.mtnNear, PAL.mtnNear2, 138);
  SPR.forFar = makeForest(720, 160, 404, PAL.pine1, PAL.pine1b, 80, 120, 24);
  SPR.forMid = makeForest(720, 180, 505, PAL.pine2, PAL.pine2b, 100, 150, 20);
  SPR.forNear = makeForest(720, 205, 606, PAL.pine3, PAL.pine3b, 128, 185, 16);
  SPR.forDark = makeForest(720, 226, 707, PAL.pine4, PAL.pine4b, 150, 210, 13);
  const wf = LEVEL.waterfall;
  SPR.water = makeWaterfall(wf.w, wf.h, 808);
  SPR.cliff = makeCliff(wf.cw, wf.ch, wf.x - wf.cx, wf.w, 909);
}

/* ---------------- предрендер мира ---------------- */
let MID, MAIN;
function buildWorld() {
  MID = mkc(LEVEL.width, VH);
  for (const r of LEVEL.ruins) MID.x.drawImage(makeRuin(r.w, r.h, r.seed).c, r.x, r.y);

  MAIN = mkc(LEVEL.width, VH + 90);
  const x = MAIN.x;
  let s = 1;
  for (const b of LEVEL.solids) {
    drawStone(x, b.x, b.y, b.w, b.h, 100 + s * 37);
    if (b.grass) drawGrassCap(x, b.x, b.y, b.w, 200 + s * 53);
    if (b.floating) {
      px(x, b.x, b.y + b.h - 3, b.w, 3, '#232a26');
      const r = rng(300 + s);
      for (let i = 4; i < b.w - 4; i += 11) if (r() < .55) drawVine(x, b.x + i, b.y + b.h - 2, 5 + r() * 13, 400 + s * 7 + i);
    }
    if (b.alcove) {
      const aw = 30, ax = Math.round(b.x + b.w / 2 - aw / 2), ay = b.y + 26, ah = b.h - 26;
      px(x, ax - 4, ay - 4, aw + 8, ah + 4, PAL.stoneD);
      px(x, ax - 4, ay - 4, aw + 8, 2, PAL.stoneL);
      px(x, ax - 2, ay - 2, aw + 4, ah + 2, PAL.stoneDD);
      const g = x.createLinearGradient(0, ay, 0, ay + ah);
      g.addColorStop(0, '#0a0f0d'); g.addColorStop(.4, '#131b18'); g.addColorStop(1, '#070b09');
      x.fillStyle = g; x.fillRect(ax, ay, aw, ah);
      px(x, ax, ay, 3, 3, PAL.stoneDD); px(x, ax + aw - 3, ay, 3, 3, PAL.stoneDD);
    }
    s++;
  }
  for (const v of LEVEL.vines) drawVine(x, v.x, v.y, v.len, v.seed);

  for (const d of LEVEL.decor) {
    if (d.t === 'mushroom') x.drawImage(SPR.mush.c, d.x, d.y - 11);
    else if (d.t === 'crate') x.drawImage(SPR.crate.c, d.x, d.y - 24);
    else if (d.t === 'pot') x.drawImage(SPR.pot.c, d.x, d.y - 20);
    else if (d.t === 'bush') {
      if (!SPR.bush[d.s]) SPR.bush[d.s] = buildBush(d.s);
      x.drawImage(SPR.bush[d.s].c, d.x, d.y - 22);
    } else if (d.t === 'fern') {
      if (!SPR.fern[d.s]) SPR.fern[d.s] = buildFern(d.s);
      x.drawImage(SPR.fern[d.s].c, d.x, d.y - 30);
    } else if (d.t === 'totem') {
      if (!SPR.totem) SPR.totem = buildTotem();
      x.drawImage(SPR.totem.c, d.x, d.y - 54);
    }
  }
  // шипы вплавляем в фон
  for (const sp of LEVEL.spikes) {
    if (!SPR.spike[sp.w]) SPR.spike[sp.w] = buildSpikes(sp.w);
    x.drawImage(SPR.spike[sp.w].c, sp.x, sp.y - 10);
  }
}

/* ---------------- постоянный прогресс между забегами ---------------- */
const UPG = {
  hp:  { max: 5, cost: [60, 120, 200, 320, 500], icon: () => buildPuIcon('heart'),
         name: 'upgHp', sub: 'upgHpSub' },
  atk: { max: 4, cost: [90, 180, 320, 520], icon: () => SPR.icoSword,
         name: 'upgAtk', sub: 'upgAtkSub' },
  gun: { max: 4, cost: [250, 200, 340, 520], icon: () => SPR.icoPistol,
         name: 'upgGun', sub: 'upgGunSub', nameUp: 'upgGunUp', subUp: 'upgGunUpSub' }
};
let META = { bank: 0, hp: 0, atk: 0, gun: 0 };
function metaLoad() {
  try {
    const j = JSON.parse(localStorage.getItem('rk_meta') || '{}');
    for (const k in META) if (typeof j[k] === 'number' && j[k] >= 0) META[k] = j[k] | 0;
  } catch (e) { /* нет сохранения — начинаем с нуля */ }
}
function metaSave() {
  try { localStorage.setItem('rk_meta', JSON.stringify(META)); } catch (e) { /* ignore */ }
}
metaLoad();

/* ---------------- состояние ---------------- */
const MODE = { START: 0, PLAY: 1, PAUSE: 2, END: 3 };
const G = {
  mode: MODE.START, t: 0, cam: 0, shake: 0,
  coins: 0, gems: 0, hp: 10, hpMax: 10, stam: 100,   // здоровье в половинках сердца
  level: 1, xp: 0, xpNeed: 14,
  swordDmg: 1, gunDmg: 0, gunCd: 0, flash: 0,
  kills: 0, deaths: 0, frames: 0, bossKilled: false, won: false
};

const hero = {
  x: LEVEL.startX, y: LEVEL.startY, vx: 0, vy: 0, dir: 1, onGround: true,
  st: 'idle', anim: 0, atk: 0, atkLen: 26, atkHit: false, inv: 0,
  air: 0, coyote: 0, buf: 0, puff: 0, mover: null,
  buffs: { shield: 0, boots: 0, rage: 0 }
};

let coins, gems, foes, pickups, flags, crates, shocks, sparks, rocks, bolts, boss, gateOn, portalOn, respawn;
let snapshot = null;                    // состояние мира на момент последнего чекпоинта

/* снять слепок: герой + всё, что уже пройдено */
function makeSnapshot(x, y) {
  snapshot = {
    x: x, y: y,
    hp: G.hp, coins: G.coins, gems: G.gems, kills: G.kills, bank: META.bank,
    buffs: { shield: hero.buffs.shield, boots: hero.buffs.boots, rage: hero.buffs.rage },
    coinsGot: coins.map(c => c.got),
    gemsGot: gems.map(g => g.got),
    puGot: pickups.map(p => p.got),
    cratesDead: crates.map(c => c.dead),
    foeCount: foes.length,
    foes: foes.map(f => ({ x: f.x, dir: f.dir, hp: f.hp, dead: f.dead })),
    flagsOn: flags.map(f => f.on),
    bossHp: boss.hp, bossSt: boss.st, bossX: boss.x,
    gate: gateOn, portal: portalOn
  };
}

/* откатить мир к слепку: всё после чекпоинта проходится заново */
function restoreSnapshot() {
  const s = snapshot;
  if (!s) return;
  G.hp = s.hp; G.coins = s.coins; G.gems = s.gems; G.kills = s.kills;
  META.bank = s.bank;
  hero.buffs.shield = s.buffs.shield;
  hero.buffs.boots = s.buffs.boots;
  hero.buffs.rage = s.buffs.rage;
  coins.forEach((c, i) => { c.got = s.coinsGot[i]; });
  gems.forEach((g, i) => { g.got = s.gemsGot[i]; });
  pickups.forEach((p, i) => { p.got = s.puGot[i]; });
  crates.forEach((c, i) => { c.dead = s.cratesDead[i]; });
  flags.forEach((f, i) => { f.on = s.flagsOn[i]; });
  foes.length = s.foeCount;                       // призванные боссом исчезают
  foes.forEach((f, i) => {
    const o = s.foes[i], e = LEVEL.enemies[i];
    f.x = o.x; f.dir = o.dir; f.dead = o.dead; f.hurt = 0; f.anim = 0;
    f.st = 'walk'; f.tm = 0; f.cd = 60; f.swung = false;
    f.hp = o.dead ? 0 : (f.hpMax || o.hp);
    void e;
  });
  boss.hp = s.bossHp; boss.st = s.bossSt; boss.x = s.bossX;
  boss.tm = 0; boss.act = 0; boss.hurt = 0; boss.dead = 0; boss.vx = 0;
  gateOn = s.gate; portalOn = s.portal;
  G.bossKilled = s.bossSt === 'die';
  shocks.length = 0; sparks.length = 0; rocks.length = 0; bolts.length = 0;
  document.getElementById('bossBar').classList.toggle('on', s.bossSt !== 'sleep' && !G.bossKilled);
  hero.x = s.x; hero.y = s.y;
  hero.vx = hero.vy = 0; hero.inv = 60; hero.air = 0; hero.mover = null;
  hero.atk = 0; hero.st = 'idle'; hero.anim = 0;
  bossBarUpdate(); setHud(); renderBuffs();
}

function resetRun(full) {
  coins = LEVEL.coins.map(c => ({ x: c.x, y: c.y, got: false, ph: (c.x * 7) % 6 }));
  gems = LEVEL.gems.map(c => ({ x: c.x, y: c.y, got: false, ph: (c.x * 5) % 4 }));
  foes = LEVEL.enemies.map(e => ({
    t: e.t, x: e.x, y: e.y, a: e.a, b: e.b, dir: -1, anim: 0,
    hp: e.t === 'orc' ? 5 : 2, hpMax: e.t === 'orc' ? 5 : 2, hurt: 0, dead: 0, vy: 0,
    st: 'walk', tm: 0, cd: 40 + ((e.x * 7) % 60), swung: false,
    w: e.t === 'orc' ? 30 : 16, h: e.t === 'orc' ? 70 : 32,
    spd: e.t === 'orc' ? .32 : .55
  }));
  pickups = LEVEL.powerups.map(p => ({ t: p.t, x: p.x, y: p.y, got: false, ph: 0 }));
  flags = LEVEL.checkpoints.map((c, i) => ({ x: c.x, y: c.y, on: i === 0, ph: 0 }));
  crates = LEVEL.breakables.map(b => ({ x: b.x, y: b.y, hp: 1, dead: 0 }));
  shocks = []; sparks = []; rocks = []; bolts = [];
  LEVEL.movers.forEach(m => { m.tt = m.t; });
  boss = {
    x: LEVEL.boss.x, y: LEVEL.boss.y, vx: 0, dir: -1, hp: LEVEL.boss.hp, hpMax: LEVEL.boss.hp,
    st: 'sleep', tm: 0, anim: 0, hurt: 0, act: 0, dead: 0, w: 40, h: 112, spawned: false
  };
  gateOn = false; portalOn = false;
  respawn = { x: LEVEL.startX, y: LEVEL.startY };
  snapshot = null;

  hero.x = LEVEL.startX; hero.y = LEVEL.startY;
  hero.vx = hero.vy = 0; hero.dir = 1; hero.onGround = true;
  hero.st = 'idle'; hero.anim = 0; hero.atk = 0; hero.inv = 0;
  hero.air = 0; hero.coyote = 0; hero.buf = 0; hero.puff = 0; hero.mover = null;
  hero.buffs.shield = hero.buffs.boots = hero.buffs.rage = 0;

  if (full) {
    G.hpMax = (5 + META.hp) * 2;
    G.swordDmg = 1 + META.atk;
    G.level = 1; G.xp = 0; G.xpNeed = 14;
    G.tal = { hp: 0, dmg: 0, swift: 0, jump: 0, atkspd: 0, greed: 0, vamp: 0, xp: 0, gun: 0, ward: 0 };
    G.gunDmg = META.gun > 0 ? 1 + META.gun : 0;
    buildHearts();
    document.getElementById('btnGun').classList.toggle('on-owned', META.gun > 0);
    G.coins = 0; G.gems = 0; G.hp = G.hpMax; G.stam = 100;
    G.kills = 0; G.deaths = 0; G.frames = 0; G.bossKilled = false; G.won = false;
    G.cam = 0; G.shake = 0; G.t = 0;
  }
  setHud(); renderBuffs(); bossBarUpdate();
  makeSnapshot(LEVEL.startX, LEVEL.startY);
}

/* ---------------- физика ---------------- */
const GRAV = .42, MAXFALL = 9.5, RUN = 2.05, JUMP = -8.4, JUMP2 = -7.2;
const HW = 9, HH = 44;
const COYOTE = 6, BUFFER = 7;

/* активный список твёрдых тел: статика + лифты + ворота арены */
function activeSolids() {
  const list = LEVEL.solids.slice();
  for (const m of LEVEL.movers) list.push(m.box);
  if (gateOn) list.push(LEVEL.boss.gate);
  return list;
}
let SOLIDS = LEVEL.solids;

function solidAt(x, y, w, h) {
  for (let i = 0; i < SOLIDS.length; i++) {
    const b = SOLIDS[i];
    if (x + w > b.x && x < b.x + b.w && y + h > b.y && y < b.y + b.h) return b;
  }
  return null;
}

function moveBody(o, w, h) {
  o.x += o.vx;
  let s = solidAt(o.x - w, o.y - h, w * 2, h);
  if (s) { o.x = o.vx > 0 ? s.x - w : s.x + s.w + w; o.vx = 0; }
  o.y += o.vy;
  o.onGround = false;
  s = solidAt(o.x - w, o.y - h, w * 2, h);
  if (s) {
    if (o.vy > 0) { o.y = s.y; o.onGround = true; o.ground = s; }
    else o.y = s.y + s.h + h;
    o.vy = 0;
  }
}

/* ---------------- ввод ----------------
   Нажатия копятся отдельным «фронтом»: короткий тап между двумя кадрами
   иначе терялся бы, потому что игровой цикл не увидел бы удержания.
   Удержание нужно отдельно — от него зависит высота прыжка.
------------------------------------------ */
const K = {};
const HOLD = { left: false, right: false, jump: false, attack: false, gun: false };
const PRESS = { jump: false, attack: false, gun: false };   // фронт, гасится в update

addEventListener('keydown', e => {
  if (!e.repeat) {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') PRESS.jump = true;
    if (e.code === 'KeyJ' || e.code === 'KeyX' || e.code === 'Enter') PRESS.attack = true;
    if (e.code === 'KeyK' || e.code === 'KeyC') PRESS.gun = true;
  }
  K[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'Escape' || e.code === 'KeyP') { if (G.mode === MODE.PLAY || G.mode === MODE.PAUSE) togglePause(); }
  if (e.code === 'Enter' && G.mode === MODE.START) startGame();
});
addEventListener('keyup', e => { K[e.code] = false; });

/* какой указатель какую кнопку держит — чтобы палец, съехавший с кнопки,
   не оставлял её нажатой навсегда */
const pointerOn = new Map();

document.querySelectorAll('[data-act]').forEach(btn => {
  const act = btn.dataset.act;

  btn.addEventListener('pointerdown', e => {
    e.preventDefault();
    try { btn.setPointerCapture(e.pointerId); } catch (err) { /* не критично */ }
    pointerOn.set(e.pointerId, act);
    HOLD[act] = true;
    if (act in PRESS) PRESS[act] = true;
    btn.classList.add('on');
  });

  const release = e => {
    if (pointerOn.get(e.pointerId) !== act) return;
    pointerOn.delete(e.pointerId);
    HOLD[act] = false;
    btn.classList.remove('on');
  };
  btn.addEventListener('pointerup', release);
  btn.addEventListener('pointercancel', release);
  btn.addEventListener('lostpointercapture', release);
});

/* страховка: если указатель пропал мимо кнопки, всё равно отпускаем */
const globalRelease = e => {
  const act = pointerOn.get(e.pointerId);
  if (!act) return;
  pointerOn.delete(e.pointerId);
  HOLD[act] = false;
  const b = document.querySelector('[data-act="' + act + '"]');
  if (b) b.classList.remove('on');
};
addEventListener('pointerup', globalRelease);
addEventListener('pointercancel', globalRelease);
addEventListener('blur', () => {
  pointerOn.clear();
  for (const k in HOLD) HOLD[k] = false;
  for (const k in K) K[k] = false;
  document.querySelectorAll('[data-act]').forEach(b => b.classList.remove('on'));
});

function clearTouch() {
  pointerOn.clear();
  for (const k in HOLD) HOLD[k] = false;
  for (const k in PRESS) PRESS[k] = false;
  document.querySelectorAll('[data-act]').forEach(b => b.classList.remove('on'));
}

function inLeft() { return K.ArrowLeft || K.KeyA || HOLD.left; }
function inRight() { return K.ArrowRight || K.KeyD || HOLD.right; }
function inJump() { return K.Space || K.ArrowUp || K.KeyW || HOLD.jump; }

/* совместимость со старыми тестами и dev-утилитами */
const TOUCH = HOLD;

/* ---------------- вспомогательное ---------------- */
function spark(x, y, n, col, spread) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = .6 + Math.random() * (spread || 2.2);
    sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: 16 + Math.random() * 14, col });
  }
}
let toastT = 0;
function toast(msg) { banner(null, msg, ''); }

/* всплывающая плашка: иконка + название + пояснение */
function banner(icon, title, sub) {
  const el = document.getElementById('toast');
  let ic = '';
  if (icon && PU_COL[icon]) {
    const c = buildPuIcon(icon);
    ic = '<img class="ti" src="' + c.c.toDataURL() + '">';
  } else if (icon === 'checkpoint') ic = '<span class="ti flag">⚑</span>';
  else if (icon === 'death') ic = '<span class="ti skull">✖</span>';
  el.innerHTML = ic + '<span class="tt">' + title + '</span>' +
    (sub ? '<span class="ts">' + sub + '</span>' : '');
  el.classList.remove('on');
  void el.offsetWidth;
  el.classList.add('on');
  toastT = 150;
}

/* ---------------- обновление ---------------- */
function update() {
  G.t++;
  if (G.mode !== MODE.PLAY) return;
  G.frames++;
  if (toastT > 0 && --toastT === 0) document.getElementById('toast').classList.remove('on');
  if (G.shake > 0) G.shake *= .86;

  /* лифты: платформа сама везёт героя, а не толкает его физикой */
  for (const m of LEVEL.movers) {
    m.tt += m.spd;
    const k = (1 - Math.cos(m.tt * Math.PI * 2)) / 2;      // плавно туда-обратно
    const nx = m.x + (m.x2 - m.x) * k, ny = m.y + (m.y2 - m.y) * k;
    const dx = nx - m.box.x, dy = ny - m.box.y;
    // герой едет, если стоит на платформе (с допуском на ход платформы)
    const over = hero.x + HW > m.box.x + 1 && hero.x - HW < m.box.x + m.box.w - 1;
    const onTop = hero.y >= m.box.y - 3 && hero.y <= m.box.y + Math.max(6, Math.abs(dy) + 4);
    const riding = over && onTop && hero.vy >= -0.5;
    m.box.x = nx; m.box.y = ny;
    if (riding) {
      hero.x += dx;
      hero.y = ny;                       // приклеиваем к верхней грани
      hero.vy = 0;
      hero.onGround = true; hero.air = 0; hero.coyote = COYOTE;
      hero.mover = m;
    } else if (hero.mover === m) {
      hero.mover = null;
    }
    void dy;
  }
  SOLIDS = activeSolids();

  /* ---- герой ---- */
  const rage = hero.buffs.rage > 0, boots = hero.buffs.boots > 0;
  for (const k in hero.buffs) if (hero.buffs[k] > 0) hero.buffs[k]--;
  if (G.t % 10 === 0) renderBuffs();

  if (PRESS.attack) {
    PRESS.attack = false;
    if (hero.atk <= 0) { hero.atk = hero.atkLen = Math.round(26 * (1 - G.tal.atkspd * .22)); hero.atkHit = false; }
  }
  if (hero.atk > 0) hero.atk--;

  let mv = 0;
  if (inLeft()) mv -= 1;
  if (inRight()) mv += 1;
  if (mv !== 0) hero.dir = mv;
  const slow = hero.atk > 8 ? .35 : 1;
  hero.vx = mv * RUN * slow * (boots ? 1.35 : 1) * (1 + G.tal.swift * .12);

  const jm = (boots ? 1.08 : 1) * (1 + G.tal.jump * .07);
  const jUp = JUMP * jm, j2Up = JUMP2 * jm;
  const j = inJump();
  if (PRESS.jump) { PRESS.jump = false; hero.buf = BUFFER; }
  if (hero.buf > 0) hero.buf--;
  if (hero.coyote > 0) hero.coyote--;
  if (hero.buf > 0) {
    if (hero.onGround || hero.coyote > 0) {
      hero.vy = jUp; hero.onGround = false; hero.coyote = 0; hero.buf = 0; hero.air = 1; hero.mover = null;
    } else if (hero.air < 2) {
      hero.vy = j2Up; hero.air = 2; hero.buf = 0; hero.puff = 8;
    }
  }
  if (!j && hero.vy < jUp * 0.72) hero.vy = jUp * 0.72;
  if (hero.puff > 0) hero.puff--;

  /* пистоль */
  if (G.gunCd > 0) G.gunCd--;
  if (G.flash > 0) G.flash--;
  const gfire = PRESS.gun;
  PRESS.gun = false;
  if (G.gunDmg > 0 && gfire && G.gunCd <= 0) {
    bolts.push({ x: hero.x + hero.dir * 16, y: hero.y - 24, vx: hero.dir * 5.4, life: 110, anim: 0, dir: hero.dir });
    G.gunCd = Math.round(40 * (1 - G.tal.atkspd * .18)); G.flash = 6;
    spark(hero.x + hero.dir * 20, hero.y - 24, 5, '#ffd23f', 1.6);
    G.shake = Math.max(G.shake, 2.5);
  }

  hero.vy = Math.min(MAXFALL, hero.vy + GRAV);
  const wasGround = hero.onGround;
  hero.ground = null;
  moveBody(hero, HW, HH);
  if (hero.onGround) { hero.air = 0; hero.coyote = COYOTE; }
  else {
    if (hero.mover) hero.mover = null;
    if (wasGround && hero.vy > 0) hero.coyote = COYOTE;
  }
  if (hero.y > VH + 130) { die(true); return; }
  if (hero.inv > 0) hero.inv--;

  /* состояние анимации */
  let st = 'idle';
  if (hero.atk > 0) st = 'atk';
  else if (!hero.onGround) st = hero.vy < 0 ? 'jump' : 'fall';
  else if (mv !== 0) st = 'run';
  if (st !== hero.st) { hero.st = st; if (st !== 'atk') hero.anim = 0; }
  hero.anim += (st === 'run') ? (boots ? .3 : .22) : .1;

  /* ---- удар мечом ---- */
  if (hero.atk > 0 && hero.atk < hero.atkLen * .77 && !hero.atkHit) {
    const reach = rage ? 42 : 32;
    const bx = hero.dir > 0 ? hero.x + 4 : hero.x - 4 - reach;
    const dmg = (G.swordDmg + G.tal.dmg) * (rage ? 2 : 1);
    let hit = false;
    for (const f of foes) {
      if (f.dead) continue;
      if (bx < f.x + f.w && bx + reach > f.x - f.w && hero.y - HH < f.y && hero.y > f.y - f.h) {
        f.hp -= dmg; f.hurt = 14; f.x += hero.dir * 5; hit = true;
        spark(f.x, f.y - f.h / 2, 6, '#ffd23f');
        if (f.hp <= 0) { f.dead = 1; killReward(f); spark(f.x, f.y - f.h / 2, 14, '#8fd45a', 3); }
      }
    }
    for (const c of crates) {
      if (c.dead) continue;
      if (bx < c.x + 24 && bx + reach > c.x && hero.y - HH < c.y && hero.y > c.y - 26) {
        c.dead = 1; hit = true;
        spark(c.x + 12, c.y - 12, 14, '#c69258', 2.6);
        if (Math.random() < .3) { G.gems += 1; META.bank += 5; } else earn(5);
        setHud();
      }
    }
    if (boss.st !== 'sleep' && boss.st !== 'die' && boss.hurt <= 0) {
      if (bx < boss.x + boss.w && bx + reach > boss.x - boss.w &&
        hero.y - HH < boss.y && hero.y > boss.y - boss.h) {
        boss.hp -= dmg; boss.hurt = 18; hit = true; G.shake = 6;
        spark(boss.x, boss.y - 60, 12, '#ffd23f', 3);
        bossBarUpdate();
        if (boss.hp <= 0) bossDie();
      }
    }
    if (hit) { hero.atkHit = true; G.shake = Math.max(G.shake, 4); }
  }

  /* ---- враги ---- */
  const GOB = { range: 168, minR: 34, wind: 26, cool: 130, throwSpd: 3.4 };
  const ORC = { range: 46, wind: 26, hit: 14, cool: 105, reach: 42 };
  for (const f of foes) {
    if (f.dead) { f.dead++; continue; }
    if (Math.abs(f.x - hero.x) > VW * 0.9) continue;      // спят вдалеке
    if (f.hurt > 0) f.hurt--;
    if (f.cd > 0) f.cd--;
    const dxh = hero.x - f.x, adx = Math.abs(dxh);
    const sameFloor = Math.abs(hero.y - f.y) < 48;

    if (f.st === 'walk') {
      f.x += f.dir * f.spd;
      if (f.x < f.a + f.w) { f.x = f.a + f.w; f.dir = 1; }
      if (f.x > f.b - f.w) { f.x = f.b - f.w; f.dir = -1; }
      f.anim += .09;
      // решение атаковать
      if (f.cd <= 0 && sameFloor) {
        if (f.t === 'goblin' && adx < GOB.range && adx > GOB.minR) {
          f.dir = dxh > 0 ? 1 : -1; f.st = 'wind'; f.tm = GOB.wind;
        } else if (f.t === 'orc' && adx < ORC.range) {
          f.dir = dxh > 0 ? 1 : -1; f.st = 'wind'; f.tm = ORC.wind; f.swung = false;
        }
      }
    } else if (f.st === 'wind') {
      f.anim += .16;
      if (--f.tm <= 0) {
        if (f.t === 'goblin') {
          // бросок камня по навесной траектории
          const d = Math.max(24, Math.min(GOB.range, adx));
          rocks.push({
            x: f.x + f.dir * 12, y: f.y - 30,
            vx: f.dir * GOB.throwSpd, vy: -1.5 - d * .012,
            anim: 0, life: 260
          });
          f.st = 'throw'; f.tm = 16; f.cd = GOB.cool + ((f.x | 0) % 40);
        } else {
          f.st = 'hit'; f.tm = ORC.hit; f.swung = false;
          f.cd = ORC.cool + ((f.x | 0) % 30);
        }
      }
    } else if (f.st === 'throw') {
      f.anim += .12;
      if (--f.tm <= 0) f.st = 'walk';
    } else if (f.st === 'hit') {
      f.anim += .2;
      // удар засчитывается один раз в середине замаха
      if (!f.swung && f.tm < ORC.hit - 3) {
        const bx = f.dir > 0 ? f.x + 8 : f.x - 8 - ORC.reach;
        if (hero.x + HW > bx && hero.x - HW < bx + ORC.reach &&
          hero.y > f.y - f.h - 6 && hero.y - HH < f.y + 4) damage(2, f.x);
        spark(f.x + f.dir * 34, f.y - 12, 8, '#c99a52', 2.2);
        G.shake = Math.max(G.shake, 4);
        f.swung = true;
      }
      if (--f.tm <= 0) f.st = 'walk';
    }

    // касание врага всё ещё вредит
    if (hitsHero(f.x - f.w, f.y - f.h, f.w * 2, f.h, f.x)) damage(f.t === 'orc' ? 2 : 1, f.x);
  }

  /* ---- пули ---- */
  for (let i = bolts.length - 1; i >= 0; i--) {
    const b = bolts[i];
    b.x += b.vx; b.life--; b.anim += .4;
    if (b.life <= 0 || solidAt(b.x - 3, b.y - 3, 6, 6)) {
      spark(b.x, b.y, 5, '#ffd23f', 1.6); bolts.splice(i, 1); continue;
    }
    let hit = false;
    for (const f of foes) {
      if (f.dead) continue;
      if (Math.abs(b.x - f.x) < f.w + 4 && b.y > f.y - f.h && b.y < f.y) {
        f.hp -= G.gunDmg + G.tal.gun; f.hurt = 14; hit = true;
        spark(b.x, b.y, 8, '#ffd23f', 2.2);
        if (f.hp <= 0) { f.dead = 1; killReward(f); spark(f.x, f.y - f.h / 2, 12, '#8fd45a', 3); }
        break;
      }
    }
    if (!hit && boss.st !== 'sleep' && !G.bossKilled && boss.hurt <= 0 &&
      Math.abs(b.x - boss.x) < boss.w + 6 && b.y > boss.y - boss.h && b.y < boss.y) {
      boss.hp -= G.gunDmg + G.tal.gun; boss.hurt = 14; hit = true; G.shake = 5;
      spark(b.x, b.y, 10, '#ffd23f', 2.6); bossBarUpdate();
      if (boss.hp <= 0) bossDie();
    }
    if (!hit) {
      for (const c of crates) {
        if (c.dead) continue;
        if (b.x > c.x && b.x < c.x + 24 && b.y > c.y - 26 && b.y < c.y) {
          c.dead = 1; hit = true; spark(c.x + 12, c.y - 12, 12, '#c69258', 2.4);
          if (Math.random() < .3) { G.gems += 1; META.bank += 5; } else earn(5);
          setHud();
          break;
        }
      }
    }
    if (hit) bolts.splice(i, 1);
  }

  /* ---- летящие камни ---- */
  for (let i = rocks.length - 1; i >= 0; i--) {
    const r = rocks[i];
    r.vy += .17; r.x += r.vx; r.y += r.vy; r.anim += .3; r.life--;
    if (r.life <= 0 || r.y > VH + 80) { rocks.splice(i, 1); continue; }
    if (solidAt(r.x - 3, r.y - 3, 6, 6)) {
      spark(r.x, r.y, 6, '#8c959d', 1.8); rocks.splice(i, 1); continue;
    }
    if (Math.abs(r.x - hero.x) < HW + 4 && r.y > hero.y - HH && r.y < hero.y + 2) {
      damage(1, r.x); spark(r.x, r.y, 8, '#8c959d', 2.2); rocks.splice(i, 1);   // камень — полсердца
    }
  }

  /* ---- шипы ---- */
  for (const sp of LEVEL.spikes) {
    if (hero.x + HW > sp.x && hero.x - HW < sp.x + sp.w &&
      hero.y > sp.y - 10 && hero.y - HH < sp.y + 4) damage(2, hero.x - hero.dir * 40);
  }

  /* ---- сбор ---- */
  for (const c of coins) {
    if (c.got) continue;
    c.ph += .18;
    if (Math.abs(c.x - hero.x) < 16 && Math.abs(c.y - (hero.y - 22)) < 26) {
      c.got = true;
      earn(1 + (G.tal.greed > 0 && Math.random() < .5 * G.tal.greed ? 1 : 0));
      spark(c.x, c.y, 4, '#ffd23f', 1.4); setHud();
    }
  }
  for (const g of gems) {
    if (g.got) continue;
    g.ph += .1;
    if (Math.abs(g.x - hero.x) < 18 && Math.abs(g.y - (hero.y - 22)) < 28) {
      g.got = true; G.gems++; META.bank += 5; spark(g.x, g.y - 10, 6, '#7fe3ff', 1.8); setHud();
    }
  }
  for (const p of pickups) {
    if (p.got) continue;
    p.ph += .12;
    if (Math.abs(p.x - hero.x) < 20 && Math.abs(p.y - (hero.y - 22)) < 30) { p.got = true; takePower(p.t); }
  }

  /* ---- чекпоинты ---- */
  for (const fl of flags) {
    fl.ph += .1;
    if (!fl.on && Math.abs(fl.x - hero.x) < 22 && Math.abs(fl.y - hero.y) < 46) {
      fl.on = true; respawn = { x: fl.x, y: fl.y };
      makeSnapshot(fl.x, fl.y);
      banner('checkpoint', T('cpTitle'), T('cpSub'));
      spark(fl.x, fl.y - 30, 12, '#ffd23f', 2);
    }
  }

  /* ---- босс ---- */
  updateBoss();

  /* ---- ударные волны ---- */
  for (let i = shocks.length - 1; i >= 0; i--) {
    const s = shocks[i];
    s.x += s.vx; s.life--; s.anim += .25;
    if (s.life <= 0 || s.x < LEVEL.boss.arenaL - 40 || s.x > LEVEL.boss.arenaR + 40) { shocks.splice(i, 1); continue; }
    if (Math.abs(s.x - hero.x) < 16 && hero.y > s.y - 26 && hero.y - HH < s.y) damage(2, s.x);
  }

  /* ---- искры ---- */
  for (let i = sparks.length - 1; i >= 0; i--) {
    const p = sparks[i];
    p.x += p.vx; p.y += p.vy; p.vy += .16; p.life--;
    if (p.life <= 0) sparks.splice(i, 1);
  }

  /* ---- портал ---- */
  if (portalOn && Math.abs(LEVEL.portal.x - hero.x) < 22 && Math.abs(LEVEL.portal.y - hero.y) < 50) {
    G.won = true; endGame();
  }

  /* ---- таймер сверху ---- */
  if (G.frames % 15 === 0) updateTimer();
  if (G.frames % 300 === 0) metaSave();          // кошелёк не теряется при закрытии вкладки

  /* ---- стамина ---- */
  if (mv !== 0 || !hero.onGround) G.stam = Math.max(0, G.stam - .18);
  else G.stam = Math.min(100, G.stam + .5);
  document.getElementById('stamFill').style.width = G.stam + '%';

  /* ---- камера ---- */
  let target = hero.x - VW * .38;
  if (boss.st !== 'sleep' && !G.bossKilled) target = (hero.x + boss.x) / 2 - VW * .5;
  target = Math.max(0, Math.min(LEVEL.width - VW, target));
  G.cam += (target - G.cam) * .1;
}

function hitsHero(bx, by, bw, bh, srcX) {
  if (hero.inv > 0) return false;
  const ok = hero.x + HW > bx && hero.x - HW < bx + bw && hero.y > by && hero.y - HH < by + bh;
  void srcX;
  return ok;
}

/* опыт за убийство и повышение уровня */
/* монеты идут и в счёт забега, и в кошелёк — тратить можно сразу */
function earn(n) { G.coins += n; META.bank += n; }

function gainXp(n) {
  G.xp += Math.round(n * (1 + G.tal.xp * .25));
  while (G.xp >= G.xpNeed) {
    G.xp -= G.xpNeed;
    G.level++;
    G.xpNeed = Math.round(14 + G.level * 7);
    if (G.tal.ward > 0) hero.buffs.shield = BUFF_MAX;
    offerTalents();
  }
  setHud();
}

function killReward(f) {
  G.kills++;
  earn(Math.round(3 * (1 + G.tal.greed * .5)));
  gainXp(f.t === 'orc' ? 7 : 3);
  if (G.tal.vamp > 0 && G.hp < G.hpMax && Math.random() < .25 * G.tal.vamp) {
    G.hp = Math.min(G.hpMax, G.hp + 1);
    spark(hero.x, hero.y - 26, 8, '#e23b3b', 2);
  }
  setHud();
}

function damage(n, srcX) {
  if (hero.inv > 0) return;
  if (hero.buffs.shield > 0) {
    hero.buffs.shield = 0; hero.inv = 60; G.shake = 6;
    spark(hero.x, hero.y - 22, 16, '#7fd0ff', 3);
    toast('Щит разбит'); renderBuffs();
    return;
  }
  G.hp = Math.max(0, G.hp - n);
  hero.inv = 72; G.shake = 8;
  hero.vx = (hero.x < srcX ? -1 : 1) * 3.2;
  hero.vy = -3.6;
  spark(hero.x, hero.y - 24, 8, '#ff6b5c', 2.4);
  setHud();
  if (G.hp <= 0) die(false);
}

function die(fell) {
  G.deaths++;
  hero.inv = 99999;                 // пока висит экран, ничего добить не может
  hero.vx = 0; hero.vy = 0;
  G.mode = MODE.PAUSE;
  clearTouch();
  shocks.length = 0;
  scr('deathTitle').dataset.fell = fell ? '1' : '0';
  scr('deathTitle').textContent = fell ? T('fell') : T('died');
  document.getElementById('deathCount').textContent = G.deaths;
  showScreen('scrDeath');
}

/* возродиться на последнем флаге */
function respawnAtCheckpoint() {
  restoreSnapshot();
  G.mode = MODE.PLAY;
  showScreen(null);
  banner('checkpoint', T('cpTitle'), T('backToCp'));
}

const PU_KEY = { heart: 'puHeart', shield: 'puShield', boots: 'puBoots', rage: 'puRage' };

function takePower(t) {
  let sub = T(PU_KEY[t] + 'Sub');
  if (t === 'heart') {
    if (G.hp < G.hpMax) G.hp = Math.min(G.hpMax, G.hp + 2);
    else if (G.hpMax < 24) {          // при полном здоровье — лишнее сердце сверху
      G.hpMax += 2; G.hp = G.hpMax; buildHearts();
      sub = T('heartUpSub');
    } else G.coins += 25;
    setHud();
  } else if (t === 'shield') hero.buffs.shield = BUFF_MAX;
  else if (t === 'boots') hero.buffs.boots = BUFF_MAX;
  else if (t === 'rage') hero.buffs.rage = BUFF_MAX;
  banner(t, T(PU_KEY[t]), sub);
  spark(hero.x, hero.y - 26, 16, PU_COL[t], 2.8);
  renderBuffs();
}

/* ---------------- БОСС ---------------- */
function updateBoss() {
  const B = LEVEL.boss;
  if (boss.st === 'sleep') {
    if (hero.x > B.trigger) {
      boss.st = 'intro'; boss.tm = 80; gateOn = true;
      document.getElementById('bossBar').classList.add('on');
      toast(T('bossWake'));
      G.shake = 10;
    }
    return;
  }
  if (G.bossKilled) {
    if (boss.dead < 90) { boss.dead++; if (boss.dead % 6 === 0) spark(boss.x + (Math.random() - .5) * 50, boss.y - 40 - Math.random() * 60, 8, '#ff9b3a', 2.6); }
    return;
  }

  if (boss.hurt > 0) boss.hurt--;
  boss.anim += .1;
  boss.tm--;
  const dx = hero.x - boss.x;
  const phase2 = boss.hp <= boss.hpMax * .55;
  const phase3 = boss.hp <= boss.hpMax * .28;

  switch (boss.st) {
    case 'intro':
      if (boss.tm <= 0) { boss.st = 'walk'; boss.tm = 90; }
      break;

    case 'walk': {
      boss.dir = dx > 0 ? 1 : -1;
      const spd = phase3 ? .95 : phase2 ? .78 : .6;
      boss.x += boss.dir * spd;
      boss.x = Math.max(B.arenaL + 50, Math.min(B.arenaR - 50, boss.x));
      if (Math.abs(dx) < 78 || boss.tm <= 0) {
        boss.act++;
        if (phase2 && boss.act % 3 === 0) { boss.st = 'charge'; boss.tm = 26; boss.vx = boss.dir * (phase3 ? 4.4 : 3.6); }
        else { boss.st = 'raise'; boss.tm = phase3 ? 26 : 36; }
      }
      break;
    }

    case 'raise':
      if (boss.tm <= 0) {
        boss.st = 'slam'; boss.tm = 26;
        G.shake = 12;
        const y = boss.y;
        shocks.push({ x: boss.x - 34, y, vx: -2.1, life: 200, anim: 0 });
        shocks.push({ x: boss.x + 34, y, vx: 2.1, life: 200, anim: 0 });
        spark(boss.x, boss.y - 4, 22, '#c99a52', 3.4);
        if (Math.abs(dx) < 56 && hero.y > boss.y - 30) damage(2, boss.x);
        if (phase3 && boss.act % 2 === 0) summonAdds();
      }
      break;

    case 'slam':
      if (boss.tm <= 0) { boss.st = 'walk'; boss.tm = phase3 ? 55 : 90; }
      break;

    case 'charge': {
      boss.x += boss.vx;
      if (boss.x < B.arenaL + 50 || boss.x > B.arenaR - 50) {
        boss.x = Math.max(B.arenaL + 50, Math.min(B.arenaR - 50, boss.x));
        boss.st = 'slam'; boss.tm = 30; G.shake = 10;
        spark(boss.x, boss.y - 6, 18, '#c99a52', 3);
      }
      if (boss.tm <= 0) { boss.st = 'walk'; boss.tm = 80; }
      if (Math.abs(boss.x - hero.x) < 34 && hero.y > boss.y - boss.h && hero.y - HH < boss.y) damage(2, boss.x);
      break;
    }
  }
}

function summonAdds() {
  const B = LEVEL.boss;
  for (let i = 0; i < 2; i++) {
    const x = B.arenaL + 90 + i * 220;
    foes.push({
      t: 'goblin', x, y: 217, a: B.arenaL + 40, b: B.arenaR - 40, dir: i ? -1 : 1, anim: 0,
      hp: 2, hpMax: 2, hurt: 0, dead: 0, vy: 0, w: 16, h: 32, spd: .8,
      st: 'walk', tm: 0, cd: 60 + i * 30, swung: false
    });
    spark(x, 200, 12, '#8fd45a', 2.6);
  }
  toast(T('bossAdds'));
}

function bossDie() {
  G.bossKilled = true; boss.st = 'die'; boss.dead = 0;
  G.kills++; G.shake = 16; gainXp(40);
  gateOn = false; portalOn = true;
  document.getElementById('bossBar').classList.remove('on');
  spark(boss.x, boss.y - 60, 40, '#ffd23f', 4);
  toast(T('bossDead'));
  bossBarUpdate();
}

const PAR_SEC = 240;                       // эталонное время прохождения
function fmtTime(sec) {
  const m = Math.floor(sec / 60), s2 = sec % 60;
  return m + ':' + String(s2).padStart(2, '0');
}
function updateTimer() {
  const sec = Math.floor(G.frames / 60);
  const el = document.getElementById('timeVal');
  if (el) el.textContent = fmtTime(sec);
  document.getElementById('timer').classList.toggle('hot', sec > PAR_SEC);
}

function bossBarUpdate() {
  const el = document.getElementById('bossFill');
  if (el) el.style.width = Math.max(0, boss ? (boss.hp / boss.hpMax) * 100 : 0) + '%';
}

/* ---------------- отрисовка ---------------- */
function layer(cv, par, y) {
  const w = cv.w;
  const off = -((G.cam * par) % w);
  for (let X = off - w; X < VW + w; X += w) ctx.drawImage(cv.c, Math.round(X), y);
}

function draw() {
  const sh = G.shake > .4 ? (Math.random() - .5) * G.shake : 0;
  ctx.setTransform(1, 0, 0, 1, Math.round(sh), Math.round(sh * .6));

  const g = ctx.createLinearGradient(0, 0, 0, VH * .72);
  g.addColorStop(0, PAL.sky1); g.addColorStop(.55, PAL.sky2); g.addColorStop(1, PAL.sky3);
  ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);

  layer(SPR.clouds, .05, 2);
  layer(SPR.mtnFar, .10, 22);
  layer(SPR.mtnNear, .16, 30);

  let h = ctx.createLinearGradient(0, 118, 0, 172);
  h.addColorStop(0, 'rgba(206,238,250,0)');
  h.addColorStop(.45, 'rgba(206,238,250,.5)');
  h.addColorStop(1, 'rgba(206,238,250,0)');
  ctx.fillStyle = h; ctx.fillRect(0, 118, VW, 54);

  layer(SPR.forFar, .22, 30);
  layer(SPR.forMid, .34, 36);

  h = ctx.createLinearGradient(0, 140, 0, 215);
  h.addColorStop(0, 'rgba(198,232,246,.24)');
  h.addColorStop(1, 'rgba(198,232,246,0)');
  ctx.fillStyle = h; ctx.fillRect(0, 140, VW, 75);

  layer(SPR.forNear, .48, 40);
  layer(SPR.forDark, .62, 44);

  /* тёмная глубина под лесом — в провалах видно бездну, а не небо */
  const ab = ctx.createLinearGradient(0, 176, 0, VH);
  ab.addColorStop(0, 'rgba(14,44,50,0)');
  ab.addColorStop(.45, 'rgba(12,38,44,.72)');
  ab.addColorStop(1, 'rgba(7,22,27,.96)');
  ctx.fillStyle = ab; ctx.fillRect(0, 176, VW, VH - 176);

  const cam = Math.round(G.cam);

  /* водопад со скалой */
  const wf = LEVEL.waterfall, WP = .74;
  const cx0 = Math.round(wf.cx - cam * WP);
  if (cx0 > -wf.cw && cx0 < VW) {
    ctx.drawImage(SPR.water[(G.t / 3 | 0) % 6].c, Math.round(wf.x - cam * WP), wf.y);
    ctx.drawImage(SPR.cliff.c, cx0, wf.y);
    const wx = Math.round(wf.x - cam * WP);
    const r = rng(((G.t / 5) | 0) * 13 + 1);
    ctx.fillStyle = 'rgba(226,246,253,.30)';
    ctx.fillRect(wx - 6, wf.y + wf.h - 22, wf.w + 12, 26);
    for (let i = 0; i < 34; i++) {
      px(ctx, wx - 8 + r() * (wf.w + 16), wf.y + wf.h - 24 + r() * 26, 1 + r() * 2, 1 + r() * 2,
        r() < .5 ? 'rgba(255,255,255,.9)' : 'rgba(208,240,252,.65)');
    }
  }

  ctx.drawImage(MID.c, Math.round(cam * .78), 0, VW, VH, 0, 0, VW, VH);
  ctx.drawImage(MAIN.c, cam, 0, VW, VH, 0, 0, VW, VH);

  /* лифты: рельс хода + платформа */
  for (const m of LEVEL.movers) {
    const X = Math.round(m.box.x - cam);
    if (X < -m.w - 16 || X > VW + 16) continue;
    const cxm = X + Math.round(m.w / 2);
    const yTop = Math.min(m.y, m.y2), yBot = Math.max(m.y, m.y2) + m.h;
    // направляющая
    px(ctx, cxm - 1, yTop - 6, 2, yBot - yTop + 6, 'rgba(30,40,48,.55)');
    for (let yy = yTop - 6; yy < yBot; yy += 8) px(ctx, cxm - 2, yy, 4, 2, '#4a545e');
    px(ctx, cxm - 4, yTop - 8, 8, 4, '#5a646e');
    px(ctx, cxm - 4, yTop - 8, 8, 1, '#7f8a95');
    // цепь до платформы
    for (let yy = yTop - 4; yy < m.box.y; yy += 5) px(ctx, cxm - 1, yy, 2, 3, '#8b95a1');
    // платформа
    drawStone(ctx, X, Math.round(m.box.y), m.w, m.h, 771);
    drawGrassCap(ctx, X, Math.round(m.box.y), m.w, 883);
    px(ctx, X - 1, Math.round(m.box.y) + m.h - 3, m.w + 2, 3, '#232a26');
    px(ctx, X - 1, Math.round(m.box.y) - 3, 3, m.h + 2, '#3a444c');
    px(ctx, X + m.w - 2, Math.round(m.box.y) - 3, 3, m.h + 2, '#3a444c');
  }

  /* ворота арены */
  if (gateOn) {
    const gg = LEVEL.boss.gate;
    ctx.drawImage(SPR.gate.c, Math.round(gg.x - cam), gg.y);
  }

  /* чекпоинты */
  for (const fl of flags) {
    const X = Math.round(fl.x - cam);
    if (X < -30 || X > VW + 30) continue;
    const set = fl.on ? SPR.flagOn : SPR.flagOff;
    ctx.drawImage(set[(fl.ph | 0) % 4].c, X - 4, Math.round(fl.y) - 40);
  }

  /* ящики */
  for (const c of crates) {
    if (c.dead) continue;
    const X = Math.round(c.x - cam);
    if (X < -30 || X > VW + 30) continue;
    ctx.drawImage(SPR.crate.c, X, Math.round(c.y) - 24);
  }

  /* усиления */
  for (const p of pickups) {
    if (p.got) continue;
    const X = Math.round(p.x - cam);
    if (X < -30 || X > VW + 30) continue;
    ctx.drawImage(SPR.pu[p.t][(p.ph | 0) % 4].c, X - 12, Math.round(p.y) - 26);
  }

  /* монеты */
  for (const c of coins) {
    if (c.got) continue;
    const X = Math.round(c.x - cam);
    if (X < -20 || X > VW + 20) continue;
    const f = SPR.coin[((c.ph | 0) % 6 + 6) % 6];
    ctx.drawImage(f.c, X - 7, Math.round(c.y - 7 + Math.sin(G.t * .06 + c.x) * 1.6));
  }
  /* кристаллы */
  for (const gm of gems) {
    if (gm.got) continue;
    const X = Math.round(gm.x - cam);
    if (X < -20 || X > VW + 20) continue;
    const f = SPR.gem[((gm.ph | 0) % 4 + 4) % 4];
    ctx.drawImage(f.c, X - 8, Math.round(gm.y - 22 + Math.sin(G.t * .05 + gm.x) * 1.2));
  }

  /* портал */
  if (portalOn) {
    const X = Math.round(LEVEL.portal.x - cam);
    ctx.drawImage(SPR.portal[(G.t / 5 | 0) % 6].c, X - 22, LEVEL.portal.y - 60);
  }

  /* враги */
  for (const f of foes) {
    if (f.dead > 26) continue;
    const X = Math.round(f.x - cam);
    if (X < -70 || X > VW + 70) continue;
    const set = f.t === 'orc' ? SPR.orc : SPR.gob;
    const side = f.dir > 0 ? set.R : set.L;
    let arr = side.walk;
    if (f.st === 'wind') arr = side.wind;
    else if (f.st === 'throw') arr = side.throw;
    else if (f.st === 'hit') arr = side.hit;
    const cv = arr[(f.anim | 0) % arr.length];
    const ox = f.t === 'orc' ? 32 : 20, oy = f.t === 'orc' ? 81 : 39;
    ctx.save();
    if (f.dead) { ctx.globalAlpha = Math.max(0, 1 - f.dead / 26); ctx.translate(0, f.dead * .6); }
    if (f.hurt > 0 && (G.t >> 1) % 2) ctx.globalAlpha = .55;
    ctx.drawImage(cv.c, X - ox, Math.round(f.y - oy));
    ctx.restore();
    if (!f.dead && f.hp < f.hpMax) hpBar(X, Math.round(f.y - oy) - 6, f.t === 'orc' ? 30 : 22, f.hp / f.hpMax);
    if (f.st === 'wind') {                        // предупреждение о замахе
      const w = f.t === 'orc' ? 30 : 22;
      const full = f.t === 'orc' ? 26 : 26;
      const k = 1 - f.tm / full;
      const y0 = Math.round(f.y - oy) - (f.hp < f.hpMax ? 12 : 6);
      px(ctx, X - w / 2, y0, w, 3, 'rgba(0,0,0,.45)');
      px(ctx, X - w / 2, y0, Math.max(1, w * k), 3, '#ff8a3a');
      px(ctx, X - w / 2, y0, Math.max(1, w * k), 1, '#ffd23f');
    }
  }

  /* босс */
  if (boss.st !== 'sleep') drawBossSprite(cam);

  /* пули и вспышка выстрела */
  for (const b of bolts) {
    const X = Math.round(b.x - cam);
    if (X < -16 || X > VW + 16) continue;
    const f = SPR.bullet[(b.anim | 0) % 3];
    if (b.dir > 0) ctx.drawImage(f.c, X - 9, Math.round(b.y) - 4);
    else { ctx.save(); ctx.translate(X + 9, Math.round(b.y) - 4); ctx.scale(-1, 1); ctx.drawImage(f.c, 0, 0); ctx.restore(); }
  }
  if (G.flash > 0) {
    const X = Math.round(hero.x - cam) + hero.dir * 14;
    ctx.save(); ctx.globalAlpha = G.flash / 6;
    if (hero.dir > 0) ctx.drawImage(SPR.flash.c, X, Math.round(hero.y) - 30);
    else { ctx.translate(X, Math.round(hero.y) - 30); ctx.scale(-1, 1); ctx.drawImage(SPR.flash.c, 0, 0); }
    ctx.restore();
  }

  /* летящие камни */
  for (const r of rocks) {
    const X = Math.round(r.x - cam);
    if (X < -12 || X > VW + 12) continue;
    ctx.drawImage(SPR.rock[(r.anim | 0) % 4].c, X - 5, Math.round(r.y) - 5);
  }

  /* ударные волны */
  for (const s of shocks) {
    const X = Math.round(s.x - cam);
    if (X < -30 || X > VW + 30) continue;
    ctx.drawImage(SPR.shock[(s.anim | 0) % 4].c, X - 15, Math.round(s.y) - 31);
  }

  /* пыль от двойного прыжка */
  if (hero.puff > 0) {
    const r = rng(hero.puff * 97 + 3);
    for (let i = 0; i < 12; i++) {
      const a2 = r() * Math.PI * 2, d = (8 - hero.puff) * 1.6 + r() * 4;
      px(ctx, hero.x - cam + Math.cos(a2) * d, hero.y - 6 + Math.sin(a2) * d * .5,
        2, 2, 'rgba(255,255,255,' + (hero.puff / 12) + ')');
    }
  }

  /* герой */
  if (!(hero.inv > 0 && (G.t >> 1) % 2 === 0 && hero.inv < 62)) {
    const side = hero.dir > 0 ? SPR.hero.R : SPR.hero.L;
    let cv;
    if (hero.st === 'atk') cv = side.atk[Math.min(3, ((hero.atkLen - hero.atk) / (hero.atkLen / 4)) | 0)];
    else if (hero.st === 'jump') cv = side.jump;
    else if (hero.st === 'fall') cv = side.fall;
    else cv = side[hero.st][(hero.anim | 0) % side[hero.st].length];
    const HX = Math.round(hero.x - cam - 32), HY = Math.round(hero.y - 55);
    if (hero.buffs.rage > 0) {
      // огненный ореол: подкрашенная копия спрайта со смещением
      const tin = rageTint(cv);
      ctx.save();
      ctx.globalAlpha = .2 + Math.sin(G.t * .2) * .07;
      ctx.drawImage(tin.c, HX - 2, HY);
      ctx.drawImage(tin.c, HX + 2, HY);
      ctx.drawImage(tin.c, HX, HY - 3);
      ctx.restore();
      ctx.drawImage(cv.c, HX, HY);
    } else {
      ctx.drawImage(cv.c, HX, HY);
    }
    if (hero.buffs.shield > 0) {
      const rr = 30 + Math.sin(G.t * .12) * 1.5;
      ctx.strokeStyle = 'rgba(127,208,255,' + (hero.buffs.shield < 120 && (G.t >> 2) % 2 ? .25 : .7) + ')';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(hero.x - cam, hero.y - 24, rr * .62, rr, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  /* искры */
  for (const p of sparks) {
    px(ctx, p.x - cam, p.y, 2, 2, p.col);
  }

  /* виньетка */
  const v = ctx.createLinearGradient(0, VH - 40, 0, VH);
  v.addColorStop(0, 'rgba(10,26,16,0)'); v.addColorStop(1, 'rgba(8,22,14,.30)');
  ctx.fillStyle = v; ctx.fillRect(0, VH - 40, VW, 40);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

const _tint = new WeakMap();
function rageTint(cv) {
  let t = _tint.get(cv);
  if (t) return t;
  t = mkc(cv.w, cv.h);
  t.x.drawImage(cv.c, 0, 0);
  t.x.globalCompositeOperation = 'source-atop';
  t.x.fillStyle = '#ff5a1e';
  t.x.fillRect(0, 0, cv.w, cv.h);
  t.x.globalCompositeOperation = 'source-over';
  _tint.set(cv, t);
  return t;
}

/* полоска здоровья над врагом: показывается только при неполном здоровье */
function hpBar(cx, y, w, k) {
  const x0 = Math.round(cx - w / 2);
  px(ctx, x0 - 1, y - 1, w + 2, 5, '#141a1e');
  px(ctx, x0, y, w, 3, '#3a2028');
  const fw = Math.max(1, Math.round(w * Math.max(0, k)));
  const col = k > .6 ? '#5fd44a' : k > .3 ? '#ffc23f' : '#e2402e';
  px(ctx, x0, y, fw, 3, col);
  px(ctx, x0, y, fw, 1, shade(col, .3));
}

function drawBossSprite(cam) {
  const set = boss.dir > 0 ? SPR.boss.R : SPR.boss.L;
  let cv;
  if (boss.st === 'raise') cv = set.raise[(G.t / 6 | 0) % 2];
  else if (boss.st === 'slam') cv = set.slam[0];
  else if (boss.st === 'charge') cv = set.charge[(G.t / 4 | 0) % 2];
  else if (boss.st === 'walk') cv = set.walk[(boss.anim | 0) % 4];
  else cv = set.idle[(boss.anim | 0) % 4];
  const X = Math.round(boss.x - cam - 64), Y = Math.round(boss.y - 123);
  ctx.save();
  if (G.bossKilled) {
    ctx.globalAlpha = Math.max(0, 1 - boss.dead / 90);
    ctx.translate((Math.random() - .5) * 3, boss.dead * .35);
  } else if (boss.hurt > 0 && (G.t >> 1) % 2) ctx.globalAlpha = .5;
  ctx.drawImage(cv.c, X, Y);
  ctx.restore();
  // индикатор замаха
  if (boss.st === 'raise') {
    const k = 1 - boss.tm / 36;
    px(ctx, boss.x - cam - 20, boss.y - 132, Math.max(0, 40 * k), 3, '#ff5533');
    px(ctx, boss.x - cam - 20, boss.y - 132, 40, 1, 'rgba(0,0,0,.4)');
  }
}

/* ---------------- HUD ---------------- */
const HEART = 'M12 21.6C12 21.6 2.6 15.2 2.6 9.1 2.6 5.9 5 3.5 8 3.5c1.9 0 3.2 1 4 2.3.8-1.3 2.1-2.3 4-2.3 3 0 5.4 2.4 5.4 5.6 0 6.1-9.4 12.5-9.4 12.5z';
function buildHearts() {
  const box = document.getElementById('hearts');
  box.innerHTML = '';
  const n = Math.round(G.hpMax / 2);
  for (let i = 0; i < n; i++) {
    box.insertAdjacentHTML('beforeend',
      '<svg viewBox="0 0 24 24">' +
      '<clipPath id="hc' + i + '"><rect id="hr' + i + '" x="0" y="0" width="24" height="24"/></clipPath>' +
      '<path d="' + HEART + '" fill="#3d323a" stroke="#7a1616" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<g clip-path="url(#hc' + i + ')">' +
      '<path d="' + HEART + '" fill="#e23b3b" stroke="#8d1a1a" stroke-width="1.6" stroke-linejoin="round"/>' +
      '<path d="M7.4 7.2c.9-1.1 2.3-1.2 3-.4" stroke="#ff9b9b" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '</g></svg>');
  }
}

function setHud() {
  document.getElementById('coinVal').textContent = G.coins.toLocaleString('en-US');
  document.getElementById('gemVal').textContent = G.gems.toLocaleString('en-US');
  const n = Math.round(G.hpMax / 2);
  for (let i = 0; i < n; i++) {
    const r = document.getElementById('hr' + i);
    if (!r) continue;
    const left = G.hp - i * 2;                    // сколько половинок в этом сердце
    r.setAttribute('width', left >= 2 ? 24 : left === 1 ? 12 : 0);
  }
  const lv = document.querySelector('.lvl span');
  if (lv) lv.textContent = G.level;
  const xf = document.getElementById('stamFill');
  if (xf) xf.style.width = Math.min(100, (G.xp / G.xpNeed) * 100) + '%';
}

const BUFF_MAX = 60 * 14;
function renderBuffs() {
  const box = document.getElementById('buffs');
  const want = ['shield', 'boots', 'rage'].filter(k => hero.buffs[k] > 0);
  if (box.dataset.keys === want.join(',')) {
    want.forEach(k => {
      const el = box.querySelector('[data-k="' + k + '"] .t');
      if (el) el.style.width = (hero.buffs[k] / BUFF_MAX * 100) + '%';
    });
    return;
  }
  box.dataset.keys = want.join(',');
  box.innerHTML = '';
  for (const k of want) {
    const d = document.createElement('div');
    d.className = 'buff'; d.dataset.k = k;
    const c = document.createElement('canvas');
    c.width = 16; c.height = 18;
    c.getContext('2d').drawImage(buildPuIcon(k).c, 0, 0);
    const t = document.createElement('div');
    t.className = 't'; t.style.width = (hero.buffs[k] / BUFF_MAX * 100) + '%';
    d.appendChild(c); d.appendChild(t);
    box.appendChild(d);
  }
}

function drawFaceIcon() {
  const src = mkc(72, 56);
  drawRaccoon(src.x, { legA: [-3, 0], legB: [3, 0], hideSword: true });
  outline(src, PAL.outline);
  const paint = (el, size) => {
    const fx = el.getContext('2d');
    fx.imageSmoothingEnabled = false;
    fx.clearRect(0, 0, size, size);
    const g = fx.createLinearGradient(0, 0, 0, size);
    g.addColorStop(0, '#4a5766'); g.addColorStop(1, '#232b34');
    fx.fillStyle = g; fx.fillRect(0, 0, size, size);
    fx.drawImage(src.c, 19, 0, 26, 27, 0, size * .03, size, size * .97);
  };
  paint(document.getElementById('face'), 64);
  paint(document.getElementById('startFace'), 96);

  const ic = document.getElementById('icnCoin').getContext('2d');
  ic.imageSmoothingEnabled = false; ic.clearRect(0, 0, 32, 32);
  ic.drawImage(SPR.coin[0].c, 0, 0, 14, 14, 1, 1, 30, 30);

  const gi = mkc(16, 16), gx2 = gi.x;
  const rows = [[7, 0, 2], [5, 1, 6], [3, 2, 10], [1, 3, 14], [0, 5, 16], [1, 9, 14], [3, 11, 10], [5, 13, 6], [7, 15, 2]];
  for (const r of rows) px(gx2, r[0], r[1], r[2], 2, PAL.gemD);
  for (const r of rows) px(gx2, r[0] + 1, r[1], Math.max(1, r[2] - 2), 2, PAL.gem);
  px(gx2, 4, 4, 4, 7, PAL.gemL);
  px(gx2, 6, 2, 2, 3, '#ffffff');
  px(gx2, 9, 7, 2, 5, '#bff0ff');
  outline(gi, '#0d4a72');
  const ig = document.getElementById('icnGem').getContext('2d');
  ig.imageSmoothingEnabled = false; ig.clearRect(0, 0, 32, 32);
  ig.drawImage(gi.c, 0, 0, 16, 16, 0, 8, 32, 32);
}

/* ---------------- размеры и полный экран ---------------- */

/* Реальная видимая область. Во встроенных браузерах innerHeight часто больше
   того, что видно под панелью, поэтому берём минимум из доступных источников. */
function viewportSize() {
  const vv = window.visualViewport;
  const de = document.documentElement;
  let w = innerWidth, h = innerHeight;
  if (de && de.clientWidth) { w = Math.min(w, de.clientWidth); h = Math.min(h, de.clientHeight); }
  if (vv) { w = Math.min(w, vv.width); h = Math.min(h, vv.height); }
  return { w: Math.max(240, Math.round(w)), h: Math.max(160, Math.round(h)) };
}

function resize() {
  const { w: W, h: H } = viewportSize();

  /* ширина кадра под пропорции экрана, чтобы не было чёрных полей по бокам */
  let want = Math.round(VH * (W / H) / 2) * 2;
  want = Math.max(VW_MIN, Math.min(VW_MAX, want));
  if (want !== VW) {
    VW = want;
    cvs.width = VW;
    ctx.imageSmoothingEnabled = false;
    G.cam = Math.max(0, Math.min(LEVEL.width - VW, G.cam));
  }

  const s = Math.min(W / VW, H / VH);
  const w = Math.round(VW * s), h = Math.round(VH * s);
  cvs.style.width = w + 'px'; cvs.style.height = h + 'px';
  const hud = document.getElementById('hud');
  hud.style.width = w + 'px'; hud.style.height = h + 'px';
  hud.style.setProperty('--u', (h / 100) + 'px');
  document.querySelectorAll('.screen').forEach(el => el.style.setProperty('--u', (h / 100) + 'px'));
}

addEventListener('resize', resize);
addEventListener('orientationchange', () => { resize(); setTimeout(resize, 250); });
if (window.visualViewport) {
  visualViewport.addEventListener('resize', resize);
  visualViewport.addEventListener('scroll', resize);
}
document.addEventListener('fullscreenchange', () => { setTimeout(resize, 120); syncFsButton(); });

/* полный экран + попытка зафиксировать альбомную ориентацию */
const isTouch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

function fsElement() { return document.fullscreenElement || document.webkitFullscreenElement; }

async function enterFullscreen() {
  const el = document.documentElement;
  try {
    if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  } catch (e) { /* браузер не дал — играем как есть */ }
  try {
    if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape');
  } catch (e) { /* блокировка ориентации необязательна */ }
  setTimeout(resize, 200);
}

async function exitFullscreen() {
  try {
    if (document.exitFullscreen) await document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  } catch (e) { /* ignore */ }
  setTimeout(resize, 200);
}

function toggleFullscreen() { fsElement() ? exitFullscreen() : enterFullscreen(); }

function syncFsButton() {
  const b = document.getElementById('btnFs');
  if (b) b.classList.toggle('is-on', !!fsElement());
}

/* ---------------- экраны ---------------- */
const scr = id => document.getElementById(id);
function showScreen(id) {
  ['scrStart', 'scrEnd', 'scrPause', 'scrShop', 'scrTalent', 'scrDeath']
    .forEach(k => scr(k).classList.toggle('on', k === id));
  // HUD виден только в самом забеге
  document.getElementById('hud').style.visibility = id ? 'hidden' : 'visible';
}

/* ---------------- ТАЛАНТЫ ---------------- */
const TALENTS = [
  { k: 'hp', n: 'tHp', s: 'tHpS', ico: () => buildPuIcon('heart'), max: 6 },
  { k: 'dmg', n: 'tDmg', s: 'tDmgS', ico: () => SPR.icoSword, max: 6 },
  { k: 'swift', n: 'tSwift', s: 'tSwiftS', ico: () => buildPuIcon('boots'), max: 4 },
  { k: 'jump', n: 'tJump', s: 'tJumpS', ico: () => buildPuIcon('boots'), max: 4 },
  { k: 'atkspd', n: 'tAtkspd', s: 'tAtkspdS', ico: () => buildPuIcon('rage'), max: 3 },
  { k: 'greed', n: 'tGreed', s: 'tGreedS', ico: () => SPR.coin[0], max: 2 },
  { k: 'vamp', n: 'tVamp', s: 'tVampS', ico: () => buildPuIcon('heart'), max: 3 },
  { k: 'xp', n: 'tXp', s: 'tXpS', ico: () => SPR.gem[0], max: 3 },
  { k: 'ward', n: 'tWard', s: 'tWardS', ico: () => buildPuIcon('shield'), max: 2 },
  { k: 'gun', n: 'tGun', s: 'tGunS', ico: () => SPR.icoPistol, max: 4, needGun: true }
];
let talentQueue = 0;

function offerTalents() {
  talentQueue++;
  if (G.mode === MODE.PLAY) showTalents();
}

function showTalents() {
  const pool = TALENTS.filter(t => G.tal[t.k] < t.max && (!t.needGun || G.gunDmg > 0));
  const pick = [];
  const bag = pool.slice();
  while (pick.length < 3 && bag.length) pick.push(bag.splice((Math.random() * bag.length) | 0, 1)[0]);
  if (!pick.length) { talentQueue = 0; return; }

  document.getElementById('lvlNum').textContent = G.level;
  const box = document.getElementById('talentList');
  box.innerHTML = '';
  for (const t of pick) {
    const card = document.createElement('div');
    card.className = 'card';
    const ic = t.ico();
    const cv2 = document.createElement('canvas');
    cv2.width = 22; cv2.height = 22;
    const cx2 = cv2.getContext('2d');
    cx2.imageSmoothingEnabled = false;
    cx2.drawImage(ic.c, Math.round((22 - ic.w) / 2), Math.round((22 - ic.h) / 2));
    card.appendChild(cv2);
    const n = document.createElement('div'); n.className = 'cn'; n.textContent = T(t.n);
    const d = document.createElement('div'); d.className = 'cd'; d.textContent = T(t.s);
    const lv = document.createElement('div'); lv.className = 'clv';
    lv.textContent = T('lvl') + ' ' + G.tal[t.k] + ' / ' + t.max;
    const pk = document.createElement('div'); pk.className = 'pick'; pk.textContent = T('pick');
    card.appendChild(n); card.appendChild(d); card.appendChild(lv); card.appendChild(pk);
    card.onclick = () => takeTalent(t);
    box.appendChild(card);
  }
  G.mode = MODE.PAUSE;
  clearTouch();
  showScreen('scrTalent');
}

function takeTalent(t) {
  G.tal[t.k]++;
  if (t.k === 'hp') { G.hpMax += 2; G.hp = G.hpMax; buildHearts(); }
  if (t.k === 'ward') hero.buffs.shield = BUFF_MAX;
  setHud(); renderBuffs();
  talentQueue--;
  if (talentQueue > 0) { showTalents(); return; }
  G.mode = MODE.PLAY;
  showScreen(null);
  banner(null, T(t.n), T(t.s));
}

function startGame() {
  if (isTouch && !fsElement()) enterFullscreen();
  talentQueue = 0;
  resetRun(true);
  G.mode = MODE.PLAY;
  showScreen(null);
  document.getElementById('bossBar').classList.remove('on');
  clearTouch();
}

function togglePause() {
  if (G.mode === MODE.PLAY) { G.mode = MODE.PAUSE; showScreen('scrPause'); clearTouch(); }
  else if (G.mode === MODE.PAUSE) { G.mode = MODE.PLAY; showScreen(null); }
}

function endGame() {
  G.mode = MODE.END;
  clearTouch();
  document.getElementById('bossBar').classList.remove('on');

  const secs = Math.round(G.frames / 60);
  const diff = PAR_SEC - secs;
  const timeBonus = diff > 0 ? diff * 40 : Math.max(-1500, diff * 15);
  const rows = [
    [T('rCoins'), G.coins + ' x 10', G.coins * 10],
    [T('rGems'), G.gems + ' x 50', G.gems * 50],
    [T('rKills'), G.kills + ' x 25', G.kills * 25],
    [T('rHearts'), G.hp + ' x 200', G.hp * 200],
    [T('rTime'), fmtTime(secs) + ' - ' + (diff > 0 ? T('timeFast') : T('timeSlow')), timeBonus],
    [T('rDeaths'), G.deaths + ' x -150', -G.deaths * 150]
  ];
  if (G.bossKilled) rows.splice(3, 0, [T('rBoss'), '1 x 1500', 1500]);
  const total = Math.max(0, rows.reduce((a2, r) => a2 + r[2], 0));

  metaSave();                                     // монеты уже начислялись по ходу забега

  scr('endTitle').textContent = G.won ? T('win') : T('over');
  scr('endSub').textContent = G.won ? T('winSub') : T('overSub');
  scr('scoreTable').innerHTML = rows.map(r =>
    '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' +
    (r[2] < 0 ? '-' + Math.abs(r[2]).toLocaleString('en-US') : r[2].toLocaleString('en-US')) + '</td></tr>').join('');

  const el = scr('totalScore');
  let shown = 0;
  const stepv = Math.max(1, Math.round(total / 45));
  clearInterval(el._iv);
  el._iv = setInterval(() => {
    shown = Math.min(total, shown + stepv);
    el.textContent = shown.toLocaleString('en-US');
    if (shown >= total) clearInterval(el._iv);
  }, 26);
  el.textContent = '0';
  showScreen('scrEnd');
}

/* ---------------- ЛАВКА ---------------- */
function upgCost(k) { const u = UPG[k]; return META[k] >= u.max ? null : u.cost[META[k]]; }

function renderShop() {
  document.getElementById('bankVal').textContent = META.bank.toLocaleString('en-US');
  const cc = document.getElementById('shopCoin').getContext('2d');
  cc.imageSmoothingEnabled = false; cc.clearRect(0, 0, 32, 32);
  cc.drawImage(SPR.coin[0].c, 0, 0, 14, 14, 1, 1, 30, 30);

  const box = document.getElementById('shopList');
  box.innerHTML = '';
  for (const k of ['hp', 'atk', 'gun']) {
    const u = UPG[k], lvl = META[k], cost = upgCost(k);
    const owned = k === 'gun' && lvl > 0;
    const card = document.createElement('div');
    card.className = 'card' + (cost === null ? ' done' : '');

    const ic = u.icon();
    const cv2 = document.createElement('canvas');
    cv2.width = 18; cv2.height = 18;
    const cx2 = cv2.getContext('2d');
    cx2.imageSmoothingEnabled = false;
    cx2.drawImage(ic.c, Math.round((18 - ic.w) / 2), Math.round((18 - ic.h) / 2));
    card.appendChild(cv2);

    const n = document.createElement('div'); n.className = 'cn';
    n.textContent = T(owned && u.nameUp ? u.nameUp : u.name);
    const d = document.createElement('div'); d.className = 'cd';
    d.textContent = T(owned && u.subUp ? u.subUp : u.sub);
    const lv = document.createElement('div'); lv.className = 'clv';
    lv.textContent = T('lvl') + ' ' + lvl + ' / ' + u.max;
    card.appendChild(n); card.appendChild(d); card.appendChild(lv);

    const b = document.createElement('button');
    if (cost === null) { b.textContent = T('maxed'); b.disabled = true; }
    else {
      b.innerHTML = '<i class="cc"></i>' + cost;
      if (META.bank < cost) { b.disabled = true; b.title = T('notEnough'); }
      else b.onclick = () => {
        if (META.bank < cost) return;
        META.bank -= cost; META[k]++; metaSave();
        applyUpgrade(k);                       // улучшение работает уже в этом забеге
        renderShop();
      };
    }
    card.appendChild(b);
    box.appendChild(card);
  }
}

/* улучшение из лавки применяется к текущему герою немедленно */
function applyUpgrade(k) {
  if (k === 'hp') {
    G.hpMax += 2;
    G.hp = Math.min(G.hpMax, G.hp + 2);
    buildHearts();
  } else if (k === 'atk') {
    G.swordDmg = 1 + META.atk;
  } else if (k === 'gun') {
    G.gunDmg = 1 + META.gun;
    document.getElementById('btnGun').classList.add('on-owned');
  }
  setHud();
}

/* лавка открывается и с финала, и прямо из забега */
let shopFrom = 'end';
function openShop(from) {
  shopFrom = from || 'end';
  if (shopFrom === 'play') { G.mode = MODE.PAUSE; clearTouch(); }
  document.getElementById('btnRun').textContent = T(shopFrom === 'play' ? 'resume' : 'startRun');
  renderShop();
  showScreen('scrShop');
}

function closeShop() {
  if (shopFrom === 'play') { G.mode = MODE.PLAY; showScreen(null); }
  else startGame();
}

document.getElementById('btnPlay').addEventListener('click', startGame);
document.getElementById('btnAgain').addEventListener('click', () => openShop('end'));
document.getElementById('btnRun').addEventListener('click', closeShop);
document.getElementById('btnShopHud').addEventListener('click', () => openShop('play'));
document.getElementById('btnResume').addEventListener('click', togglePause);
document.getElementById('btnRestart').addEventListener('click', startGame);
document.getElementById('btnPause').addEventListener('click', togglePause);
document.getElementById('btnFs').addEventListener('click', toggleFullscreen);
document.getElementById('btnRespawn').addEventListener('click', respawnAtCheckpoint);
document.getElementById('btnOver').addEventListener('click', startGame);

/* ---------------- язык ---------------- */
document.querySelectorAll('.lang-btn').forEach(b => {
  b.addEventListener('click', () => setLang(b.dataset.lang));
});
function onLangChange() {
  buildHearts(); setHud();
  if (G.mode === MODE.END) endGame();
  if (document.getElementById('scrDeath').classList.contains('on')) {
    scr('deathTitle').textContent = T(scr('deathTitle').dataset.fell === '1' ? 'fell' : 'died');
  }
  if (document.getElementById('scrShop').classList.contains('on')) {
    document.getElementById('btnRun').textContent = T(shopFrom === 'play' ? 'resume' : 'startRun');
    renderShop();
  }
}

/* ---------------- цикл ---------------- */
let acc = 0, last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  let dt = now - last; last = now;
  if (dt > 250) dt = 250;
  acc += dt;
  const step = 1000 / 60;
  let n = 0;
  while (acc >= step && n < 5) { update(); acc -= step; n++; }
  draw();
}

/* ---------------- старт ---------------- */
LEVEL.movers.forEach(m => { m.box = { x: m.x, y: m.y, w: m.w, h: m.h, mover: true }; });
buildAssets();
buildWorld();
buildHearts();
resetRun(true);
drawFaceIcon();
applyStatic();
resize();
showScreen('scrStart');
requestAnimationFrame(loop);

window.__g = { G, hero, foes: () => foes, LEVEL, SPR, MODE };
window.__step = function (n) { for (let i = 0; i < (n || 1); i++) update(); draw(); };
