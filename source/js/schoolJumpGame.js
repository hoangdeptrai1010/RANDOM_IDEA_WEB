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
    this.phase = 'play'; // 'play' or 'cutscene'

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

    // Bông the dog entity details for cutscene
    this.dog = {
      x: 610,
      y: this.floorY,
      targetX: 200,
      speed: 85,
      frameTime: 0
    };

    // Mouse coordinates for Bông hover detection
    this.mouseX = -999;
    this.mouseY = -999;

    this.obstacles = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 2.0; // Spawn obstacle every 2s

    this.setupEvents();
  }

  initEntities() {
    this.score = 0;
    this.time = 0;
    this.phase = 'play';
    this.obstacles = [];
    this.lastSpawnTime = -0.5; // Starts at -0.5s so first spawns quickly at t = 1.5s

    this.cat.y = this.floorY;
    this.cat.vy = 0;
    this.cat.isGrounded = true;
    this.cat.state = 'walk';

    this.dog.x = 610;
    this.dog.frameTime = 0;

    // Spawn first book obstacle immediately
    this.spawnObstacle();

    if (this.onScoreChange) this.onScoreChange(this.score);
  }

  setupEvents() {
    // Jump trigger on click/touch
    const triggerJump = () => {
      if (this.running && this.cat.isGrounded && this.phase === 'play') {
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

    // Jump trigger on Spacebar (preventing default scrolling)
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        if (this.running && this.phase === 'play') {
          e.preventDefault();
          triggerJump();
        }
      }
    });

    // Track mouse coordinate offsets on chalkboard canvas
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

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseX = -999;
      this.mouseY = -999;
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

    if (this.phase === 'play') {
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

          // Win transition to cutscene
          if (this.score >= 5) {
            this.phase = 'cutscene';
            return;
          }
        }

        // Remove off-screen obstacles
        if (obs.x < -obs.w) {
          this.obstacles.splice(i, 1);
        }
      }
    } else if (this.phase === 'cutscene') {
      // Clear remaining books off screen
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.x -= obs.speed;
        if (obs.x < -obs.w) {
          this.obstacles.splice(i, 1);
        }
      }

      // Bông walks in from right
      if (this.dog.x > this.dog.targetX) {
        this.dog.x -= this.dog.speed * dt;
        this.dog.frameTime += dt;
        if (this.dog.x <= this.dog.targetX) {
          this.dog.x = this.dog.targetX;
          // Open victory screen overlay
          if (this.onVictory) this.onVictory();
        }
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
    this.ctx.fillText("Mồn Lèo - 2005", 50, 60);
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

    // 3. Draw Dog Bông if in cutscene
    if (this.phase === 'cutscene') {
      this.drawDog();
      this.drawTooltip();
    }

    // 4. Draw Cat
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

  drawDog() {
    this.ctx.save();
    const dx = this.dog.x;
    const dy = this.dog.y;
    
    // Draw white retro pixel dog (Bông)
    this.ctx.fillStyle = '#ffffff'; // White body
    this.ctx.fillRect(dx - 12, dy - 20, 24, 16); // body
    this.ctx.fillRect(dx + 4, dy - 28, 12, 10); // head
    
    this.ctx.fillStyle = '#f2d1d1'; // Pink ears
    this.ctx.fillRect(dx + 2, dy - 26, 4, 6);
    
    this.ctx.fillStyle = '#000000'; // Eyes & nose
    this.ctx.fillRect(dx + 12, dy - 25, 2, 2); // eye
    this.ctx.fillRect(dx + 15, dy - 22, 2, 2); // nose
    
    // Animating legs
    const legOffset = Math.sin(this.dog.frameTime * 12) > 0 ? 3 : 0;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(dx - 8, dy - 4, 3, 4); // leg 1
    this.ctx.fillRect(dx - 2, dy - 4 + legOffset, 3, 4); // leg 2
    this.ctx.fillRect(dx + 4, dy - 4, 3, 4); // leg 3
    this.ctx.fillRect(dx + 8, dy - 4 + legOffset, 3, 4); // leg 4
    
    // Tail
    this.ctx.fillRect(dx - 15, dy - 18, 4, 4);
    
    this.ctx.restore();
  }

  drawTooltip() {
    const dx = this.dog.x;
    const dy = this.dog.y;
    
    // Proximity check: within 45 pixels of Bông's center
    const dist = Math.hypot(this.mouseX - dx, this.mouseY - (dy - 12));
    if (dist < 45) {
      this.ctx.save();
      const tx = dx;
      const ty = dy - 42;
      
      // Shadow border
      this.ctx.fillStyle = '#000000';
      this.ctx.fillRect(tx - 26, ty - 13, 52, 18);
      
      // White container
      this.ctx.fillStyle = '#ffffff';
      this.ctx.fillRect(tx - 25, ty - 12, 50, 16);
      
      // Black text
      this.ctx.fillStyle = '#000000';
      this.ctx.font = "bold 11px monospace";
      this.ctx.textAlign = "center";
      this.ctx.fillText("Bông", tx, ty);
      this.ctx.restore();
    }
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
