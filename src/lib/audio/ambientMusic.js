/**
 * Ambient Procedural Music Engine for Energy Tycoon
 * Inspired by Firewatch (Chris Remo) & Minecraft (C418)
 * 
 * Features:
 * - Rich analog polyphonic synth pad swells with lush low-pass filter sweeps
 * - Sparse, soulful C418-style acoustic felt piano & Rhodes chimes with stereo delay
 * - Subtle mountain wilderness breeze / forest air ambient texture
 * - Adaptive day / night chord progressions (D Major warmth -> B Minor starlight)
 * - Zero external audio file dependencies (100% Web Audio API procedural synthesis)
 * - Smooth fade-ins/fade-outs and graceful browser autoplay policy handling
 */

// Musical Note Frequencies (Hz) in D Major / B Minor scale
const NOTES = {
  // Octave 2
  B2: 123.47,
  // Octave 3
  D3: 146.83,
  E3: 164.81,
  F3s: 185.00,
  G3: 196.00,
  A3: 220.00,
  B3: 246.94,
  C4s: 277.18,
  // Octave 4
  D4: 293.66,
  E4: 329.63,
  F4s: 369.99,
  G4: 392.00,
  A4: 440.00,
  B4: 493.88,
  C5s: 554.37,
  // Octave 5
  D5: 587.33,
  E5: 659.25,
  F5s: 739.99,
  A5: 880.00
};

// Day Progression: Warm, expansive, nostalgic Firewatch sunset
const DAY_CHORDS = [
  {
    name: 'Dadd9/F#',
    pad: [NOTES.F3s, NOTES.A3, NOTES.D4, NOTES.E4],
    piano: [NOTES.A3, NOTES.D4, NOTES.E4, NOTES.F4s, NOTES.A4, NOTES.D5]
  },
  {
    name: 'Gmaj9',
    pad: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.F4s],
    piano: [NOTES.B3, NOTES.D4, NOTES.F4s, NOTES.A4, NOTES.B4, NOTES.D5, NOTES.E5]
  },
  {
    name: 'Bm9',
    pad: [NOTES.B2, NOTES.F3s, NOTES.A3, NOTES.C4s],
    piano: [NOTES.D4, NOTES.F4s, NOTES.A4, NOTES.C5s, NOTES.D5]
  },
  {
    name: 'Aadd4',
    pad: [NOTES.A3, NOTES.C4s, NOTES.D4, NOTES.E4],
    piano: [NOTES.A3, NOTES.C4s, NOTES.E4, NOTES.A4, NOTES.C5s, NOTES.E5]
  },
  {
    name: 'Em9',
    pad: [NOTES.E3, NOTES.G3, NOTES.B3, NOTES.D4],
    piano: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.F4s, NOTES.A4, NOTES.B4]
  }
];

// Night Progression: Starry, tranquil, contemplative Minecraft (C418) stillness
const NIGHT_CHORDS = [
  {
    name: 'Bm7',
    pad: [NOTES.B2, NOTES.F3s, NOTES.A3, NOTES.D4],
    piano: [NOTES.F4s, NOTES.A4, NOTES.D5, NOTES.F5s]
  },
  {
    name: 'Gmaj7',
    pad: [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.F4s],
    piano: [NOTES.G4, NOTES.B4, NOTES.D5, NOTES.F5s]
  },
  {
    name: 'Dmaj9',
    pad: [NOTES.D3, NOTES.A3, NOTES.C4s, NOTES.E4],
    piano: [NOTES.A4, NOTES.C5s, NOTES.E5, NOTES.F5s]
  },
  {
    name: 'F#m7',
    pad: [NOTES.F3s, NOTES.A3, NOTES.C4s, NOTES.E4],
    piano: [NOTES.A4, NOTES.C5s, NOTES.E5, NOTES.A5]
  }
];

