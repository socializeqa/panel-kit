"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Undo2, X } from "lucide-react";
import { BACKDROP, CTRL_BTN } from "./classes";
import { cn } from "./cn";
import { IconTile } from "./icon-tile";
import { ConfirmDialog } from "./modal";
import { roomFor } from "./nav";
import { usePanel } from "./panel-provider";
import { RecordEditingProvider } from "./record-editing";
import { tx } from "./tx";
import { useUnsavedGuard } from "./unsaved-guard";
import { usePanelPathname } from "./use-panel-pathname";

// What the drawer's header band shows. A record publishes this through
// DrawerHeader (the way a list page publishes PageMeta to the top bar), so the
// title, its status, the subline and the record's actions all sit in the one
// band beside close — never in a second heading below.
export interface DrawerHeaderData {
  title: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  sub?: string;
  /** What this record belongs to (a child's family, a quote's job), drawn as
   *  its own full-width row under the title. Ecole's slot, which replaces the
   *  job line Elite Touch hard-wired here. */
  context?: React.ReactNode;
  /** The record's rooms as a fused strip beside the title. */
  tabs?: React.ReactNode;
  /** The rooms on their own line under the title, centred (DrawerTabs `under`). */
  tabsUnder?: boolean;
}
const DrawerHeaderContext = createContext<((data: DrawerHeaderData | null) => void) | null>(null);
export function useDrawerHeaderSetter() {
  return useContext(DrawerHeaderContext);
}

// The open drawer's unsaved-work state, and the ways out for its content:
//  - markClean — after a save that keeps the drawer open, so staff aren't
//    asked to discard saved work and Save greys out again.
//  - markDirty — after a fill in code (a model's draft) that fires no input
//    event but is unsaved work all the same.
//  - close — after a save that should DISMISS the drawer. Content must never
//    navigate to the list to do this: these are intercepted routes, and
//    pushing the list leaves the interception mounted, so the drawer sits
//    there over the list still holding values already saved.
//  - closeTo — close with the full slide-out, then land on `href` instead of
//    going back (a create form walking onto the record it just made).
//  - inDrawer — false outside a Drawer, so a form shared with a full page
//    knows to navigate instead of calling close() into the void.
//  - askThen — a way out the PERSON chose (a Cancel): with unsaved edits it
//    asks "Discard changes?" first, exactly as Esc, the scrim and the X do,
//    and runs the action only on Discard. Without edits it just runs. Cancel
//    used to empty the form before anything could ask (X Capital, 30 Sep
//    2026), so it was the one way out that lost work silently.
// Two contexts on purpose: the ACTIONS are stable for the drawer's life, so a
// component that only marks state never re-renders when the flag flips; the
// FLAG lives apart, read only by what gates on it (a Save button). The split
// is what stopped each save's markClean() from re-rendering a whole editor and
// eating the keystroke being typed.
type DrawerActions = {
  markClean: () => void;
  markDirty: () => void;
  close: () => void;
  closeTo: (href: string) => void;
  inDrawer: boolean;
  askThen: (action: () => void) => void;
};
const NOOP_ACTIONS: DrawerActions = {
  markClean: () => {},
  markDirty: () => {},
  close: () => {},
  closeTo: () => {},
  inDrawer: false,
  askThen: (action) => action(),
};
const DrawerActionsContext = createContext<DrawerActions>(NOOP_ACTIONS);

// A picker that changes by a click (a menu, a stepper, a calendar, a switch)
// fires no input event for the content area to hear, so a form whose only
// change was one of them kept its Save greyed out (found in Ecole's copy, 23
// Sep 2026). They report the change here instead. A panel whose choices are a
// draft rather than unsaved work (the filter drawer) opts out with DirtyExempt.
const DirtyExemptContext = createContext(false);
export function DirtyExempt({ children }: { children: React.ReactNode }) {
  return <DirtyExemptContext.Provider value>{children}</DirtyExemptContext.Provider>;
}
const NO_MARK = () => {};
export function useMarkDrawerDirty() {
  const exempt = useContext(DirtyExemptContext);
  const { markDirty } = useDrawerActions();
  return exempt ? NO_MARK : markDirty;
}

// Outside a drawer there's no dirty tracking (a record opened full-page), so
// the flag defaults to dirty — the Save button behaves normally there.
const DrawerDirtyValueContext = createContext<boolean>(true);

