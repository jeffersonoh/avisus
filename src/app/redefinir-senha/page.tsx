import type { Metadata } from "next";

import { AuthPageShell } from "@/components/auth/AuthPageShell";
import { UpdatePasswordForm } from "@/components/auth/UpdatePasswordForm";

export const metadata: Metadata = {
  title: "Redefinir senha | Avisus",
  description: "Defina uma nova senha para sua conta Avisus.",
};

export default function RedefinirSenhaPage() {
  return (
    <AuthPageShell title="Defina uma nova senha" subtitle="Escolha uma senha segura para continuar">
      <UpdatePasswordForm />
    </AuthPageShell>
  );
}
