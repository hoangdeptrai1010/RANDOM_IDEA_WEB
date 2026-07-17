// schoolJumpGame.js
import { AssetLoader } from './assetLoader.js';

export class SchoolJumpGame {
  constructor(canvas, onScoreChange, onVictory) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreChange = onScoreChange;
    this.onVictory = onVictory;

    this.w = 600;
    this.h = 400;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.running = false;
    this.time = 0;
    this.score = 0;

    // Physics constants
    this.gravity = 0.45;
    this.floorY = 290;

    // Cat entity
    this.cat = {
      x: 100,
      y: this.floorY,
      vy: 0,
      radius: 14,
      isGrounded: true,
      jumpForce: -8.5,
      state: 'walk' // walk, jump, land
    };

    this.obstacles = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 2.0; // Spawn obstacle every 2s

    this.setupEvents();
  }

  initEntities() {
    this.score = 0;
    this.time = 0;
    this.obstacles = [];
    this.lastSpawnTime = 0;

    this.cat.y = this.floorY;
    this.cat.vy = 0;
    this.cat.isGrounded = true;
    this.cat.state = 'walk';

    if (this.onScoreChange) this.onScoreChange(this.score);
  }

  setupEvents() {
    // Jump trigger on click/touch
    const triggerJump = () => {
      if (this.running && this.cat.isGrounded) {
        this.cat.vy = this.cat.jumpForce;
        this.cat.isGrounded = false;
        this.cat.state = 'jump';
      }
    };

    this.canvas.addEventListener('mousedown', triggerJump);
    this.canvas.addEventListener('touchstart', (e) => {
      triggerJump();
      e.preventDefault();
    }, { passive: false });

    // Jump trigger on Spacebar
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        triggerJump();
      }
    });
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

    // Apply gravity to cat
    if (!this.cat.isGrounded) {
      this.cat.vy += this.gravity;
      this.cat.y += this.cat.vy;

      if (this.cat.y >= this.floorY) {
        this.cat.y = this.floorY;
        this.cat.vy = 0;
        this.cat.isGrounded = true;
        this.cat.state = 'walk';
      }
    }

    // Spawn obstacles (books)
    if (this.time - this.lastSpawnTime > this.spawnInterval) {
      this.lastSpawnTime = this.time;
      this.spawnObstacle();
    }

    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= obs.speed * (1 + this.score * 0.05); // speed increases slightly with score

      // Check collision
      if (
        obs.x + obs.w > this.cat.x - this.cat.radius &&
        obs.x < this.cat.x + this.cat.radius &&
        this.floorY - obs.h < this.cat.y + this.cat.radius &&
        this.floorY > this.cat.y - this.cat.radius
      ) {
        // Reset Level 1 on collision (retro challenge style)
        this.initEntities();
        return;
      }

      // Check score
      if (!obs.passed && obs.x + obs.w < this.cat.x) {
        obs.passed = true;
        this.score++;
        if (this.onScoreChange) this.onScoreChange(this.score);

        // Win condition
        if (this.score >= 5) {
          this.stop();
          if (this.onVictory) this.onVictory();
          return;
        }
      }

      // Remove off-screen obstacles
      if (obs.x < -obs.w) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  spawnObstacle() {
    const bookWidth = 24 + Math.random() * 12;
    const bookHeight = 28 + Math.random() * 12;
    const colors = ['#d9534f', '#5bc0de', '#5cb85c', '#f0ad4e', '#8e44ad'];
    
    this.obstacles.push({
      x: this.w + 10,
      w: bookWidth,
      h: bookHeight,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: 180, // pixels per second
      passed: false
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw Classroom Background (Pixel Art Chalkboard Style)
    // Chalkboard background
    this.ctx.fillStyle = '#2c3e50';
    this.ctx.fillRect(20, 20, this.w - 40, this.floorY - 60);

    this.ctx.strokeStyle = '#7f8c8d';
    this.ctx.lineWidth = 6;
    this.ctx.strokeRect(20, 20, this.w - 40, this.floorY - 60);

    // Grid lines on chalkboard
    this.ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    this.ctx.lineWidth = 1;
    for (let x = 40; x < this.w - 40; x += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 20);
      this.ctx.lineTo(x, this.floorY - 40);
      this.ctx.stroke();
    }
    for (let y = 40; y < this.floorY - 40; y += 30) {
      this.ctx.beginPath();
      this.ctx.moveTo(20, y);
      this.ctx.lineTo(this.w - 20, y);
      this.ctx.stroke();
    }

    // Text on board
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.font = "16px 'Space Grotesk', sans-serif";
    this.ctx.fillText("Hoàng - 2005", 50, 60);
    this.ctx.fillText("Màn 1: Trường học", 50, 90);

    // Classroom floor line
    this.ctx.strokeStyle = 'var(--border)';
    this.ctx.lineWidth = 4;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.floorY + 2);
    this.ctx.lineTo(this.w, this.floorY + 2);
    this.ctx.stroke();

    // Floor tiles (wooden slats)
    this.ctx.fillStyle = 'var(--surface)';
    this.ctx.fillRect(0, this.floorY + 4, this.w, this.h - this.floorY - 4);

    this.ctx.strokeStyle = 'var(--border-light)';
    this.ctx.lineWidth = 2;
    for (let y = this.floorY + 20; y < this.h; y += 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.w, y);
      this.ctx.stroke();
    }

    // 2. Draw Obstacles (Retro Books)
    this.obstacles.forEach(obs => {
      this.drawBook(obs.x, this.floorY - obs.h, obs.w, obs.h, obs.color);
    });

    // 3. Draw Cat
    this.drawCat();
  }

  drawBook(x, y, w, h, color) {
    this.ctx.save();
    
    // Draw main cover
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
    
    // Draw pages side (white slice on the right)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(x + w - 4, y + 2, 3, h - 4);
    
    // Draw stripes on cover (book spine/title line)
    this.ctx.fillStyle = '#ffffff';
    this.ctx.globalAlpha = 0.6;
    this.ctx.fillRect(x + 3, y + 6, w - 8, 2);
    this.ctx.fillRect(x + 3, y + 12, w - 8, 2);
    
    // Outer black border
    this.ctx.restore();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, w, h);
  }

  drawCat() {
    const walkSheet = AssetLoader.get('cat_walk');
    const runSheet = AssetLoader.get('cat_run');
    const landSheet = AssetLoader.get('cat_land');

    let sheet = walkSheet;
    let frameCount = 8;
    let fps = 8;

    if (this.cat.state === 'jump') {
      sheet = runSheet;
      frameCount = 10;
      fps = 12;
    } else if (this.cat.state === 'land') {
      sheet = landSheet;
      frameCount = 4;
      fps = 6;
    }

    if (!sheet) return;

    // Handle frame indexing
    let frameIndex = Math.floor(this.time * fps) % frameCount;
    if (this.cat.state === 'jump') {
      // Hold high jump pose at mid-air
      if (this.cat.vy < -2) frameIndex = 2;
      else if (this.cat.vy > 2) frameIndex = 6;
      else frameIndex = 4;
    }

    const nativeWidth = sheet.naturalWidth / frameCount;
    const nativeHeight = sheet.naturalHeight;

    const displayWidth = nativeWidth * 0.72;
    const displayHeight = nativeHeight * 0.72;

    this.ctx.save();
    // Position cat slightly offset so its paws touch floor line
    this.ctx.translate(this.cat.x, this.cat.y - 12);
    
    // Always face right in this level
    this.ctx.drawImage(
      sheet,
      frameIndex * nativeWidth, 0, nativeWidth, nativeHeight,
      -displayWidth / 2, -displayHeight / 2, displayWidth, displayHeight
    );
    this.ctx.restore();
  }
}
