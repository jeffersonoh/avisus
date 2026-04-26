import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { PasswordResetRequestForm } from "@/components/auth/PasswordResetRequestForm";

export const metadata: Metadata = {
  title: "Recuperar senha | Avisus",
  description: "Solicite um link para redefinir sua senha no Avisus.",
};

export default function EsqueciSenhaPage() {
  return (
    <AuthPageShell
      title="Recuperar senha"
      subtitle="Informe seu e-mail para receber o link de redefinição"
    >
      <PasswordResetRequestForm />
    </AuthPageShell>
  );
}
