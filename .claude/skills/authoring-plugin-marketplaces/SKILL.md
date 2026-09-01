---
name: authoring-plugin-marketplaces
description: Guide for creating and distributing Claude Code plugin marketplaces. Use when creating a marketplace.json, publishing plugins to a team or community, setting up release channels, managing private repos, or configuring strictKnownMarketplaces for enterprise.
user-invocable: true
metadata:
  # Repo-local authoring aid. Hidden from `npx skills` so it is not
  # distributed to consumers of this marketplace.
  internal: true
---

## What Is a Plugin Marketplace?

A marketplace is a catalog (`marketplace.json`) that lets you distribute plugins to others. It provides centralized discovery, versioning, and auto-updates. Users add your marketplace once with `/plugin marketplace add`, then install individual plugins from it.

Plugin = skills + agents + hooks + MCP servers + LSP servers (see `/authoring-skills` for skill authoring).

## Directory Structure

```
my-marketplace/
├── .claude-plugin/
│   └── marketplace.json     # The catalog (required)
└── plugins/
    └── my-plugin/
        ├── .claude-plugin/
        │   └── plugin.json  # Plugin manifest
        └── skills/
            └── my-skill/
                └── SKILL.md
```

Plugins cannot reference files outside their own directory (`../` paths break after installation because plugins are copied to `~/.claude/plugins/cache`). Use symlinks to share files across plugins.

## marketplace.json Schema

```json
{
  "$schema": "...",
  "name": "acme-tools",
  "description": "Team plugins for Acme Corp",
  "owner": {
    "name": "DevTools Team",
    "email": "devtools@example.com"
  },
  "metadata": {
    "pluginRoot": "./plugins"
  },
  "plugins": [...]
}
```

### Required fields

| Field | Type | Notes |
|---|---|---|
| `name` | string | Kebab-case, no spaces. Public-facing: users see `@your-name` when installing. **Reserved names are blocked** (see below). |
| `owner.name` | string | Maintainer or team name |
| `plugins` | array | List of plugin entries |

**Reserved names** (Anthropic use only): `claude-code-marketplace`, `anthropic-marketplace`, `agent-skills`, `knowledge-work-plugins`, `life-sciences`, and names that impersonate official marketplaces.

### Optional fields

| Field | Description |
|---|---|
| `description` | Brief marketplace description |
| `version` | Manifest version |
| `owner.email` | Maintainer contact |
| `metadata.pluginRoot` | Base dir prepended to relative `source` paths: write `"formatter"` instead of `"./plugins/formatter"` |
| `allowCrossMarketplaceDependenciesOn` | Array of other marketplaces that plugins here may depend on |

## Plugin Entries

Each entry in `plugins` needs at minimum `name` and `source`. All `plugin.json` fields are also valid here.

### Required

| Field | Type | Notes |
|---|---|---|
| `name` | string | Kebab-case. Public-facing identifier. |
| `source` | string \| object | Where to fetch the plugin (see sources below) |

### Optional metadata

| Field | Notes |
|---|---|
| `displayName` | Human-readable, may have spaces. Requires Claude Code v2.1.143+. |
| `description` | Brief description |
| `version` | Pins the plugin. If set, users only get updates when this changes. Omit to use git SHA. |
| `author` | `{ name, email? }` |
| `homepage` | Documentation URL |
| `repository` | Source code URL |
| `license` | SPDX identifier (e.g. `MIT`) |
| `keywords` / `tags` | Discovery and search |
| `category` | Organizational grouping |
| `strict` | See strict mode below |

### Component configuration fields

| Field | Type | Notes |
|---|---|---|
| `skills` | string \| array | Paths to skill dirs containing `<name>/SKILL.md` |
| `commands` | string \| array | Paths to flat `.md` skill files or dirs |
| `agents` | string \| array | Paths to agent files |
| `hooks` | string \| object | Hooks config or path to hooks file |
| `mcpServers` | string \| object | MCP server configs or path to config file |
| `lspServers` | string \| object | LSP server configs |

## Plugin Sources

### Relative path (same repo)
```json
{ "name": "my-plugin", "source": "./plugins/my-plugin" }
```
- Must start with `./`. Resolves from marketplace root (not `.claude-plugin/`)
- **Only works for git-hosted marketplaces**: fails with URL-based distribution

### GitHub
```json
{
  "source": {
    "source": "github",
    "repo": "owner/plugin-repo",
    "ref": "v2.0.0",
    "sha": "a1b2c3d4..."
  }
}
```
`ref` = branch or tag. `sha` = full 40-char commit SHA.

### Git URL (GitLab, Bitbucket, self-hosted)
```json
{
  "source": {
    "source": "url",
    "url": "https://gitlab.com/team/plugin.git",
    "ref": "main",
    "sha": "a1b2c3d4..."
  }
}
```

### Git subdirectory (monorepo)
```json
{
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/acme/monorepo.git",
    "path": "tools/claude-plugin",
    "ref": "v2.0.0"
  }
}
```
Uses sparse clone: only fetches the subdirectory.

### npm
```json
{
  "source": {
    "source": "npm",
    "package": "@acme/claude-plugin",
    "version": "^2.0.0",
    "registry": "https://npm.example.com"
  }
}
```

## Strict Mode

| Value | Behavior |
|---|---|
| `true` (default) | `plugin.json` is the authority. Marketplace entry supplements it; both are merged. |
| `false` | Marketplace entry is the entire definition. Plugin must NOT have a `plugin.json` that declares components. |

Use `strict: false` when the marketplace operator wants full control over which plugin files are exposed, regardless of what the plugin repo defines.

## Version Resolution

Claude Code resolves version from the first set:
1. `version` in `plugin.json`
2. `version` in marketplace entry
3. Git commit SHA

