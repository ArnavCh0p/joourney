"use client";

import { openExternal } from "@/lib/openExternal";

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={() => openExternal(href)} className={className}>
      {children}
    </button>
  );
}
