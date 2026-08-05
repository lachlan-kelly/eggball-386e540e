import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const MAX = 500;

export function FeedbackPanel({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async () => {
    const message = text.trim();
    if (!message || message.length > MAX) return;
    setStatus("sending");
    const { error } = await supabase.from("eggball_feedback").insert({ message });
    if (error) {
      setStatus("error");
      return;
    }
    setStatus("sent");
    setText("");
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black/75 rounded-lg p-4">
      <div className="bg-neutral-800 rounded-xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 bg-neutral-900">
          <h2 className="text-lg font-bold">Feedback</h2>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md bg-neutral-700 hover:bg-neutral-600 text-sm font-semibold"
          >
            Close
          </button>
        </div>
        <div className="p-5 flex flex-col gap-3">
          <p className="text-xs text-neutral-400">
            Totally anonymous — no name, no account. Tell me what to fix, add or change.
          </p>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX));
              if (status !== "idle") setStatus("idle");
            }}
            rows={7}
            maxLength={MAX}
            placeholder="Your feedback (max 500 characters)"
            className="w-full px-3 py-2 rounded-md bg-neutral-900 text-white placeholder-neutral-500 outline-none focus:ring-2 focus:ring-white/30 text-sm resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500 tabular-nums">
              {text.length}/{MAX}
            </span>
            <button
              onClick={submit}
              disabled={!text.trim() || status === "sending"}
              className="px-4 py-2 rounded-md bg-yellow-500 hover:bg-yellow-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-black text-sm font-bold"
            >
              {status === "sending" ? "Sending..." : "Submit"}
            </button>
          </div>
          {status === "sent" && <p className="text-xs text-green-400">Thanks — feedback sent anonymously.</p>}
          {status === "error" && <p className="text-xs text-red-400">Couldn't send that. Try again in a moment.</p>}
        </div>
      </div>
    </div>
  );
}