export function useDrawerActions() {
  return useContext(DrawerActionsContext);
}
// The flag and the actions together, for the few that render the flag (a
// disabled Save). They re-render on a flip, which is what they are for.
export function useDrawerDirty() {
  const isDirty = useContext(DrawerDirtyValueContext);
  const actions = useContext(DrawerActionsContext);
  return { isDirty, ...actions };
}
export function useMarkDrawerClean() {
  return useDrawerActions().markClean;
}

// The right-side slide-over (the left, in Arabic). Two modes:
//  - Route mode (default): for intercepted record routes — mounts open, and
//    closing slides out then navigates back, removing the intercepted route.
//  - Controlled mode: pass `open` + `onOpenChange` to drive it (a nested "New
//    customer" drawer opened from inside another). No route navigation, and
//    `elevated` stacks it above a drawer already open.
export function Drawer({
  title = "Details",
  children,
  // Aliased: `actions` below is the dirty-tracking value this drawer gives
  // its content, a different thing entirely.
  actions: headerActions,
  open: openProp,
  onOpenChange,
  elevated = false,
  padded = true,
  fill = false,
  closeHref,
}: {
  title?: string;
  // Where closing lands when there is no intercepted route to pop — a create
  // page hard-loaded at its own address renders this same Drawer, and on
  // close goes to its list.
  closeHref?: string;
  children: React.ReactNode;
  // A controlled drawer's own seats, beside close. A route drawer puts these
  // on its DrawerHeader; a controlled one may have none.
  actions?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  elevated?: boolean;
  // false: no inner padding, for content that brings its own.
  padded?: boolean;
  // true: the content area is a non-scrolling flex column, for content that
  // sizes itself to the drawer.
  fill?: boolean;
}) {
  const router = useRouter();
  const pathname = usePanelPathname();
  const { nav, host, t } = usePanel();
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(true);
  const open = controlled ? openProp : internalOpen;
  const z = elevated ? "z-[60]" : "z-50";
  const [published, setPublished] = useState<DrawerHeaderData | null>(null);
  // Which edges of the scroll area still have content past them.
  const scrollRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const measureEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollHeight - el.clientHeight - el.scrollTop > 2;
    setEdges((cur) => (cur.top === top && cur.bottom === bottom ? cur : { top, bottom }));
  }, []);
  // Content grows and shrinks without scrolling (a section folds, a map
  // mounts), so watch the size as well as the scroll position.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    measureEdges();
    const ro = new ResizeObserver(measureEdges);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    return () => ro.disconnect();
  }, [measureEdges, open]);
  const header: DrawerHeaderData = published ?? { title };
  const room = roomFor(nav, pathname, host.home);
  // The kicker names the room — unless the title already LEADS with it ("Job
  // ET-…" under Jobs would read the word twice; "New job" and "Filter & sort"
  // keep their room, like every other drawer).
  const roomWord = room?.label.toLowerCase().replace(/s$/, "") ?? "";
  const kicker = room && !header.title.toLowerCase().startsWith(roomWord) ? room.label : null;

  // Unsaved work. Any input inside the content area marks the drawer dirty; a
  // close by the person (Esc, the scrim, the X) then asks before discarding.
  // A close after a good save goes through navigation, not onOpenChange, so it
  // never sees the question. Elements marked data-dirty-exempt (a picker's
  // search box) don't count — typing a search is not unsaved work.
  const [dirty, setDirty] = useState(false);
  // What "Discard" should do — leave the drawer, or let through the
  // navigation the guard held back. One flag, one dialog, one answer for all
  // four ways out (Damine, 28 Aug 2026).
  const [pending, setPending] = useState<(() => void) | null>(null);
  const markClean = useCallback(() => setDirty(false), []);
  const markDirty = useCallback(() => setDirty(true), []);
  // The other exits: back and forward, links, refresh and tab close. The
  // drawer owns the flag, so the guard belongs here — which covers every
  // record editor in every room at once.
  const guard = useUnsavedGuard({
    when: dirty,
    ask: (discard) => setPending(() => discard),
    // A controlled drawer sits on no route of its own, so back is not one of
    // its exits — the route drawer under it still holds the buffer.
    history: !controlled,
  });
  // Close for content, held behind a ref so its identity never changes: a
  // controlled drawer's inline onOpenChange would otherwise rebuild the
  // actions on every keystroke and re-render every editor inside.
  const closeRef = useRef<() => void>(() => {});
  const requestClose = useCallback(() => closeRef.current(), []);
  // Where this close lands when it isn't back — set by closeTo() for one
  // close, read once the slide-out settles.
  const closeToRef = useRef<string | null>(null);
  const requestCloseTo = useCallback((href: string) => {
    closeToRef.current = href;
    closeRef.current();
  }, []);
  // Read through a ref so askThen keeps one identity for the drawer's life,
  // like the other actions, and never re-renders the editors inside.
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  });
  const askThen = useCallback((action: () => void) => {
    if (!dirtyRef.current) return action();
    setPending(() => () => {
      setDirty(false);
      action();
    });
  }, []);
  const actions = useMemo<DrawerActions>(
    () => ({ markClean, markDirty, close: requestClose, closeTo: requestCloseTo, inDrawer: true, askThen }),
    [markClean, markDirty, requestClose, requestCloseTo, askThen],
  );

  // History entries the guard parked and this close must step over, so a
  // walk back lands on the list rather than on a copy of this same record.
  const parked = useRef(0);
  const close = () => {
    setPending(null);
    parked.current = guard.release();
    setDirty(false);
    if (controlled) onOpenChange?.(false);
    else setInternalOpen(false);
  };
  useEffect(() => {
    closeRef.current = close;
  });

  // A route change while a CONTROLLED drawer is open means a record link in it
  // navigated — and a record route opens as an intercepted drawer at z-50,
  // underneath an elevated one. Without this the click looks like it did
  // nothing: the new drawer mounts hidden. So this one steps aside.
  const lastPath = useRef(pathname);
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    if (controlled && open) onOpenChange?.(false);
  }, [pathname, controlled, open, onOpenChange]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next) return;
        if (dirty) setPending(() => close);
        else close();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn("kit", BACKDROP, "data-[state=open]:animate-scrim-in data-[state=closed]:animate-scrim-out", z)}
        />
        <Dialog.Content
          aria-describedby={undefined}
          onAnimationEnd={() => {
            // The slide-in has settled: the scroll area has its final size,
            // so the edge fades can be measured against it.
            if (open) measureEdges();
            // Route mode: navigate once the slide-out finishes — to wherever
            // closeTo() aimed this close, else closeHref, else back.
            if (!open && !controlled) {
              const aimed = closeToRef.current;
              const target = aimed ?? closeHref;
              closeToRef.current = null;
              const extra = parked.current;
              parked.current = 0;
              // The hard-load twin (closeHref) is a route the drawer slot
              // also intercepts. Walking softly from it to a record stacks
              // the record's drawer over it, and the next refresh refetches
              // this page as its intercepted twin, which doesn't match: Next
              // reloads the page and drops any action in flight (Elite Touch,
              // 23 Sep 2026). A document load lands on the record's own twin.
              if (aimed && closeHref) window.location.replace(aimed);
              else if (target) router.replace(target);
              // One move, not two backs in a row: a second popstate racing
              // the first is what makes a drawer close onto the wrong page.
              else if (extra) history.go(-(1 + extra));
              else router.back();
            }
          }}
          className={cn(
            // Opens on the iOS drawer curve and closes on it too — Elite Touch
            // closed on an ease-in, which waits at the start of the move.
            "kit fixed inset-y-0 end-0 flex w-full max-w-[1160px] flex-col bg-ground shadow-2xl outline-none data-[state=open]:animate-drawer-in data-[state=closed]:animate-drawer-out",
            z,
          )}
        >
          {/* The header band — the drawer's one heading: the room's tile and
              kicker, the title with its status, the subline, then the
              record's seats and close. A real row, so nothing floats over
              the body. */}
          <header className="@container relative shrink-0 border-b border-ink/[0.08] bg-surface px-5 pb-4 pt-3.5 sm:px-7">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand-deep via-brand-deep/40 to-transparent rtl:bg-gradient-to-l"
            />
            {/* One row when it fits — title, then the rooms strip, then the
                seats; the strip drops to its own line when the title needs
                the room. */}
            <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3">
              <div className="flex min-w-0 flex-1 items-center gap-3.5 @[1080px]:basis-0">
                {room ? (
                  <IconTile size="lg" tone="ink" className="shadow-kit-tile">
                    <room.Icon aria-hidden="true" />
                  </IconTile>
                ) : null}
                <div className="min-w-0 flex-1">
                  {kicker ? (
                    <p className="text-[11px] font-semibold leading-none tracking-[0.02em] text-brand-deep">{t(kicker)}</p>
                  ) : null}
                  <div className={cn("flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1", kicker && "mt-1")}>
                    <Dialog.Title asChild>
                      {/* A narrow drawer (a phone) wraps the name onto two lines rather than cut it to a few letters. */}
                      <h2 className="truncate text-[20px] font-semibold leading-tight tracking-[-0.015em] text-ink @max-[34rem]:line-clamp-2 @max-[34rem]:whitespace-normal">
                        {t(header.title)}
                      </h2>
                    </Dialog.Title>
                    {header.badge}
                  </div>
                  {header.sub ? <p className="mt-0.5 truncate text-[13px] text-quiet">{t(header.sub)}</p> : null}
                </div>
              </div>
              {/* The rooms strip sits centred between the title and the seats
                  (Damine, 23 Aug 2026: "must be centered"). */}
              {header.tabs && !header.tabsUnder ? (
                <div className="order-last basis-full @[1080px]:order-none @[1080px]:flex @[1080px]:flex-1 @[1080px]:basis-0 @[1080px]:justify-center">
                  {header.tabs}
                </div>
              ) : null}
              {/* The seats: the record's own (⋯ and the like) then close,
                  fused into one strip like the list headers' cluster. */}
              <div className="ms-auto flex shrink-0 justify-end @[1080px]:flex-1 @[1080px]:basis-0">
                <div className="flex items-center overflow-hidden rounded-control ps-px [&_.seat]:-ms-px [&_.seat]:rounded-none">
                  {header.actions}
                  {headerActions}
                  <Dialog.Close aria-label={t("Close")} title={t("Close")} className={CTRL_BTN}>
                    <X aria-hidden="true" />
                  </Dialog.Close>
                </div>
              </div>
            </div>
            {/* What the record belongs to — its own full-width row under the
                title row, so it never fights the rooms strip for space. */}
            {header.context ? <div className="mt-3">{tx(header.context)}</div> : null}
            {/* Rooms under the title: centred on their own line, their marks
                resting on the header's rule. */}
            {header.tabs && header.tabsUnder ? <div className="-mb-4 mt-3.5 flex justify-center">{header.tabs}</div> : null}
          </header>
          <div className="relative flex min-h-0 flex-1 flex-col">
            {/* Edge fades: the body slides under a soft gradient at the top
                and bottom of the scroll area, each shown only while there is
                content past that edge — a quiet "there's more". */}
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 top-0 z-[2] h-6 bg-gradient-to-b from-ground to-transparent transition-opacity duration-200",
                edges.top ? "opacity-100" : "opacity-0",
              )}
            />
            <span
              aria-hidden="true"
              className={cn(
                "pointer-events-none absolute inset-x-0 bottom-0 z-[2] h-6 bg-gradient-to-t from-ground to-transparent transition-opacity duration-200",
                edges.bottom ? "opacity-100" : "opacity-0",
              )}
            />
            <div
              ref={scrollRef}
              onScroll={measureEdges}
              // Bubble phase, never capture: a state update in the capture
              // phase makes React flush and restore every controlled value to
              // the DOM BEFORE the field's own onChange reads it — the first
              // keystroke in a fresh drawer vanished (Elite Touch, 23 Aug 2026).
              onInput={(e) => {
                const target = e.target as HTMLElement;
                // A nested drawer renders in its own portal but is a React
                // child of this one, so its input events bubble up here through
                // the React tree. They are not this drawer's work.
                if (!e.currentTarget.contains(target)) return;
                if (target.closest("[data-dirty-exempt]")) return;
                if (!dirty) setDirty(true);
              }}
              className={cn(
                // A flex column either way: a record form stretches to the
                // floor so its sticky Save bar rides the bottom edge even when
                // the sections above are short or folded.
                fill ? "flex min-h-0 flex-1 flex-col overflow-hidden" : "flex min-h-0 flex-1 flex-col overflow-y-auto",
                padded && "px-5 py-6 sm:px-7",
              )}
            >
              <DrawerActionsContext.Provider value={actions}>
                <DrawerDirtyValueContext.Provider value={dirty}>
                  <DrawerHeaderContext.Provider value={setPublished}>
                    {/* A drawer opened over a record (a child over its family)
                        is a React child of that record, so it would inherit
                        the record's view-mode lock and open behind a "switch
                        to edit" sheet. Its own form starts unlocked (Ecole). */}
                    {controlled ? <RecordEditingProvider initial>{children}</RecordEditingProvider> : children}
                  </DrawerHeaderContext.Provider>
                </DrawerDirtyValueContext.Provider>
              </DrawerActionsContext.Provider>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <ConfirmDialog
        open={!!pending}
        onClose={() => setPending(null)}
        onConfirm={() => {
          const go = pending;
          setPending(null);
          go?.();
        }}
        title="Discard changes?"
        body="You have unsaved edits in this panel. Leaving it will discard them."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        kicker="Before you leave"
        confirmIcon={Undo2}
      />
    </Dialog.Root>
  );
}
