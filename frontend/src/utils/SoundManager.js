// Процедурный менеджер звука с использованием Web Audio API
// Все звуки синтезированы — внешние файлы не требуются

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

// ── Утилита: воспроизвести тон ──
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

// ── Утилита: шумовой всплеск ──
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

  // Полосовой фильтр для теплоты
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
//  ЗВУКОВЫЕ ЭФФЕКТЫ
// ══════════════════════════════════════

// Мягкий клик для взаимодействий с интерфейсом (вкладки, переключатели)
export function playClick() {
  playTone(800, 0.06, 'sine', 0.12);
  playTone(1200, 0.04, 'sine', 0.06, 0.02);
}

// Монеты / кассовый аппарат для покупок и дохода
export function playCoin() {
  playTone(1318, 0.1, 'sine', 0.2);
  playTone(1568, 0.1, 'sine', 0.15, 0.08);
  playTone(2093, 0.15, 'sine', 0.12, 0.15);
}

// Покупка / трата денег (нисходящий)
export function playSpend() {
  playTone(880, 0.08, 'triangle', 0.15);
  playTone(660, 0.1, 'triangle', 0.12, 0.07);
  playNoise(0.05, 0.03, 0.05);
}

// Успешный звук для улучшений, сохранений
export function playSuccess() {
  playTone(523, 0.12, 'sine', 0.2);
  playTone(659, 0.12, 'sine', 0.18, 0.1);
  playTone(784, 0.2, 'sine', 0.22, 0.2);
}

// Звук ошибки
export function playError() {
  playTone(200, 0.15, 'sawtooth', 0.08);
  playTone(180, 0.15, 'sawtooth', 0.06, 0.05);
}

// Уведомление о случайном событии — загадочный колокольчик
export function playEvent() {
  playTone(880, 0.3, 'sine', 0.15);
  playTone(1108, 0.3, 'sine', 0.1, 0.15);
  playTone(880, 0.2, 'sine', 0.08, 0.35);
  playNoise(0.1, 0.02);
}

// Начало дня — энергичное открытие
export function playDayStart() {
  playTone(392, 0.15, 'sine', 0.18);
  playTone(494, 0.15, 'sine', 0.16, 0.12);
  playTone(587, 0.15, 'sine', 0.14, 0.24);
  playTone(784, 0.25, 'sine', 0.2, 0.36);
}

// Конец дня — заключительный звук
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

// Победный гимн
export function playWin() {
  const notes = [523, 523, 523, 659, 784, 784, 659, 784, 1047];
  const times = [0, 0.12, 0.24, 0.36, 0.48, 0.6, 0.75, 0.87, 1.0];
  const durs = [0.1, 0.1, 0.1, 0.1, 0.2, 0.12, 0.1, 0.1, 0.5];
  notes.forEach((f, i) => {
    playTone(f, durs[i], 'sine', 0.2, times[i]);
  });
}

// Поражение — мрачный
export function playLose() {
  playTone(392, 0.4, 'sine', 0.15);
  playTone(349, 0.4, 'sine', 0.13, 0.35);
  playTone(330, 0.4, 'sine', 0.12, 0.7);
  playTone(262, 0.8, 'sine', 0.15, 1.05);
}

// Улучшение куплено — мерцание повышения уровня
export function playUpgrade() {
  playTone(440, 0.1, 'sine', 0.15);
  playTone(554, 0.1, 'sine', 0.15, 0.08);
  playTone(659, 0.1, 'sine', 0.15, 0.16);
  playTone(880, 0.25, 'sine', 0.2, 0.24);
  playNoise(0.08, 0.02, 0.24);
}

// ══════════════════════════════════════
//  ФОНОВАЯ АТМОСФЕРА КОФЕЙНИ
// ══════════════════════════════════════

export function startAmbient() {
  if (isMuted || ambientRunning) return;
  const ctx = getCtx();

  // Создать тёплый, мягкий фоновый цикл с использованием фильтрованного шума + лёгкий гул
  const bufferSize = ctx.sampleRate * 4; // 4 секунды цикл
  const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < bufferSize; i++) {
      // Очень мягкий броуновский шум
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * 0.015 +
        Math.sin(t * 0.8 * Math.PI * 2) * 0.003 +  // очень лёгкий гул
        Math.sin(t * 1.2 * Math.PI * 2) * 0.002;
    }
  }

  ambientSource = ctx.createBufferSource();
  ambientSource.buffer = buffer;
  ambientSource.loop = true;

  // Тёплый фильтр низких частот
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
    try { ambientSource.stop(); } catch (e) { /* игнорировать */ }
    ambientSource = null;
  }
  ambientRunning = false;
}

// ══════════════════════════════════════
//  УПРАВЛЕНИЕ ОТКЛЮЧЕНИЕМ ЗВУКА
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

// Инициализировать аудио контекст при первом взаимодействии пользователя
export function initAudio() {
  getCtx();
}
