// Web Audio API based ambient sounds and meditation chime

let audioCtx: AudioContext | null = null;
let activeSource: AudioNode | null = null;
let noiseGainNode: GainNode | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// 1. Play a warm meditative chime / singing bowl sound
export function playChime() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    const baseFreq = 528; // 528Hz Solfeggio frequency for healing & peace
    const freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2.02];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      const initialVolume = idx === 0 ? 0.2 : 0.08 / idx;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(initialVolume, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.3);
    });
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
}

// 2. Play gentle rain sound (synthesized pink noise with lowpass filter)
export function startGentleRain(): () => void {
  try {
    const ctx = getAudioContext();
    stopAmbientSound();

    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    // Pink-noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to make it sound like gentle rain outside the classroom
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();

    activeSource = whiteNoise;
    noiseGainNode = gain;

    return () => {
      stopAmbientSound();
    };
  } catch (e) {
    console.warn('Failed to start ambient sound:', e);
    return () => {};
  }
}

// 3. Stop ambient sound
export function stopAmbientSound() {
  if (noiseGainNode && audioCtx) {
    try {
      noiseGainNode.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.5);
      setTimeout(() => {
        try {
          if (activeSource && 'stop' in activeSource) {
            (activeSource as AudioBufferSourceNode).stop();
          }
        } catch {
          // ignore
        }
        activeSource = null;
        noiseGainNode = null;
      }, 500);
    } catch {
      activeSource = null;
      noiseGainNode = null;
    }
  } else {
    activeSource = null;
    noiseGainNode = null;
  }
}

// 4. Speech synthesis for reading comfort messages
export function speakComfortText(text: string, onEnd?: () => void): () => void {
  if (!('speechSynthesis' in window)) return () => {};

  window.speechSynthesis.cancel();

  // Clean markdown syntax for cleaner speech
  const cleanText = text
    .replace(/[#*`_~]/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .slice(0, 500); // Read first 500 chars for comfort without overloading

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'ko-KR';
  utterance.rate = 0.9; // Soft, relaxed tempo
  utterance.pitch = 1.0;

  // Prefer natural Korean voice if available
  const voices = window.speechSynthesis.getVoices();
  const koVoice = voices.find(v => v.lang.startsWith('ko') || v.lang.includes('Korean'));
  if (koVoice) {
    utterance.voice = koVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
  };
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
