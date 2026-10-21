/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Synthesized Web Audio API Manager
 * Zero external audio assets needed! Generates retro cyberpunk sound effects,
 * cable latch clicks, alarms, victory arpeggios, and an ambient sci-fi drone.
 */
class AudioManagerClass {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private bgmGain: GainNode | null = null;
  private bgmOsc1: OscillatorNode | null = null;
  private bgmOsc2: OscillatorNode | null = null;
  private isBgmPlaying: boolean = false;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.bgmGain) {
      this.bgmGain.gain.setValueAtTime(muted ? 0 : 0.08, this.ctx ? this.ctx.currentTime : 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * UI Click / Tap feedback
   */
  public playClick(pitch: number = 800) {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(pitch * 0.4, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.04);
    } catch {
      // Ignore audio failure
    }
  }

  /**
   * Cable connection snap / RJ-45 latch click
   */
  public playWireSnap() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Click transient
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(1400, t);
      clickOsc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
      clickGain.gain.setValueAtTime(0.12, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(t);
      clickOsc.stop(t + 0.06);

      // Low resonance thump
      const thumpOsc = this.ctx.createOscillator();
      const thumpGain = this.ctx.createGain();
      thumpOsc.type = 'sine';
      thumpOsc.frequency.setValueAtTime(120, t + 0.02);
      thumpOsc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
      thumpGain.gain.setValueAtTime(0.15, t + 0.02);
      thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      thumpOsc.connect(thumpGain);
      thumpGain.connect(this.ctx.destination);
      thumpOsc.start(t + 0.02);
      thumpOsc.stop(t + 0.12);
    } catch {
      // Ignore
    }
  }

  /**
   * Packet drop warning buzzer
   */
  public playPacketDrop() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.setValueAtTime(140, t + 0.05);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      // Ignore
    }
  }

  /**
   * Cash / Revenue milestone chime
   */
  public playCash() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      [987.77, 1318.51].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.06);
        gain.gain.setValueAtTime(0.08, t + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 0.18);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Victory fanfare arpeggio
   */
  public playVictory() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      const t = this.ctx.currentTime;

      notes.forEach((freq, i) => {
        const noteTime = t + i * 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.12, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.28);
      });
    } catch {
      // Ignore
    }
  }

  /**
   * Ambient Cyberpunk Synth Background Soundtrack
   * Soft sub-bass and filtered space chords that loop continuously
   */
  public toggleBgm(): boolean {
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  public startBgm() {
    if (this.isBgmPlaying) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.07, t);

      // Low pass filter for soft sci-fi drone
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, t);

      // Osc 1: Root sub
      this.bgmOsc1 = this.ctx.createOscillator();
      this.bgmOsc1.type = 'sine';
      this.bgmOsc1.frequency.setValueAtTime(55, t); // A1 note

      // Osc 2: Fifth with slight detune
      this.bgmOsc2 = this.ctx.createOscillator();
      this.bgmOsc2.type = 'triangle';
      this.bgmOsc2.frequency.setValueAtTime(82.41, t); // E2 note
      this.bgmOsc2.detune.setValueAtTime(4, t);

      this.bgmOsc1.connect(filter);
      this.bgmOsc2.connect(filter);
      filter.connect(this.bgmGain);
      this.bgmGain.connect(this.ctx.destination);

      this.bgmOsc1.start(t);
      this.bgmOsc2.start(t);
      this.isBgmPlaying = true;
    } catch {
      // Ignore
    }
  }

  public stopBgm() {
    try {
      if (this.bgmOsc1) {
        this.bgmOsc1.stop();
        this.bgmOsc1.disconnect();
        this.bgmOsc1 = null;
      }
      if (this.bgmOsc2) {
        this.bgmOsc2.stop();
        this.bgmOsc2.disconnect();
        this.bgmOsc2 = null;
      }
      if (this.bgmGain) {
        this.bgmGain.disconnect();
        this.bgmGain = null;
      }
      this.isBgmPlaying = false;
    } catch {
      // Ignore
    }
  }

  public isBgmActive(): boolean {
    return this.isBgmPlaying;
  }
}

export const AudioManager = new AudioManagerClass();
