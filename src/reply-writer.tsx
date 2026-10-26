"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { ChoicePills } from "./choice-pills";
import { ContactDoors } from "./contact-doors";
import { DirtyExempt } from "./drawer";
import { Button, Textarea } from "./fields";
import { usePanelT } from "./panel-provider";

// A reply to someone who wrote in, ready before it is sent: pick one of the
// panel's ready replies (already in the person's language, with their name
// in), change what needs changing, then open WhatsApp or the email app with
// it typed, or copy it. Nothing is sent from here: the person's own WhatsApp
// or mailbox sends it, so the reply comes from a number or address they know.
// Typing a reply is not an edit of the record it sits beside, so it never
// marks a drawer unsaved (DirtyExempt, data-dirty-exempt).
// Born for Lucce's requests (9 languages); any panel with an inbox can use it.

export interface ReadyReply {
  key: string;
  /** The pill's word, in the panel's language ("Thank you", "Book a call"). */
  label: string;
  subject?: string;
  text: string;
}

export function ReplyWriter({
  replies,
  email,
  phone,
  label = "Ready replies",
}: {
  replies: ReadyReply[];
  email?: string | null;
  phone?: string | null;
  label?: string;
}) {
  const t = usePanelT();
  const [chosen, setChosen] = useState(replies[0]?.key ?? "");
  const pick = replies.find((r) => r.key === chosen);
  const [text, setText] = useState(pick?.text ?? "");
  const [copied, setCopied] = useState(false);

  return (
    <DirtyExempt>
    <div data-dirty-exempt className="flex flex-col gap-3">
      {replies.length > 1 ? (
        <ChoicePills
          wrap
          ariaLabel={t(label)}
          value={chosen}
          onChange={(key) => {
            const next = replies.find((r) => r.key === key);
            if (!next) return;
            setChosen(next.key);
            setText(next.text);
            setCopied(false);
          }}
          options={replies.map((r) => ({ value: r.key, label: r.label }))}
        />
      ) : null}
      <Textarea
        aria-label={t("The reply")}
        // A reply in Arabic reads from the right; the box follows the text it holds.
        dir="auto"
        rows={6}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setCopied(false);
        }}
        className="text-[14px] leading-relaxed"
      />
      <ContactDoors email={email} phone={phone} message={{ text, subject: pick?.subject }} />
      <div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
          }}
        >
          {copied ? <Check size={14} strokeWidth={2} aria-hidden="true" /> : <Copy size={14} strokeWidth={2} aria-hidden="true" />}
          {copied ? t("Copied") : t("Copy the reply")}
        </Button>
      </div>
    </div>
    </DirtyExempt>
  );
}
