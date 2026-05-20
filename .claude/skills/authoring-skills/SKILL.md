---
name: authoring-skills
description: Guide for writing high-quality Claude Code skills (SKILL.md files). Use when creating, improving, or reviewing a skill, slash command, or SKILL.md. Covers structure, frontmatter fields, best practices, anti-patterns, and the authoring workflow.
user-invocable: true
---

## What Is a Skill?

A skill is a directory containing `SKILL.md` at `.claude/skills/<name>/` (project) or `~/.claude/skills/<name>/` (personal). The directory name becomes the `/name` command. Full skill body only loads on invocation: minimal token cost until used.

## Directory Structure

```
my-skill/
├── SKILL.md          # Required. Keep under 500 lines.
├── reference.md      # Load-on-demand detail
└── scripts/
    └── helper.py     # Executed, not loaded into context
```

## SKILL.md Format

```yaml
---
name: my-skill
description: What this does and when to use it. Include natural trigger phrases users would say.
disable-model-invocation: true   # for side-effect workflows
allowed-tools: Bash(git add *) Bash(git commit *)
---

## Context
!`git diff HEAD`   # runs BEFORE Claude sees anything; output replaces the line

## Instructions
...
```

## Frontmatter Reference

| Field | Purpose |
|---|---|
| `name` | Lowercase, hyphens only, max 64 chars. Defaults to directory name. |
| `description` | **Most critical field.** Claude uses this for auto-invocation. Max 1,024 chars. |
| `when_to_use` | Extra trigger context appended to `description`. Combined cap: 1,536 chars. |
| `argument-hint` | Shown in autocomplete: `[issue-number]` or `[filename] [format]` |
| `arguments` | Named args list: `[component, from, to]` → use `$component`, `$from`, `$to` |
| `disable-model-invocation: true` | Only user can invoke. Use for deploy, commit, send-message workflows. |
| `user-invocable: false` | Only Claude can invoke. Use for background reference knowledge. |
| `allowed-tools` | Pre-approve tools to skip permission prompts while skill is active. |
| `context: fork` | Run in isolated subagent with no conversation history. |
| `agent` | Subagent type with `context: fork`: `Explore`, `Plan`, `general-purpose`, or custom. |
| `paths` | Glob patterns: only activate when working with matching files. |
| `model` | Override model for this skill's turn only. |
| `effort` | Override effort: `low`, `medium`, `high`, `xhigh`, `max`. |

## String Substitutions

| Variable | Description |
|---|---|
| `$ARGUMENTS` | All arguments as typed |
| `$0`, `$1`, `$2` | Positional arguments |
| `$name` | Named argument (declared in `arguments` field) |
| `${CLAUDE_SESSION_ID}` | Current session ID |
| `${CLAUDE_EFFORT}` | Current effort level |
| `${CLAUDE_SKILL_DIR}` | Absolute path to skill's directory |

## Top 10 Best Practices

**1. Write descriptions for Claude, not humans.**
Include concrete trigger phrases. Bad: `"Helps with documents"`. Good: `"Extract text from PDF files. Use when the user mentions PDFs, forms, or document extraction."`.

**2. Keep SKILL.md concise.**
Every line is recurring token cost: content stays in context the entire session. Push reference detail to `reference.md` and code to `scripts/`.

**3. Use dynamic context injection for live data.**
`` !`git diff HEAD` ``, `` !`gh pr view` ``: commands run before Claude sees anything. Grounds responses in actual state.

Multi-line form:
````markdown
```!
git status --short
node --version
```
````

**4. Match instruction freedom to task fragility.**
- Open-ended tasks → general guidance
- Fragile sequences (deploy, migrate) → exact numbered steps with validators

**5. Gate side-effect workflows.**
Set `disable-model-invocation: true` for anything that deploys, commits, or sends messages. Never let Claude decide to trigger these.

**6. Prefer named arguments over positional.**
`arguments: [component, from, to]` with `$component`/`$from`/`$to` is clearer than `$0`/`$1`/`$2`.

**7. Provide checklists for multi-step workflows.**
Claude copies and tracks progress; humans can audit at a glance.

**8. Build iteratively.**
1. Complete a task with normal prompting; note context you kept repeating
2. Crystallize that pattern into a skill
3. Test with a fresh Claude instance (no session history)
4. Refine based on observed behavior

**9. Use scripts over generated code.**
Pre-baked scripts are more reliable, save tokens, and ensure consistency.

**10. One level of references only.**
Nested links (`SKILL.md → ref.md → details.md`) cause Claude to use partial reads and miss content.

## Anti-Patterns

- Offering multiple library options instead of one with a clear fallback
- Time-sensitive or version-pinned content in the main body
- Magic numbers with no justification
- `context: fork` on guideline skills (subagent returns nothing: needs a concrete task)
- Deeply nested reference chains
- Descriptions written as marketing copy rather than trigger-phrase anchors

## Invocation Control

| Config | You invoke | Claude invokes |
|---|---|---|
| (default) | Yes | Yes |
| `disable-model-invocation: true` | Yes | No |
| `user-invocable: false` | No | Yes |

## Dynamic Context Example

```yaml
---
name: pr-summary
description: Summarize a pull request. Use when asked to review or summarize a PR.
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context
- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`
- Files changed: !`gh pr diff --name-only`

## Task
Summarize this PR: what changed, why, and any risks.
```

## Named Arguments Example

```yaml
---
name: migrate-component
description: Migrate a UI component between frameworks.
arguments: [component, from, to]
---

Migrate the $component component from $from to $to.
Preserve all existing behavior and tests.
```

## Troubleshooting

**Skill not triggering:** Check description has natural keywords. Try `/skill-name` directly. Run `/doctor` to check budget overflow.

**Skill triggers too often:** Make description more specific. Add `disable-model-invocation: true`.

**Descriptions cut short:** Too many skills competing for the 1% context budget. Set low-priority skills to `"name-only"` in `skillOverrides`, or raise `skillListingBudgetFraction` in settings.

**Skill stops working mid-session:** Content is likely still in context but the model chose other tools. Strengthen instructions, or use hooks to enforce behavior deterministically.

## Official Documentation

- https://code.claude.com/docs/en/skills: Skills overview and format reference
- https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices: Authoring best practices

## Reference Repositories

- https://github.com/anthropics/skills: Official Anthropic examples
- https://github.com/alirezarezvani/claude-skills: 313+ production-ready skills
- https://github.com/ComposioHQ/awesome-claude-skills: 1,000+ examples
- https://github.com/travisvn/awesome-claude-skills: Curated resource list
