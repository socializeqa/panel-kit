"use client";

import { Briefcase, CalendarCheck, LayoutDashboard, Users } from "lucide-react";
import type { ListConfig } from "@socialize/panel-kit/list-config";
import type { NavGroup } from "@socialize/panel-kit/nav";
import { PanelProvider, type CreateEntry } from "@socialize/panel-kit/panel-provider";
import { Shell } from "@socialize/panel-kit/shell";
import { ToastProvider } from "@socialize/panel-kit/toast";

// An app's own module: the rooms, the lists and the rules, handed to the kit.
// A client module, because the rooms carry their icons (components) and `can`
// is a function — neither crosses from a server component.

const NAV: NavGroup[] = [
  { label: "Overview", items: [{ href: "/", label: "Dashboard", Icon: LayoutDashboard }] },
  {
    label: "Operations",
    items: [
      { href: "/bookings", label: "Bookings", Icon: CalendarCheck, count: 3 },
      { href: "/team", label: "Team", Icon: Users, cap: "manage_team" },
      { href: "/hiring", label: "Hiring", Icon: Briefcase },
    ],
  },
];

const LISTS: Record<string, ListConfig> = {
  "/": {
    statuses: [
      { value: "pending", label: "Pending" },
      { value: "confirmed", label: "Confirmed" },
    ],
    sorts: [
      { value: "created_at", label: "Date", type: "date" },
      { value: "total", label: "Amount", type: "amount", cap: "view_finance" },
    ],
    defaultSort: "created_at",
    searchHint: "Search by name",
  },
};

const CREATE: Record<string, CreateEntry> = {
  "/": { label: "New booking" },
};

const can = (capability: string) => capability !== "manage_team";

export function Panel({ children }: { children: React.ReactNode }) {
  return (
    <PanelProvider
      nav={NAV}
      lists={LISTS}
      create={CREATE}
      can={can}
      logo={<span className="text-[15px] font-semibold">Fixture</span>}
      user={{ name: "Dev Socialize", role: "Owner" }}
    >
      <ToastProvider>
        <Shell>{children}</Shell>
      </ToastProvider>
    </PanelProvider>
  );
}
