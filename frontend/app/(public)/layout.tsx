import PublicShell from "@/components/navigation/PublicShell";

export default function PublicLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <PublicShell>{children}</PublicShell>;
}
