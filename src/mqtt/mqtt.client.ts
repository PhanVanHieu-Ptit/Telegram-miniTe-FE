import mqtt, {
    type IClientOptions,
    type ISubscriptionGrant,
    type MqttClient,
    type Packet,
} from "mqtt";

export type QoS = 0 | 1 | 2;

export interface MqttConnectionOptions {
    url: string;
    username?: string;
    password?: string;
    clientId?: string;
    keepalive?: number;
    reconnectPeriod?: number;
    connectTimeout?: number;
    protocolVersion?: 4 | 5;
    extra?: Partial<IClientOptions>;
}

export interface SubscribeOptions {
    qos?: QoS;
}

export interface PublishOptions {
    qos?: QoS;
    retain?: boolean;
}

export type ConnectionStatus =
    | "disconnected"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error";

export interface MqttMessage<T = unknown> {
    topic: string;
    payload: T | null;
    raw: Buffer;
    packet: Packet;
}

export type MessageHandler<T = unknown> = (message: MqttMessage<T>) => void;

function safeJsonParse<T>(payload: Buffer): T | null {
    try {
        return JSON.parse(payload.toString("utf-8")) as T;
    } catch {
        return null;
    }
}

export class AppMqttClient {
    private client: MqttClient | null = null;
    private status: ConnectionStatus = "disconnected";
    private messageHandlers: Set<MessageHandler> = new Set();
    private subscribedTopics: Set<string> = new Set();
    private options: MqttConnectionOptions;

    constructor(options: MqttConnectionOptions) {
        this.options = options;
    }

    get connectionStatus(): ConnectionStatus {
        return this.status;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.client) {
                resolve();
                return;
            }

            this.status = "connecting";

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

            this.client = mqtt.connect(url, {
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

            this.client.on("connect", () => {
                this.status = "connected";
                resolve();
            });

            this.client.on("reconnect", () => {
                this.status = "reconnecting";
            });

            this.client.on("close", () => {
                if (this.status !== "reconnecting") {
                    this.status = "disconnected";
                }
            });

            this.client.on("offline", () => {
                this.status = "disconnected";
            });

            this.client.on("error", (error: Error) => {
                const wasConnected = this.status === "connected";
                this.status = "error";
                if (!wasConnected) {
                    reject(error);
                }
            });

            this.client.on("message", (topic: string, payload: Buffer, packet: Packet) => {
                const parsed = safeJsonParse(payload);
                const message: MqttMessage = {
                    topic,
                    payload: parsed,
                    raw: payload,
                    packet,
                };
                this.messageHandlers.forEach((handler) => {
                    try {
                        handler(message);
                    } catch {
                        // ignore handler errors
                    }
                });
            });
        });
    }

    disconnect(): Promise<void> {
        return new Promise((resolve) => {
            if (!this.client) {
                this.status = "disconnected";
                resolve();
                return;
            }

            this.client.end(false, {}, () => {
                this.client = null;
                this.subscribedTopics.clear();
                this.status = "disconnected";
                resolve();
            });
        });
    }

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
            const freshTopics = topics.filter((t) => !this.subscribedTopics.has(t));
            if (freshTopics.length === 0) {
                resolve([]);
                return;
            }

            this.client.subscribe(
                freshTopics,
                { qos: options.qos ?? 1 },
                (err, granted) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    freshTopics.forEach((t) => this.subscribedTopics.add(t));
                    resolve(granted ?? []);
                },
            );
        });
    }

    unsubscribe(topic: string | string[]): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new Error("MQTT client is not connected"));
                return;
            }

            const topics = Array.isArray(topic) ? topic : [topic];
            const existingTopics = topics.filter((t) => this.subscribedTopics.has(t));
            if (existingTopics.length === 0) {
                resolve();
                return;
            }

            this.client.unsubscribe(existingTopics, {}, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                existingTopics.forEach((t) => this.subscribedTopics.delete(t));
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

    onMessage<T = unknown>(handler: MessageHandler<T>): () => void {
        const typedHandler = handler as MessageHandler;
        this.messageHandlers.add(typedHandler);
        return () => {
            this.messageHandlers.delete(typedHandler);
        };
    }
}

const clientInstances = new Map<string, AppMqttClient>();

export function getMqttClient(options: MqttConnectionOptions): AppMqttClient {
    const existing = clientInstances.get(options.url);
    if (existing) return existing;

    const client = new AppMqttClient(options);
    clientInstances.set(options.url, client);
    return client;
}

export function removeMqttClient(url: string): void {
    const existing = clientInstances.get(url);
    if (existing) {
        existing.disconnect();
        clientInstances.delete(url);
    }
}