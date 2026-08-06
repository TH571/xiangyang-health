import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

export default function ClockDisplay() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const month = now.getMonth() + 1;
  const day = now.getDate();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return (
    <div className="absolute -bottom-9 right-16 flex items-center gap-2 bg-white/90 backdrop-blur-sm px-4 py-2.5 rounded-full shadow-lg border border-orange-100">
      <Calendar className="w-4 h-4 text-orange-600" />
      <span className="text-sm font-medium text-slate-700">{month}月{day}日</span>
      <span className="text-sm font-mono font-semibold text-orange-600">{hours}:{minutes}</span>
    </div>
  );
}
