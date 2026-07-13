// cookingGame.js
import { AssetLoader } from './assetLoader.js';

export class CookingGame {
  constructor(canvas, onScoreChange, onTimerChange, onVictory, onDefeat) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreChange = onScoreChange;
    this.onTimerChange = onTimerChange;
    this.onVictory = onVictory;
    this.onDefeat = onDefeat;

    this.w = 600;
    this.h = 400;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    // Game state
    this.running = false;
    this.time = 0;
    this.mouseX = this.w / 2;

    this.score = 0;
    this.gameTimeRemaining = 20.0;

    // Cat properties
    this.cat = {
      x: 300,
      y: 330,
      radius: 16,
      speed: 8.0, // fast horizontal movement
      facingRight: true,
      state: 'idle',
      invincibilityTime: 0
    };

    this.items = [];
    this.hearts = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 0.45; // Spawn item every 0.45s

    this.initEntities();
    this.setupEvents();
  }

  initEntities() {
    this.score = 0;
    this.gameTimeRemaining = 20.0;
    this.time = 0;
    this.items = [];
    this.hearts = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 0.45;

    this.cat.x = 300;
    this.cat.y = 330;
    this.cat.state = 'idle';
    this.cat.invincibilityTime = 0;

    if (this.onScoreChange) this.onScoreChange(this.score);
    if (this.onTimerChange) this.onTimerChange(Math.ceil(this.gameTimeRemaining));
  }

  setupEvents() {
    const getCanvasMouseX = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      return ((e.clientX - rect.left) / rect.width) * this.w;
    };

    this.canvas.addEventListener('mousemove', (e) => {
      this.mouseX = getCanvasMouseX(e);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouseX = getCanvasMouseX(e.touches[0]);
      }
      e.preventDefault();
    }, { passive: false });
  }

  start() {
    this.running = true;
    this.initEntities();
    this.lastTime = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop = () => {
    if (!this.running) return;

    const now = performance.now();
    let dt = (now - this.lastTime) / 1000;
    if (dt > 0.1) dt = 0.1;
    this.lastTime = now;

    this.update(dt);
    this.draw();

    if (this.running) {
      requestAnimationFrame(this.loop);
    }
  };

  update(dt) {
    this.time += dt;
    this.gameTimeRemaining -= dt;

    // Check defeat (Time runs out and score is < 100)
    if (this.gameTimeRemaining <= 0) {
      this.gameTimeRemaining = 0;
      this.stop();
      if (this.score >= 100) {
        if (this.onVictory) this.onVictory();
      } else {
        if (this.onDefeat) this.onDefeat();
      }
      return;
    }

    if (this.onTimerChange) {
      this.onTimerChange(Math.ceil(this.gameTimeRemaining));
    }

    // 1. Move Cat towards mouse X
    const dx = this.mouseX - this.cat.x;
    if (Math.abs(dx) > 4) {
      const moveAmount = Math.sign(dx) * Math.min(Math.abs(dx), this.cat.speed * 1.5);
      this.cat.x += moveAmount;
      this.cat.facingRight = dx > 0;
      this.cat.state = Math.abs(dx) > 40 ? 'run' : 'walk';
    } else {
      this.cat.state = 'idle';
    }

    // Constrain cat on screen
    this.cat.x = Math.max(this.cat.radius + 15, Math.min(this.w - this.cat.radius - 15, this.cat.x));

    // Invincibility frame update
    if (this.cat.invincibilityTime > 0) {
      this.cat.invincibilityTime -= dt;
    }

    // 2. Spawn items
    const progress = (20.0 - this.gameTimeRemaining) / 20.0;
    this.spawnInterval = 0.45 - progress * 0.22; // spawn rate increases up to every 0.23s

    if (this.time - this.lastSpawnTime > this.spawnInterval) {
      this.lastSpawnTime = this.time;
      this.spawnItem(progress);
    }

    // 3. Update falling items
    this.items.forEach((item, index) => {
      item.y += item.vy;

      // Remove items falling below bottom
      if (item.y > this.h + 20) {
        this.items.splice(index, 1);
        return;
      }

      // Check collision
      const dist = Math.hypot(item.x - this.cat.x, item.y - this.cat.y);
      if (dist < this.cat.radius + item.radius) {
        // Collided!
        if (item.type === 'seed') {
          this.score += 10;
          if (this.onScoreChange) this.onScoreChange(this.score);

          // Spawn heart feedback
          for (let i = 0; i < 2; i++) {
            this.hearts.push({
              x: item.x,
              y: item.y - 10,
              vx: -0.5 + Math.random() * 1.0,
              vy: -1.0 - Math.random() * 0.8,
              opacity: 1.0,
              seed: Math.random() * 10
            });
          }

          this.items.splice(index, 1);

          // Immediate win condition if they hit 100 points
          if (this.score >= 100) {
            this.stop();
            if (this.onVictory) this.onVictory();
          }
        } else {
          // Bad item
          if (this.cat.invincibilityTime <= 0) {
            this.score = Math.max(0, this.score - 20);
            if (this.onScoreChange) this.onScoreChange(this.score);
            this.cat.invincibilityTime = 0.6; // 0.6 seconds i-frame
          }
          this.items.splice(index, 1);
        }
      }
    });

    // 4. Update heart particles
    this.hearts.forEach((h, index) => {
      h.y += h.vy;
      h.x += h.vx + Math.sin(this.time * 4 + h.seed) * 0.2;
      h.opacity -= dt * 1.5;
      if (h.opacity <= 0) {
        this.hearts.splice(index, 1);
      }
    });
  }

  spawnItem(progress) {
    const rx = 25 + Math.random() * (this.w - 50);
    const rand = Math.random();
    let type = 'seed';
    let radius = 6;

    if (rand < 0.65) {
      type = 'seed';
      radius = 6;
    } else if (rand < 0.82) {
      type = 'knife';
      radius = 10;
    } else {
      type = 'pan';
      radius = 12;
    }

    const fallSpeed = (2.2 + progress * 2.2) * (0.95 + Math.random() * 0.1);

    this.items.push({
      x: rx,
      y: -15,
      type: type,
      radius: radius,
      vy: fallSpeed
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw Kitchen chopping board background lines
    this.ctx.fillStyle = '#b07e54'; // Darker brown for gaps
    this.ctx.fillRect(15, 15, this.w - 30, this.h - 30);

    this.ctx.fillStyle = '#cc966b'; // Light wood floor panels
    const numPanels = 10;
    const panelWidth = (this.w - 30) / numPanels;
    for (let i = 0; i < numPanels; i++) {
      // Alternating wood tint
      if (i % 2 === 0) {
        this.ctx.fillStyle = '#c08d62';
      } else {
        this.ctx.fillStyle = '#cc966b';
      }
      this.ctx.fillRect(15 + i * panelWidth, 15, panelWidth - 2, this.h - 30);
      
      // Horizontal wood grain details
      this.ctx.fillStyle = 'rgba(0,0,0,0.04)';
      this.ctx.fillRect(15 + i * panelWidth, 100, panelWidth - 2, 4);
      this.ctx.fillRect(15 + i * panelWidth, 250, panelWidth - 2, 4);
    }

    // Outer double border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 3;
    this.ctx.strokeRect(15, 15, this.w - 30, this.h - 30);

    // Shelf line at the top
    this.ctx.fillStyle = '#8d5524';
    this.ctx.fillRect(15, 45, this.w - 30, 8);

    // 2. Draw Items
    this.items.forEach(item => {
      this.drawItem(item);
    });

    // 3. Draw Hearts
    this.hearts.forEach(h => {
      this.drawHeart(h.x, h.y, h.opacity);
    });

    // 4. Draw Cat
    if (this.cat.invincibilityTime > 0 && Math.floor(this.time * 20) % 2 === 0) {
      // Skip drawing to flash
      return;
    }
    this.drawCat();
  }

  drawItem(item) {
    this.ctx.save();
    this.ctx.translate(item.x, item.y);

    if (item.type === 'seed') {
      // Golden seed circle with inner highlight
      this.ctx.fillStyle = '#ffcc00';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(-2, -2, 2, 2); // pixel highlight
    } else if (item.type === 'knife') {
      // Knife pixel art
      // Blade
      this.ctx.fillStyle = '#cbd5e1';
      this.ctx.fillRect(-2, -8, 4, 11);
      // Handle
      this.ctx.fillStyle = '#78350f';
      this.ctx.fillRect(-1.5, 3, 3, 5);
      // Outline
      this.ctx.strokeStyle = '#1e293b';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(-2.5, -8.5, 5, 17);
    } else if (item.type === 'pan') {
      // Frying pan pixel art
      // Circle pan
      this.ctx.fillStyle = '#475569';
      this.ctx.beginPath();
      this.ctx.arc(0, -3, 8, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Handle
      this.ctx.strokeStyle = '#0f172a';
      this.ctx.lineWidth = 2.5;
      this.ctx.beginPath();
      this.ctx.moveTo(0, 5);
      this.ctx.lineTo(0, 11);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  drawHeart(x, y, opacity) {
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.fillStyle = '#ff4b4b';
    this.ctx.fillRect(x - 2, y - 3, 2, 2);
    this.ctx.fillRect(x + 1, y - 3, 2, 2);
    this.ctx.fillRect(x - 3, y - 1, 7, 2);
    this.ctx.fillRect(x - 2, y + 1, 5, 2);
    this.ctx.fillRect(x - 1, y + 3, 3, 2);
    this.ctx.fillRect(x, y + 5, 1, 1);
    this.ctx.restore();
  }

  drawCat() {
    const idleSheet = AssetLoader.get('cat_idle');
    const walkSheet = AssetLoader.get('cat_walk');
    const runSheet = AssetLoader.get('cat_run');

    let sheet = idleSheet;
    let frameCount = 8;
    let fps = 8;

    if (this.cat.state === 'walk') {
      sheet = walkSheet;
      frameCount = 8;
      fps = 8;
    } else if (this.cat.state === 'run') {
      sheet = runSheet;
      frameCount = 10;
      fps = 12;
    }

    if (!sheet) return;

    const frameIndex = Math.floor(this.time * fps) % frameCount;
    const nativeWidth = sheet.naturalWidth / frameCount;
    const nativeHeight = sheet.naturalHeight;

    const displayWidth = nativeWidth * 0.72;
    const displayHeight = nativeHeight * 0.72;

    this.ctx.save();
    this.ctx.translate(this.cat.x, this.cat.y);
    if (!this.cat.facingRight) {
      this.ctx.scale(-1, 1);
    }
    this.ctx.drawImage(
      sheet,
      frameIndex * nativeWidth, 0, nativeWidth, nativeHeight,
      -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight
    );
    this.ctx.restore();
  }
}
