/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * CYBERCORE: PROTOCOL ROGUE Procedural Web Audio Engine
 * Zero external audio assets! Pure Web Audio API synthesis for 120-BPM dynamic synthwave BGM
 * and distinct combat, mechanical, and roguelite SFX.
 */
class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private masterGain: GainNode | null = null;
  private masterVolume: number = 0.7;

  // 120 BPM Synthwave BGM
  private bgmGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private isBgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private bgmStep: number = 0;
  private combatIntensity: number = 0; // 0.0 (calm) to 1.0 (peak battle)

  constructor() {
    // Automatically attach window listeners so audio unlocks on the very first user interaction
    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.init();
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('pointerdown', unlockAudio);
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true });
    }
  }

  public init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    return this.setMuted(!this.isMuted);
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }

  /**
   * Adjust dynamic combat intensity to scale the 120-BPM BGM lowpass filter cutoff
   */
  public setCombatIntensity(intensity: number) {
    this.combatIntensity = Math.max(0, Math.min(1, intensity));
    if (this.bgmFilter && this.ctx) {
      // Base cutoff at 450Hz, scaling up to 3200Hz during intense waves
      const targetFreq = 450 + this.combatIntensity * 2750;
      this.bgmFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.15);
    }
  }

  /**
   * 120-BPM Driving Cyberpunk Bassline Loop
   */
  public startBGM() {
    if (this.isBgmPlaying) return;
    this.init();
    if (!this.ctx || !this.masterGain) return;

    this.isBgmPlaying = true;

    this.bgmFilter = this.ctx.createBiquadFilter();
    this.bgmFilter.type = 'lowpass';
    this.bgmFilter.frequency.setValueAtTime(500, this.ctx.currentTime);
    this.bgmFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.24, this.ctx.currentTime);

    this.bgmFilter.connect(this.bgmGain);
    this.bgmGain.connect(this.masterGain);

    // 120 BPM cyber driving sequence in D minor: D1 (36.7Hz), F1 (43.6Hz), G1 (49.0Hz), A1 (55.0Hz)
    const notes = [
      36.7, 36.7, 73.4, 36.7,
      36.7, 43.6, 36.7, 73.4,
      49.0, 49.0, 98.0, 49.0,
      55.0, 55.0, 43.6, 36.7,
    ];

    // 16th note at 120 BPM = 125ms
    const stepDuration = 0.125;
    this.bgmStep = 0;

    const playBgmStep = () => {
      if (!this.isBgmPlaying || !this.ctx || !this.bgmFilter) return;

      const t = this.ctx.currentTime;
      const baseFreq = notes[this.bgmStep % notes.length];
      const isAccent = this.bgmStep % 4 === 0;

      // Primary Sawtooth Oscillator
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, t);

      // Sub-bass Sine Layer
      const sub = this.ctx.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(baseFreq * 0.5, t);

      const amp = isAccent ? 0.32 : 0.22;
      oscGain.gain.setValueAtTime(amp, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + stepDuration * 0.88);

      osc.connect(oscGain);
      sub.connect(oscGain);
      oscGain.connect(this.bgmFilter);

      osc.start(t);
      sub.start(t);
      osc.stop(t + stepDuration * 0.9);
      sub.stop(t + stepDuration * 0.9);

      // Cyber Hi-Hat on offbeats during battle
      if (this.bgmStep % 2 === 1 && this.combatIntensity > 0.1) {
        this.playNoiseHat(t, 0.035, isAccent ? 0.08 : 0.04);
      }

      this.bgmStep = (this.bgmStep + 1) % 16;
      this.bgmTimer = window.setTimeout(playBgmStep, stepDuration * 1000);
    };

    playBgmStep();
  }

  private playNoiseHat(startTime: number, duration: number, volume: number) {
    if (!this.ctx || !this.masterGain) return;
    try {
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, startTime);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(startTime);
      noise.stop(startTime + duration);
    } catch {}
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer !== null) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // --- Procedural SFX Collection ---

  /**
   * Turret Servo Rotation Mechanical Sound
   */
  public playServoRotation() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.linearRampToValueAtTime(260, t + 0.05);

      gain.gain.setValueAtTime(0.04, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.06);
    } catch {}
  }

  /**
   * DPI Flak Cannon Twin-Burst
   */
  public playFlakBurst() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(620, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.07);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.07);
    } catch {}
  }

  /**
   * Firewall Thermal Plasma Beam Laser
   */
  public playPlasmaLaser(pitch: number = 880) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  /**
   * Next-Gen IPS Railgun Hypersonic Crack
   */
  public playRailgunCrack() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;

      // High voltage sonic crack
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(2600, t);
      osc1.frequency.exponentialRampToValueAtTime(340, t + 0.18);
      gain1.gain.setValueAtTime(0.28, t);
      gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc1.connect(gain1);
      gain1.connect(this.masterGain);
      osc1.start(t);
      osc1.stop(t + 0.18);

      // Deep sub recoil
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(160, t);
      osc2.frequency.exponentialRampToValueAtTime(30, t + 0.35);
      gain2.gain.setValueAtTime(0.35, t);
      gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.masterGain);
      osc2.start(t);
      osc2.stop(t + 0.35);
    } catch {}
  }

  /**
   * Packet Explosion & Detonation Crunch
   */
  public playPacketExplosion(isBoss: boolean = false) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const duration = isBoss ? 0.55 : 0.18;
      const bufferSize = Math.floor(this.ctx.sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(isBoss ? 420 : 880, t);
      filter.Q.setValueAtTime(1.8, t);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(isBoss ? 0.45 : 0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      noise.start(t);
      noise.stop(t + duration);
    } catch {}
  }

  /**
   * Boss Arrival Klaxon Siren
   */
  public playBossSiren() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.linearRampToValueAtTime(880, t + 0.28);
      osc.frequency.linearRampToValueAtTime(440, t + 0.56);
      osc.frequency.linearRampToValueAtTime(880, t + 0.84);
      osc.frequency.linearRampToValueAtTime(320, t + 1.2);

      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.2);
    } catch {}
  }

  /**
   * Roguelite Card Draft Fanfare
   */
  public playCardDraftFanfare() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      // High-tech shimmering arpeggio: F4, A4, C5, E5, G5
      const freqs = [349.23, 440.0, 523.25, 659.25, 783.99];
      freqs.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        const noteStart = t + idx * 0.07;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(noteStart);
        osc.stop(noteStart + 0.4);
      });
    } catch {}
  }

  /**
   * AGV Bot Data Orb Harvest & Coin Ping
   */
  public playCoinPing(bonus: boolean = false) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const freq = bonus ? 1318.51 : 987.77; // E6 or B5
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.setValueAtTime(freq * 1.5, t + 0.05);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.18);
    } catch {}
  }

  /**
   * Core EMP Overcharge Blast
   */
  public playEMPBlast() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(110, t);
      osc.frequency.exponentialRampToValueAtTime(1800, t + 0.25);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.85);

      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.9);
    } catch {}
  }

  /**
   * Cable connection snap / RJ-45 latch click
   */
  public playWireSnap() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, t);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.05);

      gain.gain.setValueAtTime(0.14, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.05);
    } catch {}
  }

  public playClick(pitch: number = 800) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, t + 0.04);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.04);
    } catch {}
  }

  public playPacketDrop() {
    this.playPacketExplosion(false);
  }

  public playPacketSuccess() {
    this.playCoinPing(false);
  }

  public playError() {
    this.playWarningAlert();
  }

  public playWarningAlert() {
    this.playBossSiren();
  }

  public playSnap() {
    this.playWireSnap();
  }

  public startBgm() {
    this.startBGM();
  }

  public playVictory() {
    this.playCardDraftFanfare();
  }

  public playVictoryChime() {
    this.playCardDraftFanfare();
  }
}

export const SoundFX = new SoundFXEngine();
export const AudioManager = SoundFX; // Unified alias
