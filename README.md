# Automate.ax agent plugins

The official agent entrypoint for [Automate.ax](https://automate.ax). It teaches an agent to install and drive the CLI, write and validate automation code, complete browser-based authorization, deploy projects, and maintain or upgrade existing projects.

## Install the skill

Use this with Codex, Claude Code, or another agent that supports Agent Skills:

```sh
npx skills add SentsCo/automate-ax-agent-plugins --skill automate-ax --yes
```

Then ask the agent to use the `automate-ax` skill and describe what you want to automate.

## Install the Claude Code plugin

```sh
claude plugin marketplace add SentsCo/automate-ax-agent-plugins
claude plugin install automate-ax@automate-ax
```

## What is included

- The cross-agent `automate-ax` skill
- A Codex plugin manifest
- A Claude Code plugin manifest and marketplace
- Runtime semantics and plan-limit references for automation authors

This is a public distribution repository published from the Automate.ax product repository. Future skills, agent helpers, and MCP configuration can be added to the same plugin bundle.
