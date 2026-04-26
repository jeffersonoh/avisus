import type { Metadata } from "next";

import { EmailConfirmedContent } from "@/components/auth/EmailConfirmedContent";

export const metadata: Metadata = {
  title: "Cadastro confirmado | Avisus",
  description: "Confirmação de cadastro no Avisus.",
};

export default function CadastroConfirmadoPage() {
  return <EmailConfirmedContent />;
}
