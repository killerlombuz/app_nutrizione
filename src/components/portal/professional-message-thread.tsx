"use client";

import { useRef, useTransition } from "react";
import { Send } from "lucide-react";
import { sendMessageAsProfessional } from "@/features/messages/actions";

interface MessageItem {
  id: string;
  senderType: string;
  content: string;
  createdAt: Date;
}

export function ProfessionalMessageThread({
  patientId,
  messages,
  patientName,
  professionalName,
}: {
  patientId: string;
  messages: MessageItem[];
  patientName: string;
  professionalName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const sendAction = sendMessageAsProfessional.bind(null, patientId);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const content = formData.get("content") as string;
    if (!content.trim()) return;

    startTransition(async () => {
      await sendAction(formData);
      formRef.current?.reset();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            Nessun messaggio ancora. Scrivi qualcosa al paziente!
          </div>
        ) : (
          messages.map((msg) => {
            const isProfessional = msg.senderType === "professional";
            return (
              <div
                key={msg.id}
                className={`flex ${isProfessional ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                    isProfessional
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm border border-border"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${
                      isProfessional
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isProfessional ? professionalName : patientName} ·{" "}
                    {msg.createdAt.toLocaleTimeString("it-IT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
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

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="flex gap-2 pt-2"
      >
        <input
          name="content"
          type="text"
          placeholder={`Scrivi a ${patientName}...`}
          required
          className="flex-1 rounded-2xl border border-input px-4 py-2.5 text-sm bg-background focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={isPending}
          className="shrink-0 rounded-2xl bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
}
