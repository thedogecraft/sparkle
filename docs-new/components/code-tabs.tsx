"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";

interface CodeTab {
  label: string;
  value: string;
  code: string;
}

interface CodeTabsProps {
  tabs: CodeTab[];
  defaultValue?: string;
  className?: string;
}

export function CodeTabs({ tabs, defaultValue, className }: CodeTabsProps) {
  const [copied, setCopied] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState(
    defaultValue || tabs[0]?.value || ""
  );

  const activeCode = tabs.find((tab) => tab.value === activeTab)?.code || "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = activeCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className={cn("w-full", className)}
    >
      <div className="flex items-center justify-between rounded-t-lg border border-b-0 border-border bg-muted/50 px-1">
        <TabsList className="h-auto bg-transparent p-0">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="relative rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={copied ? "Copied" : "Copy code to clipboard"}
        >
          {copied ? (
            <>
              <Check className="size-3.5" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="size-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className="mt-0 rounded-b-lg border border-border bg-[hsl(var(--foreground)/0.03)] p-4"
        >
          <pre className="overflow-x-auto">
            <code className="font-mono text-sm text-foreground">
              {tab.code}
            </code>
          </pre>
        </TabsContent>
      ))}
    </Tabs>
  );
}
