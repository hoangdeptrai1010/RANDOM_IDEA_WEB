import { AssetLoader } from './assetLoader.js';
import { Cursor } from './cursor.js';
import { Cat } from './cat.js';
import { Particles } from './particles.js';
import { NPCCursor } from './npcCursor.js';
import { Pet } from './pet.js';
import { WeatherEngine } from './weather.js';
import { FootballGame } from './footballGame.js';
import { MmaGame } from './mmaGame.js';
import { SchoolJumpGame } from './schoolJumpGame.js';
import { ToxicDodgeGame } from './toxicDodgeGame.js';
import { BuddhaScene } from './buddhaScene.js';

const CAT_COLOR = 'white';
const MAX_NPC_PETS = 5;
const npcPets = [];

const PET_POOL = [
  { type: 'cat', colors: ['white', 'black', 'brown', 'orange', 'gray', 'lightbrown'] },
  { type: 'dog', colors: ['white', 'black', 'brown', 'akita', 'red'] },
  { type: 'bunny', colors: ['white', 'gray', 'pink', 'purple'] }
];

function getRandomPet() {
  const pool = PET_POOL[Math.floor(Math.random() * PET_POOL.length)];
  const color = pool.colors[Math.floor(Math.random() * pool.colors.length)];
  return { type: pool.type, color };
}

// Define reactive window.gameActive property to toggle body game-active class
let gameActiveVal = false;
Object.defineProperty(window, 'gameActive', {
  get() {
    return gameActiveVal;
  },
  set(val) {
    gameActiveVal = !!val;
    if (gameActiveVal) {
      document.body.classList.add('game-active');
    } else {
      document.body.classList.remove('game-active');
    }
  }
});

