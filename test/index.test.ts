import { expect, jest, test, describe, beforeAll } from "@jest/globals";
import { WSWrapper } from "../src/WSWrapper";

const mockWebSocket = jest.fn().mockImplementation(() => {
  return {
    send: jest.fn(),
    close: jest.fn(),
    onopen: jest.fn(),
    onclose: jest.fn(),
    onerror: jest.fn(),
  };
});

describe("WSWrapper", () => {
  beforeAll(() => {
    // @ts-expect-error
    global.WebSocket = mockWebSocket;
  });

  test("Basic test", () => {
    const ws = new WSWrapper("url", {
      onmessage: () => {},
      autostart: true,
    });

    expect(ws.websocket).toBeTruthy();

    ws.send("hello");
    expect(ws.websocket.send).toHaveBeenCalledWith("hello");
  });
  test("Proxies on message", () => {
    const handleMessage = jest.fn();
    const ws = new WSWrapper("url", {
      onmessage: handleMessage,
      autostart: true,
    });

    ws.websocket.onmessage({} as any);
    expect(handleMessage).toBeCalledWith({});
  });
});
