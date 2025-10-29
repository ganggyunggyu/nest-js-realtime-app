'use client';

import React from 'react';
import { cn } from '@/shared/lib/cn';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs';
import { VoiceAgentConsole } from '@/features';

export default function Home() {
  const [activeTab, setActiveTab] = React.useState('voice');

  return (
    <React.Fragment>
      <div
        className={cn(
          'flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br',
          'from-zinc-100 via-white to-zinc-200 px-6 py-20',
          'dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950'
        )}
      >
        <div className={cn('w-full max-w-5xl')}>
          <div className={cn('mb-6 text-center')}>
            <h1
              className={cn(
                'text-3xl font-semibold text-zinc-950',
                'dark:text-zinc-100'
              )}
            >
              Realtime API Prototype
            </h1>
            <p
              className={cn(
                'text-sm leading-6 text-zinc-600',
                'dark:text-zinc-400'
              )}
            >
              Choose a communication mode to interact with the AI agent
            </p>
          </div>

          <Tabs>
            <TabsList className="mx-auto w-fit">
              <TabsTrigger
                value="voice"
                isActive={activeTab === 'voice'}
                onClick={() => setActiveTab('voice')}
              >
                Voice Mode
              </TabsTrigger>
              <TabsTrigger
                value="text"
                isActive={activeTab === 'text'}
                onClick={() => setActiveTab('text')}
              >
                Text Mode
              </TabsTrigger>
            </TabsList>

            <TabsContent value="voice" isActive={activeTab === 'voice'}>
              <VoiceAgentConsole forcedMode="voice" />
            </TabsContent>

            <TabsContent value="text" isActive={activeTab === 'text'}>
              <VoiceAgentConsole forcedMode="text" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </React.Fragment>
  );
}
