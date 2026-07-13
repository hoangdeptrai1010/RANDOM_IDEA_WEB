// physics.js
// Simple physics body with position, velocity, acceleration, damping
export class Body {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 0;
    this.maxSpeed = 0;
    this.maxAccel = 0;
  }

  // Set limits for speed and acceleration
  setLimits({ maxSpeed = 0, maxAccel = 0 } = {}) {
    this.maxSpeed = maxSpeed;
    this.maxAccel = maxAccel;
  }

  // Update physics using delta time (seconds)
  update(dt) {
    // Apply acceleration limits
    if (this.maxAccel > 0) {
      const accelMag = Math.hypot(this.ax, this.ay);
      if (accelMag > this.maxAccel) {
        const scale = this.maxAccel / accelMag;
        this.ax *= scale;
        this.ay *= scale;
      }
    }

    // Integrate velocity
    this.vx += this.ax * dt;
    this.vy += this.ay * dt;

    // Apply velocity damping for smooth stop (LERP style)
    const damping = 0.92; // can be tuned per entity
    this.vx *= damping;
    this.vy *= damping;

    // Speed limit
    if (this.maxSpeed > 0) {
      const speed = Math.hypot(this.vx, this.vy);
      if (speed > this.maxSpeed) {
        const scale = this.maxSpeed / speed;
        this.vx *= scale;
        this.vy *= scale;
      }
    }

    // Integrate position
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
}
