/**
 * notification-sound.ts — Generates and plays notification sounds using
 * the Web Audio API. No external audio files needed.
 *
 * - `ringtone`  : looping ringtone for incoming calls (stop via returned handle)
 * - `message`   : short one-shot chime for new messages
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
    if (!audioCtx || audioCtx.state === 'closed') {
        audioCtx = new AudioContext();
    }
    // Resume if suspended (browser autoplay policy)
    if (audioCtx.state === 'suspended') {
        void audioCtx.resume();
    }
    return audioCtx;
}

// ---------------------------------------------------------------------------
// Ringtone — repeating two-tone ring pattern (plays until stopped)
// ---------------------------------------------------------------------------

export interface RingtoneHandle {
    stop: () => void;
}

/**
 * Play a looping ringtone. Returns a handle with `stop()` to silence it.
 * Pattern: two short beeps ("doo-doo"), 1.5 s pause, repeat.
 */
export function playRingtone(): RingtoneHandle {
    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.35;
    gainNode.connect(ctx.destination);

    let stopped = false;
    let currentTimeout: ReturnType<typeof setTimeout> | null = null;
    let activeOscs: OscillatorNode[] = [];

    function ring() {
        if (stopped) return;

        const now = ctx.currentTime;

        // Beep 1
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(440, now);        // A4
        osc1.frequency.setValueAtTime(523.25, now + 0.1); // C5
        osc1.connect(gainNode);
        osc1.start(now);
        osc1.stop(now + 0.25);
        activeOscs.push(osc1);

        // Beep 2
        const osc2 = ctx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(440, now + 0.35);
        osc2.frequency.setValueAtTime(523.25, now + 0.45);
        osc2.connect(gainNode);
        osc2.start(now + 0.35);
        osc2.stop(now + 0.6);
        activeOscs.push(osc2);

        // Clean up ended oscillators
        osc1.onended = () => { activeOscs = activeOscs.filter((o) => o !== osc1); };
        osc2.onended = () => { activeOscs = activeOscs.filter((o) => o !== osc2); };

        // Repeat after pause
        currentTimeout = setTimeout(ring, 2000);
    }

    ring();

    return {
        stop() {
            stopped = true;
            if (currentTimeout) clearTimeout(currentTimeout);
            activeOscs.forEach((o) => {
                try { o.stop(); } catch { /* already stopped */ }
            });
            activeOscs = [];
            gainNode.disconnect();
        },
    };
}

// ---------------------------------------------------------------------------
// Message notification — short pleasant chime
// ---------------------------------------------------------------------------

let lastMessageSoundTime = 0;
const MESSAGE_SOUND_COOLDOWN_MS = 800; // avoid rapid-fire sounds

/**
 * Play a short notification chime for a new message.
 * Debounced so rapid successive messages don't stack.
 */
export function playMessageSound(): void {
    const now = Date.now();
    if (now - lastMessageSoundTime < MESSAGE_SOUND_COOLDOWN_MS) return;
    lastMessageSoundTime = now;

    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    gainNode.connect(ctx.destination);

    // Two-note chime: E5 → G5
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(659.25, ctx.currentTime);      // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
    osc.connect(gainNode);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.35);

    osc.onended = () => gainNode.disconnect();
}
