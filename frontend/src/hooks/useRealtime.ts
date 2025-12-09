import { useEffect, useState } from "react";

export function useRealtime(url: string) {
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => setMessages((prev) => [event.data, ...prev].slice(0, 10));
    return () => ws.close();
  }, [url]);

  return messages;
}

