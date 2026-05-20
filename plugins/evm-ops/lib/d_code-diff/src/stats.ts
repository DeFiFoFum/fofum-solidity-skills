import type { DiffStats } from "./types.js";

/**
 * Parse a unified diff string and count files changed, lines added, and lines removed.
 */
export function parseDiffStats(unifiedDiff: string): DiffStats {
  let filesChanged = 0;
  let linesAdded = 0;
  let linesRemoved = 0;

  for (const line of unifiedDiff.split("\n")) {
    if (line.startsWith("+") && !line.startsWith("+++")) linesAdded++;
    if (line.startsWith("-") && !line.startsWith("---")) linesRemoved++;
    if (line.startsWith("diff ")) filesChanged++;
  }

  return { filesChanged, linesAdded, linesRemoved };
}
