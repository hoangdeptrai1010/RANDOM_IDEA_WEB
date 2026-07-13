// stateMachine.js
// Generic state machine utility
export class StateMachine {
  constructor() {
    this.states = {};
    this.current = null;
    this.currentStateName = '';
    this.timer = 0;
  }

  addState(name, config) {
    this.states[name] = config;
  }

  transition(to) {
    if (this.current === this.states[to]) return;
    
    if (this.current && this.current.onExit) {
      this.current.onExit();
    }
    
    this.current = this.states[to];
    this.currentStateName = to;
    this.timer = 0; // Reset timer on state entry
    
    if (this.current && this.current.onEnter) {
      this.current.onEnter();
    }
  }

  update(dt) {
    if (this.current) {
      this.timer += dt;
      if (this.current.onUpdate) {
        this.current.onUpdate(dt, this.timer);
      }
    }
  }
}
