"use client";

import React from "react";
import { VoiceAgentConsole } from "@/features/voice-agent/ui/voice-agent-console";
import { cn } from "@/shared/lib/cn";

export default function VoicePage() {
  return (
    <React.Fragment>
      <div
        className={cn(
          "flex min-h-screen w-full items-center justify-center bg-gradient-to-br",
          "from-zinc-100 via-white to-zinc-200 px-6 py-20",
          "dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950",
        )}
      >
        <div className={cn("w-full max-w-5xl")}>
          <div className={cn("mb-6 text-center")}>
            <h1
              className={cn(
                "text-3xl font-semibold text-zinc-950",
                "dark:text-zinc-100",
              )}
            >
              Voice Mode
            </h1>
            <p
              className={cn(
                "text-sm leading-6 text-zinc-600",
                "dark:text-zinc-400",
              )}
            >
              Full-duplex audio communication using WebRTC. Requires microphone access.
            </p>
          </div>
          <VoiceAgentConsole forcedMode="voice" />
        </div>
      </div>
    </React.Fragment>
  );
}