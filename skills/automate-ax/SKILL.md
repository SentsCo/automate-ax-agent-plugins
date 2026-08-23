---
name: automate-ax
description: Build and operate Automate.ax automation-as-code projects. Use for creating, adopting, changing, deploying, debugging, upgrading, or administering automations, integrations, projects, organizations, and billing.
---

# Automate.ax

Complete the requested workflow. Run the CLI, edit and validate code, answer non-secret prompts, and continue through authorized deployment or administration. Pause only for private secrets, user authorization, a material choice, or an external action the request did not authorize.

## Use authoritative sources

- Use `https://docs.automate.ax/llms.txt` to find current public docs, then open only the relevant pages.
- For authoring APIs, inspect the installed `automate.ax` README, exports, TypeScript declarations, changelog, and nearby examples. The installed version is authoritative.
- For CLI options, account state, usage, and limits, inspect CLI help and live JSON output. Do not rely on memory or static values.

## Set up or adopt a project

- Inspect the directory first. Use an existing Automate.ax project when present. Otherwise create a project directory before installing packages or writing files.
- Preserve the package manager. Before initialization, run the CLI package without a version pin if no local copy exists. After initialization, use the project-installed CLI so it matches the SDK.
- Check authentication first. Run `init` only without an `automate.config.ts`, and drive its project selection, scaffolding, and installation prompts.
- Run interactive commands in a persistent terminal. Let browser authorization open and keep the command alive while it polls. In a non-interactive terminal, give the user the focused URL from `DEPLOYMENT_AUTHORIZATION_REQUIRED`, then wait with `automate deployment authorize <deployment-id> --no-open`.
- Never ask the user to paste passwords, API keys, or provider secrets into chat. Leave masked terminal prompts for the user.

When adopting a shared repository, treat its automation and the user's request as the full brief. Do not ask what to automate when the repository already says.

- Read the repository instructions, automation behavior, and dependencies. Preserve committed automation files.
- Install with the repository's package manager. If `automate.config.ts` is absent, authenticate and run the installed `init`. Remove only the generic example automation that initialization adds.
- Do not commit generated `automate.config.ts`, `.automate/`, credentials, account bindings, deployment URLs, or other user-specific state.
- Continue through validation, authorized deployment, provider authorization, and a practical smoke test.

## Build automations

Implement the business process in `*.automation.ts` files. Read the relevant action, trigger, signal, and integration docs first. Follow project conventions and infer safe defaults. Ask only when a missing business choice changes behavior or authorizes an external action.

Preserve these runtime rules:

- The automation body composes durable work synchronously. Signals are symbolic values, not promises or ordinary control-flow values.
- Put external effects in actions. Keep transforms and composition callbacks pure and deterministic.
- Keep durable declaration order stable across replays.
- Orchestrator functions run directly. Do not build a graph or JSON intermediate.

## Validate in layers

