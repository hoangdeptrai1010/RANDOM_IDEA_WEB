// main.js
import { AssetLoader } from './assetLoader.js';
import { Cursor } from './cursor.js';
import { Cat } from './cat.js';
import { Particles } from './particles.js';
import { NPCCursor } from './npcCursor.js';
import { Pet } from './pet.js';
import { WeatherEngine } from './weather.js';
import { FootballGame } from './footballGame.js';
import { MmaGame } from './mmaGame.js';
import { CookingGame } from './cookingGame.js';
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

  // 5. Initialize Football game
  const footballOverlay = document.getElementById('football-game-overlay');
  const footballCanvas = document.getElementById('football-canvas');
  const clearedMarkersSpan = document.getElementById('cleared-markers');
  const victoryScreen = document.getElementById('game-victory');
  const closeGameBtn = document.getElementById('close-game-btn');
  const restartGameBtn = document.getElementById('restart-game-btn');
  const tagFootball = document.getElementById('tag-football');
  
  window.gameActive = false;
  let footballGame = null;

  if (tagFootball && footballOverlay && footballCanvas) {
    footballGame = new FootballGame(
      footballCanvas,
      (score) => {
        if (clearedMarkersSpan) clearedMarkersSpan.textContent = score;
      },
      () => {
        if (victoryScreen) victoryScreen.classList.remove('hidden');
      }
    );

    const startGame = () => {
      window.gameActive = true;
      footballOverlay.classList.remove('hidden');
      victoryScreen.classList.add('hidden');
      
      // Hide elements
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');
      
      footballGame.start();
    };

    const stopGame = () => {
      window.gameActive = false;
      footballOverlay.classList.add('hidden');
      
      // Restore elements
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');
      
      footballGame.stop();
    };

    tagFootball.addEventListener('click', () => {
      startGame();
    });

    closeGameBtn.addEventListener('click', () => {
      stopGame();
    });

    restartGameBtn.addEventListener('click', () => {
      startGame();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.gameActive) {
        stopGame();
      }
    });
  }

  // 6. Initialize MMA game
  const mmaOverlay = document.getElementById('mma-game-overlay');
  const mmaCanvas = document.getElementById('mma-canvas');
  const mmaHealthSpan = document.getElementById('mma-health');
  const mmaTimerSpan = document.getElementById('mma-timer');
  const mmaVictoryScreen = document.getElementById('mma-victory');
  const mmaDefeatScreen = document.getElementById('mma-defeat');
  const closeMmaBtn = document.getElementById('close-mma-btn');
  const restartMmaBtn = document.getElementById('restart-mma-btn');
  const retryMmaBtn = document.getElementById('retry-mma-btn');
  const tagMma = document.getElementById('tag-mma');

  let mmaGame = null;

  if (tagMma && mmaOverlay && mmaCanvas) {
    mmaGame = new MmaGame(
      mmaCanvas,
      (hp) => {
        if (mmaHealthSpan) {
          mmaHealthSpan.textContent = '❤'.repeat(Math.max(0, hp)) || 'X_X';
        }
      },
      (timer) => {
        if (mmaTimerSpan) {
          mmaTimerSpan.textContent = timer;
        }
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

      // Hide elements
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      mmaGame.start();
    };

    const stopMmaGame = () => {
      window.gameActive = false;
      mmaOverlay.classList.add('hidden');

      // Restore elements
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      mmaGame.stop();
    };

    tagMma.addEventListener('click', () => {
      startMmaGame();
    });

    closeMmaBtn.addEventListener('click', () => {
      stopMmaGame();
    });

    restartMmaBtn.addEventListener('click', () => {
      startMmaGame();
    });

    retryMmaBtn.addEventListener('click', () => {
      startMmaGame();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.gameActive) {
        stopMmaGame();
      }
    });
  }

  // 7. Initialize Cooking game
  const cookingOverlay = document.getElementById('cooking-game-overlay');
  const cookingCanvas = document.getElementById('cooking-canvas');
  const cookingScoreSpan = document.getElementById('cooking-score');
  const cookingTimerSpan = document.getElementById('cooking-timer');
  const cookingVictoryScreen = document.getElementById('cooking-victory');
  const cookingDefeatScreen = document.getElementById('cooking-defeat');
  const closeCookingBtn = document.getElementById('close-cooking-btn');
  const restartCookingBtn = document.getElementById('restart-cooking-btn');
  const retryCookingBtn = document.getElementById('retry-cooking-btn');
  const tagCooking = document.getElementById('tag-cooking');

  let cookingGame = null;
  let mmaMusic = null;
  let wasBgmPlaying = false;
  const mainBgm = document.getElementById('bgm');

  if (tagCooking && cookingOverlay && cookingCanvas) {
    cookingGame = new CookingGame(
      cookingCanvas,
      (score) => {
        if (cookingScoreSpan) {
          cookingScoreSpan.textContent = score;
        }
      },
      (timer) => {
        if (cookingTimerSpan) {
          cookingTimerSpan.textContent = timer;
        }
      },
      () => {
        // Victory callback
        if (cookingVictoryScreen) cookingVictoryScreen.classList.remove('hidden');
        // Stop main bgm and play epic MMA music
        if (mainBgm) {
          mainBgm.pause();
        }
        if (!mmaMusic) {
          mmaMusic = new Audio('sound/i-alone-am-the-honored-one.mp3');
          mmaMusic.loop = true;
          mmaMusic.volume = 0.6;
        }
        mmaMusic.currentTime = 0;
        mmaMusic.play().catch(err => console.log("Music play blocked: ", err));
      },
      () => {
        // Defeat callback
        if (cookingDefeatScreen) cookingDefeatScreen.classList.remove('hidden');
      }
    );

    const startCookingGame = () => {
      window.gameActive = true;
      cookingOverlay.classList.remove('hidden');
      cookingVictoryScreen.classList.add('hidden');
      cookingDefeatScreen.classList.add('hidden');

      // Record BGM state
      if (mainBgm) {
        wasBgmPlaying = !mainBgm.paused;
      }

      // Hide MMA music if playing
      if (mmaMusic) {
        mmaMusic.pause();
        mmaMusic.currentTime = 0;
      }

      // Hide screen companions
      catEl.style.display = 'none';
      cursorEl.style.display = 'none';
      npcPets.forEach(npc => npc.el.style.display = 'none');

      cookingGame.start();
    };

    const stopCookingGame = () => {
      window.gameActive = false;
      cookingOverlay.classList.add('hidden');

      // Stop MMA music and restore BGM if it was playing
      if (mmaMusic) {
        mmaMusic.pause();
        mmaMusic.currentTime = 0;
      }
      if (wasBgmPlaying && mainBgm) {
        mainBgm.play().catch(e => console.log(e));
      }

      // Restore screen elements
      catEl.style.display = '';
      cursorEl.style.display = '';
      npcPets.forEach(npc => npc.el.style.display = '');

      cookingGame.stop();
    };

    tagCooking.addEventListener('click', () => {
      startCookingGame();
    });

    closeCookingBtn.addEventListener('click', () => {
      stopCookingGame();
    });

    restartCookingBtn.addEventListener('click', () => {
      startCookingGame();
    });

    retryCookingBtn.addEventListener('click', () => {
      startCookingGame();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.gameActive) {
        stopCookingGame();
      }
    });
  }

  // 8. Initialize Buddha Zen scene
  const buddhaOverlay = document.getElementById('buddha-game-overlay');
  const buddhaCanvas = document.getElementById('buddha-canvas');
  const zenChantText = document.getElementById('zen-chant');
  const closeBuddhaBtn = document.getElementById('close-buddha-btn');
  const tagBuddha = document.getElementById('tag-buddha');

  let buddhaScene = null;
  let zenMusic = null;
  let wasBgmPlayingBuddha = false;

  if (tagBuddha && buddhaOverlay && buddhaCanvas) {
    buddhaScene = new BuddhaScene(buddhaCanvas, zenChantText);

    const startBuddhaScene = () => {
      window.gameActive = true;
      buddhaOverlay.classList.remove('hidden');

      // Record BGM state
      if (mainBgm) {
        wasBgmPlayingBuddha = !mainBgm.paused;
        mainBgm.pause();
      }

      // Play peaceful Zen music (tinhcam.mp3)
      if (!zenMusic) {
        zenMusic = new Audio('sound/tinhcam.mp3');
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

    tagBuddha.addEventListener('click', () => {
      startBuddhaScene();
    });

    closeBuddhaBtn.addEventListener('click', () => {
      stopBuddhaScene();
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.gameActive) {
        stopBuddhaScene();
      }
    });
  }

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
