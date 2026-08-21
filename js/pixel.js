/* ============ мини-движок пиксельной графики ============ */
'use strict';

function mkc(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  return { c, x, w, h };
}

/* прямоугольник в целых пикселях */
function px(x, X, Y, W, H, col) {
  x.fillStyle = col;
  x.fillRect(X | 0, Y | 0, Math.max(1, W | 0), Math.max(1, H | 0));
}

/* детерминированный ГПСЧ — мир всегда одинаковый */
function rng(seed) {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* смешать два hex-цвета */
function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(((pa >> 16) & 255) * (1 - t) + ((pb >> 16) & 255) * t);
  const g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t);
  const bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
}

function shade(hex, t) { return t < 0 ? mix(hex, '#000000', -t) : mix(hex, '#ffffff', t); }

/* залить пиксельный «шум» поверх области */
function noise(x, X, Y, W, H, cols, rand, chance) {
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    if (rand() < chance) px(x, X + i, Y + j, 1, 1, cols[(rand() * cols.length) | 0]);
  }
}

/* обводка непрозрачных пикселей канваса */
function outline(cv, col) {
  const { c, x, w, h } = cv;
  const src = x.getImageData(0, 0, w, h);
  const out = x.createImageData(w, h);
  const A = (i, j) => (i < 0 || j < 0 || i >= w || j >= h) ? 0 : src.data[(j * w + i) * 4 + 3];
  const p = parseInt(col.slice(1), 16);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const o = (j * w + i) * 4;
    if (A(i, j) > 0) continue;
    if (A(i - 1, j) > 128 || A(i + 1, j) > 128 || A(i, j - 1) > 128 || A(i, j + 1) > 128) {
      out.data[o] = (p >> 16) & 255; out.data[o + 1] = (p >> 8) & 255;
      out.data[o + 2] = p & 255; out.data[o + 3] = 255;
    }
  }
  const tmp = mkc(w, h);
  tmp.x.putImageData(out, 0, 0);
  tmp.x.drawImage(c, 0, 0);
  x.clearRect(0, 0, w, h);
  x.drawImage(tmp.c, 0, 0);
  return cv;
}

/* горизонтальное отражение спрайта */
function flip(cv) {
  const o = mkc(cv.w, cv.h);
  o.x.translate(cv.w, 0); o.x.scale(-1, 1);
  o.x.drawImage(cv.c, 0, 0);
  return o;
}

/* ---------- палитра мира ---------- */
const PAL = {
  sky1: '#4fb0e6', sky2: '#86d2f0', sky3: '#c9edfa',
  cloud: '#ffffff', cloudSh: '#d8ebf5',
  mtnFar: '#9cc0d6', mtnFar2: '#b6d3e3', mtnNear: '#6b93af', mtnNear2: '#86a9c2',
  pine1: '#5b93a1', pine1b: '#74aab6',
  pine2: '#37727c', pine2b: '#4b8b93',
  pine3: '#1d4f57', pine3b: '#2a666c',
  pine4: '#123a41', pine4b: '#1b4d54',
  trunk: '#22333a',
  stoneL: '#95a293', stone: '#78867a', stoneD: '#5d6a60', stoneDD: '#454f49',
  mortar: '#2b322e',
  grass: '#55b23a', grassL: '#82d95c', grassD: '#2e7f2c', grassDD: '#1d5f23',
  moss: '#49952f',
  rock: '#5a6a6e', rockL: '#7b8d90', rockD: '#3c4a4e', rockDD: '#263134',
  water: '#d5f0fb', water2: '#9adcf3', water3: '#68bfe2', water4: '#3f9ac6', foam: '#ffffff',
  vine: '#3f9440', vineD: '#276c2b', vineL: '#71c552',
  wood: '#a9743c', woodD: '#7c5028', woodL: '#c69258',
  clay: '#b07a41', clayD: '#7f5326', clayL: '#d0a06a',
  gold: '#ffd23f', goldD: '#e09a15', goldL: '#fff2a8',
  gem: '#7fe3ff', gemD: '#2b8fd6', gemL: '#e8fbff',
  outline: '#141a1e'
};
