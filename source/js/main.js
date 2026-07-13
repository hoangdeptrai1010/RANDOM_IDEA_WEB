// main.js
import { AssetLoader } from './assetLoader.js';
import { Cursor } from './cursor.js';
import { Cat } from './cat.js';
import { Particles } from './particles.js';
import { NPCCursor } from './npcCursor.js';

const CAT_COLOR = 'orange';
const MAX_NPC_CATS = 5;
const npcCats = [];

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
  
  async function spawnNPC(x, y) {
    if (npcCats.length >= MAX_NPC_CATS) {
      // Recycle the oldest cat
      const oldest = npcCats.shift();
      oldest.cursor.setAnchor(x, y);
      npcCats.push(oldest);
      return;
    }

    const el = document.createElement('div');
    el.className = 'pixel-cat-base';
    document.body.appendChild(el);
    
    const npcCat = new Cat(el, CAT_COLOR);
    npcCat.setParticles(particles);
    await npcCat.initSprites();
    
    npcCat.body.x = x;
    npcCat.body.y = y;
    
    const npcCursor = new NPCCursor(x, y, 70);
    npcCats.push({ cat: npcCat, cursor: npcCursor, el: el });
  }

  catZones.forEach(zone => {
    zone.addEventListener('mouseenter', (e) => {
      // Spawn 1-2 cats when hovered
      const numCatsToSpawn = Math.floor(Math.random() * 2) + 1;
      const rect = zone.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      for (let i = 0; i < numCatsToSpawn; i++) {
        spawnNPC(centerX, centerY);
      }
    });
  });

  // 4. Main Loop
  let lastTime = performance.now();
  function loop(now) {
    let dt = (now - lastTime) / 1000;
    if (dt > 0.1) dt = 0.1; 
    lastTime = now;

    cursor.update(dt);
    
    // Update main cat
    mainCat.update(dt, cursor);
    
    // Update NPC cats
    npcCats.forEach(npc => {
      npc.cursor.update(dt);
      npc.cat.update(dt, npc.cursor);
    });
    
    particles.update(dt);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
