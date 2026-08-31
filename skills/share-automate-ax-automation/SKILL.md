---
name: share-automate-ax-automation
description: Package an Automate.ax automation as a reusable repository. Use when sharing, handing off, publishing, or extracting an automation for someone to initialize with their own project and integration accounts.
---

# Share an automation

Create a small repository that another user can initialize without inheriting the source project's identity, accounts, or deployment state.

## Inspect the source

Read the source instructions, automation, imports, dependencies, and relevant public Automate.ax docs. Preserve behavior and remove unrelated project material. Ask only if the target automation or repository visibility is unclear.

## Package the repository

Use a short name beginning with `automate-ax-`. Include only:

- `automations/*.automation.ts` and required source files
- a concise `README.md` covering behavior, inputs, outputs, integrations, setup, deployment, and realistic security concerns
- an `AGENTS.md` that identifies the shared automation, directs agents to `https://docs.automate.ax/llms.txt`, and tells them to use the primary Automate.ax skill
- minimal Bun and TypeScript metadata for installation and validation
- a `.gitignore` for generated and sensitive state

Do not copy `automate.config.ts`, `.automate/`, environment files, credentials, account bindings, deployment URLs, unrelated automations, or personal formatting and linting setup. The recipient's agent must authenticate the user and run Automate.ax `init` to create project-specific configuration.

The repository's `AGENTS.md` must treat the committed automation as the brief. It must tell the recipient's agent to preserve that source, remove only the generic example created by `init`, validate the project, and continue through deployment and testing when authorized.

## Validate and publish

Install with Bun and run the packaged repository's validation command from a clean state. Inspect the exact files before any Git operation.

Publishing is an external action. Create a GitHub repository, commit, push, or make it public only when explicitly requested. Never infer public visibility. When authorized, stage only intended files, use the `automate-ax-` name, and verify the remote contents and visibility after pushing.

Finish with the repository URL or local path, included automation, validation results, visibility, and any action the recipient still needs to take.
