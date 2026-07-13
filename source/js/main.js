// main.js
import { AssetLoader } from './assetLoader.js';
import { Cursor } from './cursor.js';
import { Cat } from './cat.js';
import { Particles } from './particles.js';
import { NPCCursor } from './npcCursor.js';
import { Pet } from './pet.js';
import { WeatherEngine } from './weather.js';
import { FootballGame } from './footballGame.js';

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

  catZones.forEach(zone => {
    zone.addEventListener('mouseenter', (e) => {
      // Spawn 1-2 pets when hovered
      const numPetsToSpawn = Math.floor(Math.random() * 2) + 1;
      const rect = zone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      for (let i = 0; i < numPetsToSpawn; i++) {
        spawnNPC(centerX, centerY);
      }
    });
  });

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

  // 6. Main Loop
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
