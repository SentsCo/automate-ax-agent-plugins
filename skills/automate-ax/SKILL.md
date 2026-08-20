---
name: automate-ax
description: Build, adopt, deploy, operate, debug, and upgrade Automate.ax automation-as-code projects. Use when a user wants to start an Automate.ax project, use an automation shared through a repository, turn a business process into TypeScript automations, change an existing automation, connect integration accounts, deploy, manage projects or organizations, handle billing, or upgrade the automate.ax SDK and CLI.
---

# Automate.ax

Own the workflow end to end. Run the CLI, write and validate the automation code, complete non-secret prompts, and continue through any requested deployment or maintenance work instead of handing routine steps back to the user.

## Use authoritative sources

- Use the public documentation index at `https://docs.automate.ax/llms.txt` to discover current pages, then open only the documentation relevant to the task.
- For exact authoring APIs, inspect the project's installed `automate.ax` README, exports, TypeScript declarations, changelog, and nearby examples. The installed version is authoritative.
- For current CLI options, account state, plan usage, and limits, inspect CLI help and live JSON output. Do not rely on remembered commands or static values.

## Operate the project

- Inspect the directory before changing it. Work in an existing Automate.ax project when present; otherwise create a project directory before installing packages or writing files.
- Preserve the project's package manager. Without a local installation, run the latest CLI package for setup or diagnosis; after initialization, use the project-installed CLI so the CLI and SDK stay aligned.
- Check authentication before setup. Run `init` only when no `automate.config.ts` exists, and drive its project selection, scaffolding, and installation flow.
- Run interactive commands in a persistent terminal. Let browser authorization open, keep the command alive while it polls, and resume after the user completes the browser step.
- Never ask the user to paste passwords, API keys, or provider secrets into chat. Leave masked credential prompts active for the user to complete in the terminal.

## Adopt a shared automation

When the user provides a repository containing an Automate.ax automation, treat the existing automation and the user's request as the complete brief. Do not ask what they want to automate when the repository already answers that question.

- Clone or open the repository, read its instructions, inspect the automation's behavior and dependencies, and preserve its committed automation files.
- Install dependencies with the repository's package manager. When `automate.config.ts` is absent, authenticate the user and run the installed Automate.ax `init` flow in the repository. Remove only the generic example automation added by initialization; do not replace the shared automation.
- Keep the generated `automate.config.ts`, `.automate/`, credentials, account bindings, deployment URLs, and other user-specific state out of commits.
- Continue through validation, requested deployment, provider authorization, and a practical smoke test. Pause only for user authorization, secrets that must be entered privately, a material missing choice, or an external action the request did not authorize.

## Build automations

Implement the business process directly as TypeScript in `*.automation.ts` files. Preserve these runtime invariants:

- The automation body composes durable work synchronously; signals are symbolic values, not promises or ordinary control-flow values.
- External effects belong in actions, while transforms and composition callbacks remain pure and deterministic.
- Durable declaration order stays stable across replays.
- Orchestrator functions run directly at runtime; do not construct a graph or JSON intermediate.

Read the relevant action, trigger, signal, and integration documentation before choosing APIs. Preserve project conventions, infer safe defaults, and ask only when a missing business decision would materially change behavior or authorize an external action. Run the project's formatter, typecheck, and relevant tests after editing.

## Run one-off work

When the user asks to try, test, or perform something once rather than build a lasting feature, use an ephemeral automation instead of turning it into permanent project behavior.

- Use the current project only when the task depends on its code, configuration, or account bindings. Otherwise, create a separate temporary directory and Automate.ax project so the work does not alter an unrelated repository or deployment.
- Build the smallest useful automation around `onHttpRequest`. Prefer a JSON request body for structured or sensitive input, and never put secrets in query parameters.
- Use `waitForResponse: true` with `respondToHttpRequest` only when the result should be returned to the caller and the work is expected to finish within the HTTP response window. Otherwise, accept the request asynchronously and inspect the completed run.
- When the request authorizes execution, deploy the automation, read its endpoint from `.automate/deployment.md`, invoke it with `curl`, and verify the outcome. Do not stop after writing code or ask the user to run routine commands.
- Keep ephemeral source uncommitted unless the user asks to preserve it. Clean up local temporary files after verification, do not leave a temporary endpoint or project active unintentionally, and get authorization before deleting deployed resources or changing a pre-existing deployment for cleanup.

## Deploy and administer

- Inspect live organization state before project creation, invitations, billing, or other plan-sensitive work.
- Deploy when the user wants the automation live, and drive account selection and authorization while keeping secrets out of chat.
- After deployment, inspect `.automate/deployment.md` and report the deployed automations, trigger details, status, and any remaining user action.
- Inspect the relevant CLI help before administrative work. Require explicit intent for destructive resource deletion, invitations, billing changes, or production deployment when the request did not already authorize them.

## Upgrade

Preserve the existing package manager and lockfile, update `automate.ax`, then use the installed package's current declarations and changelog to update code and configuration. Run the project checks. Redeploy only when the user asked to update the live project.

## Finish

Report what changed, which checks passed, whether authentication and deployment completed, and any action still needed from the user.
