// cat.js
import { Body } from './physics.js';
import { StateMachine } from './stateMachine.js';
import { SpriteRenderer } from './spriteRenderer.js';
import { AssetLoader } from './assetLoader.js';

export class Cat {
  constructor(element, color = 'orange') {
    this.el = element;
    this.color = color;
    this.body = new Body(window.innerWidth / 2, window.innerHeight / 2);
    this.sm = new StateMachine();
    this.particles = null;
    this.facingRight = true;
    
    // We will dynamically create SpriteRenderers for each state
    this.renderers = {};
    this.currentRenderer = null;
    
    // Config values
    this.targetDist = 45; // distance to keep from cursor
    
    this.initStates();
  }

  setParticles(p) {
    this.particles = p;
  }

  // Create a sprite renderer by dynamically calculating dimensions to preserve aspect ratio
  createRenderer(assetName, frameCount, fps) {
    const sheet = AssetLoader.get(assetName);
    if (!sheet) {
      console.warn(`Asset not found: ${assetName}`);
      return null;
    }
    
    const nativeWidth = sheet.naturalWidth / frameCount;
    const nativeHeight = sheet.naturalHeight;
    
    // Scale factor to keep the companion at a premium size
    const scale = 0.55; 
    const displayWidth = nativeWidth * scale;
    const displayHeight = nativeHeight * scale;
    
    return new SpriteRenderer(this.el, sheet, frameCount, fps, displayWidth, displayHeight);
  }

  async initSprites() {
    // Determine the run frame count (brown cat run GIF has 9 frames, others have 10)
    const runFrames = (this.color === 'brown') ? 9 : 10;

    this.renderers['idle'] = this.createRenderer('cat_idle', 8, 8);
    this.renderers['walk'] = this.createRenderer('cat_walk', 8, 8);
    this.renderers['run']  = this.createRenderer('cat_run', runFrames, 12);
    this.renderers['swipe'] = this.createRenderer('cat_swipe', 7, 10);
    this.renderers['with_ball'] = this.createRenderer('cat_with_ball', 8, 8);
    this.renderers['climb'] = this.createRenderer('cat_climb', 8, 8);
    this.renderers['fall'] = this.createRenderer('cat_fall', 3, 8);
    this.renderers['land'] = this.createRenderer('cat_land', 2, 8);
    
    this.currentRenderer = this.renderers['idle'];
  }

