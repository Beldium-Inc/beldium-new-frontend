// Join codes: the eight-character code an organisation administrator shares
// so colleagues can ask to join. Same scheme as the Miner Hub.

/** Letters and digits only, upper case, at most eight. */
export function cleanJoinCode(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

/** Show the code the way it is printed: two groups of four. */
export function formatJoinCode(value: string): string {
  const clean = cleanJoinCode(value);
  return clean.length > 4 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}
