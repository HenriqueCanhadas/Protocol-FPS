// hooks/useClock.js — PROTOCOL FPS
// Relógio ao vivo (hora + data), sempre em horário de Brasília.
import { useState, useEffect } from "react";
import { horaBRT, dataBRT } from "@/utils/datas";

export function useClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const tick = () => {
      const agora = new Date();
      setTime(horaBRT(agora, { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(dataBRT(agora));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return { time, date };
}
