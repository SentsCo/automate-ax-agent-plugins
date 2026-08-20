---
name: share-automate-ax-automation
description: Package an Automate.ax automation as a lightweight reusable repository. Use when a user wants to share, hand off, publish, or extract an existing automation for someone else to initialize with their own Automate.ax project and integration accounts.
---

# Share an automation

Create a small, self-contained repository that another user can hand to their coding agent and initialize without inheriting the source project's identity, accounts, or deployment state.

## Inspect the source

Read the source project's instructions and the automation, its imports, dependencies, and relevant public Automate.ax documentation. Preserve the automation's behavior while removing unrelated project material. Ask only when the intended automation or repository visibility is genuinely unclear.

## Package the repository

Use a short repository name beginning with `automate-ax-`. Include only what the shared automation needs:

- `automations/*.automation.ts` and any source files they genuinely depend on
- a concise `README.md` explaining behavior, inputs, outputs, required integrations, setup, deployment, and realistic security considerations
- an `AGENTS.md` that identifies the repository as a shared Automate.ax automation and directs the agent to follow `https://docs.automate.ax/guides/agent-setup.md`, the canonical agent entry point
- minimal Bun and TypeScript metadata needed to install and validate the automation
- a `.gitignore` covering generated and sensitive state

Don't copy `automate.config.ts`, `.automate/`, environment files, credentials, account bindings, deployment URLs, unrelated automations, or personal formatting and linting setup. The recipient's agent creates project-specific configuration by authenticating the user and running Automate.ax `init`.

The repository's agent instructions must treat the committed automation as the brief, so the recipient isn't asked what to automate. They should direct the agent to preserve the shared source, remove any generic example created by initialization, validate the project, and continue through deployment and testing when the user's request authorizes those actions.

## Validate and publish

Install from the packaged repository with Bun and run its validation command from a clean state. Inspect the exact files before any Git operation.

Publishing is an external action. Create a GitHub repository, commit, push, or make it public only when the user explicitly requests those actions. Never infer public visibility. When the user authorizes publishing, stage only the intended files, use the `automate-ax-` name, and verify the remote repository contents and visibility after pushing.

Finish with the repository URL or local path, the included automation, validation results, visibility, and any action still required from the recipient.
