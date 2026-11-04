"use client";

import { useActionState } from "react";
import { signIn } from "@/app/auth-actions";
import type { Dictionary } from "@/i18n/dictionaries";

export function SignIn({ text }: { text: Dictionary }) {
  const [failed, action, pending] = useActionState(signIn, false);
  return (
    <section className="access-panel">
      <h2>{text.signIn}</h2>
      <p className="muted">{text.signInHelp}</p>
      <form action={action} className="entry-form">
        <label>
          {text.email}
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label>
          {text.password}
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />
        </label>
        {failed && (
          <p role="alert" className="error">
            {text.signInError}
          </p>
        )}
        <button className="primary" disabled={pending}>
          {pending ? text.signingIn : text.signIn}
        </button>
      </form>
    </section>
  );
}
