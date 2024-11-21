export class QueueError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'QueueError';
  }
}

export class PlayerError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'PlayerError';
  }
}

export class RealTimeError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'RealTimeError';
  }
}

export class AnalyticsError extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'AnalyticsError';
  }
} 