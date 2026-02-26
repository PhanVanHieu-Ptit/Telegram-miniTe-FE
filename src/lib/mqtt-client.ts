import mqtt, {
  type MqttClient,
  type IClientOptions,
  type ISubscriptionGrant,
  type Packet,
} from "mqtt";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MqttConnectionOptions {
  /** WebSocket URL, e.g. "wss://broker.example.com:8084/mqtt" */
  url: string;
  username?: string;
  password?: string;
  /** Client‑id — a random one is generated when omitted */
  clientId?: string;
  /** Keep‑alive interval in seconds (default 60) */
  keepalive?: number;
  /** Auto‑reconnect period in ms (default 5000) */
  reconnectPeriod?: number;
  /** Connection timeout in ms (default 30000) */
  connectTimeout?: number;
  /** MQTT protocol version – 4 = 3.1.1, 5 = 5.0 (default 4) */
  protocolVersion?: 4 | 5;
  /** Extra options forwarded straight to mqtt.js */
  extra?: Partial<IClientOptions>;
}

export type QoS = 0 | 1 | 2;

export interface PublishOptions {
  qos?: QoS;
  retain?: boolean;
}

export interface SubscribeOptions {
  qos?: QoS;
}

export type MessageCallback = (
  topic: string,
  payload: Buffer,
  packet: Packet,
) => void;

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

export type StatusCallback = (status: ConnectionStatus, error?: Error) => void;

// ---------------------------------------------------------------------------
// Client wrapper
// ---------------------------------------------------------------------------

export class TelegramMqttClient {
  private client: MqttClient | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private statusCallbacks: Set<StatusCallback> = new Set();
  private options: MqttConnectionOptions;
  private _status: ConnectionStatus = "disconnected";
  private subscribedTopics: Map<string, QoS> = new Map();
  private activeTopics: Map<string, QoS> = new Map();
  private pendingTopics: Set<string> = new Set();
  private isDisconnecting = false;

  constructor(options: MqttConnectionOptions) {
    this.options = options;
  }

  // ── Getters ──────────────────────────────────────────────────────────

  get status(): ConnectionStatus {
    return this._status;
  }

  get connected(): boolean {
    return this._status === "connected";
  }

  get raw(): MqttClient | null {
    return this.client;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client) {
        resolve();
        return;
      }

      this.isDisconnecting = false;
      this.setStatus("connecting");

      const {
        url,
        username,
        password,
        clientId = `tg_${Math.random().toString(36).slice(2, 10)}`,
        keepalive = 60,
        reconnectPeriod = 5_000,
        connectTimeout = 30_000,
        protocolVersion = 4,
        extra,
      } = this.options;

      const client = mqtt.connect(url, {
        username,
        password,
        clientId,
        keepalive,
        reconnectPeriod,
        connectTimeout,
        protocolVersion,
        clean: true,
        ...extra,
      });
      this.client = client;

      let settled = false;
      const settleResolve = () => {
        if (!settled) {
          settled = true;
          resolve();
        }
      };
      const settleReject = (error: Error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      };

      client.on("connect", () => {
        this.setStatus("connected");
        if (this.subscribedTopics.size > 0) {
          void this.resubscribeTopics();
        }
        settleResolve();
      });

      client.on("reconnect", () => {
        if (this.isDisconnecting) return;
        this.setStatus("reconnecting");
      });

      client.on("error", (err: Error) => {
        if (this.isDisconnecting) return;
        this.setStatus("error", err);
        settleReject(err);
      });

      client.on("close", () => {
        if (this.isDisconnecting || this._status === "reconnecting") return;
        this.setStatus("disconnected");
      });

      client.on("offline", () => {
        if (this.isDisconnecting) return;
        this.setStatus("disconnected");
      });

