// Procedural sound manager using Web Audio API
// All sounds are synthesized — no external files needed

let audioCtx = null;
let isMuted = false;
let masterGain = null;
let ambientSource = null;
let ambientRunning = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function getMaster() {
  getCtx();
  return masterGain;
}

// ── Utility: play a tone ──
function playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
  if (isMuted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
  gain.gain.setValueAtTime(0, ctx.currentTime + delay);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(getMaster());
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

// ── Utility: noise burst ──
function playNoise(duration, volume = 0.05, delay = 0) {
  if (isMuted) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * volume;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  filter.Q.value = 0.5;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(getMaster());
  source.start(ctx.currentTime + delay);
}

// ══════════════════════════════════════
//  SOUND EFFECTS
// ══════════════════════════════════════

// Soft click for UI interactions (tabs, toggles)
export function playClick() {
  playTone(800, 0.06, 'sine', 0.12);
  playTone(1200, 0.04, 'sine', 0.06, 0.02);
}

// Coin / cash register for purchases and revenue
export function playCoin() {
  playTone(1318, 0.1, 'sine', 0.2);
  playTone(1568, 0.1, 'sine', 0.15, 0.08);
  playTone(2093, 0.15, 'sine', 0.12, 0.15);
}

// Purchase / spend money (descending)
export function playSpend() {
  playTone(880, 0.08, 'triangle', 0.15);
  playTone(660, 0.1, 'triangle', 0.12, 0.07);
  playNoise(0.05, 0.03, 0.05);
}

// Success chime for upgrades, saves
export function playSuccess() {
  playTone(523, 0.12, 'sine', 0.2);
  playTone(659, 0.12, 'sine', 0.18, 0.1);
  playTone(784, 0.2, 'sine', 0.22, 0.2);
}

// Error buzz
export function playError() {
  playTone(200, 0.15, 'sawtooth', 0.08);
  playTone(180, 0.15, 'sawtooth', 0.06, 0.05);
}

// Random event notification — mysterious bell
export function playEvent() {
  playTone(880, 0.3, 'sine', 0.15);
  playTone(1108, 0.3, 'sine', 0.1, 0.15);
  playTone(880, 0.2, 'sine', 0.08, 0.35);
  playNoise(0.1, 0.02);
}

// Day start — upbeat opening
export function playDayStart() {
  playTone(392, 0.15, 'sine', 0.18);
  playTone(494, 0.15, 'sine', 0.16, 0.12);
  playTone(587, 0.15, 'sine', 0.14, 0.24);
  playTone(784, 0.25, 'sine', 0.2, 0.36);
}

// Day end — closing summary sound
export function playDayEnd() {
  playCoin();
  setTimeout(() => {
    if (!isMuted) {
      playTone(784, 0.2, 'sine', 0.15);
      playTone(659, 0.2, 'sine', 0.12, 0.15);
      playTone(523, 0.3, 'sine', 0.18, 0.3);
    }
  }, 200);
}

// Victory fanfare
export function playWin() {
  const notes = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
  const times = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.75, 0.87, 1.0];
  const durs = [0.1, 0.1, 0.1, 0.1, 0.2, 0.12, 0.1, 0.1, 0.5];
  notes.forEach((f, i) => {
    playTone(f, durs[i], 'sine', 0.2, times[i]);
  });
}

// Defeat — somber
export function playLose() {
  playTone(392, 0.4, 'sine', 0.15);
  playTone(349, 0.4, 'sine', 0.13, 0.35);
  playTone(330, 0.4, 'sine', 0.12, 0.7);
  playTone(262, 0.8, 'sine', 0.15, 1.05);
}

// Upgrade purchased — level-up shimmer
export function playUpgrade() {
  playTone(440, 0.1, 'sine', 0.15);
  playTone(554, 0.1, 'sine', 0.15, 0.08);
  playTone(659, 0.1, 'sine', 0.15, 0.16);
  playTone(880, 0.25, 'sine', 0.2, 0.24);
  playNoise(0.08, 0.02, 0.24);
}

// ══════════════════════════════════════
//  AMBIENT COFFEE SHOP BACKGROUND
// ══════════════════════════════════════

export function startAmbient() {
  if (isMuted || ambientRunning) return;
  const ctx = getCtx();

  // Create a warm, gentle ambient loop using filtered noise + subtle drone
  const bufferSize = ctx.sampleRate * 4; // 4 seconds loop
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      // Very soft brownian noise
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * 0.015 +
        Math.sin(t * 0.8 * Math.PI * 2) * 0.003 +  // very subtle drone
        Math.sin(t * 1.2 * Math.PI * 2) * 0.002;
    }
  }

  ambientSource = ctx.createBufferSource();
  ambientSource.buffer = buffer;
  ambientSource.loop = true;

  // Warm low-pass filter
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 400;
  lp.Q.value = 0.3;

  const ambientGain = ctx.createGain();
  ambientGain.gain.value = 0.6;

  ambientSource.connect(lp);
  lp.connect(ambientGain);
  ambientGain.connect(getMaster());
  ambientSource.start();
  ambientRunning = true;
}

export function stopAmbient() {
  if (ambientSource) {
    try { ambientSource.stop(); } catch (e) { /* ignore */ }
    ambientSource = null;
  }
  ambientRunning = false;
}

// ══════════════════════════════════════
//  MUTE CONTROL
// ══════════════════════════════════════

export function setMuted(muted) {
  isMuted = muted;
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 0.4;
  }
  if (muted) {
    stopAmbient();
  } else {
    startAmbient();
  }
}

export function getMuted() {
  return isMuted;
}

// Initialize audio context on first user interaction
export function initAudio() {
  getCtx();
}
