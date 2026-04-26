import { QueryProvider } from "@/components/QueryProvider";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <QueryProvider>{children}</QueryProvider>;
}