      client.on("message", (topic: string, payload: Buffer, packet: Packet) => {
        this.messageCallbacks.forEach((cb) => {
          try {
            cb(topic, payload, packet);
          } catch {
            // swallow per‑callback errors
          }
        });
      });
    });
  }

  disconnect(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.client) {
        this.subscribedTopics.clear();
        this.activeTopics.clear();
        this.pendingTopics.clear();
        this.setStatus("disconnected");
        resolve();
        return;
      }

      const client = this.client;
      this.isDisconnecting = true;

      client.end(false, {}, () => {
        client.removeAllListeners();
        this.client = null;
        this.subscribedTopics.clear();
        this.activeTopics.clear();
        this.pendingTopics.clear();
        this.setStatus("disconnected");
        this.isDisconnecting = false;
        resolve();
      });
    });
  }

  // ── Pub / Sub ────────────────────────────────────────────────────────

  subscribe(
    topic: string | string[],
    options: SubscribeOptions = {},
  ): Promise<ISubscriptionGrant[]> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error("MQTT client is not connected"));
        return;
      }

      const topics = Array.isArray(topic) ? topic : [topic];
      const uniqueTopics = [...new Set(topics)];
      const qos = options.qos ?? 1;

      uniqueTopics.forEach((t) => {
        this.subscribedTopics.set(t, qos);
      });

      const freshTopics = uniqueTopics.filter(
        (t) => !this.activeTopics.has(t) && !this.pendingTopics.has(t),
      );
      if (freshTopics.length === 0) {
        resolve([]);
        return;
      }

      freshTopics.forEach((t) => {
        this.pendingTopics.add(t);
      });

      this.client.subscribe(freshTopics, { qos }, (err, granted) => {
        if (err) {
          freshTopics.forEach((t) => {
            this.pendingTopics.delete(t);
          });
          reject(err);
          return;
        }

        freshTopics.forEach((t) => {
          this.pendingTopics.delete(t);
          if (this.subscribedTopics.has(t)) {
            this.activeTopics.set(t, qos);
          } else {
            this.client?.unsubscribe(t, () => undefined);
          }
        });

        resolve(granted ?? []);
      });
    });
  }

  unsubscribe(topic: string | string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error("MQTT client is not connected"));
        return;
      }

      const topics = Array.isArray(topic) ? topic : [topic];
      const activeTopics = topics.filter((t) => this.activeTopics.has(t));

      topics.forEach((t) => {
        this.subscribedTopics.delete(t);
        this.pendingTopics.delete(t);
      });

      if (activeTopics.length === 0) {
        resolve();
        return;
      }

      this.client.unsubscribe(activeTopics, {}, (err) => {
        if (err) {
          reject(err);
          return;
        }

        activeTopics.forEach((t) => {
          this.activeTopics.delete(t);
        });

        resolve();
      });
    });
  }

  publish(
    topic: string,
    payload: string | Buffer | object,
    options: PublishOptions = {},
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new Error("MQTT client is not connected"));
        return;
      }

      const data: string | Buffer =
        typeof payload === "object" && !Buffer.isBuffer(payload)
          ? JSON.stringify(payload)
          : (payload as string | Buffer);

      this.client.publish(
        topic,
        data,
        { qos: options.qos ?? 1, retain: options.retain ?? false },
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  }

  // ── Callbacks ────────────────────────────────────────────────────────

  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => {
      this.messageCallbacks.delete(callback);
    };
  }

  onStatusChange(callback: StatusCallback): () => void {
    this.statusCallbacks.add(callback);
    return () => {
      this.statusCallbacks.delete(callback);
    };
  }

  // ── Internals ────────────────────────────────────────────────────────

  private async resubscribeTopics(): Promise<void> {
    if (!this.client || this.subscribedTopics.size === 0) return;

    const entries = [...this.subscribedTopics.entries()];

    await Promise.all(
      entries.map(([topic, qos]) => this.subscribe(topic, { qos }).catch(() => [])),
    );
  }

  private setStatus(status: ConnectionStatus, error?: Error): void {
    this._status = status;

    if (status === "reconnecting" || status === "disconnected") {
      this.activeTopics.clear();
      this.pendingTopics.clear();
    }

    this.statusCallbacks.forEach((cb) => {
      try {
        cb(status, error);
      } catch {
        // swallow per‑callback errors
      }
    });
  }
}

// ---------------------------------------------------------------------------
// Factory – singleton per URL so multiple callers share one connection
// ---------------------------------------------------------------------------

const instances = new Map<string, TelegramMqttClient>();

export function getMqttClient(options: MqttConnectionOptions): TelegramMqttClient {
  const key = options.url;
  const existing = instances.get(key);
  if (existing) return existing;

  const client = new TelegramMqttClient(options);
  instances.set(key, client);
  return client;
}

export function removeMqttClient(url: string): void {
  const existing = instances.get(url);
  if (existing) {
    existing.disconnect();
    instances.delete(url);
  }
}
