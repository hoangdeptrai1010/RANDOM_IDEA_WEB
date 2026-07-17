// toxicDodgeGame.js
import { AssetLoader } from './assetLoader.js';

export class ToxicDodgeGame {
  constructor(canvas, onHealthChange, onTimerChange, onDialogueStart, onComplete) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onHealthChange = onHealthChange;
    this.onTimerChange = onTimerChange;
    this.onDialogueStart = onDialogueStart;
    this.onComplete = onComplete;

    this.w = 600;
    this.h = 400;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.running = false;
    this.time = 0;
    this.hp = 3;
    this.gameTimeRemaining = 15.0;
    this.phase = 'dodge'; // dodge, dialogue, walkAway

    this.mouseX = this.w / 2;
    this.mouseY = this.h / 2;

    this.floorY = 320;

    // Cat & Dog entities
    this.cat = {
      x: 200,
      y: this.floorY,
      vx: 0,
      radius: 14,
      state: 'idle',
      facingRight: true,
      invincibilityTime: 0
    };

    this.dog = {
      x: 240,
      y: this.floorY,
      radius: 14,
      state: 'idle',
      facingRight: true,
      hovered: false
    };

    this.words = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 0.8;

    this.toxicWordsList = [
      "Yếu đuối", "Vô dụng", "Lười biếng", "Thất bại", 
      "Kém cỏi", "Bất tài", "Ngu ngốc", "Kém tắm"
    ];

