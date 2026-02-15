import { ConsumeMessage } from "amqplib";
import { getChannel } from "../rabbitmq";

export const consumeQueue = async (queue: string): Promise<void> => {
  const channel = getChannel();

  await channel.assertQueue(queue, { durable: true });

  channel.consume(queue, (msg: ConsumeMessage | null) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());

    console.log("📥 Received:", data);

    // acknowledge message
    channel.ack(msg);
  });
};
