"use client";

import { useActionState } from "react";
import { firstAccessAction, type FirstAccessState } from "./actions";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: FirstAccessState = {};

export function FirstAccessForm() {
  const [state, formAction, pending] = useActionState(firstAccessAction, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <Label htmlFor="currentPassword">Senha provisória</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          placeholder="A senha que você recebeu por e-mail"
          required
          autoFocus
        />
      </div>
      <div>
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input id="newPassword" name="newPassword" type="password" placeholder="Mínimo 8 caracteres" required />
      </div>
      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" required />
      </div>
      {state.error && <FieldError>{state.error}</FieldError>}
      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? "Salvando..." : "Continuar"}
      </Button>
    </form>
  );
}
