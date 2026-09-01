import type { Theme } from "./types.js";

const DARK_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #c9d1d9; background: #0d1117; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #30363d; padding-bottom: 12px; margin-bottom: 4px; color: #e6edf3; }
    .header-info { font-family: monospace; font-size: 0.85rem; color: #8b949e; margin-bottom: 20px; }
    .header-info a { color: #58a6ff; text-decoration: none; }
    .header-info a:hover { text-decoration: underline; }
    /* Dark theme overrides for diff2html: GitHub-style colors */
    .d2h-wrapper { border: 1px solid #30363d; border-radius: 6px; overflow: hidden; }
    .d2h-file-header { background: #161b22 !important; color: #c9d1d9 !important; border-bottom-color: #30363d !important; }
    .d2h-file-list-wrapper { background: #161b22 !important; border-color: #30363d !important; }
    .d2h-file-list-wrapper a { color: #58a6ff !important; }
    .d2h-file-list-line { border-bottom-color: #21262d !important; }
    .d2h-tag { background: #21262d !important; color: #c9d1d9 !important; border-color: #30363d !important; }
    .d2h-code-side-linenumber, .d2h-code-linenumber { background: #161b22 !important; color: #484f58 !important; border-color: #21262d !important; }
    .d2h-code-line, .d2h-code-side-line { background: #0d1117 !important; color: #c9d1d9 !important; }
    .d2h-code-line-ctn { white-space: pre-wrap; word-break: break-all; color: #c9d1d9 !important; }
    /* Deletions: red background, red text */
    .d2h-del, td.d2h-del { background-color: #3d1f28 !important; }
    .d2h-del .d2h-code-line-ctn, .d2h-del .d2h-code-side-line-ctn { color: #ffa198 !important; }
    .d2h-del .d2h-code-side-linenumber { background-color: #3d1f28 !important; }
    /* Additions: green background, green text */
    .d2h-ins, td.d2h-ins { background-color: #1a3a2a !important; }
    .d2h-ins .d2h-code-line-ctn, .d2h-ins .d2h-code-side-line-ctn { color: #7ee787 !important; }
    .d2h-ins .d2h-code-side-linenumber { background-color: #1a3a2a !important; }
    /* Inline highlights within changed lines */
    .d2h-code-line del, .d2h-code-side-line del { background-color: #6e3530 !important; color: #ffa198 !important; text-decoration: none !important; }
    .d2h-code-line ins, .d2h-code-side-line ins { background-color: #264d3a !important; color: #7ee787 !important; text-decoration: none !important; }
    /* Misc */
    .d2h-info { background: #161b22 !important; color: #8b949e !important; border-color: #30363d !important; }
    .d2h-file-diff { border-color: #30363d !important; }
    .d2h-files-diff { border-color: #30363d !important; }
    .d2h-file-side-diff { border-color: #30363d !important; }
    .d2h-cntx { background: #0d1117 !important; }
    .d2h-cntx .d2h-code-line-ctn { color: #8b949e !important; }
    /* Empty side placeholders (opposite side of added/removed) */
    .d2h-emptyplaceholder { background-color: #161b22 !important; }
    @media print {
      body { background: #fff; color: #333; }
    }`;

const LIGHT_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #1f2328; background: #ffffff; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #d0d7de; padding-bottom: 12px; margin-bottom: 4px; color: #1f2328; }
    .header-info { font-family: monospace; font-size: 0.85rem; color: #656d76; margin-bottom: 20px; }
    .header-info a { color: #0969da; text-decoration: none; }
    .header-info a:hover { text-decoration: underline; }`;

const DARK_INDEX_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; color: #c9d1d9; background: #0d1117; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #30363d; padding-bottom: 12px; color: #e6edf3; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #21262d; }
    th { background: #161b22; font-weight: 600; color: #e6edf3; }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .mono a { color: #8b949e; text-decoration: none; }
    .mono a:hover { color: #58a6ff; text-decoration: underline; }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .meta { color: #8b949e; font-size: 0.9rem; margin-top: 8px; }
    tr:hover { background: #161b22; }`;

const LIGHT_INDEX_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 1100px; margin: 40px auto; padding: 0 20px; color: #1f2328; background: #ffffff; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #d0d7de; padding-bottom: 12px; color: #1f2328; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #d0d7de; }
    th { background: #f6f8fa; font-weight: 600; color: #1f2328; }
    .mono { font-family: monospace; font-size: 0.8rem; }
    .mono a { color: #656d76; text-decoration: none; }
    .mono a:hover { color: #0969da; text-decoration: underline; }
    a { color: #0969da; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .meta { color: #656d76; font-size: 0.9rem; margin-top: 8px; }
    tr:hover { background: #f6f8fa; }`;

const DARK_IDENTICAL_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #c9d1d9; background: #0d1117; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #30363d; padding-bottom: 12px; color: #e6edf3; }
    .header-info { font-family: monospace; font-size: 0.85rem; color: #8b949e; }
    .header-info a { color: #58a6ff; text-decoration: none; }
    .header-info a:hover { text-decoration: underline; }
    .identical { background: #0d2818; border: 1px solid #238636; border-radius: 6px; padding: 16px 20px; margin-top: 20px; color: #56d364; }`;

const LIGHT_IDENTICAL_CSS = `
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 20px; color: #1f2328; background: #ffffff; }
    h1 { font-size: 1.5rem; border-bottom: 2px solid #d0d7de; padding-bottom: 12px; color: #1f2328; }
    .header-info { font-family: monospace; font-size: 0.85rem; color: #656d76; }
    .header-info a { color: #0969da; text-decoration: none; }
    .header-info a:hover { text-decoration: underline; }
    .identical { background: #dafbe1; border: 1px solid #1a7f37; border-radius: 6px; padding: 16px 20px; margin-top: 20px; color: #116329; }`;

export function getDiffCss(theme: Theme): string {
  return theme === "dark" ? DARK_CSS : LIGHT_CSS;
}

export function getIndexCss(theme: Theme): string {
  return theme === "dark" ? DARK_INDEX_CSS : LIGHT_INDEX_CSS;
}

export function getIdenticalCss(theme: Theme): string {
  return theme === "dark" ? DARK_IDENTICAL_CSS : LIGHT_IDENTICAL_CSS;
}
