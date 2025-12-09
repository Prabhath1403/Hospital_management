import WebSocket, { WebSocketServer } from "ws";
import amqplib from "amqplib";

const port = process.env.PORT || 9001;
const amqpUrl = process.env.AMQP_URL || "amqp://rabbitmq";
const exchange = "notifications";

const wss = new WebSocketServer({ port });
console.log(`Realtime server listening on ${port}`);

(async () => {
  const conn = await amqplib.connect(amqpUrl);
  const ch = await conn.createChannel();
  await ch.assertExchange(exchange, "fanout", { durable: false });
  const { queue } = await ch.assertQueue("", { exclusive: true });
  await ch.bindQueue(queue, exchange, "");
  ch.consume(
    queue,
    (msg) => {
      if (!msg) return;
      const payload = msg.content.toString();
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    },
    { noAck: true }
  );
})();

