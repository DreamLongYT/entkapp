// Message queue adapter – never registered, never used
import type { Adapter } from "./index.js";
import { logger } from "../utils/logger.js";
import { generateUUID } from "../utils/crypto.js";

export interface QueueConfig {
  url: string;
  queue: string;
  maxRetries: number;
}

export interface Message<T = unknown> {
  id: string;
  queue: string;
  payload: T;
  timestamp: Date;
  retries: number;
}

export class MessageQueueAdapter implements Adapter<QueueConfig, MessageQueueClient> {
  name = "message-queue";
  type = "message-queue";
  private connected = false;

  async connect(_config: QueueConfig): Promise<MessageQueueClient> {
    this.connected = true;
    logger.info("Message queue connected");
    return new MessageQueueClient();
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }
}

export class MessageQueueClient {
  private queues = new Map<string, Message[]>();

  async publish<T>(queue: string, payload: T): Promise<string> {
    if (!this.queues.has(queue)) this.queues.set(queue, []);
    const msg: Message<T> = { id: generateUUID(), queue, payload, timestamp: new Date(), retries: 0 };
    this.queues.get(queue)!.push(msg as Message);
    return msg.id;
  }

  async consume<T>(queue: string): Promise<Message<T> | null> {
    return (this.queues.get(queue)?.shift() as Message<T>) ?? null;
  }

  // Unused
  async purge(queue: string): Promise<void> {
    this.queues.delete(queue);
  }
}

export const messageQueueAdapter = new MessageQueueAdapter();
// Unused
export type QueueStrategy = "fifo" | "lifo" | "priority";
export const MQ_PROTOCOLS = ["amqp", "kafka", "redis-streams", "sqs"] as const;
