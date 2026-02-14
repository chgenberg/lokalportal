"use client";

import { useState } from "react";

type Step = "date" | "time" | "details" | "confirm";

const TIMES = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00",
];

function getWeekdays(daysAhead: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let d = new Date(today);
  let count = 0;
  while (count < daysAhead) {
    if (d.getDay() >= 1 && d.getDay() <= 5) {
      out.push(new Date(d));
      count++;
    }
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export interface BookingData {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

interface BookingCalendarProps {
  variant: "callback";
  onComplete: (data: BookingData) => void;
  onBack?: () => void;
}

export default function BookingCalendar({ onComplete, onBack }: BookingCalendarProps) {
  const [step, setStep] = useState<Step>("date");
  const [data, setData] = useState<BookingData>({
    date: "",
    time: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
  });
  const [sending, setSending] = useState(false);

  const weekdays = getWeekdays(30);
  const selectedDateObj = data.date ? weekdays.find((d) => d.toISOString().slice(0, 10) === data.date) : null;

  const handleSubmit = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/contact/booking-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: data.date,
          time: data.time,
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company || undefined,
          message: data.message || undefined,
          bookingType: "callback",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Kunde inte skicka");
      }
      onComplete(data);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Något gick fel. Försök igen.");
    } finally {
      setSending(false);
    }
  };

  if (step === "date") {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-gray-600">Välj datum (vardagar)</p>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
          {weekdays.map((d) => {
            const dateStr = d.toISOString().slice(0, 10);
            const label = d.getDate();
            const month = d.toLocaleDateString("sv-SE", { month: "short" });
            const active = data.date === dateStr;
            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => setData((p) => ({ ...p, date: dateStr }))}
                className={`px-3 py-2 rounded-lg text-center text-sm font-medium transition-all border ${
                  active ? "bg-navy text-white border-navy" : "bg-muted/50 text-navy border-border hover:border-navy/30"
                }`}
              >
                <span className="block">{label}</span>
                <span className="block text-[10px] opacity-80">{month}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {onBack && (
            <button type="button" onClick={onBack} className="px-4 py-2 text-sm text-gray-500 hover:text-navy">
              Tillbaka
            </button>
          )}
          <button
            type="button"
            onClick={() => data.date && setStep("time")}
            disabled={!data.date}
            className="ml-auto px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl disabled:opacity-40"
          >
            Nästa
          </button>
        </div>
      </div>
    );
  }

  if (step === "time") {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-gray-600">
          Välj tid. Vi ringer mellan 09:00–16:00.
        </p>
        <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto">
          {TIMES.map((t) => {
            const active = data.time === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setData((p) => ({ ...p, time: t }))}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                  active ? "bg-navy text-white border-navy" : "bg-muted/50 text-navy border-border hover:border-navy/30"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setStep("date")} className="px-4 py-2 text-sm text-gray-500 hover:text-navy">
            Tillbaka
          </button>
          <button
            type="button"
            onClick={() => data.time && setStep("details")}
            disabled={!data.time}
            className="ml-auto px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl disabled:opacity-40"
          >
            Nästa
          </button>
        </div>
      </div>
    );
  }

  if (step === "details") {
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-gray-600">Dina uppgifter</p>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Namn *</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => setData((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none"
              placeholder="Ditt namn"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">E-post *</label>
            <input
              type="email"
              value={data.email}
              onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none"
              placeholder="din@email.se"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Telefon *</label>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => setData((p) => ({ ...p, phone: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none"
              placeholder="070-123 45 67"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Företag (valfritt)</label>
            <input
              type="text"
              value={data.company}
              onChange={(e) => setData((p) => ({ ...p, company: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none"
              placeholder="Ditt företag"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-500 mb-1">Meddelande (valfritt)</label>
            <textarea
              value={data.message}
              onChange={(e) => setData((p) => ({ ...p, message: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm border border-border focus:border-navy outline-none resize-none"
              placeholder="Vad vill du prata om?"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => setStep("time")} className="px-4 py-2 text-sm text-gray-500 hover:text-navy">
            Tillbaka
          </button>
          <button
            type="button"
            onClick={() => setStep("confirm")}
            disabled={!data.name.trim() || !data.email.trim() || !data.phone.trim()}
            className="ml-auto px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl disabled:opacity-40"
          >
            Nästa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-gray-600">Sammanfattning</p>
      <div className="bg-muted/40 rounded-xl p-4 text-sm text-navy space-y-1">
        <p><strong>Datum:</strong> {data.date} kl {data.time}</p>
        <p><strong>Namn:</strong> {data.name}</p>
        <p><strong>E-post:</strong> {data.email}</p>
        <p><strong>Telefon:</strong> {data.phone}</p>
        {data.company && <p><strong>Företag:</strong> {data.company}</p>}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setStep("details")} className="px-4 py-2 text-sm text-gray-500 hover:text-navy">
          Tillbaka
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={sending}
          className="ml-auto px-4 py-2 bg-navy text-white text-sm font-medium rounded-xl disabled:opacity-40"
        >
          {sending ? "Skickar..." : "Bekräfta och skicka"}
        </button>
      </div>
    </div>
  );
}
