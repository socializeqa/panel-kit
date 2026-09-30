import { Tx } from "./panel-provider";

/**
 * Whatever a screen draws, translated if it is words: a string becomes <Tx>,
 * anything else (a number, an element, nothing) passes through as it was.
 * Safe on data — a family's name matches no English key and stays itself.
 * No "use client" on purpose: the kit's server-safe pieces (the table, the
 * cards) call it while rendering on the server. Ecole's panel, 23 Sep 2026.
 */
export function tx(node: React.ReactNode): React.ReactNode {
  return typeof node === "string" && /[A-Za-z]/.test(node) ? <Tx>{node}</Tx> : node;
}
