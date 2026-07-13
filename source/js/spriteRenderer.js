// spriteRenderer.js
// Renders a sprite sheet on a DOM element using background-position
export class SpriteRenderer {
  /**
   * @param {HTMLElement} element - element whose background will be animated
   * @param {HTMLImageElement} sheet - loaded sprite sheet image
   * @param {number} frameCount - total frames in the sheet (horizontal)
   * @param {number} fps - animation speed
   */
  constructor(element, sheet, frameCount, fps = 12, displayWidth = 48, displayHeight = 48, cols = null) {
    this.el = element;
    this.sheet = sheet;
    this.frameCount = frameCount;
    this.fps = fps;
    this.currentFrame = 0;
    this.acc = 0;
    
    this.displayWidth = displayWidth;
    this.displayHeight = displayHeight;

    // Default to a horizontal strip if cols isn't provided
    this.cols = cols || frameCount;
    this.rows = Math.ceil(frameCount / this.cols);

    // To scale the background properly for a grid:
    // If we want each frame to be displayWidth x displayHeight,
    // the total background size must be (displayWidth * cols) x (displayHeight * rows)
    this.bgWidth = displayWidth * this.cols;
    this.bgHeight = displayHeight * this.rows;
  }

  activate() {
    this.el.style.backgroundImage = `url('${this.sheet.src}')`;
    this.el.style.backgroundSize = `${this.bgWidth}px ${this.bgHeight}px`;
    this.el.style.width = `${this.displayWidth}px`;
    this.el.style.height = `${this.displayHeight}px`;
    this.applyFrame();
  }

  update(dt) {
    this.acc += dt * this.fps;
    if (this.acc >= 1 && this.frameCount > 1) {
      const framesToAdvance = Math.floor(this.acc);
      this.currentFrame = (this.currentFrame + framesToAdvance) % this.frameCount;
      this.acc -= framesToAdvance;
      this.applyFrame();
    }
  }

  setFrame(frame) {
    this.currentFrame = frame % this.frameCount;
    this.applyFrame();
  }

  applyFrame() {
    const col = this.currentFrame % this.cols;
    const row = Math.floor(this.currentFrame / this.cols);
    const offsetX = -col * this.displayWidth;
    const offsetY = -row * this.displayHeight;
    this.el.style.backgroundPosition = `${offsetX}px ${offsetY}px`;
  }
}
