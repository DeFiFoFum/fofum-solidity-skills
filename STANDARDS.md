# Fofum Skills - Standards & Structure Guide

> How we build Claude Code skills. Use this as a template for new skill marketplaces.

---

## Executive Summary

**Philosophy:**
- Markdown first: prefer zero executable code, zero supply chain risk
- Every skill directory is self-contained, so it installs into any harness
- One marketplace repo → multiple focused plugins
- Each plugin does ONE thing well
- Real examples > abstract theory

**Key Files:**
- `marketplace.json`: Plugin registry (root level)
- `SKILL.md`: Main skill instructions (per plugin)
- `resources/`: Reference materials Claude reads during tasks, inside the skill directory

**Non-negotiable rule: every skill directory is self-contained.** Everything a
skill reads or runs lives under `skills/{skill-name}/`. Nothing above it. See
[Self-Contained Skills](#self-contained-skills) for why.

---

## Repository Structure

```
{org}-{domain}-skills/                   # Marketplace repo
├── .claude-plugin/
│   └── marketplace.json                 # Plugin registry
├── README.md                            # Marketplace docs
├── STANDARDS.md                         # This file
├── LICENSE
│
└── plugins/
    └── {plugin-name}/                   # Individual plugin
        ├── .claude-plugin/
        │   └── plugin.json              # Plugin manifest
        ├── README.md                    # Plugin docs
        ├── QUICKSTART.md                # Quick usage guide
        │
        ├── skills/
        │   └── {skill-name}/            # Self-contained: never reach above this
        │       ├── SKILL.md             # Main skill instructions
        │       ├── resources/           # Reference material read on demand
        │       ├── references/          # Longer-form docs
        │       ├── assets/              # Example files to copy or adapt
        │       ├── scripts/             # Shell helpers
        │       └── tools/               # Executable tools, one dir per tool
        │           └── {tool-name}/
        │
        ├── commands/                    # Slash commands (Claude Code only)
        │   └── {command}.md
        │
        └── agents/                      # Subagent definitions (Claude Code only)
            ├── lead-agent.md
            └── specialist-agent.md
```

---

## Self-Contained Skills

A skill directory must carry everything it needs. No `../`, no plugin-root
`resources/`, no plugin-root `tools/`.

**Why.** Claude Code installs the whole plugin tree, so a skill can cheat and
reach up to plugin root. Nothing else does. The [`skills` CLI](https://github.com/vercel-labs/skills)
(`npx skills`), which installs into Cursor, Codex, Cline, Copilot, Windsurf, and
70+ other agents, copies **only the skill directory**. Anything above it is
silently dropped, and the skill ships broken: SKILL.md cites files that are not
there.

**Rules:**

1. Resources, references, assets, scripts, and tools go inside the skill directory.
2. SKILL.md references its own files by paths relative to itself. Define an anchor
   at the top rather than guessing at an install location:
   ```markdown
   ## Paths

   Commands below use `$SKILL_DIR`: the absolute path of the directory containing
   this SKILL.md.
   ```
   Do not use `${CLAUDE_PLUGIN_ROOT}` or `${CLAUDE_SKILL_DIR}` in a SKILL.md. Those
   are Claude Code plugin variables and are undefined everywhere else. They are
   fine in `commands/` and `agents/`, which are Claude Code only.
3. Executable tools resolve sibling paths from their own location
   (`import.meta.dir`, `$(dirname "$0")`), never from the caller's cwd.
4. If two skills genuinely need the same tool, one skill owns it and the other
   declares the dependency: name the required sibling skill in SKILL.md, give the
   install command, and probe candidate paths at runtime instead of assuming one.
   Skills install as siblings in both layouts, so `$SKILL_DIR/../{other-skill}/`
   resolves in each.
5. Commands and agents do not transfer outside Claude Code. A skill must be
   useful without them, and should say so if it degrades.

**Verify before publishing:**

```bash
npx skills add /path/to/this/repo -a claude-code -y   # into a scratch directory
```

Then check that every path a SKILL.md mentions exists in the installed copy.

---

## File Specifications

### marketplace.json

```json
{
  "$schema": "https://anthropic.com/claude-code/marketplace.schema.json",
  "name": "fofum-{domain}-skills",
  "description": "One-line description of marketplace",
  "owner": {
    "name": "YourName",
    "email": "you@example.com"
  },
  "plugins": [
    {
      "name": "plugin-name",
      "description": "What this plugin does",
      "version": "0.1.0",
      "author": { "name": "YourName" },
      "source": "./plugins/plugin-name",
      "category": "security|development|productivity|etc",
      "homepage": "https://github.com/org/repo/tree/main/plugins/plugin-name"
    }
  ]
}
```

### plugin.json

```json
{
  "$schema": "https://anthropic.com/claude-code/plugin.schema.json",
  "name": "plugin-name",
  "description": "What this plugin does",
  "version": "0.1.0",
  "author": { "name": "YourName" }
}
```

### SKILL.md (Most Important!)

```markdown
---
name: skill-name
description: |
  When to activate this skill. Be specific about triggers.
---

# Skill Name

## Purpose
What this skill helps Claude do.

## When to Use
- Trigger phrase 1
- Trigger phrase 2
- Trigger phrase 3

## When NOT to Use
- Anti-pattern 1
- Anti-pattern 2

## Methodology
Step-by-step process Claude should follow.

### Phase 1: Name (XX%)
1. Step one
2. Step two

### Phase 2: Name (XX%)
...

## Quick Reference
Common patterns, code snippets, examples.

## Resources
Links to files in this skill's resources/ folder, by path relative to SKILL.md.

## Ready to Start
What Claude should ask for before beginning.
```

---

## Design Principles

### 1. Markdown First
- Prefer pure Markdown: no dependencies, safe to install without code review
- When a skill genuinely needs executable tools, they live in
  `skills/{skill}/tools/{tool}/` and the plugin README flags the supply chain
- No hooks that run code

### 2. Single Responsibility
- Each plugin does ONE thing well
- Split into multiple plugins vs one mega-plugin
- Users install only what they need

### 3. Progressive Disclosure
- SKILL.md = high-level methodology
- skills/{skill}/resources/ = detailed reference (loaded on demand)
- External repos = large databases, linked by URL rather than bundled

### 4. Real Examples
- Link to actual exploits, not theoretical patterns
- Show before/after code
- Include production incidents

### 5. Structured Output
- Define report templates
- Consistent severity ratings
- Reproducible results

---

## Agents (Multi-Agent Architecture)

For complex tasks, define specialized agents in `agents/` at plugin root. These
are Claude Code only: they do not transfer when a skill is installed with
`npx skills`, so the skill must still work without them.

```markdown
# agents/lead-auditor.md

## Role
Orchestrate the audit process.

## Responsibilities
1. Coordinate specialist agents
2. Synthesize findings
3. Generate final report

## Spawn Sequence
1. Spawn reentrancy-agent
2. Spawn access-control-agent
3. Wait for results
4. Synthesize and report
```

```markdown
# agents/reentrancy-agent.md

## Role
Find reentrancy vulnerabilities.

## Focus Areas
- External calls before state updates
- Cross-function reentrancy
- Read-only reentrancy

## Output Format
Return findings as JSON...
```

---

## Resources Organization

Always inside the skill directory, `skills/{skill-name}/resources/`:

```
resources/
├── checklist.md           # Step-by-step checklist
├── severity.md            # How to rate findings
├── templates/
│   └── report.md          # Output template
├── examples/
│   ├── example-1.md       # Real-world example
│   └── example-2.md
└── protocols/             # Domain-specific guides
    ├── lending.md
    └── amm.md
```

---

## Versioning

- Start at `0.1.0` during development
- Bump to `1.0.0` when stable and tested
- Follow semver: MAJOR.MINOR.PATCH

---

## Testing (Evals)

Create a separate evals repo:

```
{org}-{domain}-evals/
├── benchmarks/
│   └── {test-case}/
│       ├── contracts/        # Test input
│       ├── expected.json     # Known findings
│       └── results.json      # Skill output
├── scripts/
│   └── score.py              # Scoring logic
└── Makefile                  # Easy commands
```

**Metrics:**
- **Recall** = Found known issues (primary)
- **Extra Findings** = Found more (good)
- **False Positives** = Reported non-issues (bad)

---

## Naming Conventions

| Type | Format | Example |
|------|--------|---------|
| Marketplace | `{org}-{domain}-skills` | `fofum-solidity-skills` |
| Plugin | `{function}` | `solidity-audit` |
| Skill | `{org}-{function}` | `fofum-solidity-audit` |
| Command | `{verb}.md` | `audit.md` |
| Agent | `{role}-agent.md` | `reentrancy-agent.md` |

---

## Checklist for New Plugin

- [ ] Create plugin folder in `plugins/`
- [ ] Add `plugin.json` with metadata
- [ ] Write `SKILL.md` with methodology
- [ ] Add to `marketplace.json`
- [ ] Create `README.md` for plugin
- [ ] Add resources as needed
- [ ] Test with real examples
- [ ] (Optional) Create evals benchmark

---

## Example: Minimal Plugin

```
plugins/my-skill/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── skills/
    └── my-skill/
        └── SKILL.md
```

That's it! Start minimal, add resources as needed.

---

## References

- [Trail of Bits Skills](https://github.com/trailofbits/skills): 27 plugins, good examples
- [Anthropic Official Plugins](https://github.com/anthropics/claude-plugins-official): Schema reference
- [Claude Code Plugin Docs](https://docs.anthropic.com/en/docs/claude-code/plugins)