  initStates() {
    // Helper to safely activate a renderer
    const setRenderer = (key) => {
      this.currentRenderer = this.renderers[key];
      if (this.currentRenderer) this.currentRenderer.activate();
    };

    // IDLE State
    this.sm.addState('idle', {
      onEnter: () => {
        setRenderer('idle');
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 }); // stop completely
      }
    });

    // WALK State
    this.sm.addState('walk', {
      onEnter: () => {
        setRenderer('walk');
        this.body.setLimits({ maxSpeed: 160, maxAccel: 800 });
      },
      onUpdate: (dt, timer) => {
        // Emit dust occasionally at feet
        if (this.particles && Math.random() < 0.08) {
          const halfHeight = this.currentRenderer ? this.currentRenderer.displayHeight / 2 : 20;
          this.particles.emit('dust', this.body.x, this.body.y + halfHeight, 1);
        }
      }
    });

    // RUN State
    this.sm.addState('run', {
      onEnter: () => {
        setRenderer('run');
        this.body.setLimits({ maxSpeed: 380, maxAccel: 1800 });
      },
      onUpdate: (dt, timer) => {
        // Emit dust behind feet
        if (this.particles && Math.random() < 0.25) {
          const halfHeight = this.currentRenderer ? this.currentRenderer.displayHeight / 2 : 20;
          const offset = this.facingRight ? -15 : 15;
          this.particles.emit('dust', this.body.x + offset, this.body.y + halfHeight, 2);
        }
      }
    });

    // CLIMB (Wall Climb) State
    this.sm.addState('climb', {
      onEnter: () => {
        setRenderer('climb');
        this.body.setLimits({ maxSpeed: 200, maxAccel: 1000 });
      }
    });

    // FALL State
    this.sm.addState('fall', {
      onEnter: () => {
        setRenderer('fall');
        this.body.setLimits({ maxSpeed: 400, maxAccel: 1500 });
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
        if (this.currentRenderer) this.currentRenderer.setFrame(0);
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 });
      }
    });

    // WITH BALL State
    this.sm.addState('with_ball', {
      onEnter: () => {
        setRenderer('with_ball');
        if (this.currentRenderer) this.currentRenderer.setFrame(0);
        this.body.setLimits({ maxSpeed: 0, maxAccel: 0 });
      },
      onUpdate: (dt, timer) => {
        // Emit hearts from cat's head
        if (this.particles && timer > 0.5 && Math.random() < 0.05) {
          const halfHeight = this.currentRenderer ? this.currentRenderer.displayHeight / 2 : 20;
          this.particles.emit('heartParticle', this.body.x, this.body.y - halfHeight, 1);
        }
      }
    });

    this.sm.transition('idle');
  }

  update(dt, cursor) {
    if (!this.currentRenderer) return; // Wait for sprites to load
    
    const target = cursor.getTarget();
    const dx = target.x - this.body.x;
    const dy = target.y - this.body.y;
    const dist = Math.hypot(dx, dy);
    
    const halfWidth = this.currentRenderer.displayWidth / 2;
    const halfHeight = this.currentRenderer.displayHeight / 2;
    
    // Determine state
    const speed = Math.hypot(this.body.vx, this.body.vy);
    const currentState = this.sm.currentStateName;
    
    // Check if we are in a timed-exclusive state
    let stateFinished = false;
    if (currentState === 'swipe') {
      // swipe has 7 frames at 10fps = 0.7s duration
      stateFinished = this.sm.timer >= 0.7;
    } else if (currentState === 'with_ball') {
      // with_ball has 8 frames at 8fps = 1.0s. Let it loop 2 times = 2.0s
      stateFinished = this.sm.timer >= 2.0;
    } else if (currentState === 'land') {
      // land has 2 frames at 8fps = 0.25s duration
      stateFinished = this.sm.timer >= 0.25;
    }
    
    if ((currentState === 'swipe' || currentState === 'with_ball' || currentState === 'land') && !stateFinished) {
      // Keep running the current state
      this.body.ax = 0;
      this.body.ay = 0;
    } else {
      let targetState = 'idle';
      
      if (dist > this.targetDist) {
        // Move towards target
        const springK = 7.5;
        this.body.ax = dx * springK;
        this.body.ay = dy * springK;
        
        // Facing direction
        if (dx > 5) this.facingRight = true;
        if (dx < -5) this.facingRight = false;
        
        // Choose vertical or horizontal animation state based on velocity
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
        // Close to target, stop acceleration
        this.body.ax = 0;
        this.body.ay = 0;
        
        if (speed < 15) {
          // Transition from vertical movement to landing/idle
          if (currentState === 'fall' || currentState === 'climb') {
            targetState = 'land';
          } else {
            targetState = 'idle';
            
            // Random chance to play with ball or swipe when standing idle near the heart
            if (currentState === 'idle' && Math.random() < 0.006) {
              targetState = Math.random() < 0.5 ? 'swipe' : 'with_ball';
            }
          }
        } else {
          // Decelerating
          if (this.body.vy > 40) {
            targetState = 'fall';
          } else {
            targetState = 'walk';
          }
        }
      }
      
      this.sm.transition(targetState);
    }
    
    // Update physics, state machine, and renderer
    this.body.update(dt);
    this.sm.update(dt);
    
    // Constrain position to screen boundaries (stay on screen)
    this.body.x = Math.max(halfWidth, Math.min(window.innerWidth - halfWidth, this.body.x));
    this.body.y = Math.max(halfHeight, Math.min(window.innerHeight - halfHeight, this.body.y));
    
    this.currentRenderer.update(dt);
    
    // Render DOM element
    const flip = this.facingRight ? 1 : -1;
    this.el.style.transform = `translate3d(${this.body.x}px, ${this.body.y}px, 0) translate(-50%, -50%) scaleX(${flip})`;
  }
}
