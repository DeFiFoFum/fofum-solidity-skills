# Fofum Skills - Standards & Structure Guide

> How we build Claude Code skills. Use this as a template for new skill marketplaces.

---

## Executive Summary

**Philosophy:**
- 100% Markdown: no executable code, zero supply chain risk
- One marketplace repo → multiple focused plugins
- Each plugin does ONE thing well
- Real examples > abstract theory

**Key Files:**
- `marketplace.json`: Plugin registry (root level)
- `SKILL.md`: Main skill instructions (per plugin)
- `resources/`: Reference materials Claude reads during tasks

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
        │   └── {skill-name}/
        │       └── SKILL.md             # Main skill instructions
        │
        ├── commands/                    # Slash commands (optional)
        │   └── {command}.md
        │
        ├── agents/                      # Subagent definitions (optional)
        │   ├── lead-agent.md
        │   └── specialist-agent.md
        │
        └── resources/                   # Reference materials
            ├── checklist.md
            ├── templates/
            └── examples/
```

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
Links to files in resources/ folder.

## Ready to Start
What Claude should ask for before beginning.
```

---

## Design Principles

### 1. Markdown Only
- No JavaScript, Python, or executable code
- No npm packages or dependencies
- No hooks that run code
- Safe to install without code review

### 2. Single Responsibility
- Each plugin does ONE thing well
- Split into multiple plugins vs one mega-plugin
- Users install only what they need

### 3. Progressive Disclosure
- SKILL.md = high-level methodology
- resources/ = detailed reference (loaded on demand)
- submodules/ = external databases (optional)

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

For complex tasks, define specialized agents in `agents/`:

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
