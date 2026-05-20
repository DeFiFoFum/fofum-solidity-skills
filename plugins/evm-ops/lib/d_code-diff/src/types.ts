export type Theme = "dark" | "light";
export type OutputFormat = "side-by-side" | "line-by-line";

export interface DiffStats {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
}

export interface RenderDiffOptions {
  /** Page heading */
  title?: string;
  /** Color theme (default: "dark") */
  theme?: Theme;
  /** Diff display format (default: "side-by-side") */
  outputFormat?: OutputFormat;
  /** Custom HTML injected after the title (e.g., address links) */
  headerHtml?: string;
}

export interface IndexEntry {
  /** Display label (used as link text and filename base) */
  label: string;
  /** Relative path to the diff HTML file */
  href: string;
  /** Diff statistics */
  stats: DiffStats;
  /** Whether files are identical (no changes) */
  identical: boolean;
  /** Extra column values keyed by column header */
  extra?: Record<string, string>;
}

export interface RenderIndexOptions {
  /** Page title (default: "Code Diffs") */
  title?: string;
  /** Subtitle text below the title (e.g., "Chain: base | Generated: 2026-02-24") */
  subtitle?: string;
  /** Color theme (default: "dark") */
  theme?: Theme;
  /** Additional table column headers; values pulled from IndexEntry.extra */
  extraColumns?: string[];
}

export interface DiffDirectoriesOptions {
  /** Glob patterns to exclude (passed to diff --exclude) */
  exclude?: string[];
}

export interface DiffGitOptions {
  /** Working directory for git (default: cwd) */
  cwd?: string;
  /** Path specs to limit diff scope (e.g., ["src/", "lib/"]) */
  paths?: string[];
}

export type PathSide = "old" | "new";
