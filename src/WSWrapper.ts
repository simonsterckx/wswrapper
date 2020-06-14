export interface WSWrapperOptions {
  maxAttempts?: number;
  protocols?: string | string[];
  binaryType?: BinaryType;
  onmessage: (e: MessageEvent) => void;
  onopen?: (e: Event) => void;
  onclose?: (e: CloseEvent) => void;
  onerror?: (e: Event) => void;
  onreconnect?: (e: Event) => void;
  timeout?: number;
  onmaximum?: any;
}

export default class WSWrapper {
  websocket: WebSocket;
  options: WSWrapperOptions;
  url: string;
  attemptedReconnects = 0;
  timerId = -1;
  constructor(url: string, options: WSWrapperOptions) {
    this.url = url;
    this.options = {
      binaryType: "blob",
      maxAttempts: Infinity,
      protocols: [],
      timeout: 1000,
      ...options,
    };

    this.open();
  }
  open() {
    const ws = new WebSocket(this.url, this.options.protocols);
    this.websocket = ws;

    ws.binaryType = this.options.binaryType;
    ws.onmessage = this.options.onmessage;

    ws.onopen = (evt) => {
      this.options.onopen?.(evt);
      this.attemptedReconnects = 0;
    };
    ws.onclose = (evt) => {
      // https://github.com/Luka967/websocket-close-codes
      evt.code === 1000 ||
        evt.code === 1001 ||
        evt.code === 1005 ||
        this.reconnect(evt);
      this.options.onclose?.(evt);
    };

    ws.onerror = (evt) => {
      this.options.onerror?.(evt);
    };
  }
  reconnect(evt: Event) {
    if (this.timerId && this.attemptedReconnects++ < this.options.maxAttempts) {
      const timeoutFn = () => {
        this.options.onreconnect?.(evt);
        this.open();
      };
      this.timerId = setTimeout(timeoutFn, this.options.timeout);
    } else {
      this.options.onmaximum?.(evt);
    }
  }

  send(message: string | ArrayBuffer | Blob | ArrayBufferView) {
    this.websocket.send(message);
  }

  close(code?: number, reason?: string) {
    clearTimeout(this.timerId);
    this.timerId = -1;
    this.websocket.close(code || 1000, reason);
  }
}
