// The panel's words, server-safe: the translator a page rendered on the
// server uses as well as the provider in the browser (panel-provider re-exports
// these). A panel in one language passes nothing and reads English.

export type Vars = Record<string, string | number>;
/** English in, the person's language out. Blanks read `{name}`. */
export type Translate = (text: string, vars?: Vars) => string;

/** Fill `{name}` blanks with their values — the translator a panel with no
 *  second language uses, so a kit sentence with a number still reads. */
export function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (blank, key: string) => (key in vars ? String(vars[key]) : blank));
}

/**
 * A translator from a word list: the panel's own words for each English text
 * the kit and the app hand to `t`, then the blanks filled. A text with no entry
 * stays English (and `missing` hears it, so a panel can list what is left).
 * Lucce's panel in Romanian, 26 Oct 2026.
 */
export function translator(words: Readonly<Record<string, string>>, missing?: (text: string) => void): Translate {
  return (text, vars) => {
    const said = words[text];
    if (said === undefined) missing?.(text);
    return fill(said ?? text, vars);
  };
}
