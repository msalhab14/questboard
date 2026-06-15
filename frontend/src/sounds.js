// Lazy singleton AudioContext, created on first use to satisfy browser autoplay policy.
let ctx = null;

// Mute state
let muted = JSON.parse(localStorage.getItem('questboard_muted') || 'false');

export function setMuted(val) {
  muted = val;
  localStorage.setItem('questboard_muted', JSON.stringify(val));
}

export function isMuted() {
  return muted;
}

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

// Plays a single chiptune beep. freq=Hz, dur=seconds, type=oscillator waveform, vol=peak gain.
function beep(freq, dur, type = 'square', vol = 0.12) {
  if (muted) return;
  try {
    const c = getCtx();
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(vol, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + dur);
  } catch (_) {}
}

// Ascending 4-note fanfare played when a player defeats their monster.
export function playKill() {
  [330, 415, 494, 659].forEach((f, i) => setTimeout(() => beep(f, 0.18), i * 85));
  speakRandom(KILL_PHRASES);
}

// 8-note arpeggio celebration played when all players defeat their monsters on the same day.
export function playFanfare() {
  [261, 329, 392, 523, 659, 784, 1047, 1047].forEach((f, i) =>
    setTimeout(() => beep(f, i === 7 ? 0.55 : 0.18, 'square', 0.11), i * 75)
  );
  speakRandom(FANFARE_PHRASES);
}

// Descending two-tone played when a chore claim is undone.
export function playUndo() {
  beep(440, 0.07);
  setTimeout(() => beep(330, 0.1), 55);
}

// 3-note rising chime played when a reward is redeemed.
export function playRedeem() {
  [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 0.13), i * 65));
}

// Sharp 5-note ascending arpeggio played on any chore completion that doesn't kill the monster.
export function playHit() {
  [494, 659, 880, 1175, 1568].forEach((f, i) =>
    setTimeout(() => beep(f, i === 4 ? 0.3 : 0.1, 'square', 0.15), i * 50)
  );
  speakRandom(HIT_PHRASES);
}

// Bright double-ding when a dungeon key is picked up.
export function playKeyPickup() {
  beep(1320, 0.14, 'sine', 0.18);
  setTimeout(() => beep(1760, 0.20, 'sine', 0.15), 120);
}

// ── Voice line announcer (Web Speech API — no audio files needed) ──────────
const KILL_PHRASES = [
  'Monster defeated!',
  'You did it!',
  'Boss down!',
  'Quest complete!',
  'Enemy vanquished!',
  'Loot secured!',
];

const HIT_PHRASES = [
  'Good hit!',
  'Epic hit!',
  'Critical strike!',
  'Nice one!',
  'Devastating blow!',
];

const FANFARE_PHRASES = [
  'Victory!',
  'Dungeon cleared!',
  'You got them all!',
  'Legendary!',
];

// Speaks a random phrase from the given pool, so repeats feel fresh.
function speakRandom(phrases) {
  if (muted) return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  try {
    synth.cancel(); // interrupt any line still queued from a prior hit
    const utter = new SpeechSynthesisUtterance(phrases[Math.floor(Math.random() * phrases.length)]);
    utter.rate = 1.05;
    utter.pitch = 0.85;
    synth.speak(utter);
  } catch (_) {}
}
