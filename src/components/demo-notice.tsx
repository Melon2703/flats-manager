"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDemo } from "@/app/demo-actions";
import type { Dictionary } from "@/i18n/dictionaries";

export function DemoNotice({
  month,
  text,
}: {
  month: string;
  text: Dictionary;
}) {
  const [pending, start] = useTransition();
  const [failed, setFailed] = useState(false);
  const router = useRouter();
  return (
    <div className="demo-notice">
      <p>{text.demoNotice}</p>
      <button
        className="text-button"
        disabled={pending}
        onClick={() => {
          if (
            !window.dispatchEvent(
              new Event("rental:before-sign-out", { cancelable: true }),
            ) ||
            !window.confirm(text.demoResetConfirm)
          )
            return;
          setFailed(false);
          start(async () => {
            try {
              const result = await resetDemo(month);
              if (result.ok) router.refresh();
              else setFailed(true);
            } catch {
              setFailed(true);
            }
          });
        }}
      >
        {pending ? text.saving : text.demoReset}
      </button>
      {failed && (
        <p className="error" role="alert">
          {text.saveError}
        </p>
      )}
    </div>
  );
}