    this.setupEvents();
  }

  initEntities() {
    this.hp = 3;
    this.gameTimeRemaining = 15.0;
    this.time = 0;
    this.phase = 'dodge';
    this.words = [];
    this.lastSpawnTime = 0;

    this.cat.x = 200;
    this.cat.y = this.floorY;
    this.cat.state = 'idle';
    this.cat.invincibilityTime = 0;

    this.dog.x = 240;
    this.dog.y = this.floorY;
    this.dog.state = 'idle';
    this.dog.hovered = false;

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

    if (this.phase === 'dodge') {
      this.gameTimeRemaining -= dt;

      if (this.gameTimeRemaining <= 0) {
        this.gameTimeRemaining = 0;
        this.phase = 'dialogue';
        this.cat.state = 'sleep'; // Tired lying down pose
        this.dog.state = 'idle';
        if (this.onDialogueStart) this.onDialogueStart();
      }

      if (this.onTimerChange) {
        this.onTimerChange(Math.ceil(this.gameTimeRemaining));
      }

      // Decrement invincibility
      if (this.cat.invincibilityTime > 0) {
        this.cat.invincibilityTime -= dt;
      }

      // 1. Move Cat towards mouse X
      const dx = this.mouseX - this.cat.x;
      if (Math.abs(dx) > 6) {
        const moveAmount = Math.sign(dx) * Math.min(Math.abs(dx), 4.5);
        this.cat.x += moveAmount;
        this.cat.facingRight = dx > 0;
        this.cat.state = Math.abs(dx) > 40 ? 'run' : 'walk';
      } else {
        this.cat.state = 'idle';
      }

      // 2. Dog Bông walks side-by-side with Cat (slight offset to the right/left)
      const targetDogX = this.cat.x + (this.cat.facingRight ? -32 : 32);
      const dogDx = targetDogX - this.dog.x;
      if (Math.abs(dogDx) > 4) {
        this.dog.x += Math.sign(dogDx) * Math.min(Math.abs(dogDx), 4.0);
        this.dog.facingRight = dogDx > 0;
        this.dog.state = 'walk';
      } else {
        this.dog.state = 'idle';
      }

      // Constrain inside bounds
      this.cat.x = Math.max(15 + this.cat.radius, Math.min(this.w - 15 - this.cat.radius, this.cat.x));
      this.dog.x = Math.max(15 + this.dog.radius, Math.min(this.w - 15 - this.dog.radius, this.dog.x));

      // 3. Hover check for Bông's name
      const distToDog = Math.hypot(this.mouseX - this.dog.x, this.mouseY - (this.dog.y - 12));
      this.dog.hovered = distToDog < 30;

      // 4. Spawning falling toxic words
      if (this.time - this.lastSpawnTime > this.spawnInterval) {
        this.lastSpawnTime = this.time;
        this.spawnWord();
      }

      // 5. Update and check word collisions
      for (let i = this.words.length - 1; i >= 0; i--) {
        const w = this.words[i];
        w.y += w.vy;

        if (w.y > this.h + 20) {
          this.words.splice(i, 1);
          continue;
        }

        // Collision check with Cat or Dog (when not invincible)
        if (this.cat.invincibilityTime <= 0) {
          const catDist = Math.hypot(w.x - this.cat.x, w.y - (this.cat.y - 12));
          const dogDist = Math.hypot(w.x - this.dog.x, w.y - (this.dog.y - 12));

          if (catDist < this.cat.radius + w.radius || dogDist < this.dog.radius + w.radius) {
            // Hit!
            this.hp--;
            this.cat.invincibilityTime = 0.8; // 0.8s invincibility
            this.words.splice(i, 1);

            if (this.onHealthChange) this.onHealthChange(this.hp);

            // Defeat condition
            if (this.hp <= 0) {
              this.initEntities();
              return;
            }
          }
        }
      }
    } else if (this.phase === 'dialogue') {
      // Game stands still waiting for HTML dialogue boxes
      this.cat.state = 'sleep';
      this.dog.state = 'idle';
      
      // Proximity name tooltip is still active
      const distToDog = Math.hypot(this.mouseX - this.dog.x, this.mouseY - (this.dog.y - 12));
      this.dog.hovered = distToDog < 30;
      
    } else if (this.phase === 'walkAway') {
      // Walk away animation
      // Cat walks left, Dog walks right
      this.cat.facingRight = false;
      this.cat.state = 'walk';
      this.cat.x -= dt * 90;

      this.dog.facingRight = true;
      this.dog.state = 'walk';
      this.dog.x += dt * 90;

      // Completion check when offscreen
      if (this.cat.x < -40 && this.dog.x > this.w + 40) {
        this.stop();
        if (this.onComplete) this.onComplete();
      }
    }
  }

  spawnWord() {
    const text = this.toxicWordsList[Math.floor(Math.random() * this.toxicWordsList.length)];
    this.words.push({
      x: 30 + Math.random() * (this.w - 60),
      y: -10,
      vy: 2.0 + Math.random() * 2.0,
      text: text,
      radius: 12 + text.length * 3
    });
  }

  startWalkAway() {
    this.phase = 'walkAway';
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw Background (Dark moody rain-like background)
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.h);
    skyGrad.addColorStop(0, '#11131a');
    skyGrad.addColorStop(1, '#2c3240');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.w, this.h);

    // Draw floor
    this.ctx.fillStyle = '#1c1f26';
    this.ctx.fillRect(0, this.floorY + 2, this.w, this.h - this.floorY - 2);
    this.ctx.strokeStyle = '#2b303c';
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.floorY + 2);
    this.ctx.lineTo(this.w, this.floorY + 2);
    this.ctx.stroke();

    // 2. Draw falling words
    if (this.phase === 'dodge') {
      this.ctx.fillStyle = '#ff6b6b';
      this.ctx.font = "bold 14px 'Space Grotesk', sans-serif";
      this.ctx.textAlign = 'center';
      
      this.words.forEach(w => {
        this.ctx.shadowColor = 'rgba(255, 107, 107, 0.4)';
        this.ctx.shadowBlur = 8;
        this.ctx.fillText(w.text, w.x, w.y);
        this.ctx.shadowBlur = 0; // Reset
      });
    }

    // 3. Draw Dog Bông
    this.drawDog();

    // 4. Draw Cat
    this.drawCat();

    // 5. Draw dog hover name
    if (this.dog.hovered) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.strokeStyle = '#000000';
      this.ctx.lineWidth = 3;
      this.ctx.font = "bold 13px 'Space Grotesk', sans-serif";
      this.ctx.textAlign = 'center';

      // Tooltip box
      this.ctx.strokeText("Bông", this.dog.x, this.dog.y - 45);
      this.ctx.fillText("Bông", this.dog.x, this.dog.y - 45);
    }
  }

  drawCat() {
    const walkSheet = AssetLoader.get('cat_walk');
    const runSheet = AssetLoader.get('cat_run');
    const idleSheet = AssetLoader.get('cat_idle');
    const sleepSheet = AssetLoader.get('cat_land'); // Using land/sleep frames for tiredness

    let sheet = idleSheet;
    let frameCount = 8;
    let fps = 8;

    if (this.cat.state === 'walk') {
      sheet = walkSheet;
    } else if (this.cat.state === 'run') {
      sheet = runSheet;
      frameCount = 10;
      fps = 12;
    } else if (this.cat.state === 'sleep') {
      sheet = sleepSheet;
      frameCount = 4;
      fps = 2; // slow breathing
    }

    if (!sheet) return;

    const frameIndex = Math.floor(this.time * fps) % frameCount;
    const nativeWidth = sheet.naturalWidth / frameCount;
    const nativeHeight = sheet.naturalHeight;

    const displayWidth = nativeWidth * 0.72;
    const displayHeight = nativeHeight * 0.72;

    this.ctx.save();
    this.ctx.translate(this.cat.x, this.cat.y - 12);
    
    // Toggle blink on invincibility
    if (this.cat.invincibilityTime > 0 && Math.floor(this.time * 15) % 2 === 0) {
      this.ctx.restore();
      return;
    }

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

  drawDog() {
    // Dog is drawn using white dog frames
    // Since we don't have spritesheets for dog, we can draw a custom pixel-art dog in 2D canvas
    // OR we can draw Bông as a cute pixel art shape
    this.ctx.save();
    this.ctx.translate(this.dog.x, this.dog.y - 12);
    if (!this.dog.facingRight) {
      this.ctx.scale(-1, 1);
    }

    // Cheering animation hop
    const hop = (this.dog.state === 'walk') ? Math.floor(Math.sin(this.time * 10) * 2) : 0;
    const dy = hop;

    // Drawing a retro pixel art White Dog
    // Tail
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(-12, dy - 2, 4, 3);
    
    // Body
    this.ctx.fillRect(-8, dy - 5, 14, 10);
    this.ctx.fillStyle = '#e5e9f0'; // shadows
    this.ctx.fillRect(-8, dy + 2, 14, 3);

    // Legs
    this.ctx.fillStyle = '#ffffff';
    if (this.dog.state === 'walk') {
      const step = Math.floor(this.time * 8) % 2;
      this.ctx.fillRect(-6, dy + 5, 2, 4 - step * 2);
      this.ctx.fillRect(2, dy + 5, 2, 2 + step * 2);
    } else {
      this.ctx.fillRect(-6, dy + 5, 2, 4);
      this.ctx.fillRect(2, dy + 5, 2, 4);
    }

    // Head
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(4, dy - 11, 8, 8);
    this.ctx.fillRect(10, dy - 9, 3, 4); // muzzle
    
    // Ears (floppy)
    this.ctx.fillStyle = '#d8dee9';
    this.ctx.fillRect(3, dy - 11, 2, 5);

    // Nose
    this.ctx.fillStyle = '#2e3440';
    this.ctx.fillRect(13, dy - 9, 1, 1);

    // Eyes
    this.ctx.fillRect(9, dy - 8, 1, 1);

    this.ctx.restore();
  }
}
