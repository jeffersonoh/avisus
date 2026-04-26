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

export const PasswordResetRequestSchema = z.object({
  email: emailField,
});

export const UpdatePasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas informadas não conferem.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
