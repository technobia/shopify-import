class RateLimiter {
  constructor() {
    this.currentlyAvailable = 2000;
    this.restoreRate = 100;
    this.maximumAvailable = 2000;
    this.lastUpdate = Date.now();
  }

  updateFromResponse(throttleStatus) {
    if (throttleStatus) {
      this.currentlyAvailable = throttleStatus.currentlyAvailable || this.currentlyAvailable;
      this.restoreRate = throttleStatus.restoreRate || this.restoreRate;
      this.maximumAvailable = throttleStatus.maximumAvailable || this.maximumAvailable;
      this.lastUpdate = Date.now();
    }
  }

  getRestoredPoints() {
    const timePassed = (Date.now() - this.lastUpdate) / 1000;
    return timePassed * this.restoreRate;
  }

  getCurrentAvailable() {
    const restored = this.getRestoredPoints();
    return Math.min(this.maximumAvailable, this.currentlyAvailable + restored);
  }

  canMakeRequest(cost = 1) {
    return this.getCurrentAvailable() >= cost;
  }

  getWaitTime(cost = 1) {
    const available = this.getCurrentAvailable();
    if (available >= cost) return 0;
    const pointsNeeded = cost - available;
    return Math.ceil((pointsNeeded / this.restoreRate) * 1000);
  }

  async waitForAvailability(cost = 1) {
    const waitTime = this.getWaitTime(cost);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  consumePoints(cost) {
    this.currentlyAvailable = Math.max(0, this.getCurrentAvailable() - cost);
    this.lastUpdate = Date.now();
  }

  getStatus() {
    return {
      currentlyAvailable: this.getCurrentAvailable(),
      maximumAvailable: this.maximumAvailable,
      restoreRate: this.restoreRate,
      utilizationPercent: ((this.maximumAvailable - this.getCurrentAvailable()) / this.maximumAvailable * 100).toFixed(1)
    };
  }
}

export const rateLimiter = new RateLimiter();