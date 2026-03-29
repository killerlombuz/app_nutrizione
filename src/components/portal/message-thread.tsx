"use client";

import { useRef, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessageAsPatient } from "@/features/messages/actions";

interface MessageItem {
  id: string;
  senderType: string;
  content: string;
  createdAt: Date;
}

export function MessageThread({
  messages,
  patientName,
  professionalName,
}: {
  messages: MessageItem[];
  patientName: string;
  professionalName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    startTransition(async () => {
      await sendMessageAsPatient(formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Messaggi */}
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Nessun messaggio ancora. Inizia la conversazione!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isPatient = msg.senderType === "patient";
            return (
              <div
                key={msg.id}
                className={`flex ${isPatient ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isPatient
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-900 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isPatient ? "text-emerald-200" : "text-gray-400"
                    }`}
                  >
                    {isPatient ? patientName : professionalName} ·{" "}
                    {msg.createdAt.toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" "}
                    {msg.createdAt.toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Form invio */}
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex gap-2 sticky bottom-0 bg-gray-50 pt-2"
      >
        <input
          name="content"
          type="text"
          placeholder="Scrivi un messaggio..."
          required
          className="flex-1 rounded-2xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-2xl bg-emerald-600 px-4 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