(async () => {
  // 1. Preload all assets
  try {
    await Promise.all([
      AssetLoader.load('heart', 'assets/cursor/heart.png'),
      AssetLoader.load('cat_idle', `assets/cat/${CAT_COLOR}_idle.png`),
      AssetLoader.load('cat_walk', `assets/cat/${CAT_COLOR}_walk.png`),
      AssetLoader.load('cat_run', `assets/cat/${CAT_COLOR}_run.png`),
      AssetLoader.load('cat_swipe', `assets/cat/${CAT_COLOR}_swipe.png`),
      AssetLoader.load('cat_with_ball', `assets/cat/${CAT_COLOR}_with_ball.png`),
      AssetLoader.load('cat_climb', `assets/cat/${CAT_COLOR}_wallclimb.png`),
      AssetLoader.load('cat_fall', `assets/cat/${CAT_COLOR}_fall_from_grab.png`),
      AssetLoader.load('cat_land', `assets/cat/${CAT_COLOR}_land.png`),
      AssetLoader.load('dust', 'assets/particles/dust.png'),
    ]);
  } catch (e) {
    console.error("Failed to load companion assets:", e);
  }

  // 2. Initialize modules
  const cursorEl = document.getElementById('cursor-heart');
  const catEl = document.getElementById('pixel-cat');
  
  if (!cursorEl || !catEl) {
    console.warn("Companion DOM elements not found.");
    return;
  }

  const cursor = new Cursor(cursorEl);
  cursor.init();

  const particles = new Particles(30);
  
  const mainCat = new Cat(catEl, CAT_COLOR);
  mainCat.setParticles(particles);
  await mainCat.initSprites();

  // 3. NPC Spawner Logic
  const catZones = document.querySelectorAll('.cat-zone');
  
  function spawnNPC(x, y) {
    if (npcPets.length >= MAX_NPC_PETS) {
      // Recycle the oldest pet
      const oldest = npcPets.shift();
      oldest.cursor.setAnchor(x, y);
      
      const choice = getRandomPet();
      oldest.cat.changePet(choice.type, choice.color);
      
      npcPets.push(oldest);
      return;
    }

    const el = document.createElement('img');
    el.className = 'pixel-cat-base';
    document.body.appendChild(el);
    
    const choice = getRandomPet();
    const npcPet = new Pet(el, choice.type, choice.color);
    npcPet.setParticles(particles);
    
    npcPet.body.x = x;
    npcPet.body.y = y;
    
    const npcCursor = new NPCCursor(x, y, 70);
    npcPets.push({ cat: npcPet, cursor: npcCursor, el: el });
  }

  const characterWrapper = document.getElementById('character-wrapper');
  if (characterWrapper) {
    characterWrapper.addEventListener('mouseenter', () => {
      // Spawn 1-2 pets when hovered
      const numPetsToSpawn = Math.floor(Math.random() * 2) + 1;
      const rect = characterWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      for (let i = 0; i < numPetsToSpawn; i++) {
        spawnNPC(centerX, centerY);
      }
    });
  }

  // 4. Initialize weather engine & console
  const canvasEl = document.getElementById('weather-canvas');
  const weatherEngine = new WeatherEngine(canvasEl);
  window.isSleeping = false;

  const consoleInput = document.getElementById('console-input');
  if (consoleInput) {
    consoleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = consoleInput.value.trim().toLowerCase();
        consoleInput.value = '';

        if (text === '/sleep') {
          window.isSleeping = !window.isSleeping;
          
          // Toggle sleeping state for static dog
          const dogImg = document.getElementById('pixel-dog');
          if (dogImg) {
            dogImg.src = window.isSleeping ? 'assets/dog/white_lie.gif' : 'assets/dog/white_idle.gif';
          }
        } else if (text.startsWith('/weather ')) {
          const type = text.replace('/weather ', '').trim();
          if (['sun', 'rain', 'snow', 'autumn', 'clear'].includes(type)) {
            weatherEngine.setWeather(type);
          } else {
            showError();
          }
        } else {
          showError();
        }
      }
    });

    function showError() {
      const origPlaceholder = consoleInput.placeholder;
      consoleInput.placeholder = "Lệnh sai! Gõ /sleep hoặc /weather [sun, rain, snow, autumn, clear]";
      consoleInput.style.color = '#ff6b6b';
      consoleInput.readOnly = true;
      setTimeout(() => {
        consoleInput.placeholder = origPlaceholder;
        consoleInput.style.color = '';
        consoleInput.readOnly = false;
      }, 3000);
    }
  }

  // 5. Initialize linear story mode games
  const tagStartStory = document.getElementById('tag-start-story');
  const guideModal = document.getElementById('story-guide-modal');
  const guideStartBtn = document.getElementById('guide-start-btn');

  // Show guide modal on page load
  if (guideModal) {
    guideModal.classList.remove('hidden');
  }

  if (tagStartStory && guideModal) {
    tagStartStory.addEventListener('click', () => {
      guideModal.classList.remove('hidden');
    });
  }

  if (guideStartBtn && guideModal) {
    guideStartBtn.addEventListener('click', () => {
      guideModal.classList.add('hidden');
      startSchoolGame();
    });
  }

  // --- LEVEL 1: School Jump ---
  const schoolOverlay = document.getElementById('school-jump-overlay');
  const schoolCanvas = document.getElementById('school-canvas');
  const schoolScoreSpan = document.getElementById('school-score');
  const schoolNextBtn = document.getElementById('school-next-btn');
  const schoolVictoryScreen = document.getElementById('school-victory');
  const closeSchoolBtn = document.getElementById('close-school-btn');

  let schoolGame = null;

  if (schoolOverlay && schoolCanvas) {
    schoolGame = new SchoolJumpGame(
      schoolCanvas,
      (score) => {
        if (schoolScoreSpan) schoolScoreSpan.textContent = score;
      },
      () => {
        if (schoolVictoryScreen) schoolVictoryScreen.classList.remove('hidden');
      }
    );

    const startSchoolGame = () => {
      window.gameActive = true;
      schoolOverlay.classList.remove('hidden');
      schoolVictoryScreen.classList.add('hidden');
      
      // Hide companion pets
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      schoolGame.start();
    };

    const stopSchoolGame = () => {
      window.gameActive = false;
      schoolOverlay.classList.add('hidden');
      
      // Restore companions
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      schoolGame.stop();
    };

    closeSchoolBtn?.addEventListener('click', stopSchoolGame);
    schoolNextBtn?.addEventListener('click', () => {
      stopSchoolGame();
      startToxicGame(); // Go to Level 2
    });
  }

  // --- LEVEL 2: Toxic Dodge & Dialog ---
  const toxicOverlay = document.getElementById('toxic-dodge-overlay');
  const toxicCanvas = document.getElementById('toxic-canvas');
  const toxicHealthSpan = document.getElementById('toxic-health');
  const toxicTimerSpan = document.getElementById('toxic-timer');
  const toxicVictoryScreen = document.getElementById('toxic-victory');
  const closeToxicBtn = document.getElementById('close-toxic-btn');
  const toxicNextBtn = document.getElementById('toxic-next-btn');

  const dialogueContainer = document.getElementById('story-dialogue-container');
  const dialogueText = document.getElementById('dialogue-text');
  const dialogueNextBtn = document.getElementById('dialogue-next-btn');

  let toxicGame = null;
  let currentDialogIndex = 0;
  
  // Dialog script
  const dialogScript = [
    { speaker: 'cat', text: "Mình mệt mỏi quá Bông ơi... Những lời nói độc hại kia làm tớ đau lòng quá." },
    { speaker: 'dog', text: "Đừng buồn Mèo con, cậu đã rất dũng cảm khi vượt qua chúng rồi!" },
    { speaker: 'dog', text: "Nhưng tớ nghĩ tớ phải rẽ sang con đường riêng của tớ rồi..." },
    { speaker: 'cat', text: "Tớ hiểu mà. Cảm ơn Bông đã đồng hành cùng tớ suốt chặng đường qua nhé!" },
    { speaker: 'dog', text: "Tạm biệt cậu nhé! Hãy luôn vững tin và tiếp tục hành trình thật tốt nha!" }
  ];

  if (toxicOverlay && toxicCanvas) {
    toxicGame = new ToxicDodgeGame(
      toxicCanvas,
      (hp) => {
        if (toxicHealthSpan) toxicHealthSpan.textContent = '❤'.repeat(Math.max(0, hp)) || 'X_X';
      },
      (timer) => {
        if (toxicTimerSpan) toxicTimerSpan.textContent = timer;
      },
      () => {
        // Dialogue start callback
        startDialogue();
      },
      () => {
        // Complete walkAway callback
        if (toxicVictoryScreen) toxicVictoryScreen.classList.remove('hidden');
      }
    );

    const startToxicGame = () => {
      window.gameActive = true;
      toxicOverlay.classList.remove('hidden');
      toxicVictoryScreen.classList.add('hidden');
      dialogueContainer?.classList.add('hidden');

      // Hide companions
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      toxicGame.start();
    };

    const stopToxicGame = () => {
      window.gameActive = false;
      toxicOverlay.classList.add('hidden');

      // Restore companions
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      toxicGame.stop();
    };

    const startDialogue = () => {
      currentDialogIndex = 0;
      dialogueContainer?.classList.remove('hidden');
      showDialogueLine();
    };

    const showDialogueLine = () => {
      if (!dialogueText || !dialogueContainer) return;
      const line = dialogScript[currentDialogIndex];
      
      // Update dialogue speaker UI styling
      const speakerCat = dialogueContainer.querySelector('.avatar-speaker.left');
      const speakerDog = dialogueContainer.querySelector('.avatar-speaker.right');

      if (line.speaker === 'cat') {
        speakerCat?.classList.add('active');
        speakerDog?.classList.remove('active');
      } else {
        speakerCat?.classList.remove('active');
        speakerDog?.classList.add('active');
      }

      dialogueText.textContent = line.text;
    };

    dialogueNextBtn?.addEventListener('click', () => {
      currentDialogIndex++;
      if (currentDialogIndex < dialogScript.length) {
        showDialogueLine();
      } else {
        dialogueContainer?.classList.add('hidden');
        // Tell toxicGame to run the walk away separation animation
        toxicGame.startWalkAway();
      }
    });

    closeToxicBtn?.addEventListener('click', stopToxicGame);
    toxicNextBtn?.addEventListener('click', () => {
      stopToxicGame();
      startFootballGame(); // Go to Level 3
    });
  }

  // --- LEVEL 3: Football Game ---
  const footballOverlay = document.getElementById('football-game-overlay');
  const footballCanvas = document.getElementById('football-canvas');
  const clearedMarkersSpan = document.getElementById('cleared-markers');
  const footballVictoryScreen = document.getElementById('game-victory');
  const closeFootballBtn = document.getElementById('close-game-btn');
  const footballNextBtn = document.getElementById('football-next-btn');

  let footballGame = null;

  if (footballOverlay && footballCanvas) {
    footballGame = new FootballGame(
      footballCanvas,
      (score) => {
        if (clearedMarkersSpan) clearedMarkersSpan.textContent = score;
      },
      () => {
        if (footballVictoryScreen) footballVictoryScreen.classList.remove('hidden');
      }
    );

    const startFootballGame = () => {
      window.gameActive = true;
      footballOverlay.classList.remove('hidden');
      footballVictoryScreen.classList.add('hidden');

      // Hide companions
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      footballGame.start();
    };

    const stopFootballGame = () => {
      window.gameActive = false;
      footballOverlay.classList.add('hidden');

      // Restore companions
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      footballGame.stop();
    };

    closeFootballBtn?.addEventListener('click', stopFootballGame);
    footballNextBtn?.addEventListener('click', () => {
      stopFootballGame();
      startMmaGame(); // Go to Level 4
    });
  }

  // --- LEVEL 4: MMA Game ---
  const mainBgm = document.getElementById('bgm');
  const mmaOverlay = document.getElementById('mma-game-overlay');
  const mmaCanvas = document.getElementById('mma-canvas');
  const mmaHealthSpan = document.getElementById('mma-health');
  const mmaTimerSpan = document.getElementById('mma-timer');
  const mmaVictoryScreen = document.getElementById('mma-victory');
  const mmaDefeatScreen = document.getElementById('mma-defeat');
  const closeMmaBtn = document.getElementById('close-mma-btn');
  const mmaNextBtn = document.getElementById('mma-next-btn');
  const retryMmaBtn = document.getElementById('retry-mma-btn');

  let mmaGame = null;
  let mmaPlayMusic = null;
  let wasBgmPlayingMma = false;

  if (mmaOverlay && mmaCanvas) {
    mmaGame = new MmaGame(
      mmaCanvas,
      (hp) => {
        if (mmaHealthSpan) mmaHealthSpan.textContent = '❤'.repeat(Math.max(0, hp)) || 'X_X';
      },
      (timer) => {
        if (mmaTimerSpan) mmaTimerSpan.textContent = timer;
      },
      () => {
        if (mmaVictoryScreen) mmaVictoryScreen.classList.remove('hidden');
      },
      () => {
        if (mmaDefeatScreen) mmaDefeatScreen.classList.remove('hidden');
      }
    );

    const startMmaGame = () => {
      window.gameActive = true;
      mmaOverlay.classList.remove('hidden');
      mmaVictoryScreen.classList.add('hidden');
      mmaDefeatScreen.classList.add('hidden');

      // Record BGM state and play MMA music
      if (mainBgm) {
        wasBgmPlayingMma = !mainBgm.paused;
        mainBgm.pause();
      }

      if (!mmaPlayMusic) {
        mmaPlayMusic = new Audio('sound/mma.mp3');
        mmaPlayMusic.loop = true;
        mmaPlayMusic.volume = 0.55;
      }
      mmaPlayMusic.currentTime = 0;
      mmaPlayMusic.play().catch(e => console.log("Music play blocked: ", e));

      // Hide companions
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      mmaGame.start();
    };

    const stopMmaGame = () => {
      window.gameActive = false;
      mmaOverlay.classList.add('hidden');

      // Stop MMA music and restore BGM
      if (mmaPlayMusic) {
        mmaPlayMusic.pause();
        mmaPlayMusic.currentTime = 0;
      }
      if (wasBgmPlayingMma && mainBgm) {
        mainBgm.play().catch(e => console.log(e));
      }

      // Restore companions
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      mmaGame.stop();
    };

    closeMmaBtn?.addEventListener('click', stopMmaGame);
    mmaNextBtn?.addEventListener('click', () => {
      stopMmaGame();
      startBuddhaScene(); // Go to Level 5
    });
    retryMmaBtn?.addEventListener('click', startMmaGame);
  }

  // --- LEVEL 5: Buddha Zen Scene & Final Booking Card ---
  const buddhaOverlay = document.getElementById('buddha-game-overlay');
  const buddhaCanvas = document.getElementById('buddha-canvas');
  const zenChantText = document.getElementById('zen-chant');
  const closeBuddhaBtn = document.getElementById('close-buddha-btn');
  const buddhaVictoryScreen = document.getElementById('buddha-victory');
  const buddhaNextBtn = document.getElementById('buddha-next-btn');

  let buddhaScene = null;
  let zenMusic = null;
  let wasBgmPlayingBuddha = false;

  if (buddhaOverlay && buddhaCanvas) {
    buddhaScene = new BuddhaScene(
      buddhaCanvas, 
      zenChantText,
      () => {
        // Victory callback
        if (buddhaVictoryScreen) buddhaVictoryScreen.classList.remove('hidden');
      }
    );

    const startBuddhaScene = () => {
      window.gameActive = true;
      buddhaOverlay.classList.remove('hidden');
      buddhaVictoryScreen.classList.add('hidden');

      // Record BGM state
      if (mainBgm) {
        wasBgmPlayingBuddha = !mainBgm.paused;
        mainBgm.pause();
      }

      // Play peaceful Zen music (binhan.mp3)
      if (!zenMusic) {
        zenMusic = new Audio('sound/binhan.mp3');
        zenMusic.loop = true;
        zenMusic.volume = 0.55;
      }
      zenMusic.currentTime = 0;
      zenMusic.play().catch(e => console.log("Music play blocked: ", e));

      // Hide screen companions
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      buddhaScene.start();
    };

    const stopBuddhaScene = () => {
      window.gameActive = false;
      buddhaOverlay.classList.add('hidden');

      // Stop Zen music and restore BGM
      if (zenMusic) {
        zenMusic.pause();
        zenMusic.currentTime = 0;
      }
      if (wasBgmPlayingBuddha && mainBgm) {
        mainBgm.play().catch(e => console.log(e));
      }

      // Restore screen elements
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      buddhaScene.stop();
    };

    closeBuddhaBtn?.addEventListener('click', stopBuddhaScene);
    
    buddhaNextBtn?.addEventListener('click', () => {
      stopBuddhaScene();
      
      // Navigate to booking section
      const bookingBtn = document.querySelector('button[data-target="section-booking"]');
      if (bookingBtn) {
        bookingBtn.click();
        
        // Highlight form as a dating request card
        const formElement = document.getElementById('booking-form');
        const parentElement = formElement?.closest('.content-wrap') || formElement;
        if (parentElement) {
          parentElement.classList.add('booking-date-card');
        }

        // Smooth scroll to the form
        document.getElementById('section-booking')?.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Close on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && window.gameActive) {
      schoolGame?.stop();
      toxicGame?.stop();
      footballGame?.stop();
      mmaGame?.stop();
      buddhaScene?.stop();
      
      schoolOverlay?.classList.add('hidden');
      toxicOverlay?.classList.add('hidden');
      footballOverlay?.classList.add('hidden');
      mmaOverlay?.classList.add('hidden');
      buddhaOverlay?.classList.add('hidden');
      
      window.gameActive = false;
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');
    }
  });

  // 9. Main Loop
  let lastTime = performance.now();
  function loop(now) {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; 
    lastTime = now;

    if (!window.gameActive) {
      cursor.update(dt);
      
      // Update main cat
      mainCat.update(dt, cursor);
      
      // Update NPC pets
      npcPets.forEach(npc => {
        npc.cursor.update(dt);
        npc.cat.update(dt, npc.cursor);
      });
      
      particles.update(dt);
    }

    weatherEngine.update(dt);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
