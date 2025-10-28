import React from "react";
import { VoiceAgentConsole } from "@/features/voice-agent/ui/voice-agent-console";
import { cn } from "@/shared/lib/cn";

export default function Home() {
  return (
    <React.Fragment>
      <div
        className={cn(
          "flex min-h-screen w-full items-center justify-center bg-gradient-to-br",
          "from-zinc-100 via-white to-zinc-200 px-6 py-20",
          "dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950",
        )}
      >
        <VoiceAgentConsole />
      </div>
    </React.Fragment>
  );
}
