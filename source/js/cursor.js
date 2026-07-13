// cursor.js
// Handles cursor position tracking
export class Cursor {
  constructor(element) {
    this.el = element;
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;
    this.lastX = this.x;
    this.lastY = this.y;
    this.speed = 0;
  }

  init() {
    document.addEventListener('mousemove', (e) => {
      this.x = e.clientX;
      this.y = e.clientY;
      // Update DOM instantly for zero lag
      this.el.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) translate(-50%, -50%)`;
    });
  }

  update(dt) {
    // Calculate speed based on distance moved since last frame
    const dx = this.x - this.lastX;
    const dy = this.y - this.lastY;
    
    // Prevent division by zero
    if (dt > 0) {
        this.speed = Math.hypot(dx, dy) / dt;
    } else {
        this.speed = 0;
    }

    this.lastX = this.x;
    this.lastY = this.y;
  }

  getTarget() {
    return {
      x: this.x,
      y: this.y,
      speed: this.speed
    };
  }
}
