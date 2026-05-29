// Simple WebAudio beep for notifications (no external assets).
// Note: Some browsers require a user gesture before audio can play.
export function playNotificationSound() {
  if (typeof window === "undefined") return;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.value = 880; // A5

    // Quick, non-intrusive envelope
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);

    // Release resources
    setTimeout(() => {
      try {
        ctx.close();
      } catch {
        // ignore
      }
    }, 300);
  } catch {
    // Ignore autoplay restrictions / unsupported environments.
  }
}