class AmbientMusicEngine {
  constructor() {
    this.audioCtx = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbNode = null;
    this.delayNode = null;
    this.delayGain = null;
    this.windNode = null;
    this.windGain = null;

    this.enabled = true;
    this.userVolume = 0.65;
    this.isNight = false;
    this.isPlaying = false;
    this.chordTimer = null;
    this.melodyTimers = [];
    this.currentChordIndex = 0;
  }

  // Initialize Web Audio graph
  initAudio() {
    if (this.audioCtx || typeof window === 'undefined') return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      this.audioCtx = new AudioContextClass();

      // Master Compressor with generous headroom to ensure loud, clear, distortion-free output
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -16;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 2.5;
      this.compressor.attack.value = 0.03;
      this.compressor.release.value = 0.25;

      // Master Gain Node
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.enabled ? this.userVolume : 0.0001, this.audioCtx.currentTime);

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioCtx.destination);

      // Procedural Lush Stereo Reverb Impulse (2.4s decay)
      this.reverbNode = this.audioCtx.createConvolver();
      this.reverbNode.buffer = this.createReverbBuffer(2.4, 2.0);
      this.reverbNode.connect(this.masterGain);

      // Stereo Ping-Pong / Cross Delay for C418 piano reflections
      this.delayNode = this.audioCtx.createDelay();
      this.delayNode.delayTime.value = 0.52; // 520ms canyon delay
      this.delayGain = this.audioCtx.createGain();
      this.delayGain.gain.value = 0.32;

      // Gentle filter on delay feedback for natural analog tape warmth
      const delayFilter = this.audioCtx.createBiquadFilter();
      delayFilter.type = 'lowpass';
      delayFilter.frequency.value = 1400;

      this.delayNode.connect(delayFilter);
      delayFilter.connect(this.delayGain);
      this.delayGain.connect(this.delayNode);
      this.delayGain.connect(this.reverbNode);

      // Subtle Mountain Wind / Forest Air Layer
      this.initWindLayer();
    } catch (e) {
      console.warn('Web Audio initialization error:', e);
    }
  }

  // Generate synthetic impulse response for warm acoustic reverberation
  createReverbBuffer(duration, decay) {
    if (!this.audioCtx) return null;
    const sampleRate = this.audioCtx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const buffer = this.audioCtx.createBuffer(2, length, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * decay);
      // Gentle stereo diffusion
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }
    return buffer;
  }

  // Gentle pink-noise mountain breeze texture
  initWindLayer() {
    if (!this.audioCtx) return;
    try {
      const bufferSize = this.audioCtx.sampleRate * 3;
      const noiseBuffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);

      // Pink noise filter approximation
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.05;
      }

      const noiseSource = this.audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Bandpass filter to isolate deep wind whoosh (320Hz - 700Hz)
      const windFilter = this.audioCtx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.value = 450;
      windFilter.Q.value = 1.6;

      this.windGain = this.audioCtx.createGain();
      this.windGain.gain.setValueAtTime(0.03, this.audioCtx.currentTime);

      noiseSource.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      noiseSource.start(0);

      // Gentle wind gust LFO modulation (breathing every 9-14s)
      this.modulateWind();
    } catch (e) {
      // Ignore wind layer on restricted devices
    }
  }

  modulateWind() {
    if (!this.audioCtx || !this.windGain) return;
    const now = this.audioCtx.currentTime;
    const targetGain = 0.015 + Math.random() * 0.025;
    const duration = 6 + Math.random() * 6;

    this.windGain.gain.linearRampToValueAtTime(targetGain, now + duration);
    setTimeout(() => {
      if (this.isPlaying) this.modulateWind();
    }, duration * 1000);
  }

  // Play a lush multi-voice warm pad chord
  playPadChord(frequencies, duration = 14) {
    if (!this.audioCtx || !this.enabled) return;

    const now = this.audioCtx.currentTime;
    const attack = 3.5;
    const release = 4.5;
    const sustain = duration - attack;

    frequencies.forEach((freq, idx) => {
      // Voice gain (rich, warm, audible ambient swell)
      const voiceGain = this.audioCtx.createGain();
      const peakVolume = 0.16 / Math.sqrt(frequencies.length);

      voiceGain.gain.setValueAtTime(0.0001, now);
      voiceGain.gain.linearRampToValueAtTime(peakVolume, now + attack);
      voiceGain.gain.setValueAtTime(peakVolume, now + sustain);
      voiceGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // Warm low-pass filter with gentle movement
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(550 + idx * 70, now);
      filter.frequency.linearRampToValueAtTime(950 + idx * 90, now + attack);
      filter.frequency.linearRampToValueAtTime(500, now + duration);
      filter.Q.value = 1.0;

      // 2 Detuned Oscillators (Triangle + Soft Sine)
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.value = freq;
      osc1.detune.value = -6;

      const osc2 = this.audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq;
      osc2.detune.value = 6;

      osc1.connect(voiceGain);
      osc2.connect(voiceGain);
      voiceGain.connect(filter);

      // Stereo Pan
      if (this.audioCtx.createStereoPanner) {
        const panner = this.audioCtx.createStereoPanner();
        panner.pan.value = ((idx / (frequencies.length - 1 || 1)) - 0.5) * 0.7;
        filter.connect(panner);
        panner.connect(this.masterGain);
        panner.connect(this.reverbNode);
      } else {
        filter.connect(this.masterGain);
        filter.connect(this.reverbNode);
      }

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    });
  }

  // Play a soft C418-style felt piano / Rhodes note
  playPianoNote(freq, delaySeconds = 0, velocity = 1.0) {
    if (!this.audioCtx || !this.enabled) return;

    const startTime = this.audioCtx.currentTime + delaySeconds;
    const duration = 4.2;

    // Note Master Gain (clearly audible, rich felt piano timbre)
    const noteGain = this.audioCtx.createGain();
    const baseGain = 0.32 * velocity;

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.linearRampToValueAtTime(baseGain, startTime + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(baseGain * 0.35, startTime + 1.2);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    // Fundamental Tone (Sine)
    const osc1 = this.audioCtx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, startTime);

    // 2nd Harmonic (Warm Bell Resonance)
    const osc2 = this.audioCtx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, startTime);
    const osc2Gain = this.audioCtx.createGain();
    osc2Gain.gain.setValueAtTime(0.28, startTime);
    osc2Gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.6);
    osc2.connect(osc2Gain);
    osc2Gain.connect(noteGain);

    // 3rd Harmonic (Soft Shimmer)
    const osc3 = this.audioCtx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3, startTime);
    const osc3Gain = this.audioCtx.createGain();
    osc3Gain.gain.setValueAtTime(0.10, startTime);
    osc3Gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.9);
    osc3.connect(osc3Gain);
    osc3Gain.connect(noteGain);

    // Sub-harmonic warmth (Triangle body)
    const oscSub = this.audioCtx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(freq * 0.5, startTime);
    const subGain = this.audioCtx.createGain();
    subGain.gain.setValueAtTime(0.12, startTime);
    subGain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.8);
    oscSub.connect(subGain);
    subGain.connect(noteGain);

    osc1.connect(noteGain);

    // Filter to give that authentic "Felt" soft piano mute
    const feltFilter = this.audioCtx.createBiquadFilter();
    feltFilter.type = 'lowpass';
    feltFilter.frequency.setValueAtTime(1600, startTime);
    feltFilter.frequency.exponentialRampToValueAtTime(600, startTime + duration);

    noteGain.connect(feltFilter);

    // Stereo Panning
    if (this.audioCtx.createStereoPanner) {
      const panner = this.audioCtx.createStereoPanner();
      panner.pan.value = (Math.random() * 2 - 1) * 0.45;
      feltFilter.connect(panner);
      panner.connect(this.masterGain);
      panner.connect(this.delayNode);
      panner.connect(this.reverbNode);
    } else {
      feltFilter.connect(this.masterGain);
      feltFilter.connect(this.delayNode);
      feltFilter.connect(this.reverbNode);
    }

    osc1.start(startTime);
    osc2.start(startTime);
    osc3.start(startTime);
    oscSub.start(startTime);

    osc1.stop(startTime + duration);
    osc2.stop(startTime + duration);
    osc3.stop(startTime + duration);
    oscSub.stop(startTime + duration);
  }

  // Step through the ambient cycle
  tickProgression() {
    if (!this.isPlaying || !this.enabled) return;

    const chords = this.isNight ? NIGHT_CHORDS : DAY_CHORDS;
    const chord = chords[this.currentChordIndex % chords.length];
    this.currentChordIndex++;

    const chordDuration = 13 + Math.random() * 3; // 13-16s per chord

    // 1. Play warm background pad
    this.playPadChord(chord.pad, chordDuration);

    // 2. Play 2 to 4 sparse C418 piano notes during this chord
    const numNotes = Math.floor(2 + Math.random() * 3);
    const availablePitches = chord.piano;

    for (let i = 0; i < numNotes; i++) {
      const delay = 1.2 + i * (2.2 + Math.random() * 1.8);
      if (delay < chordDuration - 1.5) {
        const pitch = availablePitches[Math.floor(Math.random() * availablePitches.length)];
        const velocity = 0.65 + Math.random() * 0.35;
        this.playPianoNote(pitch, delay, velocity);
      }
    }

    // Schedule next chord with seamless overlap
    const nextWaitMs = (chordDuration - 3.5) * 1000;
    this.chordTimer = setTimeout(() => {
      this.tickProgression();
    }, nextWaitMs);
  }

  // Start background music
  start() {
    if (this.isPlaying) return;
    this.initAudio();

    if (!this.audioCtx) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    this.isPlaying = true;
    this.currentChordIndex = 0;

    // Fade in master gain smoothly
    if (this.masterGain && this.enabled) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.setValueAtTime(0.0001, now);
      this.masterGain.gain.linearRampToValueAtTime(this.userVolume, now + 2.5);
    }

    this.tickProgression();
  }

  // Stop background music
  stop() {
    this.isPlaying = false;
    if (this.chordTimer) {
      clearTimeout(this.chordTimer);
      this.chordTimer = null;
    }

    if (this.audioCtx && this.masterGain) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.2);
    }
  }

  // Handle user interaction to unlock browser autoplay
  resumeIfEnabled() {
    if (!this.enabled) return;
    if (!this.audioCtx) {
      this.start();
    } else if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().then(() => {
        if (!this.isPlaying) {
          this.start();
        }
      }).catch(() => {});
    } else if (!this.isPlaying) {
      this.start();
    }
  }

  // Update enable/disable setting
  setMusicEnabled(enabled) {
    this.enabled = !!enabled;

    if (!this.enabled) {
      if (this.audioCtx && this.masterGain) {
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.8);
      }
      this.stop();
    } else {
      if (!this.isPlaying) {
        this.start();
      } else if (this.audioCtx && this.masterGain) {
        const now = this.audioCtx.currentTime;
        this.masterGain.gain.linearRampToValueAtTime(this.userVolume, now + 1.5);
      }
    }
  }

  // Update volume (0.0 to 1.0)
  setMusicVolume(volume) {
    const clamped = Math.max(0, Math.min(1, Number(volume) || 0));
    this.userVolume = clamped;

    if (this.audioCtx && this.masterGain && this.enabled && this.isPlaying) {
      const now = this.audioCtx.currentTime;
      this.masterGain.gain.linearRampToValueAtTime(clamped, now + 0.2);
    }
  }

  // Update day/night mode
  setMusicNightMode(isNight) {
    this.isNight = !!isNight;
  }
}

// Global Singleton Instance
export const ambientMusic = new AmbientMusicEngine();
export default ambientMusic;