- Run the project TypeScript typecheck after each coherent edit and before finishing or deploying. Types enforce callable inputs and outputs, signal composition, provider shapes, and constrained values. Treat type errors as automation errors.
- Use the existing typecheck command. If none exists, add a project-local TypeScript checker, a strict configuration covering `automate.config.ts`, automation files, and helpers, and a package-manager script.
- Run the formatter and relevant tests with the typecheck.
- Deployment planning checks durable structure separately. Follow [Deployments and runs](https://docs.automate.ax/concepts/deployments-and-runs.md). A passing typecheck does not replace planning. Successful bundling does not replace type checking.
- Before an authorized deployment, require a successful typecheck and plan. Without deployment authorization, finish with local validation and say planning was not run.

## Prove complex work in slices

Test uncertain stages before composing a complex automation. Good boundaries include provider data retrieval, AI generation, data transforms, and output mapping.

- Test pure deterministic code locally. For actions, runtime behavior, integration accounts, or real provider responses, deploy a small HTTP-triggered automation to a disposable project.
- A deployment publishes every `*.automation.ts` file as one project snapshot. Use the existing project only when the user explicitly authorizes changing its active deployment and every automation in it is ready.
- Keep reusable logic in a normal TypeScript module. Wrap it with the smallest `onHttpRequest` automation. Use representative JSON and, when the work fits the response window, return the relevant output with `waitForResponse: true` and `respondToHttpRequest`.
- Typecheck, deploy, and invoke each authorized slice. Test realistic success and failure inputs that affect composition.
- Assemble proven stages, typecheck the full project, and let deployment planning validate their combined durable structure.

## Test deployed behavior

When the user authorizes deployment and execution, start the automation with a realistic event and verify its observable result. A successful deployment alone is not proof.

- Prefer a companion fixture that creates the real upstream event. For example, send identifiable test emails and verify the target automation applies the expected Gmail labels.
- Otherwise add a temporary `onDashboardRun` form or `onHttpRequest` JSON trigger around the same reusable logic. One automation may have several triggers when a manual fixture belongs beside the real one.
- Test realistic filter, branch, fan-out, batching, and generated-content variations. Inspect the execution and external side effect.
- Use a disposable project for companion fixtures that can trigger the target across projects. Adding a fixture or manual trigger to an existing deployment requires explicit authorization.

## Run one-off work

For a one-time task, use an ephemeral automation instead of permanent project behavior.

- Use the current project only when the task depends on its code, configuration, or account bindings. Otherwise work in a separate temporary directory and Automate.ax project.
- Build the smallest useful `onHttpRequest` automation. Put structured or sensitive input in a JSON body, never secrets in query parameters.
- Use `waitForResponse: true` with `respondToHttpRequest` only when the caller needs the result and work fits the HTTP response window.
- For asynchronous work, start `automate data follow` and wait for its ready message before invoking the endpoint. Capture `eventId` from the `202` receipt. Use [Query execution data](https://docs.automate.ax/guides/query-execution-data.md), `automate search` across failures, actions, outputs, logs, traces, payloads, and identifiers, and SQL for exact completion checks and joins. Inspect the root context, descendants from fan-out or continuations, and their actions.
- When the user authorizes execution, deploy, read the endpoint from `.automate/deployment.md`, invoke it with `curl`, and verify the outcome.

## Clean up temporary work

- Keep harnesses, fixtures, manual triggers, and one-time setup automations uncommitted unless asked to preserve them.
- After verification, remove temporary source. If it entered an existing deployment, successfully redeploy the intended automation set.
- Delete disposable projects and local files. Do not leave temporary endpoints active. Ask before deleting deployed resources or changing a pre-existing deployment when the request did not already authorize cleanup.

## Deploy and administer

- Inspect live organization state before project creation, invitations, billing, or other plan-sensitive work.
- Deploy when the user wants the automation live. Drive account selection and authorization while keeping secrets out of chat.
- After deployment, inspect `.automate/deployment.md` and report automations, trigger details, status, and remaining user action.
- Read relevant CLI help first. Require explicit intent for destructive deletion, invitations, billing changes, or production deployment unless the request already authorizes them.

## Remove a project

When asked to remove a project and its work:

1. While it is active, add and run a one-off cleanup automation through its account bindings. Remove external resources the project created and verify the results. Record anything an integration cannot remove and the exact user action left.
2. Inspect projects, active automations, account bindings, and connected accounts with CLI JSON before deleting Automate.ax resources. Integration accounts belong to the organization and may serve several projects. Even if only the target project uses an account, ask whether to disconnect or revoke it.
3. After cleanup finishes, delete the project and temporary local files. Report everything removed and any external cleanup still needed.

## Upgrade and finish

To upgrade, preserve the package manager and lockfile, update `automate.ax`, then use the installed declarations and changelog to update code and configuration. Run project checks. Redeploy only when asked to update the live project.

Finish with changes, checks, authentication and deployment status, and remaining user action.
