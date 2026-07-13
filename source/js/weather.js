// weather.js
export class WeatherEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = 'clear'; // clear (sun), rain, snow, autumn
    this.particles = [];
    this.isActive = false;
    this.scale = 4; // Downscale factor for pixel art resolution
    this.time = 0;
    
    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.w = Math.floor(window.innerWidth / this.scale);
    this.h = Math.floor(window.innerHeight / this.scale);
    this.canvas.width = this.w;
    this.canvas.height = this.h;
    
    // Re-populate particles to match screen size if active
    if (this.isActive) {
      this.setWeather(this.state, false);
    }
  }

  setWeather(state, notify = true) {
    this.state = state;
    this.particles = [];
    this.time = 0;
    
    if (state === 'clear') {
      this.isActive = false;
      this.ctx.clearRect(0, 0, this.w, this.h);
      document.body.style.background = '';
      return;
    }

    this.isActive = true;
    
    if (state === 'sun') {
      document.body.style.background = '#dceeff'; // Warm sunny sky
    } else if (state === 'rain') {
      document.body.style.background = '#c2d0e8'; // Gloomy grey-blue
      const count = Math.floor(this.w * 0.4);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h - this.h,
          vy: 8 + Math.random() * 6,
          vx: -1 - Math.random() * 1.5,
          len: 3 + Math.floor(Math.random() * 4),
          color: Math.random() < 0.5 ? '#5b9bf5' : '#7baef8'
        });
      }
    } else if (state === 'snow') {
      document.body.style.background = '#e9eff8'; // Cold frosty blue-white
      const count = Math.floor(this.w * 0.25);
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h - this.h,
          vy: 1.5 + Math.random() * 1.5,
          driftSpeed: 1 + Math.random() * 2,
          driftRange: 8 + Math.random() * 12,
          size: Math.random() < 0.7 ? 1 : 2,
          seed: Math.random() * 100
        });
      }
    } else if (state === 'autumn') {
      document.body.style.background = '#fcf2e6'; // Cozy warm beige-orange
      const count = Math.floor(this.w * 0.12);
      const leafColors = ['#d36a2e', '#b83232', '#e5c158', '#8d5334'];
      for (let i = 0; i < count; i++) {
        this.particles.push({
          x: Math.random() * this.w,
          y: Math.random() * this.h - this.h,
          vy: 1 + Math.random() * 1.5,
          vx: -0.5 + Math.random() * 1,
          driftSpeed: 1 + Math.random() * 1.5,
          driftRange: 15 + Math.random() * 15,
          size: 2 + Math.floor(Math.random() * 2),
          color: leafColors[Math.floor(Math.random() * leafColors.length)],
          seed: Math.random() * 100
        });
      }
    }
  }

  update(dt) {
    if (!this.isActive) return;
    this.time += dt;

    this.ctx.clearRect(0, 0, this.w, this.h);

    if (this.state === 'rain') {
      this.ctx.lineWidth = 1;
      this.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y > this.h || p.x < 0) {
          p.y = -p.len;
          p.x = Math.random() * this.w;
        }

        // Draw a pixelated raindrop
        this.ctx.strokeStyle = p.color;
        this.ctx.beginPath();
        this.ctx.moveTo(Math.floor(p.x), Math.floor(p.y));
        this.ctx.lineTo(Math.floor(p.x + p.vx * 0.3), Math.floor(p.y + p.len));
        this.ctx.stroke();
      });
    } 
    
    else if (this.state === 'snow') {
      this.ctx.fillStyle = '#ffffff';
      this.particles.forEach(p => {
        p.y += p.vy;
        // Drifting effect using sine wave
        const drift = Math.sin(this.time * p.driftSpeed + p.seed) * (p.driftRange * 0.05);
        const drawX = Math.floor(p.x + drift);
        const drawY = Math.floor(p.y);

        if (p.y > this.h) {
          p.y = -p.size;
          p.x = Math.random() * this.w;
        }

        // Draw pixelated snowflake
        this.ctx.fillRect(drawX, drawY, p.size, p.size);
      });
    } 
    
    else if (this.state === 'autumn') {
      this.particles.forEach(p => {
        p.y += p.vy;
        p.x += p.vx;
        
        // Leaf fluttering motion
        const drift = Math.sin(this.time * p.driftSpeed + p.seed) * (p.driftRange * 0.05);
        const drawX = Math.floor(p.x + drift);
        const drawY = Math.floor(p.y);

        if (p.y > this.h || p.x > this.w || p.x < -p.size) {
          p.y = -p.size;
          p.x = Math.random() * this.w;
        }

        // Draw custom pixelated leaf shape
        this.ctx.fillStyle = p.color;
        if (p.size === 2) {
          // 2x2 square leaf
          this.ctx.fillRect(drawX, drawY, 2, 2);
        } else {
          // 3x3 diagonal leaf (tilted cross shape)
          this.ctx.fillRect(drawX + 1, drawY, 1, 1);
          this.ctx.fillRect(drawX, drawY + 1, 3, 1);
          this.ctx.fillRect(drawX + 1, drawY + 2, 1, 1);
        }
      });
    }

    else if (this.state === 'sun') {
      // Draw pixelated pulsating retro sun in top right
      const cx = this.w - 30;
      const cy = 30;
      this.ctx.fillStyle = '#f5c63c';
      
      // Center sun body (circle-ish)
      this.ctx.fillRect(cx - 3, cy - 3, 6, 6);
      this.ctx.fillRect(cx - 4, cy - 2, 8, 4);
      this.ctx.fillRect(cx - 2, cy - 4, 4, 8);
      
      // Pulsating rays
      const pulse = Math.floor(Math.sin(this.time * 4) * 1.5);
      const rayLen = 4 + pulse;
      
      // Cardinal rays (N, S, E, W)
      this.ctx.fillRect(cx - 1, cy - 5 - rayLen, 2, rayLen); // North
      this.ctx.fillRect(cx - 1, cy + 5, 2, rayLen); // South
      this.ctx.fillRect(cx + 5, cy - 1, rayLen, 2); // East
      this.ctx.fillRect(cx - 5 - rayLen, cy - 1, rayLen, 2); // West
      
      // Diagonal rays
      const diagDist = 4 + Math.floor(rayLen * 0.7);
      this.ctx.fillRect(cx + 3, cy - 3 - diagDist + 2, 2, 2);
      this.ctx.fillRect(cx - 3 - diagDist, cy - 3 - diagDist + 2, 2, 2);
      this.ctx.fillRect(cx + 3, cy + 3 + diagDist - 4, 2, 2);
      this.ctx.fillRect(cx - 3 - diagDist, cy + 3 + diagDist - 4, 2, 2);
    }
  }
}
