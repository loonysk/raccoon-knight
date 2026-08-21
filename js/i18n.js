/* ============ локализация: русский / английский ============ */
'use strict';

const LANGS = {
  ru: {
    code: 'ru', name: 'Русский',
    title: 'ЕНОТ‑РЫЦАРЬ',
    subtitle: 'Пробейся через лес гоблинов и одолей вождя Грумаша',
    kMove: 'ход', kJump: 'прыжок ×2', kHit: 'удар', kPause: 'пауза',
    play: 'ИГРАТЬ', hint: 'на телефоне — кнопки внизу экрана',
    langLabel: 'Язык',

    pause: 'ПАУЗА', resume: 'ПРОДОЛЖИТЬ', restart: 'НАЧАТЬ ЗАНОВО',

    win: 'ПОБЕДА!', winSub: 'Лес свободен, Грумаш повержен',
    over: 'ИТОГИ', overSub: 'Забег окончен',
    total: 'ИТОГО', again: 'ЗАНОВО',
    rCoins: 'Монеты', rGems: 'Кристаллы', rKills: 'Побеждено врагов',
    rBoss: 'Грумаш повержен', rHearts: 'Осталось сердец',
    rTime: 'Время прохождения', rDeaths: 'Смерти',
    timeFast: 'быстрее эталона', timeSlow: 'дольше эталона',

    bossName: 'ОРОЧИЙ ВОЖДЬ ГРУМАШ',
    bossWake: 'ГРУМАШ ПРОБУДИЛСЯ',
    bossDead: 'ГРУМАШ ПОВЕРЖЕН! К порталу →',
    bossAdds: 'Грумаш зовёт подмогу!',

    cpTitle: 'Контрольная точка', cpSub: 'прогресс сохранён',
    fell: 'Провалился!', died: 'Ты пал…', backToCp: 'откат к контрольной точке',
    shieldBreak: 'Щит разбит', shieldBreakSub: 'удар поглощён',

    puHeart: 'Сердце', puHeartSub: '+1 к здоровью',
    puHeartFull: 'здоровье полное · +25 монет',
    puShield: 'Щит', puShieldSub: 'поглощает один удар · 14 сек',
    puBoots: 'Сапоги скорости', puBootsSub: 'бег и прыжок выше · 14 сек',
    puRage: 'Ярость', puRageSub: 'урон ×2, размах шире · 14 сек',

    rotate1: 'Поверни телефон', rotate2: 'горизонтально',

    toShop: 'В ЛАВКУ', shopTitle: 'ЛАВКА СТАРОГО БАРСУКА',
    shopSub: 'Улучшения остаются навсегда и работают в следующих забегах',
    bank: 'В кошельке', buy: 'КУПИТЬ', bought: 'КУПЛЕНО', maxed: 'МАКСИМУМ',
    lvl: 'ур.', notEnough: 'не хватает монет', startRun: 'В ПУТЬ',
    upgHp: 'Крепкое сердце', upgHpSub: '+1 сердце к запасу здоровья',
    upgAtk: 'Заточка клинка', upgAtkSub: '+1 к урону меча',
    upgGun: 'Пороховой пистоль', upgGunSub: 'дальний выстрел, кнопка K',
    upgGunUp: 'Улучшить пистоль', upgGunUpSub: '+1 к урону выстрела',
    gunGot: 'Пороховой пистоль', gunGotSub: 'стреляй кнопкой K',
    heartUp: 'Сердце', heartUpSub: '+1 к пределу здоровья',
    yourUpg: 'Твои улучшения',

    lvlUp: 'УРОВЕНЬ', chooseTalent: 'Выбери талант', pick: 'ВЗЯТЬ',
    tHp: 'Живучесть', tHpS: '+1 сердце и полное лечение',
    tDmg: 'Сила удара', tDmgS: '+1 к урону меча',
    tSwift: 'Проворство', tSwiftS: '+12% к скорости бега',
    tJump: 'Лёгкость', tJumpS: '+7% к высоте прыжка',
    tAtkspd: 'Быстрый клинок', tAtkspdS: 'удар и выстрел на 20% быстрее',
    tGreed: 'Жадность', tGreedS: 'шанс двойной монеты',
    tVamp: 'Жажда крови', tVampS: 'шанс вернуть полсердца за убийство',
    tXp: 'Ученик', tXpS: '+25% к получаемому опыту',
    tGun: 'Крупная дробь', tGunS: '+1 к урону выстрела',
    tWard: 'Оберег', tWardS: 'щит сразу и при каждом уровне'
  },

  en: {
    code: 'en', name: 'English',
    title: 'RACCOON KNIGHT',
    subtitle: 'Fight through the goblin woods and bring down warlord Grumash',
    kMove: 'move', kJump: 'double jump', kHit: 'attack', kPause: 'pause',
    play: 'PLAY', hint: 'on phones — use the on‑screen buttons',
    langLabel: 'Language',

    pause: 'PAUSED', resume: 'RESUME', restart: 'RESTART',

    win: 'VICTORY!', winSub: 'The woods are free, Grumash has fallen',
    over: 'RESULTS', overSub: 'Run finished',
    total: 'TOTAL', again: 'PLAY AGAIN',
    rCoins: 'Coins', rGems: 'Crystals', rKills: 'Enemies defeated',
    rBoss: 'Grumash defeated', rHearts: 'Hearts left',
    rTime: 'Clear time', rDeaths: 'Deaths',
    timeFast: 'under par', timeSlow: 'over par',

    bossName: 'ORC WARLORD GRUMASH',
    bossWake: 'GRUMASH AWAKENS',
    bossDead: 'GRUMASH IS DOWN! To the portal →',
    bossAdds: 'Grumash calls for backup!',

    cpTitle: 'Checkpoint', cpSub: 'progress saved',
    fell: 'You fell!', died: 'You died…', backToCp: 'rolled back to checkpoint',
    shieldBreak: 'Shield broken', shieldBreakSub: 'one hit absorbed',

    puHeart: 'Heart', puHeartSub: '+1 health',
    puHeartFull: 'health is full · +25 coins',
    puShield: 'Shield', puShieldSub: 'absorbs one hit · 14 s',
    puBoots: 'Speed boots', puBootsSub: 'faster run, higher jump · 14 s',
    puRage: 'Rage', puRageSub: 'double damage, longer reach · 14 s',

    rotate1: 'Rotate your phone', rotate2: 'to landscape',

    toShop: 'TO THE SHOP', shopTitle: "OLD BADGER'S SHOP",
    shopSub: 'Upgrades are permanent and carry into your next run',
    bank: 'In your purse', buy: 'BUY', bought: 'OWNED', maxed: 'MAXED',
    lvl: 'lv.', notEnough: 'not enough coins', startRun: 'SET OFF',
    upgHp: 'Sturdy heart', upgHpSub: '+1 heart to your health pool',
    upgAtk: 'Sharpened blade', upgAtkSub: '+1 sword damage',
    upgGun: 'Powder pistol', upgGunSub: 'ranged shot, key K',
    upgGunUp: 'Upgrade pistol', upgGunUpSub: '+1 shot damage',
    gunGot: 'Powder pistol', gunGotSub: 'shoot with key K',
    heartUp: 'Heart', heartUpSub: '+1 to your health cap',
    yourUpg: 'Your upgrades',

    lvlUp: 'LEVEL UP', chooseTalent: 'Choose a talent', pick: 'TAKE',
    tHp: 'Vitality', tHpS: '+1 heart and a full heal',
    tDmg: 'Strength', tDmgS: '+1 sword damage',
    tSwift: 'Swiftness', tSwiftS: '+12% run speed',
    tJump: 'Lightness', tJumpS: '+7% jump height',
    tAtkspd: 'Quick blade', tAtkspdS: 'attack and shot 20% faster',
    tGreed: 'Greed', tGreedS: 'chance of double coins',
    tVamp: 'Bloodthirst', tVampS: 'chance to recover half a heart per kill',
    tXp: 'Apprentice', tXpS: '+25% experience gained',
    tGun: 'Heavy shot', tGunS: '+1 shot damage',
    tWard: 'Ward', tWardS: 'shield now and on every level up'
  }
};

let LANG = 'en';                       // по умолчанию английский
try {
  const saved = localStorage.getItem('rk_lang');
  if (saved && LANGS[saved]) LANG = saved;
} catch (e) { /* приватный режим — остаёмся на английском */ }

function T(k) { return (LANGS[LANG] && LANGS[LANG][k]) || LANGS.ru[k] || k; }

function applyStatic() {
  document.documentElement.lang = LANG;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = T(el.dataset.i18n);
  });
  document.querySelectorAll('.lang-btn').forEach(b => {
    b.classList.toggle('on', b.dataset.lang === LANG);
  });
}

function setLang(l) {
  if (!LANGS[l]) return;
  LANG = l;
  try { localStorage.setItem('rk_lang', l); } catch (e) { /* ignore */ }
  applyStatic();
  if (typeof onLangChange === 'function') onLangChange();
}
