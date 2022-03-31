
export type ListenerCallback<T> = {(event: T): void};
export class EventStream<T> {
  listeners: ListenerCallback<T>[];
  constructor() {
    this.listeners = [];
  }
  addEventListener(callback: ListenerCallback<T>): void {
    this.listeners.push(callback);
  }
  push(event: T): void {
    this.listeners.forEach((f)=>f(event));
  }
}

export class TimeTicks {
  timerId: number;
  interval: number;
  stream: EventStream<void>;
  constructor(interval: number){
    this.interval = interval;
    this.stream = new EventStream();
  }
  addEventListener(callback: ListenerCallback<void>): void {
    this.stream.addEventListener(callback);
  }
  start(): void {
    this.pause();
    this.timerId = window.setInterval(
      ()=>this.stream.push(), this.interval
    );
  }
  pause(): void {
    window.clearInterval(this.timerId);
  }
}
