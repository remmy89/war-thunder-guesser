
// Simple synthesizer using Web Audio API
let audioCtx: AudioContext | null = null;

const getContext = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

export const initAudio = () => {
  const ctx = getContext();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
};

type SoundType = 'wrong' | 'reveal' | 'win' | 'loss' | 'click' | 'start';

export const playSound = async (type: SoundType) => {
  const ctx = getContext();
  // Auto-resume if needed (though best done on user click)
  if (ctx.state === 'suspended') await ctx.resume().catch(() => {});

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  const now = ctx.currentTime;

  switch (type) {
    case 'reveal':
      // High tech data processing blip
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.1);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
      break;

    case 'wrong':
      // Low digital error buzz
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
      break;

    case 'win':
      // Victory major arpeggio
      const winNotes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C E G C E
      winNotes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'square';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.05, now + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        o.start(now + i * 0.08);
        o.stop(now + i * 0.08 + 0.3);
      });
      break;

    case 'loss':
      // Defeat descending dissonance
      const lossNotes = [300, 250, 200, 100];
      lossNotes.forEach((freq, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = 'triangle';
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.1, now + i * 0.15);
        g.gain.linearRampToValueAtTime(0.001, now + i * 0.15 + 0.4);
        o.start(now + i * 0.15);
        o.stop(now + i * 0.15 + 0.4);
      });
      break;
      
    case 'click':
      // Short high click
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
      break;

    case 'start':
      // Power up sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
      break;
  }
};
