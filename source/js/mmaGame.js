// mmaGame.js
import { AssetLoader } from './assetLoader.js';

export class MmaGame {
  constructor(canvas, onHealthChange, onTimerChange, onVictory, onDefeat) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onHealthChange = onHealthChange;
    this.onTimerChange = onTimerChange;
    this.onVictory = onVictory;
    this.onDefeat = onDefeat;

    this.w = 600;
    this.h = 400;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    // Game states
    this.running = false;
    this.time = 0;
    this.mouseX = this.w / 2;
    this.mouseY = this.h / 2;

    this.hp = 3;
    this.gameTimeRemaining = 20.0;

    // Entities
    this.cat = {
      x: 300,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 12,
      speed: 4.2,
      facingRight: true,
      state: 'idle',
      invincibilityTime: 0
    };

    this.gloves = [];
    this.lastGloveSpawn = 0;
    this.gloveSpawnInterval = 0.6; // Spawn glove every 0.6s

    this.initEntities();
    this.setupEvents();
  }

  initEntities() {
    this.hp = 3;
    this.gameTimeRemaining = 20.0;
    this.time = 0;
    this.gloves = [];
    this.lastGloveSpawn = 0;
    this.gloveSpawnInterval = 0.6;

    this.cat.x = 300;
    this.cat.y = 200;
    this.cat.vx = 0;
    this.cat.vy = 0;
    this.cat.state = 'idle';
    this.cat.invincibilityTime = 0;

    if (this.onHealthChange) this.onHealthChange(this.hp);
    if (this.onTimerChange) this.onTimerChange(Math.ceil(this.gameTimeRemaining));
  }

  setupEvents() {
    const getCanvasMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * this.w;
      const y = ((e.clientY - rect.top) / rect.height) * this.h;
      return { x, y };
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasMousePos(e);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const pos = getCanvasMousePos(e.touches[0]);
        this.mouseX = pos.x;
        this.mouseY = pos.y;
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

    if (this.gameTimeRemaining <= 0) {
      this.gameTimeRemaining = 0;
      this.stop();
      if (this.onVictory) this.onVictory();
      return;
    }

    if (this.onTimerChange) {
      this.onTimerChange(Math.ceil(this.gameTimeRemaining));
    }

    // 1. Move Cat towards mouse cursor
    const dx = this.mouseX - this.cat.x;
    const dy = this.mouseY - this.cat.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 6) {
      const currentSpeed = dist > 45 ? this.cat.speed * 1.5 : this.cat.speed;
      const moveX = (dx / dist) * Math.min(dist, currentSpeed);
      const moveY = (dy / dist) * Math.min(dist, currentSpeed);

      this.cat.vx = moveX;
      this.cat.vy = moveY;
      this.cat.x += moveX;
      this.cat.y += moveY;

      this.cat.facingRight = dx > 0;
      this.cat.state = dist > 45 ? 'run' : 'walk';
    } else {
      this.cat.vx = 0;
      this.cat.vy = 0;
      this.cat.state = 'idle';
    }

    // Invincibility cooldown
    if (this.cat.invincibilityTime > 0) {
      this.cat.invincibilityTime -= dt;
    }

    // Constrain cat inside MMA Octagon Wall
    const centerX = this.w / 2;
    const centerY = this.h / 2;
    const ringRadius = 150; // Inner boundary radius
    
    const distFromCenter = Math.hypot(this.cat.x - centerX, this.cat.y - centerY);
    if (distFromCenter > ringRadius - this.cat.radius) {
      const angle = Math.atan2(this.cat.y - centerY, this.cat.x - centerX);
      this.cat.x = centerX + Math.cos(angle) * (ringRadius - this.cat.radius);
      this.cat.y = centerY + Math.sin(angle) * (ringRadius - this.cat.radius);
    }

    // 2. Spawning flying boxing gloves
    // Spawn rate increases as game progress (more gloves at the end)
    const progress = (20.0 - this.gameTimeRemaining) / 20.0;
    this.gloveSpawnInterval = 0.65 - progress * 0.35; // ranges from 0.65s down to 0.3s spawn rate
    
    if (this.time - this.lastGloveSpawn > this.gloveSpawnInterval) {
      this.lastGloveSpawn = this.time;
      this.spawnGlove(progress);
    }

    // 3. Update & check glove collisions
    this.gloves.forEach((g, index) => {
      g.x += g.vx;
      g.y += g.vy;

      // Remove off-screen gloves
      if (g.x < -20 || g.x > this.w + 20 || g.y < -20 || g.y > this.h + 20) {
        this.gloves.splice(index, 1);
        return;
      }

      // Check collision with cat
      if (this.cat.invincibilityTime <= 0) {
        const cdist = Math.hypot(g.x - this.cat.x, g.y - this.cat.y);
        if (cdist < this.cat.radius + g.radius) {
          // HIT!
          this.hp--;
          this.cat.invincibilityTime = 1.0; // 1s i-frame
          this.gloves.splice(index, 1);
          if (this.onHealthChange) this.onHealthChange(this.hp);

          // Check defeat
          if (this.hp <= 0) {
            this.stop();
            if (this.onDefeat) this.onDefeat();
          }
        }
      }
    });
  }

  spawnGlove(progress) {
    // Spawn outside of canvas
    let sx, sy;
    const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    const offset = 15;

    if (side === 0) {
      sx = Math.random() * this.w;
      sy = -offset;
    } else if (side === 1) {
      sx = this.w + offset;
      sy = Math.random() * this.h;
    } else if (side === 2) {
      sx = Math.random() * this.w;
      sy = this.h + offset;
    } else {
      sx = -offset;
      sy = Math.random() * this.h;
    }

    // Target the glove towards a randomized offset around the cat's position to make it challenging
    const tx = this.cat.x + (-40 + Math.random() * 80);
    const ty = this.cat.y + (-40 + Math.random() * 80);
    const angle = Math.atan2(ty - sy, tx - sx);

    // Glove speed increases with game progress
    const speed = 2.5 + progress * 2.0;

    this.gloves.push({
      x: sx,
      y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 8
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw octagonal cage wall
    const centerX = this.w / 2;
    const centerY = this.h / 2;
    const radius = 155;
    const numSides = 8;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.lineWidth = 6;
    
    // Draw outer grid lines for cage aesthetic
    for (let r = radius - 8; r > 0; r -= 20) {
      this.drawOctagon(centerX, centerY, r, numSides, 'stroke');
    }
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 4;
    this.drawOctagon(centerX, centerY, radius, numSides, 'stroke');
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
    this.ctx.lineWidth = 1;
    this.drawOctagon(centerX, centerY, radius - 2, numSides, 'stroke');

    // Draw octagon posts at corners
    this.ctx.fillStyle = '#ff3d00'; // red corner posts
    for (let i = 0; i < numSides; i++) {
      const angle = (i * 2 * Math.PI) / numSides;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      this.ctx.fillRect(px - 4, py - 4, 8, 8);
    }

    // 2. Draw Flying Boxing Gloves
    this.gloves.forEach(g => {
      this.drawGlove(g.x, g.y);
    });

    // 3. Draw Cat (with invincibility flash check)
    if (this.cat.invincibilityTime > 0 && Math.floor(this.time * 18) % 2 === 0) {
      // flash by skipping drawing frame
      return;
    }
    this.drawCat();
  }

  drawOctagon(cx, cy, r, sides, type) {
    this.ctx.beginPath();
    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    if (type === 'stroke') this.ctx.stroke();
    else this.ctx.fill();
  }

  drawGlove(x, y) {
    this.ctx.save();
    this.ctx.fillStyle = '#ff3333'; // Red
    // main body
    this.ctx.fillRect(x - 5, y - 5, 10, 8);
    // thumb
    this.ctx.fillRect(x - 6, y - 2, 2, 4);
    // white lining
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x - 4, y + 3, 8, 2);
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
