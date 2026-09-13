"use client";

import { useActionState } from "react";
import { forgotPasswordAction, type ForgotState } from "./actions";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const initialState: ForgotState = {};

export function ForgotForm() {
  const [state, formAction, pending] = useActionState(forgotPasswordAction, initialState);

  if (state.submitted) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center animate-fade-in">
        <CheckCircle2 className="size-8 text-success" strokeWidth={1.5} />
        <p className="text-sm text-muted">
          Se esse e-mail estiver cadastrado, enviamos uma nova senha provisória para ele.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" placeholder="voce@email.com" required autoFocus />
      </div>
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Enviando..." : "Enviar nova senha"}
      </Button>
    </form>
  );
}
