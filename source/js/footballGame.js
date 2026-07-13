// footballGame.js
import { AssetLoader } from './assetLoader.js';

export class FootballGame {
  constructor(canvas, onScoreChange, onVictory) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreChange = onScoreChange;
    this.onVictory = onVictory;

    this.w = 600;
    this.h = 400;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    // Game state variables
    this.running = false;
    this.time = 0;
    this.mouseX = this.w / 2;
    this.mouseY = this.h / 2;
    this.clearedCount = 0;

    // Entities
    this.cat = {
      x: 60,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 14,
      speed: 3.5,
      facingRight: true,
      state: 'idle' // idle, walk, run
    };

    this.ball = {
      x: 150,
      y: 200,
      vx: 0,
      vy: 0,
      radius: 8,
      friction: 0.96,
      angle: 0
    };

    this.markers = [];
    this.kittens = [];
    this.hearts = [];

    this.initEntities();
    this.setupEvents();
  }

  initEntities() {
    // 5 zig-zag markers across the pitch
    this.markers = [
      { id: 1, x: 140, y: 280, radius: 14, cleared: false },
      { id: 2, x: 230, y: 120, radius: 14, cleared: false },
      { id: 3, x: 320, y: 280, radius: 14, cleared: false },
      { id: 4, x: 410, y: 120, radius: 14, cleared: false },
      { id: 5, x: 500, y: 200, radius: 14, cleared: false }
    ];
    this.kittens = [];
    this.hearts = [];
    this.clearedCount = 0;
    
    // Set initial positions
    this.cat.x = 60;
    this.cat.y = 200;
    this.cat.vx = 0;
    this.cat.vy = 0;
    this.cat.state = 'idle';

    this.ball.x = 150;
    this.ball.y = 200;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.angle = 0;

    if (this.onScoreChange) this.onScoreChange(this.clearedCount);
  }

  setupEvents() {
    const getCanvasMousePos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      // Calculate scaled mouse position matching canvas coordinate system
      const x = ((e.clientX - rect.left) / rect.width) * this.w;
      const y = ((e.clientY - rect.top) / rect.height) * this.h;
      return { x, y };
    };

    this.canvas.addEventListener('mousemove', (e) => {
      const pos = getCanvasMousePos(e);
      this.mouseX = pos.x;
      this.mouseY = pos.y;
    });

    // Touch events for mobile compatibility
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

    requestAnimationFrame(this.loop);
  };

  update(dt) {
    this.time += dt;

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

    // Constrain cat inside borders
    this.cat.x = Math.max(this.cat.radius + 15, Math.min(this.w - this.cat.radius - 15, this.cat.x));
    this.cat.y = Math.max(this.cat.radius + 15, Math.min(this.h - this.cat.radius - 15, this.cat.y));

    // 2. Ball physics
    this.ball.vx *= this.ball.friction;
    this.ball.vy *= this.ball.friction;
    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    // Rotate ball based on velocity
    const speed = Math.hypot(this.ball.vx, this.ball.vy);
    if (speed > 0.05) {
      this.ball.angle += (this.ball.vx > 0 ? speed : -speed) * 0.05;
    }

    // Keep ball within pitch lines (15px inset boundaries)
    const minX = this.ball.radius + 15;
    const maxX = this.w - this.ball.radius - 15;
    const minY = this.ball.radius + 15;
    const maxY = this.h - this.ball.radius - 15;

    if (this.ball.x < minX) {
      this.ball.x = minX;
      this.ball.vx = -this.ball.vx * 0.6;
    } else if (this.ball.x > maxX) {
      this.ball.x = maxX;
      this.ball.vx = -this.ball.vx * 0.6;
    }

    if (this.ball.y < minY) {
      this.ball.y = minY;
      this.ball.vy = -this.ball.vy * 0.6;
    } else if (this.ball.y > maxY) {
      this.ball.y = maxY;
      this.ball.vy = -this.ball.vy * 0.6;
    }

    // 3. Collision between Cat and Ball
    const ballDx = this.ball.x - this.cat.x;
    const ballDy = this.ball.y - this.cat.y;
    const ballDist = Math.hypot(ballDx, ballDy);
    const minCollisionDist = this.cat.radius + this.ball.radius;

    if (ballDist < minCollisionDist) {
      const angle = Math.atan2(ballDy, ballDx);
      const overlap = minCollisionDist - ballDist;

      // Push ball out of overlap
      this.ball.x += Math.cos(angle) * overlap;
      this.ball.y += Math.sin(angle) * overlap;

      // Apply kick force based on cat velocity and push vector
      const impulseX = Math.cos(angle) * (Math.abs(this.cat.vx) + 2) * 1.5;
      const impulseY = Math.sin(angle) * (Math.abs(this.cat.vy) + 2) * 1.5;

      this.ball.vx = impulseX;
      this.ball.vy = impulseY;
    }

    // 4. Collision between Ball and Markers
    this.markers.forEach(m => {
      if (!m.cleared) {
        const mdx = this.ball.x - m.x;
        const mdy = this.ball.y - m.y;
        const mdist = Math.hypot(mdx, mdy);
        
        if (mdist < m.radius + this.ball.radius) {
          m.cleared = true;
          this.clearedCount++;
          if (this.onScoreChange) this.onScoreChange(this.clearedCount);

          // Spawn a cheering kitten at the nearest sideline
          const sidelineY = m.y < this.h / 2 ? 35 : this.h - 35;
          const kittenColors = ['#95a5a6', '#f39c12', '#2c3e50', '#e74c3c'];
          this.kittens.push({
            x: m.x,
            y: sidelineY,
            color: kittenColors[this.kittens.length % kittenColors.length],
            lastThrow: this.time
          });

          // Check victory
          if (this.clearedCount === this.markers.length) {
            setTimeout(() => {
              if (this.onVictory) this.onVictory();
            }, 600);
          }
        }
      }
    });

    // 5. Kittens throw heart particles
    this.kittens.forEach(k => {
      if (this.time - k.lastThrow > 1.2) {
        k.lastThrow = this.time;
        // Spawn heart drifting up
        this.hearts.push({
          x: k.x,
          y: k.y - 8,
          vx: -0.4 + Math.random() * 0.8,
          vy: -1.2 - Math.random() * 0.8,
          opacity: 1,
          seed: Math.random() * 10
        });
      }
    });

    // 6. Update heart particles
    this.hearts.forEach((h, index) => {
      h.y += h.vy;
      h.x += h.vx + Math.sin(this.time * 4 + h.seed) * 0.2;
      h.opacity -= dt * 0.8;
      if (h.opacity <= 0) {
        this.hearts.splice(index, 1);
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw Field Markings (Pixel art style lines)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    this.ctx.lineWidth = 3;

    // Pitch outer box
    this.ctx.strokeRect(15, 15, this.w - 30, this.h - 30);

    // Center line
    this.ctx.beginPath();
    this.ctx.moveTo(this.w / 2, 15);
    this.ctx.lineTo(this.w / 2, this.h - 15);
    this.ctx.stroke();

    // Center circle
    this.ctx.beginPath();
    this.ctx.arc(this.w / 2, this.h / 2, 45, 0, Math.PI * 2);
    this.ctx.stroke();

    // Goalposts (Left & Right)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.fillRect(0, this.h / 2 - 40, 15, 80);
    this.ctx.fillRect(this.w - 15, this.h / 2 - 40, 15, 80);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.strokeRect(0, this.h / 2 - 40, 15, 80);
    this.ctx.strokeRect(this.w - 15, this.h / 2 - 40, 15, 80);

    // 2. Draw Cones / Markers
    this.markers.forEach(m => {
      this.drawCone(m.x, m.y, m.cleared);
    });

    // 3. Draw Kittens
    this.kittens.forEach(k => {
      this.drawKitten(k.x, k.y, k.color);
    });

    // 4. Draw Hearts
    this.hearts.forEach(h => {
      this.drawHeart(h.x, h.y, h.opacity);
    });

    // 5. Draw Soccer Ball
    this.drawBall(this.ball.x, this.ball.y, this.ball.angle);

    // 6. Draw Cat
    this.drawCat();
  }

  drawCone(x, y, cleared) {
    const scale = 2;
    this.ctx.fillStyle = cleared ? '#5cb85c' : '#f0ad4e'; // green / orange
    
    // Draw body triangle
    for (let row = 0; row < 7; row++) {
      const width = row;
      const cy = y - 7 + row * 2;
      this.ctx.fillRect(x - width, cy, width * 2 + 1, 2);
    }
    // Base plate
    this.ctx.fillStyle = cleared ? '#4cae4c' : '#d9534f';
    this.ctx.fillRect(x - 6, y + 7, 13, 2);
  }

  drawKitten(x, y, color) {
    this.ctx.save();
    // Cheering animation hop
    const hop = Math.floor(Math.sin(this.time * 8) * 3);
    const cy = y + hop;

    this.ctx.fillStyle = color;
    // Body
    this.ctx.fillRect(x - 4, cy - 4, 8, 8);
    // Head
    this.ctx.fillRect(x - 3, cy - 9, 6, 5);
    // Ears
    this.ctx.fillRect(x - 3, cy - 11, 1, 2);
    this.ctx.fillRect(x + 2, cy - 11, 1, 2);
    // Eyes
    this.ctx.fillStyle = '#000000';
    this.ctx.fillRect(x - 2, cy - 7, 1, 1);
    this.ctx.fillRect(x + 1, cy - 7, 1, 1);
    
    // Cheering arms
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x - 6, cy - 6, 2, 2);
    this.ctx.fillRect(x + 4, cy - 6, 2, 2);

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

  drawBall(x, y, angle) {
    this.ctx.save();
    this.ctx.translate(x, y);
    this.ctx.rotate(angle);

    // Ball outer white circle
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.ball.radius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    // Pentagons details (pixel style)
    this.ctx.fillStyle = '#111111';
    this.ctx.fillRect(-1, -1, 3, 3);
    this.ctx.fillRect(-6, -2, 2, 1);
    this.ctx.fillRect(4, -2, 2, 1);
    this.ctx.fillRect(-1, -6, 2, 1);
    this.ctx.fillRect(-1, 5, 2, 1);

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
      // brown cat has 9 frames, other colors (like white) have 10
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
