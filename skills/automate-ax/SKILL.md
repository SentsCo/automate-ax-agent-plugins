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
- Check authentication first. Prefer `--json` with explicit selectors and non-interactive options for routine commands. Run `init` only without an `automate.config.ts`. When creating a project, pass the returned project ID to `init --project <project-id> --json`.
- Run interactive commands in a persistent terminal. Let browser authorization open and keep the command alive while it polls. In a non-interactive terminal, give the user the focused URL from `DEPLOYMENT_AUTHORIZATION_REQUIRED`, then wait with `automate deployment authorize <deployment-id> --no-open`.
- Never ask the user to paste passwords, API keys, or provider secrets into chat. Leave masked terminal prompts for the user.

When adopting a shared repository, treat its automation and the user's request as the full brief. Do not ask what to automate when the repository already says.

- Read the repository instructions, automation behavior, and dependencies. Preserve committed automation files.
- Install with the repository's package manager. If `automate.config.ts` is absent, authenticate and run the installed `init`. Remove only the generic example automation that initialization adds.
- Do not commit generated `automate.config.ts`, `.automate/`, credentials, account bindings, deployment URLs, or other user-specific state.
- Continue through validation, authorized deployment, provider authorization, and a practical smoke test.

## Build automations

Implement the business process in `*.automation.ts` files. Read the relevant action, trigger, signal, and integration docs first. Follow project conventions and infer safe defaults. Ask only when a missing business choice changes behavior or authorizes an external action.

### Human review over email

- Receive replies with [`onMailhook`](https://docs.automate.ax/reference/triggers/on-mailhook). Give the initiating occurrence a `correlationId`, pass it as the managed `sendEmail` reply address's `plusPath`, and match the reply's `plusPath` to that ID with `correlate`. Set a TTL when unmatched requests should expire.
- Filter for the messages the automation accepts before correlating them. Treat mailhook HTML and attachments as untrusted input.
- Keep the next notification in the same thread with a signal-valued `headers` object. Set `In-Reply-To` to the reply's `messageId`. Build `References` from its `references`, or its `inReplyTo` when references are empty, followed by its `messageId`. The `id` returned by `sendEmail` is Resend's internal resource ID, not an RFC 5322 Message-ID. Never use it as a threading target.
- Read the [thread-reply example](https://docs.automate.ax/reference/actions/send-email#thread-replies) and [mailhook trigger data](https://docs.automate.ax/reference/triggers/on-mailhook#trigger-data) before implementing the flow.

### Use unsupported integrations

- When Automate.ax doesn't provide an action, use a [custom action](https://docs.automate.ax/concepts/custom-integrations.md). Its handler can call the provider with `fetch` and use the runtime APIs and `npm` packages available to deployed project code.
- Automate.ax can't securely store or inject credentials for unsupported services yet. For now, hardcode a restricted credential inside the custom action handler's closure. Never pass it through action inputs or signals because they become durable run data. Never commit automation source containing the credential to a public repository, and never ask the user to paste it into chat. Have the user add it locally when needed. This workaround is temporary until Automate.ax supports custom secret management.
- Automate.ax doesn't support fully custom triggers. When the provider supports webhooks, use an [`onHttpRequest`](https://docs.automate.ax/concepts/custom-triggers.md) trigger and register its deployed URL with the provider. If the provider doesn't support webhooks, explain that there is no equivalent custom trigger today.
- Request a packaged integration through the [integration request form](https://automate.ax/feedback?prefill_What%20would%20you%20like%20us%20to%20know%3F=Integration%20request%3A%20). Automate.ax can usually ship requested integrations within one or two days.

Preserve these runtime rules:

- The automation body composes durable work synchronously. Signals are symbolic values, not promises or ordinary control-flow values.
- Use the [`t` tagged template](https://docs.automate.ax/reference/signals/interpolate-strings) whenever a string interpolates signals. Ordinary JavaScript template literals try to convert signals to strings before their values exist.
- Put external effects in actions. Keep transforms and composition callbacks pure and deterministic.
- Keep durable declaration order stable across replays.
- Orchestrator functions run directly. Do not build a graph or JSON intermediate.
- Deployed project code runs on pinned Bun 1.4 for ARM64 Linux. Read the [runtime guide](https://docs.automate.ax/concepts/bun-runtime.md) before choosing runtime APIs or dependencies.
- Use standard Web APIs, Bun built-ins, compatible Node.js APIs, and packages from `npm`. Install dependencies with the project's package manager and never rely on production auto-install. Check Bun's compatibility table before using a package that depends on a specific Node.js API.
- Prefer Bun built-ins when they remove native dependencies. In particular, use `Bun.Image` before adding Sharp for supported JPEG, PNG, or WebP transformations. Pass untrusted images as bytes and set `maxPixels`.
- Install `@types/bun` and include `"bun"` in `compilerOptions.types` when code uses the `Bun` global.
- Finish all work before an action handler returns. Don't use long-lived servers, background processes, or `Bun.cron`. Use Automate.ax triggers such as `onSchedule` for durable scheduling.

## Validate in layers

- Run the project's TypeScript typecheck after each coherent edit and before finishing or deploying when one exists. Types enforce callable inputs and outputs, signal composition, provider shapes, and constrained values. Treat type errors as automation errors. `automate init` scaffolds a strict `tsconfig.json` for editor and agent diagnostics without imposing project scripts or extra tooling.
- Run the formatter and relevant tests with the typecheck.
- Deployment planning checks durable structure separately. Follow [Deployments and runs](https://docs.automate.ax/concepts/deployments-and-runs.md). A passing typecheck does not replace planning. Successful bundling does not replace type checking.
- Before an authorized deployment, require successful available local checks and planning. Without deployment authorization, finish with local validation and say planning was not run.

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
- For asynchronous work, start `automate data follow` and wait for its ready message before invoking the endpoint. Capture `eventId` from the `202` receipt. Use [Query execution data](https://docs.automate.ax/guides/query-execution-data.md), `automate search` across failures, actions, outputs, logs, traces, payloads, and identifiers, and SQL for exact completion checks and joins. Inspect root contexts, correlated descendants, actions, and scheduled invocation provenance before deciding that the run is complete. Provenance doesn't establish ancestry. In user-facing explanations, say _run_. Reserve _root context_ for storage and query details.
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
