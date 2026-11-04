"use client";

import { signOut } from "@/app/auth-actions";

export function SignOut({ label }: { label: string }) {
  return (
    <form
      action={signOut}
      onSubmit={(event) => {
        // The ledger owns draft state and can require explicit discard before signing out.
        if (
          !window.dispatchEvent(
            new Event("rental:before-sign-out", { cancelable: true }),
          )
        )
          event.preventDefault();
      }}
    >
      <button className="text-button">{label}</button>
    </form>
  );
}
