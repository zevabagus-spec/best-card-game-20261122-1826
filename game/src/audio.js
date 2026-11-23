// AURORA CLASH — sound, synthesized live with WebAudio. No audio files, no
// network: every effect is a short oscillator or noise burst, and the mute
// key (M) silences them all.
let context = null;
let muted = false;

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

function ensureContext() {
  if (typeof window === 'undefined') return null;
  if (context === null) {
    const AudioContext = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioContext) return null;
    context = new AudioContext();
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

function tone(frequency, duration, type, volume, when = 0) {
  const audio = ensureContext();
  if (audio === null || muted) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const start = audio.currentTime + when;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

function noiseBurst(duration, volume, when = 0) {
  const audio = ensureContext();
  if (audio === null || muted) return;
  const length = Math.max(1, Math.floor(audio.sampleRate * duration));
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let index = 0; index < length; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / length);
  }
  const source = audio.createBufferSource();
  const gain = audio.createGain();
  gain.gain.value = volume;
  source.buffer = buffer;
  source.connect(gain).connect(audio.destination);
  source.start(audio.currentTime + when);
}

export const sfx = {
  select() { tone(660, 0.07, 'sine', 0.12); },
  flip() { noiseBurst(0.09, 0.10); tone(520, 0.08, 'triangle', 0.08); },
  deal() { noiseBurst(0.06, 0.08); },
  hit() { tone(140, 0.22, 'sawtooth', 0.16); noiseBurst(0.14, 0.14); },
  heal() { tone(523, 0.12, 'sine', 0.10); tone(784, 0.16, 'sine', 0.10, 0.09); },
  win() {
    [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.22, 'triangle', 0.14, index * 0.11));
  },
  lose() {
    [392, 330, 262, 196].forEach((frequency, index) => tone(frequency, 0.24, 'triangle', 0.12, index * 0.13));
  },
};
