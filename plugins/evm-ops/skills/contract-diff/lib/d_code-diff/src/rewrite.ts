import type { PathSide } from "./types.js";

/**
 * Rewrite file paths in unified diff headers using a custom rewriter function.
 *
 * The rewriter receives the raw path and the side ("old" or "new") and should
 * return the desired display path. Useful for stripping temp directory prefixes,
 * adding address labels, etc.
 */
export function rewriteDiffPaths(
  unifiedDiff: string,
  rewriter: (rawPath: string, side: PathSide) => string,
): string {
  return unifiedDiff
    .split("\n")
    .map((line) => {
      if (line.startsWith("--- ") && !line.startsWith("--- a/")) {
        const raw = line.slice(4).split("\t")[0].trim();
        return `--- ${rewriter(raw, "old")}`;
      }
      if (line.startsWith("+++ ") && !line.startsWith("+++ b/")) {
        const raw = line.slice(4).split("\t")[0].trim();
        return `+++ ${rewriter(raw, "new")}`;
      }
      if (line.startsWith("diff -ru") || line.startsWith("diff --git")) {
        // Rewrite diff command line: extract the two paths at the end
        const parts = line.split(" ");
        if (parts.length >= 3) {
          const oldPath = parts[parts.length - 2];
          const newPath = parts[parts.length - 1];
          const prefix = parts.slice(0, parts.length - 2).join(" ");
          return `${prefix} ${rewriter(oldPath, "old")} ${rewriter(newPath, "new")}`;
        }
      }
      return line;
    })
    .join("\n");
}
