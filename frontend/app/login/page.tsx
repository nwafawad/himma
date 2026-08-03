import AuthCard from "@/components/auth/AuthCard";
import ScrollReveal from "@/components/ui/ScrollReveal";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] py-8 w-full">
      <ScrollReveal direction="up" delayMs={50} className="w-full flex justify-center">
        <AuthCard />
      </ScrollReveal>
    </div>
  );
}
