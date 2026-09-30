"use client";

import { iconBtnClass, type IconBtnSize, type IconBtnTone } from "./classes";
import { usePanelT } from "./panel-provider";

// The quiet icon-only action. One component for the three sizes and three
// hover tones Elite Touch's audit found hand-rolled ~35 times. Its classes
// alone are iconBtnClass (classes.ts), for an <a> or a <Link> that must match
// it exactly — a server list composes those.
export function IconBtn({
  onClick,
  label,
  tone = "default",
  size = 7,
  disabled,
  children,
}: {
  onClick?: () => void;
  label: string;
  tone?: IconBtnTone;
  size?: IconBtnSize;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const t = usePanelT();
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={t(label)}
      title={t(label)}
      className={iconBtnClass(size, tone)}
    >
      {children}
    </button>
  );
}
