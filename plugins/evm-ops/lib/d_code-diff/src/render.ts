import { html as diff2htmlHtml } from "diff2html";
import { ColorSchemeType } from "diff2html/lib/types";
import type {
  Theme,
  RenderDiffOptions,
  IndexEntry,
  RenderIndexOptions,
} from "./types.js";
import { getDiffCss, getIdenticalCss, getIndexCss } from "./themes.js";

/**
 * Render a unified diff string into a complete standalone HTML page
 * with side-by-side (or line-by-line) diff display.
 *
 * If the diff is empty, renders an "identical" page.
 */
export function renderDiffHtml(
  unifiedDiff: string,
  options: RenderDiffOptions = {},
): string {
  const {
    title = "Diff",
    theme = "dark",
    outputFormat = "side-by-side",
    headerHtml = "",
  } = options;

  const identical = unifiedDiff.trim() === "";

  if (identical) {
    return renderIdenticalHtml(title, theme, headerHtml);
  }

  const colorScheme = theme === "dark" ? ColorSchemeType.DARK : ColorSchemeType.LIGHT;
  const dataAttrs =
    theme === "dark"
      ? ' data-color-mode="dark" data-dark-theme="dark"'
      : "";

  const diffHtmlBody = diff2htmlHtml(unifiedDiff, {
    drawFileList: true,
    matching: "lines",
    outputFormat,
    renderNothingWhenEmpty: false,
    colorScheme,
  });

  const css = getDiffCss(theme);

  return `<!DOCTYPE html>
<html lang="en"${dataAttrs}>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/diff2html/bundles/css/diff2html.min.css">
  <style>${css}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${headerHtml ? `<div class="header-info">${headerHtml}</div>` : ""}
  ${diffHtmlBody}
</body>
</html>`;
}

function renderIdenticalHtml(
  title: string,
  theme: Theme,
  headerHtml: string,
): string {
  const css = getIdenticalCss(theme);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${css}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${headerHtml ? `<div class="header-info">${headerHtml}</div>` : ""}
  <div class="identical">Files are identical: no changes detected.</div>
</body>
</html>`;
}

/**
 * Render an index HTML page linking to individual diff files.
 */
export function renderIndexHtml(
  entries: IndexEntry[],
  options: RenderIndexOptions = {},
): string {
  const {
    title = "Code Diffs",
    subtitle,
    theme = "dark",
    extraColumns = [],
  } = options;

  const extraTh = extraColumns.map((col) => `<th>${escapeHtml(col)}</th>`).join("");

  const rows = entries
    .map((e) => {
      const status = e.identical
        ? '<span style="color:#56d364">Identical</span>'
        : `${e.stats.filesChanged} file(s): <span style="color:#56d364">+${e.stats.linesAdded}</span> / <span style="color:#f85149">-${e.stats.linesRemoved}</span>`;

      const extraTd = extraColumns
        .map((col) => {
          const val = e.extra?.[col] ?? "";
          return `<td class="mono">${val}</td>`;
        })
        .join("");

      return `<tr>
        <td><a href="${escapeHtml(e.href)}">${escapeHtml(e.label)}</a></td>
        ${extraTd}
        <td>${status}</td>
      </tr>`;
    })
    .join("\n");

  const css = getIndexCss(theme);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <style>${css}
  </style>
</head>
<body>
  <h1>${escapeHtml(title)}</h1>
  ${subtitle ? `<p class="meta">${escapeHtml(subtitle)}</p>` : ""}
  <table>
    <thead>
      <tr><th>Name</th>${extraTh}<th>Changes</th></tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
