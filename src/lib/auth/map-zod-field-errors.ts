export function mapZodFieldErrors(
  issues: { path: (string | number)[]; message: string }[],
): Partial<Record<"email" | "password" | "confirmPassword" | "referralCode", string>> {
  const out: Partial<Record<"email" | "password" | "confirmPassword" | "referralCode", string>> = {};
  for (const issue of issues) {
    const key = issue.path[0];
    if (
      key === "email" ||
      key === "password" ||
      key === "confirmPassword" ||
      key === "referralCode"
    ) {
      out[key] = issue.message;
    }
  }
  return out;
}
