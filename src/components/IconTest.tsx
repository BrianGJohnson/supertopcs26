"use client";

import { IconHome, IconSettings, IconUser } from "@tabler/icons-react";

export default function IconTest() {
  return (
    <div className="flex items-center gap-6 p-6 bg-surface rounded-xl">
      <IconHome size={32} className="text-primary" />
      <IconSettings size={32} className="text-accent" />
      <IconUser size={32} className="text-text-primary" />
    </div>
  );
}
