import { useRealtime } from "../hooks/useRealtime";

export default function RealtimeAlerts() {
  const messages = useRealtime(import.meta.env.VITE_WS_URL || "ws://localhost:9001");
  if (!messages.length) return null;
  return (
    <div className="card border-blue-200 bg-blue-50">
      <div className="font-semibold text-blue-800">Live alerts</div>
      <ul className="text-sm text-blue-900 space-y-1 mt-2">
        {messages.map((m, idx) => (
          <li key={idx}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

