// particles.js
// Simple particle system using DOM elements (pool to avoid memory leaks)
export class Particles {
  constructor(maxParticles = 30) {
    this.pool = [];
    this.active = [];
    
    // Pre-allocate pool
    for (let i = 0; i < maxParticles; i++) {
      const el = document.createElement('div');
      el.className = 'particle';
      el.style.display = 'none';
      document.body.appendChild(el);
      this.pool.push({
        el,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        scale: 1,
        type: ''
      });
    }
  }

  // type: 'dust', 'heartParticle', 'impact'
  emit(type, x, y, count = 1) {
    for (let i = 0; i < count; i++) {
      if (this.pool.length === 0) break; // pool exhausted
      
      const p = this.pool.pop();
      p.type = type;
      p.x = x;
      p.y = y;
      
      // Randomize based on type
      if (type === 'dust') {
        p.vx = (Math.random() - 0.5) * 50;
        p.vy = (Math.random() - 1) * 30; // mostly upward
        p.life = p.maxLife = Math.random() * 0.4 + 0.2;
        p.scale = Math.random() * 0.5 + 0.5;
        p.el.style.backgroundImage = `url('assets/particles/dust.png')`;
      } else if (type === 'heartParticle') {
        p.vx = (Math.random() - 0.5) * 30;
        p.vy = -Math.random() * 60 - 20; // float up
        p.life = p.maxLife = Math.random() * 0.5 + 0.5;
        p.scale = Math.random() * 0.3 + 0.3; // slightly smaller hearts
        p.el.style.backgroundImage = `url('assets/cursor/heart.png')`; 
      }
      
      p.el.style.display = 'block';
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale})`;
      p.el.style.opacity = 1;
      
      this.active.push(p);
    }
  }

  update(dt) {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.life -= dt;
      
      if (p.life <= 0) {
        // Return to pool
        p.el.style.display = 'none';
        this.active.splice(i, 1);
        this.pool.push(p);
        continue;
      }
      
      // Integrate velocity
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      
      // Float/gravity behavior based on type
      if (p.type === 'dust') {
        p.vy += 50 * dt; // slight gravity
      } else if (p.type === 'heartParticle') {
        p.vy -= 20 * dt; // float up
        p.x += Math.sin(p.life * 10) * 0.5; // wiggle
      }
      
      // Fade out
      const opacity = p.life / p.maxLife;
      p.el.style.opacity = opacity;
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0) scale(${p.scale})`;
    }
  }
}
