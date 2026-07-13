// npcCursor.js
export class NPCCursor {
  constructor(anchorX, anchorY, wanderRadius = 70) {
    this.anchorX = anchorX;
    this.anchorY = anchorY;
    this.wanderRadius = wanderRadius;
    this.target = { x: anchorX, y: anchorY, speed: 0 };
    this.timer = 0;
    this.pickNewTarget();
  }

  setAnchor(x, y) {
    this.anchorX = x;
    this.anchorY = y;
    this.pickNewTarget();
  }

  pickNewTarget() {
    // Pick a random point within a circle around the anchor
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * this.wanderRadius;
    this.target.x = this.anchorX + Math.cos(angle) * dist;
    this.target.y = this.anchorY + Math.sin(angle) * dist;
  }

  update(dt) {
    this.timer -= dt;
    if (this.timer <= 0) {
      this.pickNewTarget();
      
      // Pick a new target every 2.0 to 6.0 seconds
      this.timer = 2.0 + Math.random() * 4.0;
      
      // Occasionally simulate a fast "cursor" movement to trigger the cat's RUN state
      if (Math.random() < 0.25) {
        this.target.speed = 350 + Math.random() * 200;
      } else {
        this.target.speed = 50 + Math.random() * 100;
      }
    } else {
      // Decay speed over time so the cat slows down naturally after reaching target
      this.target.speed *= 0.95;
    }
  }

  getTarget() {
    return this.target;
  }
}
