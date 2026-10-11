// ==========================================================================
// CUONEDU PRO — MODULE: WEB AUDIO API (SYNTHESIZER & SFX)
// ==========================================================================
// ==========================================================================
// 5. WEB AUDIO API SYNTHESIZER (BGM & SFX ENGINE)
// ==========================================================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function playQuizizzTone(type) {
  if (!quizizzSoundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.07);
    } 
    else if (type === "correct") {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.055);
        gain.gain.setValueAtTime(0.2, now + i * 0.055);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.055 + 0.22);
        osc.start(now + i * 0.055);
        osc.stop(now + i * 0.055 + 0.24);
      });
    } 
    else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.setValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.3);
    } 
    else if (type === "streak") {
      [587.33, 739.99, 880.00, 1174.66, 1479.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.065);
        gain.gain.setValueAtTime(0.28, now + i * 0.065);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.28);
        osc.start(now + i * 0.065);
        osc.stop(now + i * 0.065 + 0.3);
      });
    } 
    else if (type === "powerup") {
      [400, 600, 850, 1200, 1600].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.04);
        gain.gain.setValueAtTime(0.2, now + i * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.04 + 0.16);
        osc.start(now + i * 0.04);
        osc.stop(now + i * 0.04 + 0.18);
      });
    }
    else if (type === "mystery") {
      [659.25, 830.61, 987.77, 1318.51, 1661.22].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.25, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.35);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.38);
      });
    }
    else if (type === "victory") {
      [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.3, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.4);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.42);
      });
    }
  } catch (e) {}
}

/**
 * Lively Quizizz-style Synthesizer Background Music Loop
 */
function startQuizizzBgm() {
  stopQuizizzBgm();
  quizizzBgmEnabled = true;
  const ctx = getAudioContext();
  if (!ctx) return;

  const btnBgm = document.getElementById("btn-quizizz-bgm");
  const iconBgm = document.getElementById("quizizz-bgm-icon");
  if (btnBgm) btnBgm.classList.add("bgm-pulsing");
  if (iconBgm) iconBgm.textContent = "BGM";

  try {
    if (ctx.state === "suspended") ctx.resume();

    const chords = [
      [261.63, 329.63, 392.00, 523.25], // C Major
      [220.00, 261.63, 329.63, 440.00], // A Minor
      [174.61, 220.00, 261.63, 349.23], // F Major
      [196.00, 246.94, 293.66, 392.00]  // G Major
    ];
    let step = 0;

    const playStep = () => {
      if (!quizizzBgmEnabled) return;
      const now = ctx.currentTime;
      const currentChord = chords[step % chords.length];

      // Arpeggiated soft synth chimes
      currentChord.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + i * 0.22);
        gain.gain.setValueAtTime(0.025, now + i * 0.22);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.22 + 1.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.22);
        osc.stop(now + i * 0.22 + 1.3);
      });

      // Warm Bass pulse
      const bassOsc = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bassOsc.type = "triangle";
      bassOsc.frequency.setValueAtTime(currentChord[0] / 2, now);
      bassGain.gain.setValueAtTime(0.035, now);
      bassGain.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
      bassOsc.connect(bassGain);
      bassGain.connect(ctx.destination);
      bassOsc.start(now);
      bassOsc.stop(now + 1.6);

      step++;
    };

    playStep();
    bgmInterval = setInterval(playStep, 1800);
  } catch (e) {}
}

function stopQuizizzBgm() {
  quizizzBgmEnabled = false;
  if (bgmInterval) {
    clearInterval(bgmInterval);
    bgmInterval = null;
  }
  const btnBgm = document.getElementById("btn-quizizz-bgm");
  const iconBgm = document.getElementById("quizizz-bgm-icon");
  if (btnBgm) btnBgm.classList.remove("bgm-pulsing");
  if (iconBgm) iconBgm.textContent = "BGM";
}

function toggleQuizizzSound() {
  quizizzSoundEnabled = !quizizzSoundEnabled;
  const icon = document.getElementById("quizizz-sound-icon");
  if (icon) icon.textContent = quizizzSoundEnabled ? "SFX" : "MUTE";
  showToast(quizizzSoundEnabled ? "Đã bật hiệu ứng âm thanh" : "Đã tắt hiệu ứng âm thanh", "info");
}

function toggleQuizizzBgm() {
  if (quizizzBgmEnabled) {
    stopQuizizzBgm();
    showToast("Đã tắt nhạc nền phòng thi", "info");
  } else {
    startQuizizzBgm();
    showToast("Đã bật nhạc nền phòng thi", "success");
  }
}

