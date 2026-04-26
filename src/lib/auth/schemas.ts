import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .min(1, "Informe o e-mail.")
  .email("Informe um e-mail válido.");

const passwordField = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.")
  .max(72, "A senha deve ter no máximo 72 caracteres.");

export const LoginSchema = z.object({
  email: emailField,
  password: passwordField,
});

export const RegisterSchema = z.object({
  email: emailField,
  password: passwordField,
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
