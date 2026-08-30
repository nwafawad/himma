import AppShell from "@/components/navigation/AppShell";

export default function AuthenticatedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}
