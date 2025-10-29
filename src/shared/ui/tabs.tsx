"use client";

import React from "react";
import { cn } from "@/shared/lib/cn";

interface TabsProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
  isActive: boolean;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ children, className }) => {
  return (
    <div className={cn("flex flex-col", className)}>
      {children}
    </div>
  );
};

const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div 
      className={cn(
        "inline-flex items-center justify-center rounded-lg bg-zinc-100 p-1",
        "dark:bg-zinc-800",
        className
      )}
    >
      {children}
    </div>
  );
};

const TabsTrigger: React.FC<TabsTriggerProps> = ({ 
  children, 
  value, 
  isActive, 
  onClick, 
  className 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      role="tab"
      aria-selected={isActive}
      className={cn(
        "inline-flex min-w-[100px] items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isActive
          ? "bg-white text-zinc-950 shadow-sm"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-950",
        "dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-zinc-800/50 dark:hover:text-zinc-50",
        isActive
          ? "dark:text-zinc-100 dark:bg-zinc-900/50"
          : "dark:hover:bg-zinc-800/50",
        className
      )}
    >
      {children}
    </button>
  );
};

const TabsContent: React.FC<TabsContentProps> = ({ 
  children, 
  value, 
  isActive, 
  className 
}) => {
  if (!isActive) {
    return null;
  }

  return (
    <div 
      role="tabpanel"
      className={cn("mt-6", className)}
    >
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };