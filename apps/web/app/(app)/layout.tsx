"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomTabNav } from "@/components/shell/BottomTabNav";
import { PageTransition } from "@/components/shell/PageTransition";
import { useSession } from "@/lib/auth/session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/auth/login");
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-accent-teal" />
      </div>
    );
  }

  const showCertifierTab = user.role === "certifier" || user.role === "admin";

  return (
    <div className="min-h-screen pb-28">
      <PageTransition>{children}</PageTransition>
      <BottomTabNav showCertifierTab={showCertifierTab} />
    </div>
  );
}
