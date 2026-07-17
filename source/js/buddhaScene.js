// buddhaScene.js
import { AssetLoader } from './assetLoader.js';

export class BuddhaScene {
  constructor(canvas, textElement, onVictory) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.textElement = textElement;
    this.onVictory = onVictory;

    this.w = 600;
    this.h = 400;
    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.running = false;
    this.time = 0;

    // Chants array
    this.chants = [
      "Nương tựa Phật ☸",
      "Nương tựa Pháp 📜",
      "Nương tựa Tăng 📿",
      "Tâm bất biến giữa dòng đời vạn biến 🙏"
    ];
    this.chantIndex = 0;
    this.chantTimer = 0;

    // Particles (Lotus petals & Golden light specks)
    this.particles = [];
    this.maxParticles = 30;

    // Cat positioning
    this.cat = {
      x: 300,
      y: 350, // Floor walk level
      facingRight: true,
      speed: 60,
      state: 'walk',
      time: 0
    };

    this.initScene();
  }

  initScene() {
    this.time = 0;
    this.chantIndex = 0;
    this.chantTimer = 0;
    this.particles = [];
    this.cat.time = 0;
    this.cat.x = 300;
    this.cat.y = 350;
    this.cat.facingRight = true;
    this.cat.state = 'walk';

    // Initialize floating petals
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle(true));
    }

    if (this.textElement) {
      this.textElement.textContent = this.chants[this.chantIndex];
    }
  }

  createParticle(randomY = false) {
    return {
      x: Math.random() * (this.w + 100) - 50,
      y: randomY ? Math.random() * this.h : -20,
      size: 3 + Math.random() * 4,
      vx: -0.5 - Math.random() * 1.0,
      vy: 0.6 + Math.random() * 0.8,
      type: Math.random() < 0.4 ? 'petal' : 'glow', // Petal (pink) or glow (golden light)
      seed: Math.random() * 100,
      opacity: 0.3 + Math.random() * 0.7
    };
  }

  start() {
    this.running = true;
    this.initScene();
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
    this.cat.time += dt;

    // Move cat back and forth across screen
    if (this.cat.facingRight) {
      this.cat.x += this.cat.speed * dt;
      if (this.cat.x > 520) {
        this.cat.x = 520;
        this.cat.facingRight = false;
      }
    } else {
      this.cat.x -= this.cat.speed * dt;
      if (this.cat.x < 80) {
        this.cat.x = 80;
        this.cat.facingRight = true;
      }
    }

    // 1. Cycle Chants
    this.chantTimer += dt;
    if (this.chantTimer >= 3.5) {
      this.chantTimer = 0;

      // If we finished the last chant, trigger victory
      if (this.chantIndex === this.chants.length - 1) {
        if (this.onVictory) {
          this.onVictory();
          return;
        }
      }

      this.chantIndex = (this.chantIndex + 1) % this.chants.length;
      if (this.textElement) {
        this.textElement.style.opacity = 0;
        setTimeout(() => {
          if (this.running && this.textElement) {
            this.textElement.textContent = this.chants[this.chantIndex];
            this.textElement.style.opacity = 1;
          }
        }, 300);
      }
    }

    // 2. Update Particles
    this.particles.forEach((p, index) => {
      p.x += p.vx + Math.sin(this.time + p.seed) * 0.15;
      p.y += p.vy;

      // Recycle off-screen particles
      if (p.y > this.h + 10 || p.x < -20) {
        this.particles[index] = this.createParticle(false);
      }
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.w, this.h);

    // 1. Draw serene dusk sunset sky gradient
    const sky = this.ctx.createLinearGradient(0, 0, 0, this.h);
    sky.addColorStop(0, '#090d16'); // Dark cosmic indigo
    sky.addColorStop(0.4, '#1b1d30'); // Deep dark violet
    sky.addColorStop(0.7, '#382743'); // Serene twilight purple
    sky.addColorStop(0.9, '#724b55'); // Soft sunset orange-red
    sky.addColorStop(1, '#a87462'); // Warm golden brown at horizon
    this.ctx.fillStyle = sky;
    this.ctx.fillRect(0, 0, this.w, this.h);

    // 2. Draw giant glowing Moon
    const mx = 420;
    const my = 140;
    const mr = 68;

    // Outer glow circles
    for (let r = mr + 30; r > mr; r -= 10) {
      const alpha = (1.0 - (r - mr) / 30) * 0.08;
      this.ctx.fillStyle = `rgba(255, 235, 190, ${alpha})`;
      this.ctx.beginPath();
      this.ctx.arc(mx, my, r, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Solid moon body
    this.ctx.fillStyle = '#fffaed';
    this.ctx.beginPath();
    this.ctx.arc(mx, my, mr, 0, Math.PI * 2);
    this.ctx.fill();

    // 3. Draw silhouette of distant mountains & tree branch
    this.ctx.fillStyle = 'rgba(12, 16, 25, 0.45)';
    this.ctx.beginPath();
    this.ctx.moveTo(0, this.h);
    this.ctx.lineTo(150, 280);
    this.ctx.lineTo(340, 360);
    this.ctx.lineTo(480, 320);
    this.ctx.lineTo(this.w, this.h);
    this.ctx.fill();

    // Tree silhouette (Pine/Bonsai) on the left
    this.ctx.fillStyle = '#0a0e14';
    // Trunk
    this.ctx.beginPath();
    this.ctx.moveTo(35, this.h);
    this.ctx.quadraticCurveTo(45, 220, 90, 160);
    this.ctx.lineTo(98, 163);
    this.ctx.quadraticCurveTo(55, 225, 55, this.h);
    this.ctx.fill();

    // Branches & Leaf clusters
    this.ctx.beginPath();
    // Lower cluster
    this.ctx.arc(60, 240, 32, 0, Math.PI * 2);
    this.ctx.arc(90, 225, 28, 0, Math.PI * 2);
    // Upper cluster
    this.ctx.arc(100, 160, 35, 0, Math.PI * 2);
    this.ctx.arc(130, 150, 24, 0, Math.PI * 2);
    this.ctx.fill();

    // 4. Draw Meditating Cat (Walking instead of cushion)
    this.drawCat();

    // 5. Draw floating particles (lotus petals & light specks)
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.globalAlpha = p.opacity;

      if (p.type === 'petal') {
        // Draw little pink petal shape
        this.ctx.fillStyle = '#ffb7c5'; // Cherry blossom pink
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, p.size, p.size / 2, Math.PI / 4 + Math.sin(this.time + p.seed) * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        // Draw glowing golden light spot
        const rad = p.size / 2;
        const grad = this.ctx.createRadialGradient(0, 0, 0, 0, 0, rad);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#ffd700');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, rad, 0, Math.PI * 2);
        this.ctx.fill();
      }

      this.ctx.restore();
    });
  }

  drawCat() {
    const walkSheet = AssetLoader.get('cat_walk');
    if (!walkSheet) return;

    const frameCount = 8;
    const fps = 8;
    const frameIndex = Math.floor(this.cat.time * fps) % frameCount;

    const nativeWidth = walkSheet.naturalWidth / frameCount;
    const nativeHeight = walkSheet.naturalHeight;

    const displayWidth = nativeWidth * 0.72;
    const displayHeight = nativeHeight * 0.72;

    this.ctx.save();
    this.ctx.translate(this.cat.x, this.cat.y);
    
    // Scale horizontal depending on walking direction
    if (!this.cat.facingRight) {
      this.ctx.scale(-1, 1);
    }
    
    this.ctx.drawImage(
      walkSheet,
      frameIndex * nativeWidth, 0, nativeWidth, nativeHeight,
      -displayWidth / 2, -displayHeight, displayWidth, displayHeight
    );
    this.ctx.restore();
  }
}
