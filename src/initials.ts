/** "Sara Haddad" → "SH". A word that doesn't start with a letter (a bracket,
 *  a dash) is skipped, so "Dev (verification)" reads "D", never "D(". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter((w) => /^\p{L}/u.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
