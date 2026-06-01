# CLAUDE.md

## Writing Style

- NEVER use em-dashes (—) or en-dashes (–) anywhere in prose, docs, or comments. Restructure the sentence, or use a colon or comma instead.
- No filler phrases ("In order to", "It is worth noting that", "Please note").
- Prefer short, direct sentences over long compound ones.

## Repo Structure

This is a Claude Code plugin marketplace. It contains:
- `plugins/`: one subdirectory per plugin
- `.claude-plugin/marketplace.json`: the plugin registry
- `STANDARDS.md`: authoring guide for new plugins

## Adding Plugins

See `STANDARDS.md`. Each plugin needs:
- `.claude-plugin/plugin.json`
- `skills/` directory with at least one `SKILL.md`
- `commands/` directory (optional but recommended)
- `README.md` and `QUICKSTART.md`
