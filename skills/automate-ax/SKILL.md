---
name: automate-ax
description: Build, adopt, deploy, operate, debug, and upgrade Automate.ax automation-as-code projects. Use when a user wants to start an Automate.ax project, use an automation shared through a repository, turn a business process into TypeScript automations, change an existing automation, connect integration accounts, deploy, manage projects or organizations, handle billing, or upgrade the automate.ax SDK and command-line tool.
---

# Automate.ax

Own the workflow end to end. Run the command-line tool, write and validate the automation code, complete non-secret prompts, and continue through any requested deployment or maintenance work instead of handing routine steps back to the user.

## Use authoritative sources

- Use the public documentation index at `https://docs.automate.ax/llms.txt` to discover current pages, then open only the documentation relevant to the task.
- For exact authoring APIs, inspect the project's installed `automate.ax` README, exports, TypeScript declarations, changelog, and nearby examples. The installed version is authoritative.
- For current command-line options, account state, plan usage, and limits, inspect command-line help and live JSON output. Don't rely on remembered commands or static values.

## Operate the project

- Inspect the directory before changing it. Work in an existing Automate.ax project when present. Otherwise, create a project directory before installing packages or writing files.
- Preserve the project's package manager. Without a local installation, run the command-line package without a version pin for setup or diagnosis. After initialization, use the project-installed command-line tool so it stays aligned with the SDK.
- Check authentication before setup. Run `init` only when no `automate.config.ts` exists, and drive its project selection, scaffolding, and installation flow.
- Run interactive commands in a persistent terminal. Let browser authorization open and keep the command alive while it polls. In a non-interactive terminal, give the user the focused URL from `DEPLOYMENT_AUTHORIZATION_REQUIRED`, then run `automate deployment authorize <deployment-id> --no-open` to wait for that deployment.
- Never ask the user to paste passwords, API keys, or provider secrets into chat. Leave masked credential prompts active for the user to complete in the terminal.

## Adopt a shared automation

When the user provides a repository containing an Automate.ax automation, treat the existing automation and the user's request as the complete brief. Don't ask what they want to automate when the repository already answers that question.

- Clone or open the repository, read its instructions, inspect the automation's behavior and dependencies, and preserve its committed automation files.
- Install dependencies with the repository's package manager. When `automate.config.ts` is absent, authenticate the user and run the installed Automate.ax `init` flow in the repository. Remove only the generic example automation added by initialization. Don't replace the shared automation.
- Keep the generated `automate.config.ts`, `.automate/`, credentials, account bindings, deployment URLs, and other user-specific state out of commits.
- Continue through validation, requested deployment, provider authorization, and a practical smoke test. Pause only for user authorization, secrets the user must enter privately, a material missing choice, or an external action the request didn't authorize.

## Build automations

Implement the business process directly as TypeScript in `*.automation.ts` files. Preserve these runtime invariants:

- The automation body composes durable work synchronously. Signals are symbolic values, not promises or ordinary control-flow values.
- External effects belong in actions, while transforms and composition callbacks remain pure and deterministic.
- Durable declaration order stays stable across replays.
- Orchestrator functions run directly at runtime. Don't construct a graph or JSON intermediate.

Read the relevant action, trigger, signal, and integration documentation before choosing APIs. Preserve project conventions, infer safe defaults, and ask only when a missing business decision would materially change behavior or authorize an external action. Run the project's formatter, typecheck, and relevant tests after editing.

## Run one-off work

When the user asks to try, test, or perform something once rather than build a lasting feature, use an ephemeral automation instead of turning it into permanent project behavior.

- Use the current project only when the task depends on its code, configuration, or account bindings. Otherwise, create a separate temporary directory, create an Automate.ax project there, and keep the work from altering an unrelated repository or deployment.
- Build the smallest useful automation around `onHttpRequest`. Prefer a JSON request body for structured or sensitive input, and never put secrets in query parameters.
- Use `waitForResponse: true` with `respondToHttpRequest` only when the caller needs the result and the work can finish within the HTTP response window.
- For asynchronous work, start `automate data follow` before invoking the endpoint and wait for its ready message. Capture the `eventId` from the `202` receipt, then use the polling and inspection queries in [Query execution data](https://docs.automate.ax/guides/query-execution-data.md). Use `automate search` for ranked discovery across synchronized failures, actions, outputs, logs, traces, payloads, and identifiers. Use SQL for exact completion checks and joins. A run starts at a root context and can include descendant contexts created by fan-out or continuations. Inspect the complete context family and its actions, not only the newest row.
- When the request authorizes execution, deploy the automation, read its endpoint from `.automate/deployment.md`, invoke it with `curl`, and verify the outcome. Don't stop after writing code or ask the user to run routine commands.
- Keep ephemeral source uncommitted unless the user asks to preserve it. Clean up local temporary files after verification, don't leave a temporary endpoint or project active unintentionally, and get authorization before deleting deployed resources or changing a pre-existing deployment for cleanup.

## Deploy and administer

- Inspect live organization state before project creation, invitations, billing, or other plan-sensitive work.
- Deploy when the user wants the automation live, and drive account selection and authorization while keeping secrets out of chat.
- After deployment, inspect `.automate/deployment.md` and report the deployed automations, trigger details, status, and any remaining user action.
- Inspect the relevant command-line help before administrative work. Require explicit intent for destructive resource deletion, invitations, billing changes, or production deployment when the request didn't already authorize them.

## Remove a project

When the user asks to remove a project and its work, complete cleanup in this order:

1. While the project is still active, add and run a one-off cleanup automation through its existing account bindings. Remove the external resources the project created and verify the results. If an available integration can't remove a resource, clean up everything it can and record the exact resource or user action that remains.
2. Inspect projects, active automations, account bindings, and connected accounts with command-line JSON output before deleting Automate.ax resources. Integration accounts belong to the organization and may serve several projects. Even when the command-line output shows that only the target project uses an account, ask whether the user wants it disconnected or revoked.
3. After the cleanup automation finishes, delete the Automate.ax project and any temporary local files. Report everything you removed and any external cleanup the user still needs to complete.

## Upgrade

Preserve the existing package manager and lockfile, update `automate.ax`, then use the installed package's current declarations and changelog to update code and configuration. Run the project checks. Redeploy only when the user asked to update the live project.

## Finish

Report what changed, which checks passed, whether authentication and deployment completed, and any action still needed from the user.
