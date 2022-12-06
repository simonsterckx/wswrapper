export interface WSWrapperOptions {
  onmessage: (e: MessageEvent) => void;

  autostart?: boolean;
  maxAttempts?: number;
  protocols?: string | string[];
  binaryType?: BinaryType;
  onopen?: (e: Event) => void;
  onclose?: (e: CloseEvent) => void;
  onerror?: (e: Event) => void;
  onreconnect?: (e: Event) => void;
  timeout?: number;
  onmaximum?: (e: Event) => void;
}

const defaultOptions = {
  binaryType: "blob",
  maxAttempts: Infinity,
  protocols: [] as string[],
  timeout: 1000,
  autostart: false,
  onopen: () => {},
  onclose: () => {},
  onerror: () => {},
  onreconnect: () => {},
  onmaximum: () => {},
} as const;

export class WSWrapper {
  websocket!: WebSocket;
  options: Required<WSWrapperOptions>;
  url: string;
  attemptedReconnects = 0;
  timerId = -1;
  constructor(url: string, options: WSWrapperOptions) {
    this.url = url;
    this.options = {
      ...defaultOptions,
      ...options,
    };

    if (this.options.autostart) {
      this.open();
    }
  }
  public open() {
    const ws = new WebSocket(this.url, this.options.protocols);
    this.websocket = ws;

    ws.binaryType = this.options.binaryType;
    ws.onmessage = this.options.onmessage;

    ws.onopen = (evt) => {
      this.options.onopen(evt);
      this.attemptedReconnects = 0;
    };
    ws.onclose = (evt) => {
      // https://github.com/Luka967/websocket-close-codes
      evt.code === 1000 ||
        evt.code === 1001 ||
        evt.code === 1005 ||
        this.reconnect(evt);
      this.options.onclose(evt);
    };

    ws.onerror = (evt) => {
      this.options.onerror(evt);
    };
  }
  private reconnect(evt: Event) {
    if (this.timerId && this.attemptedReconnects++ < this.options.maxAttempts) {
      const timeoutFn = () => {
        this.options.onreconnect(evt);
        this.open();
      };
      this.timerId = setTimeout(
        timeoutFn,
        this.options.timeout
      ) as unknown as number;
    } else {
      this.options.onmaximum(evt);
    }
  }

  public send(message: string | ArrayBuffer | Blob | ArrayBufferView) {
    this.websocket.send(message);
  }

  public close(code?: number, reason?: string) {
    clearTimeout(this.timerId);
    this.timerId = -1;
    this.websocket.close(code || 1000, reason);
  }
}