**Pitfall:** Setting `version` in both `plugin.json` and `marketplace.json`: `plugin.json` always wins silently. A stale `plugin.json` version can mask marketplace version updates.

**Simple rule:** For active internal plugins, omit `version` and use the commit SHA automatically. For stable external releases, bump `version` in `plugin.json` on every release.

## Hosting & Distribution

### GitHub (recommended)
```sh
# Users add with:
/plugin marketplace add owner/repo
# Or pin to branch/tag:
/plugin marketplace add owner/repo@v2.0
```

### Other git hosts
```sh
/plugin marketplace add https://gitlab.example.com/team/plugins.git
```

### Private repos
Manual installs use your existing git credential helpers (`gh auth login`, macOS Keychain, SSH agent).

Background auto-updates require an env var (interactive prompts would block startup):

| Provider | Env var |
|---|---|
| GitHub | `GITHUB_TOKEN` or `GH_TOKEN` |
| GitLab | `GITLAB_TOKEN` or `GL_TOKEN` |
| Bitbucket | `BITBUCKET_TOKEN` |

### Require for your team (settings.json)
```json
{
  "extraKnownMarketplaces": {
    "company-tools": {
      "source": { "source": "github", "repo": "your-org/claude-plugins" }
    }
  },
  "enabledPlugins": {
    "code-formatter@company-tools": true
  }
}
```

### Container pre-population
```bash
# At image build time:
CLAUDE_CODE_PLUGIN_CACHE_DIR=/opt/claude-seed \
  claude plugin marketplace add your-org/plugins
CLAUDE_CODE_PLUGIN_CACHE_DIR=/opt/claude-seed \
  claude plugin install my-tool@your-plugins

# At runtime, set:
CLAUDE_CODE_PLUGIN_SEED_DIR=/opt/claude-seed
```
Seed directories are read-only; auto-updates are disabled for them.

## Release Channels

Two marketplaces pointing to different `ref`s of the same repo:

```json
// stable-marketplace.json
{ "name": "stable-tools", "plugins": [{ "name": "formatter",
  "source": { "source": "github", "repo": "acme/formatter", "ref": "stable" }
}]}

// latest-marketplace.json  
{ "name": "latest-tools", "plugins": [{ "name": "formatter",
  "source": { "source": "github", "repo": "acme/formatter", "ref": "latest" }
}]}
```

Each channel must resolve to a different version: if both refs hit the same version string, Claude Code treats them as identical and skips the update.

## Enterprise: strictKnownMarketplaces

Set in managed settings. Controls what users can add (does not register marketplaces automatically: pair with `extraKnownMarketplaces` for that).

```json
// Lock down completely:
{ "strictKnownMarketplaces": [] }

// Allowlist specific repos:
{ "strictKnownMarketplaces": [
  { "source": "github", "repo": "acme-corp/approved-plugins" }
]}

// Allow all from an internal git host (recommended for GHES/self-hosted GitLab):
{ "strictKnownMarketplaces": [
  { "source": "hostPattern", "hostPattern": "^github\\.example\\.com$" }
]}

// Allow any local filesystem path:
{ "strictKnownMarketplaces": [
  { "source": "pathPattern", "pathPattern": "^/opt/approved/" }
]}
```

Restrictions are enforced at add, install, update, and auto-update time. URL matching is exact (`.git` suffix, trailing slash, and `ssh://` vs `https://` are treated differently: use `hostPattern` when multiple URL forms are possible).

## CLI Commands

```bash
# Add
claude plugin marketplace add acme-corp/plugins
claude plugin marketplace add acme-corp/plugins@v2.0          # pin to tag
claude plugin marketplace add ./my-local-marketplace           # local test
claude plugin marketplace add acme-corp/plugins --scope project  # share via .claude/settings.json
claude plugin marketplace add acme/monorepo --sparse .claude-plugin plugins  # monorepo

# List / Remove / Update
claude plugin marketplace list [--json]
claude plugin marketplace remove <name>   # also uninstalls plugins from it
claude plugin marketplace update [name]   # omit name to update all
```

## Validation & Testing

```bash
# Validate JSON/YAML syntax and schema:
claude plugin validate .
# or inside Claude Code:
/plugin validate .

# Local test cycle:
/plugin marketplace add ./my-marketplace
/plugin install my-plugin@my-marketplace
/my-marketplace:my-plugin-skill
```

## Troubleshooting

| Symptom | Fix |
|---|---|
| `File not found: .claude-plugin/marketplace.json` | Create the file at that exact path |
| `Duplicate plugin name "x"` | Each plugin needs a unique `name` |
| `Path contains ".."` | Use paths relative to marketplace root without `..` |
| `YAML frontmatter failed to parse` | Fix YAML syntax in the skill/agent/command file |
| Relative paths fail with URL-based marketplace | Switch to `github`/`npm`/`url` sources, or host in a git repo |
| Files not found after install | Plugin is in cache: paths outside plugin dir don't exist; use symlinks |
| Git clone/pull times out | `export CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=300000` |
| Offline: update wipes cache | `export CLAUDE_CODE_PLUGIN_KEEP_MARKETPLACE_ON_FAILURE=1` |
| Private repo auth fails for auto-update | Set `GITHUB_TOKEN` / `GITLAB_TOKEN` / `BITBUCKET_TOKEN` in shell env |

## Official Documentation

- https://code.claude.com/docs/en/plugin-marketplaces.md: Full marketplace reference
- https://code.claude.com/docs/en/plugins: Creating plugins
- https://code.claude.com/docs/en/discover-plugins: Installing from existing marketplaces
- https://code.claude.com/docs/en/plugins-reference: Complete technical specs and schemas
- https://code.claude.com/docs/en/settings#plugin-settings: Plugin settings reference
