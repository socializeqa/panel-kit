"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LogOut, Menu, X } from "lucide-react";
import { BackDoor } from "./back-door";
import { BACKDROP, iconBtnClass } from "./classes";
import { cn } from "./cn";
import { LightsToggle } from "./lights-toggle";
import { ActiveFilterChips, ListControls } from "./list-controls";
import { ListOptionsProvider } from "./list-options-context";
import { isItemActive, roomFor, type NavGroup } from "./nav";
import { NavMemory } from "./nav-memory";
import { NewRecordButton } from "./new-record-button";
import { NumberWheelGuard } from "./number-wheel-guard";
import { PageHeaderContext, type PageHeaderData } from "./page-header-context";
import { usePanel } from "./panel-provider";
import { RowsCalibrator } from "./rows-calibrator";
import { CountPill } from "./status-badge";
import { usePanelPathname } from "./use-panel-pathname";

// Elite Touch's shell — the ink rail, the one header, the phone's overlay rail
// — with everything it was wired to handed in through PanelProvider: the
// rooms, the logo, who is signed in, the header's own tools (a global search,
// the bell), a slot under the logo (Señorritas' branch switch) and, for a
// panel that opts in, the lights.

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  // Initials are capitals by nature; everything the panel says stays sentence case.
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function Rail({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePanelPathname();
  const { nav, host, can, t, logo, logoAlign, railTop, user, signOut, lights, credit } = usePanel();

  // A room that names a capability shows only to someone who has it; a group
  // left with no rooms goes too.
  const groups: NavGroup[] = nav
    .map((group) => ({ ...group, items: group.items.filter((i) => !i.cap || can(i.cap)) }))
    .filter((group) => group.items.length > 0);

  // One group open at a time: the group holding the current page starts open;
  // opening another folds it. Walking into a different group re-opens that one
  // (adjusted during render, no effect needed).
  const activeGroup =
    groups.find((g) => g.items.some((i) => isItemActive(i.href, pathname, host.home)))?.label ?? groups[0]?.label ?? null;
  const [openGroup, setOpenGroup] = useState<string | null>(activeGroup);
  const [seenActive, setSeenActive] = useState(activeGroup);
  if (activeGroup !== seenActive) {
    setSeenActive(activeGroup);
    setOpenGroup(activeGroup);
  }

  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden bg-rail text-on-rail">
      {/* No film-grain here: a blend layer over the full-height, always-visible
          rail pegged weaker tablet GPUs into a freeze (Elite Touch). The ink
          and this glow carry the surface on their own — the accent as light,
          never as paint. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(120%_80%_at_30%_0%,color-mix(in_oklab,var(--rail-accent)_14%,transparent),transparent_70%)]"
      />

      <div className="relative flex h-full flex-col p-3">
        {logo ? (
          <Link
            href={host.home}
            onClick={onNavigate}
            aria-label={t("Home")}
            className={cn("block px-2 py-1.5", logoAlign === "center" ? "self-center" : "self-start")}
          >
            {logo}
          </Link>
        ) : null}

        {railTop}

        {/* The grouped rail. Quiet sentence-case labels in the content's own
            face; the stack stays centred (my-auto). The room you are in is a
            soft pill with an accent edge and an accent glyph. */}
        <nav aria-label={t("Panel navigation")} className="scrollbar-none mt-1 flex min-h-0 flex-1 flex-col overflow-y-auto py-2">
          <div className="my-auto flex w-full flex-col gap-1.5">
            {groups.map((group) => {
              const isOpen = openGroup === group.label;
              return (
                <div key={group.label}>
                  {/* The group's head: its label and a hairline. Open reads
                      lit, folded reads faint; the only ornament is a dot when
                      a FOLDED group holds the current page. */}
                  <button
                    type="button"
                    onClick={() => setOpenGroup((o) => (o === group.label ? null : group.label))}
                    aria-expanded={isOpen}
                    className="group/head flex w-full items-center gap-2.5 px-3 py-1.5"
                  >
                    <span
                      className={cn(
                        "truncate text-[11px] font-medium tracking-[0.01em] transition-colors",
                        isOpen ? "text-on-rail/60" : "text-on-rail/30 group-hover/head:text-on-rail/55",
                      )}
                    >
                      {t(group.label)}
                    </span>
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-px flex-1 transition-colors",
                        isOpen ? "bg-on-rail/[0.10]" : "bg-on-rail/[0.05] group-hover/head:bg-on-rail/[0.09]",
                      )}
                    />
                    {!isOpen && group.items.some((i) => isItemActive(i.href, pathname, host.home)) ? (
                      <span aria-hidden="true" className="size-1 shrink-0 rounded-full bg-rail-accent/80" />
                    ) : null}
                  </button>
                  <div
                    className={cn(
                      // The group opens at once and its rooms fade up. Elite
                      // Touch eased the row height over 300ms — a layout
                      // animation, which the house doesn't run.
                      "grid transition-opacity duration-200 ease-out motion-reduce:transition-none",
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col gap-px pb-1 pt-0.5">
                        {group.items.map(({ href, label, Icon, count }) => {
                          const active = isItemActive(href, pathname, host.home);
                          return (
                            <Link
                              key={href}
                              href={href}
                              onClick={onNavigate}
                              tabIndex={isOpen ? undefined : -1}
                              aria-current={active ? "page" : undefined}
                              className={cn(
                                "group relative flex items-center gap-2.5 rounded-xl px-3 py-[7px] text-[13px] font-medium tracking-[-0.005em] transition-colors",
                                active ? "bg-on-rail/[0.08] text-on-rail" : "text-on-rail/55 hover:bg-on-rail/[0.04] hover:text-on-rail/90",
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "absolute inset-y-[8px] start-0 w-[3px] rounded-full bg-rail-accent transition-opacity duration-200",
                                  active ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <Icon
                                className={cn(
                                  "size-[17px] shrink-0 transition-colors",
                                  active ? "text-rail-accent" : "text-on-rail/40 group-hover:text-on-rail/75",
                                )}
                                strokeWidth={1.9}
                              />
                              <span className="flex-1 truncate">{t(label)}</span>
                              {count ? <CountPill value={count} className="bg-rail-accent px-1.5 text-rail" /> : null}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </nav>

        {user || signOut || lights ? (
          <div className="mt-2 flex items-center gap-2.5 border-t border-on-rail/10 px-2 pt-2.5">
            {user?.name ? (
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-on-rail/10 text-[11px] font-semibold text-on-rail">
                {initials(user.name)}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              {user ? <span className="block truncate text-[12px] font-medium text-on-rail">{user.name ?? t("Staff")}</span> : null}
              {user?.role ? <span className="block truncate text-[11px] text-on-rail/45">{t(user.role)}</span> : null}
            </span>
            {lights ? <LightsToggle dark={lights.dark} onChange={lights.onChange} className="h-8 w-14" /> : null}
            {signOut ? (
              <button
                type="button"
                onClick={() => void signOut()}
                aria-label={t("Sign out")}
                title={t("Sign out")}
                className={cn(iconBtnClass(8), "shrink-0 text-on-rail/55 hover:bg-on-rail/[0.06] hover:text-on-rail")}
              >
                <LogOut className="size-4" strokeWidth={1.9} />
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Who built the thing. Quiet, at the very foot, under everything. */}
        {credit === undefined ? (
          <a
            href="https://socialize.qa"
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center justify-center gap-1 px-2 pb-0.5 text-[11px] text-on-rail/35 transition-opacity hover:opacity-80"
          >
            {t("Built by")} <span className="font-semibold">Socialize</span>
          </a>
        ) : (
          credit
        )}
      </div>
    </div>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { nav, host, t, barLogo, tools } = usePanel();
  const [open, setOpen] = useState(false);
  const [published, setHeader] = useState<PageHeaderData | null>(null);
  const pathname = usePanelPathname();
  // The room this page belongs to, for the header's tile and kicker — the
  // same reading the drawer makes, so both headers say the same.
  const room = roomFor(nav, pathname, host.home);
  // A page that publishes nothing still names its room.
  const header = published ?? (room ? { title: room.label } : null);
  const roomWord = room?.label.toLowerCase().replace(/s$/, "") ?? "";
  const kicker = room && header && !header.title.toLowerCase().includes(roomWord) ? room.label : null;
  // A steady context value, so a page's PageMeta effect doesn't re-fire on
  // every header change.
  const ctxValue = useMemo(() => ({ setHeader }), []);

  // Close the phone's rail on Escape, and lock the page behind it so nothing
  // underneath moves while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <PageHeaderContext.Provider value={ctxValue}>
      <ListOptionsProvider>
        <NumberWheelGuard />
        <NavMemory />
        <RowsCalibrator />
        <div className="kit min-h-dvh bg-ground lg:grid lg:grid-cols-[248px_1fr]">
          <aside className="hidden lg:sticky lg:top-0 lg:block lg:h-dvh">
            <Rail />
          </aside>

          <div className="flex h-dvh min-w-0 flex-col">
            {/* The top bar: the page's title on the start, the shared tools on
                the end; on every page. A near-solid ground instead of a
                backdrop blur: re-blurring a sticky bar over scrolling content
                every frame froze tablets (Elite Touch). */}
            <header className="group/header sticky top-0 z-30 flex min-h-[60px] items-center gap-3 border-b border-ink/10 bg-ground/95 px-4 py-2.5 sm:px-6 lg:px-8">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t("Open menu")}
                className={cn(iconBtnClass(9, "ink"), "shrink-0 lg:hidden")}
              >
                <Menu className="size-5" />
              </button>
              <BackDoor />

              {header ? (
                // The drawer's band grammar: the room's tile, the room as a
                // kicker when the title doesn't already say it, the title and
                // its badge, then the subline.
                <div className="flex min-w-0 items-center gap-3.5">
                  {/* On a phone the room tile steps aside: the title already
                      names the room, and next to the menu button and four tools
                      it needs the width ("Bookings" read "Booki…" at 390px). */}
                  {room ? (
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-rail text-on-rail shadow-kit-tile max-sm:hidden">
                      <room.Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                    </span>
                  ) : null}
                  <div className="min-w-0">
                    {kicker ? (
                      <p className="text-[11px] font-semibold leading-none tracking-[0.02em] text-brand-deep">{t(kicker)}</p>
                    ) : null}
                    <div className={cn("flex min-w-0 items-center gap-2.5", kicker && "mt-1")}>
                      <h1 className="truncate text-[18px] font-semibold leading-tight tracking-[-0.015em] text-ink sm:text-[20px]">
                        {t(header.title)}
                      </h1>
                      {published?.badge}
                      {published?.count !== undefined && (
                        <CountPill value={published.count} className="shrink-0 px-2 py-0.5 text-[12px] font-medium" />
                      )}
                    </div>
                    {/* The subline: what the page belongs to, then its line. */}
                    {published?.context || published?.description ? (
                      <div className="mt-0.5 hidden flex-wrap items-center gap-x-5 gap-y-1 sm:flex">
                        {published.context ?? null}
                        {published.description ? (
                          <p className="truncate text-[13px] text-quiet">{t(published.description)}</p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : barLogo ? (
                <span className="lg:hidden">{barLogo}</span>
              ) : null}

              <div className="flex-1" />

              {/* One fused strip of 36px seats, by priority: the page's own
                  action, then New, then search, filter and sort, then the
                  app's tools. The wrappers render as `contents`, so every seat
                  is an item of this strip; its corners round the ends and a
                  -1px overlap fuses the borders. */}
              <div className="flex shrink-0 items-center overflow-hidden rounded-control ps-px [&_.seat]:-ms-px [&_.seat]:rounded-none">
                {published?.action ?? null}
                <Suspense fallback={null}>
                  <NewRecordButton />
                  <ListControls />
                </Suspense>
                {tools}
              </div>
            </header>

            {/* The content area is the scroll container, so the header stays
                put and a list can fill the frame while a tall page scrolls
                inside it. `relative` is load-bearing: without it, absolutely
                positioned descendants (every sr-only span) resolve against the
                viewport, escape this container's clipping, and hand the
                document phantom scroll. */}
            <main id="main-content" className="relative flex min-w-0 flex-1 flex-col overflow-y-auto overflow-x-hidden">
              <Suspense fallback={null}>
                <ActiveFilterChips />
              </Suspense>
              <div className="flex min-h-0 flex-1 flex-col px-5 py-4 sm:px-8 sm:py-5">{children}</div>
            </main>
          </div>

          {/* The phone's rail: it slides in from the start edge; it goes at
              once, since leaving it means you picked a room. */}
          {open && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label={t("Close menu")}
                onClick={() => setOpen(false)}
                className={cn(BACKDROP, "absolute animate-scrim-in")}
              />
              <div className="absolute inset-y-0 start-0 w-[272px] max-w-[80%] shadow-2xl animate-rail-in">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("Close menu")}
                  className={cn(iconBtnClass(9), "absolute end-3 top-3 z-10 text-on-rail/70 hover:bg-on-rail/10 hover:text-on-rail")}
                >
                  <X className="size-5" />
                </button>
                <Rail onNavigate={() => setOpen(false)} />
              </div>
            </div>
          )}
        </div>
      </ListOptionsProvider>
    </PageHeaderContext.Provider>
  );
}
