document.addEventListener('DOMContentLoaded', () => {

  /* ============================================
     AUDIO EFFECTS SYNTHESIZER (Web Audio API)
  ============================================ */
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;

  function initAudioCtx() {
    if (!audioCtx) {
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, type = 'sine', duration = 0.15, vol = 0.08) {
    try {
      initAudioCtx();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  }

  function playSuccessChord() {
    playTone(523.25, 'triangle', 0.4, 0.1); // C5
    setTimeout(() => playTone(659.25, 'triangle', 0.4, 0.1), 100); // E5
    setTimeout(() => playTone(783.99, 'triangle', 0.4, 0.1), 200); // G5
    setTimeout(() => playTone(1046.50, 'sine', 0.6, 0.12), 300); // C6
  }

  function playErrorBuzzer() {
    playTone(220, 'sawtooth', 0.2, 0.12);
    setTimeout(() => playTone(180, 'sawtooth', 0.25, 0.12), 120);
  }

  /* ============================================
     BACKGROUND MUSIC
  ============================================ */
  const bgm = document.getElementById('bgm');
  const bgmBtn = document.getElementById('bgm-btn');
  let isPlaying = false;

  if (bgm && bgmBtn) {
    bgm.volume = 0.5;
    const bgmContainer = bgmBtn.closest('.bgm-container');

    const updatePlayState = () => {
      isPlaying = true;
      bgmBtn.innerHTML = '🔊';
      if (bgmContainer) bgmContainer.classList.add('playing');
    };

    const updatePauseState = () => {
      isPlaying = false;
      bgmBtn.innerHTML = '🎵';
      if (bgmContainer) bgmContainer.classList.remove('playing');
    };

    bgm.addEventListener('play', updatePlayState);
    bgm.addEventListener('pause', updatePauseState);

    const tryPlayMusic = () => {
      initAudioCtx();
      if (bgm.paused) {
        bgm.play().then(() => {
          ['click', 'touchstart'].forEach(evt => {
            document.removeEventListener(evt, tryPlayMusic);
          });
        }).catch(() => {});
      }
    };

    tryPlayMusic();
    ['click', 'touchstart'].forEach(evt => {
      document.addEventListener(evt, tryPlayMusic, { once: true });
    });

    bgmBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      initAudioCtx();
      if (bgm.paused) {
        bgm.play().catch(e => console.log(e));
      } else {
        bgm.pause();
      }
    });
  }

  /* ============================================
     QUESTIONNAIRE FLOW CONTROLLER
  ============================================ */
  const steps = [
    document.getElementById('step-1'),
    document.getElementById('step-2'),
    document.getElementById('step-3')
  ];
  const progressFill = document.getElementById('progress-fill');
  const progressStepText = document.getElementById('progress-step-text');
  const progressStepTitle = document.getElementById('progress-step-title');

  let currentStep = 1;

  function goToStep(stepNumber) {
    if (stepNumber < 1 || stepNumber > 3) return;

    // Fade out current step
    steps[currentStep - 1].classList.remove('active');

    setTimeout(() => {
      currentStep = stepNumber;
      // Update progress UI
      const percent = (currentStep / 3) * 100;
      if (progressFill) progressFill.style.width = `${percent}%`;
      if (progressStepText) progressStepText.innerText = `Chặng ${currentStep}/3`;

      if (progressStepTitle) {
        if (currentStep === 1) progressStepTitle.innerText = 'Xác thực';
        else if (currentStep === 2) progressStepTitle.innerText = 'Tâm sự';
        else if (currentStep === 3) progressStepTitle.innerText = 'Câu hỏi quyết định';
      }

      // Activate new step
      steps[currentStep - 1].classList.add('active');
    }, 220);
  }

  // Step 1: Both options advance to Step 2
  const step1Choice1 = document.getElementById('step1-choice1');
  const step1Choice2 = document.getElementById('step1-choice2');

  function handleStep1() {
    playTone(480, 'sine', 0.15, 0.08);
    goToStep(2);
  }

  if (step1Choice1) step1Choice1.addEventListener('click', handleStep1);
  if (step1Choice2) step1Choice2.addEventListener('click', handleStep1);

  // Step 2: Both options advance to Step 3
  const step2Choice1 = document.getElementById('step2-choice1');
  const step2Choice2 = document.getElementById('step2-choice2');

  function handleStep2() {
    playTone(540, 'sine', 0.15, 0.08);
    goToStep(3);
  }

  if (step2Choice1) step2Choice1.addEventListener('click', handleStep2);
  if (step2Choice2) step2Choice2.addEventListener('click', handleStep2);

  /* ============================================
     STEP 3: THE FINAL PROPOSAL
  ============================================ */
  const yesBtn = document.getElementById('final-yes-btn');
  const noBtn = document.getElementById('final-no-btn');
  const errorModal = document.getElementById('error-modal');
  const errorModalBtn = document.getElementById('error-modal-btn');
  const errorDialog = errorModal ? errorModal.querySelector('.modal-dialog') : null;
  const victoryModal = document.getElementById('victory-modal');

  let rejectCount = 0;
  let yesScale = 1;

  function runawayNoButton() {
    if (rejectCount >= 1) {
      const maxX = 70;
      const maxY = 40;
      const randomX = (Math.random() - 0.5) * maxX * 2;
      const randomY = (Math.random() - 0.5) * maxY * 2;
      noBtn.style.transform = `translate(${randomX}px, ${randomY}px)`;
    }
  }

  if (noBtn) {
    noBtn.addEventListener('mouseenter', runawayNoButton);
    noBtn.addEventListener('touchstart', runawayNoButton, { passive: true });

    noBtn.addEventListener('click', (e) => {
      e.preventDefault();
      rejectCount++;
      playErrorBuzzer();

      if (errorModal) {
        errorModal.classList.add('active');
        if (errorDialog) {
          errorDialog.classList.remove('shake');
          void errorDialog.offsetWidth;
          errorDialog.classList.add('shake');
        }
      }

      // Slightly increase YES button prominence
      yesScale += 0.1;
      if (yesBtn) {
        yesBtn.style.transform = `scale(${yesScale})`;
      }
    });
  }

  if (errorModalBtn) {
    errorModalBtn.addEventListener('click', () => {
      if (errorModal) errorModal.classList.remove('active');
      if (yesBtn) {
        yesBtn.focus();
      }
    });
  }

  // YES BUTTON CLICKED ("Dạ có ạ") -> CELEBRATION!
  if (yesBtn) {
    yesBtn.addEventListener('click', () => {
      playSuccessChord();
      launchCelebrationConfetti();

      setTimeout(() => {
        if (victoryModal) {
          victoryModal.classList.add('active');
        }
      }, 350);
    });
  }

  /* ============================================
     CELEBRATION CONFETTI
  ============================================ */
  function launchCelebrationConfetti() {
    if (typeof confetti !== 'function') return;

    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const colors = ['#2e6fd4', '#ff4d88', '#5b9bf5', '#ffffff'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.7 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.7 },
        colors: colors
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    }());
  }

  /* ============================================
     VICTORY MODAL ACTION
  ============================================ */
  const kissBtn = document.getElementById('kiss-btn');

  if (kissBtn) {
    kissBtn.addEventListener('click', () => {
      playTone(660, 'sine', 0.25, 0.12);
      if (typeof confetti === 'function') {
        confetti({
          particleCount: 35,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ff4d88', '#2e6fd4', '#ffffff']
        });
      }
    });
  }

});
