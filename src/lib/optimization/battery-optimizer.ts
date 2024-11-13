'use client';

export class BatteryOptimizer {
  private static instance: BatteryOptimizer;
  private batteryLevel: number | null = null;
  private isCharging: boolean = false;

  static getInstance(): BatteryOptimizer {
    if (!BatteryOptimizer.instance) {
      BatteryOptimizer.instance = new BatteryOptimizer();
    }
    return BatteryOptimizer.instance;
  }

  async initialize() {
    if ('getBattery' in navigator) {
      const battery = await (navigator as any).getBattery();
      this.updateBatteryInfo(battery);

      battery.addEventListener('levelchange', () => this.updateBatteryInfo(battery));
      battery.addEventListener('chargingchange', () => this.updateBatteryInfo(battery));
    }
  }

  private updateBatteryInfo(battery: any) {
    this.batteryLevel = battery.level;
    this.isCharging = battery.charging;
    this.adjustFeatures();
  }

  private adjustFeatures() {
    if (this.batteryLevel === null) return;

    // Reduce animation frequency when battery is low
    if (this.batteryLevel < 0.2 && !this.isCharging) {
      document.body.classList.add('reduce-motion');
      this.disableNonEssentialFeatures();
    } else {
      document.body.classList.remove('reduce-motion');
      this.enableAllFeatures();
    }
  }

  private disableNonEssentialFeatures() {
    // Reduce polling frequency
    window.localStorage.setItem('polling_interval', '5000');
    
    // Disable animations
    document.body.style.setProperty('--animation-duration', '0s');
    
    // Reduce image quality
    document.body.classList.add('low-quality-images');
  }

  private enableAllFeatures() {
    // Reset polling frequency
    window.localStorage.setItem('polling_interval', '1000');
    
    // Enable animations
    document.body.style.removeProperty('--animation-duration');
    
    // Reset image quality
    document.body.classList.remove('low-quality-images');
  }

  getBatteryStatus() {
    return {
      level: this.batteryLevel,
      isCharging: this.isCharging
    };
  }
} 