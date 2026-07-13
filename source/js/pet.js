// pet.js
import { Body } from './physics.js';
import { StateMachine } from './stateMachine.js';

class GifRenderer {
  constructor(el, type, color, scale = 0.95) {
    this.el = el;
    this.type = type;
    this.color = color;
    this.scale = scale;

    // Approximate display size for vscode-pet gifs (usually around 32x32 native)
    this.displayWidth = 42 * scale;
    this.displayHeight = 42 * scale;

    this.el.style.width = `${this.displayWidth}px`;
    this.el.style.height = `${this.displayHeight}px`;
  }

  activate() {
    // No-op for GIF
  }

  play(state) {
    let gifName = state;
    // Fallback if certain animations do not exist for the pet
    if (state === 'climb' || state === 'fall' || state === 'land') {
      gifName = 'idle';
    }

    const src = `assets/pets/${this.type}/${this.color}_${gifName}.gif`;
    
    // Set source dynamically
    const currentSrc = this.el.getAttribute('src');
    if (!currentSrc || !currentSrc.endsWith(src)) {
      this.el.setAttribute('src', src);
    }
  }

  update(dt) {
    // No-op since browser handles GIF frames
  }
}

export class Pet {
  constructor(element, type = 'cat', color = 'white') {
    this.el = element;
    this.type = type;
    this.color = color;
    
    this.body = new Body(window.innerWidth / 2, window.innerHeight / 2);
    this.sm = new StateMachine();
    this.particles = null;
    this.facingRight = true;
    
    // Scale bunnies a bit larger because they are small in sprite native sizes
    const scale = (type === 'bunny') ? 1.1 : 0.95;
    this.currentRenderer = new GifRenderer(this.el, type, color, scale);
    
    this.targetDist = 45;
    this.initStates();
  }

  setParticles(p) {
    this.particles = p;
  }

  changePet(type, color) {
    this.type = type;
    this.color = color;
    const scale = (type === 'bunny') ? 1.1 : 0.95;
    this.currentRenderer = new GifRenderer(this.el, type, color, scale);
    this.currentRenderer.play(this.sm.currentStateName || 'idle');
  }

  initStates() {
    const setRenderer = (key) => {
      this.currentRenderer.play(key);
    };

    // IDLE State
    this.sm.addState('idle', {
      onEnter: () => {
        setRenderer('idle');
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 });
      }
    });

    // WALK State
    this.sm.addState('walk', {
      onEnter: () => {
        setRenderer('walk');
        this.body.setLimits({ maxSpeed: 140, maxAccel: 700 });
      },
      onUpdate: (dt, timer) => {
        if (this.particles && Math.random() < 0.08) {
          this.particles.emit('dust', this.body.x, this.body.y + 15, 1);
        }
      }
    });

    // RUN State
    this.sm.addState('run', {
      onEnter: () => {
        setRenderer('run');
        this.body.setLimits({ maxSpeed: 300, maxAccel: 1500 });
      },
      onUpdate: (dt, timer) => {
        if (this.particles && Math.random() < 0.25) {
          const offset = this.facingRight ? -10 : 10;
          this.particles.emit('dust', this.body.x + offset, this.body.y + 15, 2);
        }
      }
    });

    // CLIMB (Wall Climb) State
    this.sm.addState('climb', {
      onEnter: () => {
        setRenderer('climb');
        this.body.setLimits({ maxSpeed: 160, maxAccel: 800 });
      }
    });

    // FALL State
    this.sm.addState('fall', {
      onEnter: () => {
        setRenderer('fall');
        this.body.setLimits({ maxSpeed: 300, maxAccel: 1200 });
      }
    });

    // LAND State
    this.sm.addState('land', {
      onEnter: () => {
        setRenderer('land');
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 });
      }
    });

    // SWIPE State
    this.sm.addState('swipe', {
      onEnter: () => {
        setRenderer('swipe');
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 });
      }
    });

    // WITH BALL State
    this.sm.addState('with_ball', {
      onEnter: () => {
        setRenderer('with_ball');
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 });
      },
      onUpdate: (dt, timer) => {
        if (this.particles && timer > 0.5 && Math.random() < 0.05) {
          this.particles.emit('heartParticle', this.body.x, this.body.y - 15, 1);
        }
      }
    });

    this.sm.transition('idle');
  }

  update(dt, cursor) {
    const target = cursor.getTarget();
    const dx = target.x - this.body.x;
    const dy = target.y - this.body.y;
    const dist = Math.hypot(dx, dy);
    
    const halfWidth = this.currentRenderer.displayWidth / 2;
    const halfHeight = this.currentRenderer.displayHeight / 2;
    
    const speed = Math.hypot(this.body.vx, this.body.vy);
    const currentState = this.sm.currentStateName;
    
    let stateFinished = false;
    if (currentState === 'swipe') {
      stateFinished = this.sm.timer >= 1.0;
    } else if (currentState === 'with_ball') {
      stateFinished = this.sm.timer >= 2.0;
    } else if (currentState === 'land') {
      stateFinished = this.sm.timer >= 0.3;
    }
    
    if ((currentState === 'swipe' || currentState === 'with_ball' || currentState === 'land') && !stateFinished) {
      this.body.ax = 0;
      this.body.ay = 0;
    } else {
      let targetState = 'idle';
      
      if (dist > this.targetDist) {
        const springK = 7.5;
        this.body.ax = dx * springK;
        this.body.ay = dy * springK;
        
        if (dx > 5) this.facingRight = true;
        if (dx < -5) this.facingRight = false;
        
        const absVx = Math.abs(this.body.vx);
        const absVy = Math.abs(this.body.vy);
        
        if (absVy > 80 && absVy > absVx) {
          if (this.body.vy < 0) {
            targetState = 'climb';
          } else {
            targetState = 'fall';
          }
        } else {
          if (dist > 180 || target.speed > 280) {
            targetState = 'run';
          } else {
            targetState = 'walk';
          }
        }
      } else {
        this.body.ax = 0;
        this.body.ay = 0;
        
        if (speed < 15) {
          if (currentState === 'fall' || currentState === 'climb') {
            targetState = 'land';
          } else {
            targetState = 'idle';
            
            if (currentState === 'idle' && Math.random() < 0.006) {
              targetState = Math.random() < 0.5 ? 'swipe' : 'with_ball';
            }
          }
        } else {
          if (this.body.vy > 40) {
            targetState = 'fall';
          } else {
            targetState = 'walk';
          }
        }
      }
      
      this.sm.transition(targetState);
    }
    
    this.body.update(dt);
    this.sm.update(dt);
    
    this.body.x = Math.max(halfWidth, Math.min(window.innerWidth - halfWidth, this.body.x));
    this.body.y = Math.max(halfHeight, Math.min(window.innerHeight - halfHeight, this.body.y));
    
    this.currentRenderer.update(dt);
    
    const flip = this.facingRight ? 1 : -1;
    this.el.style.transform = `translate3d(${this.body.x}px, ${this.body.y}px, 0) translate(-50%, -50%) scaleX(${flip})`;
  }
}
