// Types
export type {
  Theme,
  OutputFormat,
  DiffStats,
  RenderDiffOptions,
  RenderIndexOptions,
  IndexEntry,
  DiffDirectoriesOptions,
  DiffGitOptions,
  PathSide,
} from "./types.js";

// Pure rendering (no I/O)
export { renderDiffHtml, renderIndexHtml } from "./render.js";

// Diff generation (shell commands)
export { diffDirectories, diffGitRange } from "./diff.js";

// Utilities
export { parseDiffStats } from "./stats.js";
export { rewriteDiffPaths } from "./rewrite.js";

// Themes (for advanced customization)
export { getDiffCss, getIndexCss, getIdenticalCss } from "./themes.js";
