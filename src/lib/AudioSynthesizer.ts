// Web Audio API ambient sound generator for serene 432Hz yoga meditation tones
class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscillators: OscillatorNode[] = [];
  private isPlaying = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
  }

  playDrone(fundamentalFreq = 432, duration = 30) {
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    this.isPlaying = true;

    // Create 3 harmonic oscillators for singing bowl rich timbre
    const freqs = [fundamentalFreq, fundamentalFreq * 1.5, fundamentalFreq * 2];
    const types: OscillatorType[] = ['sine', 'triangle', 'sine'];

    this.oscillators = freqs.map((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = types[i];
      osc.frequency.setValueAtTime(freq, now);

      // Subtle vibrato
      const lfo = this.ctx!.createOscillator();
      const lfoGain = this.ctx!.createGain();
      lfo.frequency.setValueAtTime(0.2, now);
      lfoGain.gain.setValueAtTime(2.0, now);
      lfo.connect(osc.frequency);
      lfo.start(now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08 / (i + 1), now + 2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + duration);
      return osc;
    });

    setTimeout(() => {
      this.isPlaying = false;
    }, duration * 1000);
  }

  stop() {
    if (this.oscillators.length > 0) {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      this.oscillators = [];
    }
    this.isPlaying = false;
  }

  get state() {
    return this.isPlaying;
  }
}

export const soundSynthesizer = new SoundSynthesizer();
