// Modern hardwood / xylem (marimba-like) notification sound.
// Uses WebAudio with two partials for a warm, hollow wooden timbre.
export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Two oscillators create the wooden character
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    // Warm low-pass to soften the tone
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(0.4, now);

    // Fundamental — wooden bar pitch (A4)
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(220, now + 0.22);

    // Harmonic partial — gives the hollow xylem body
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(880, now);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 0.18);

    // Short, percussive envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.32);
    osc2.stop(now + 0.32);

    setTimeout(() => {
      try { ctx.close(); } catch { /* ignore */ }
    }, 400);
  } catch {
    // Ignore autoplay restrictions / unsupported environments.
  }
}

/** High-frequency urgent beep for admin OTP alerts (3 rapid beeps ~1800Hz) */
export function playOtpAlertSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);

    const beepCount = 3;
    const beepDur = 0.12;
    const gap = 0.08;

    for (let i = 0; i < beepCount; i++) {
      const t = now + i * (beepDur + gap);
      const osc = ctx.createOscillator();
      osc.type = "square";
      osc.frequency.setValueAtTime(1800, t);
      osc.frequency.exponentialRampToValueAtTime(1600, t + beepDur);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.3, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + beepDur);

      osc.connect(env);
      env.connect(gain);
      osc.start(t);
      osc.stop(t + beepDur);
    }

    setTimeout(() => {
      try { ctx.close(); } catch { /* ignore */ }
    }, 1000);
  } catch {
    // Ignore autoplay restrictions.
  }
}

