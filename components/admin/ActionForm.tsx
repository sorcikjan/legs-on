"use client";

import { useActionState, type ReactNode } from "react";
import { Notice } from "@/components/admin/ui";

export type FormState = { error?: string } | undefined;

/** Formulář se Server Action: ukáže chybu z akce a během ukládání zablokuje pole. Pole mohou být serverové komponenty. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {state?.error && <Notice kind="error">{state.error}</Notice>}
      <fieldset disabled={pending} className="m-0 contents border-0 p-0">
        {children}
      </fieldset>
    </form>
  );
}

/** Tlačítko s potvrzením (smazání). */
export function ConfirmButton({ question, children, ...props }: { question: string; children: ReactNode } & React.ComponentProps<"button">) {
  return (
    <button {...props} onClick={(e) => !confirm(question) && e.preventDefault()}>
      {children}
    </button>
  );
}
