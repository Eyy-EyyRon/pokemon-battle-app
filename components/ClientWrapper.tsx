// components/ClientWrapper.tsx
"use client";

import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { SoundManager } from "@/components/sound-manager";
import { Toaster } from "@/components/ui/toaster";

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null; // or show a loading spinner

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <SoundManager>
        <main className="min-h-screen bg-background">{children}</main>
        <Toaster />
      </SoundManager>
    </ThemeProvider>
  );
}
