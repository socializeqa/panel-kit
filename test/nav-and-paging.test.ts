import { Brain, CalendarCheck, LayoutDashboard, MapPin } from "lucide-react";
import { describe, expect, it } from "vitest";
import { pageHrefBuilder, resolveSort, type ListConfig } from "../src/list-config";
import { foldPath, isItemActive, roomFor, type NavGroup } from "../src/nav";
import { resolvePageAdaptive, rowsFromCookie, rowsFromValue } from "../src/page-size";

// Señorritas' nav and page-size tests, on a panel that lives under /admin
// beside a website — the harder of the two address shapes.
const NAV: NavGroup[] = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", Icon: LayoutDashboard }] },
  { label: "Operations", items: [{ href: "/admin/reservations", label: "Reservations", Icon: CalendarCheck }] },
  {
    label: "Configure",
    items: [
      { href: "/admin/automation/ai-brain", label: "AI brain", Icon: Brain },
      { href: "/admin/settings", label: "Settings", Icon: MapPin },
      { href: "/admin/settings/integrations", label: "Integrations", Icon: MapPin },
    ],
  },
];

describe("roomFor — the room a panel path belongs to", () => {
  it.each([
    ["/admin", "Dashboard"],
    ["/admin/reservations", "Reservations"],
    ["/admin/automation/ai-brain", "AI brain"],
    ["/admin/settings/integrations/resend", "Integrations"],
  ])("%s → %s", (path, label) => {
    expect(roomFor(NAV, path, "/admin")?.label).toBe(label);
  });

  it("a path outside the rail has no room", () => {
    expect(roomFor(NAV, "/admin/login", "/admin")).toBeNull();
  });
});

describe("isItemActive", () => {
  it("the home page is lit only on itself", () => {
    expect(isItemActive("/admin", "/admin", "/admin")).toBe(true);
    expect(isItemActive("/admin", "/admin/menu", "/admin")).toBe(false);
  });

  it("a room is lit on its sub-pages, never on a lookalike path", () => {
    expect(isItemActive("/admin/menu", "/admin/menu")).toBe(true);
    expect(isItemActive("/admin/settings/team", "/admin/settings/team/invite")).toBe(true);
    expect(isItemActive("/admin/links", "/admin/links-archive")).toBe(false);
  });
});

describe("foldPath — Elite Touch's older /admin links on its own host", () => {
  it("folds the old prefix away, and leaves the short form alone", () => {
    expect(foldPath("/admin/quotes/12", "/admin")).toBe("/quotes/12");
    expect(foldPath("/admin", "/admin")).toBe("/");
    expect(foldPath("/quotes", "/admin")).toBe("/quotes");
    expect(foldPath("/administration", "/admin")).toBe("/administration");
    expect(foldPath("/admin/quotes", undefined)).toBe("/admin/quotes");
  });
});

describe("rowsFromCookie — the measured rows, clamped", () => {
  it("reads the count among other cookies", () => {
    expect(rowsFromCookie("a=1; admin-rows=14; b=2")).toBe(14);
  });
  it("clamps a mangled value to 1–60 (a short phone may fit one or two cards)", () => {
    expect(rowsFromCookie("admin-rows=0")).toBe(1);
    expect(rowsFromCookie("admin-rows=2")).toBe(2);
    expect(rowsFromCookie("admin-rows=900")).toBe(60);
    expect(rowsFromValue("23")).toBe(23);
  });
  it("is undefined before the first measure", () => {
    expect(rowsFromCookie("")).toBeUndefined();
    expect(rowsFromValue(undefined)).toBeUndefined();
    expect(rowsFromValue("")).toBeUndefined();
  });
});

describe("paging", () => {
  it("pages by the measured rows", () => {
    expect(resolvePageAdaptive("3", 14)).toEqual({ page: 3, pageSize: 14, from: 28, to: 41 });
  });
  it("falls back to twenty a page, and page 1 for nonsense", () => {
    expect(resolvePageAdaptive("abc", undefined)).toEqual({ page: 1, pageSize: 20, from: 0, to: 19 });
  });
  it("keeps the filters in a page's link, and page 1 clean", () => {
    const href = pageHrefBuilder("/admin/reservations", { status: "pending", q: "", page: "4" });
    expect(href(1)).toBe("/admin/reservations?status=pending");
    expect(href(2)).toBe("/admin/reservations?status=pending&page=2");
  });
});

describe("resolveSort", () => {
  const list: ListConfig = {
    statuses: [],
    sorts: [
      { value: "created_at", label: "Date", type: "date" },
      { value: "total", label: "Amount", type: "amount", cap: "view_finance" },
    ],
    defaultSort: "created_at",
  };
  it("lets only a known column reach the query", () => {
    expect(resolveSort(list, "total", "asc")).toEqual({ column: "total", ascending: true });
    expect(resolveSort(list, "password; drop", "asc")).toEqual({ column: "created_at", ascending: true });
    expect(resolveSort(list, null, null)).toEqual({ column: "created_at", ascending: false });
  });
});
