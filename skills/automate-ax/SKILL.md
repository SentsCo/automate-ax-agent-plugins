---
name: automate-ax
description: Build and operate Automate.ax automation-as-code projects from request through verified deployment. Use when creating, adopting, changing, testing, deploying, debugging, upgrading, or administering Automate.ax automations, integrations, projects, organizations, accounts, or billing.
---

# Automate.ax

Deliver working Automate.ax behavior. Operate the CLI, edit and validate `*.automation.ts`, answer non-secret prompts, assign accounts, deploy, prove the provider result, and clean up. Handle routine commands and project logistics yourself. Code and successful deployment are not completion.

Pause only for browser authorization, private secret entry, a material unanswered choice, or an external action the user did not authorize.

## Use the current API

- Use `https://docs.automate.ax/llms.txt` as a directory. Open only relevant links; never fetch `llms-full.txt` during normal work.
- Automate.ax changes quickly during alpha. Update `automate.ax` to `latest` at task start and again after long work or an API disagreement. Keep explicit pins and user-requested versions.
- Inspect the installed README, exports, declarations, changelog, and examples. Declarations own signatures and signal types; callable docs own Automate.ax behavior; command help and live JSON own syntax and state; provider docs own external behavior; the catalog owns availability and connection notices; OpenAPI owns REST. Do not rely on memory.

## Set up or adopt a project

- Use the directory's Automate.ax project when present. Otherwise create a directory before installing packages or writing files.
- Preserve its package manager and lockfile so SDK and CLI stay paired. Before initialization, run the unpinned CLI package when no local copy exists. Then use the project-installed CLI.
- Run `bunx automate.ax me --json`, then `bunx automate.ax login` if needed. Use explicit selectors and `--json` for bounded inspection. Use the requested or only eligible organization without reopening the choice.
- Run `project create --help`, create the project, then pass its returned ID to `init --project <project-id> --json` without listing projects again. Run `init` only when `automate.config.ts` is absent.
- Keep login and deployment authorization alive in a persistent terminal while browser authorization runs.
- Keep passwords, API keys, and provider secrets in masked terminal prompts, never chat.
- Automate.ax owns provider authentication and trigger registration. Do not ask for provider OAuth applications, webhook infrastructure, or cloud projects unless current provider docs require them.
- Existing `*.automation.ts` files and the request are the brief. Read repository instructions, behavior, and dependencies; preserve committed automations; do not ask what to build when the code says. Install dependencies with the repository's package manager. If initialization is needed, remove only its example automation.
- Do not commit generated `automate.config.ts`, `.automate/`, credentials, account bindings, deployment URLs, or other user-specific state.

## Build the automation

- Read each trigger, action, signal, and integration contract before use. Preserve project conventions. Ask only when a missing business choice changes a callable or authorized provider effect.
- If production needs a Sheet, Form, folder, label, calendar, or similar resource, create it through a temporary setup automation and connected account. Run it once, capture the resource ID, then remove the setup automation.

## Compose signals instead of awaiting values

Triggers and actions return deferred `Signal<T>` values, not promises or ordinary JavaScript values. Pass them to compatible action inputs. Use property access or operators to derive values:

```ts
const request = onInvocation<{ priority: string }>()
const urgent = request.priority.transform((value) => value === "urgent")

branch(urgent, () => {
  sendEmail({
    subject: "Urgent request",
    text: t`Priority: ${request.priority}`,
  })
})
```

Never await a signal, inspect it with `if`, use ordinary string interpolation, or call payload methods through it.

- Use property access or `transform` for synchronous pure derivation; `t` for interpolation.
- Use `filter`, `gate`, `partition`, and `branch` for selection. Do not declare triggers inside a branch.
- Line order does not set execution order. Signal dependencies do. Use `dependentOn` or `withPrerequisites` for ordering without an action input.
- Use `keyBy`, `globally`, `correlate`, `collect`, `each`, `scope`, and `group` for partitioning and coordination.
- Use `race`, `fallback`, `delay`, and `timeout` for selection and timing; `funnel`, `debounce`, and `window` for bursts; outcome operators for terminal state.
- Every action must resolve to one activation boundary. Give multi-root actions a signal prerequisite or `withPrerequisites` scope.
- Before using unfamiliar operators, read the [signal model](https://docs.automate.ax/concepts/signals.md), [operator reference](https://docs.automate.ax/reference/utilities.md), and declarations. Never guess `.output`, `.value`, provider fields, or signal shapes.

### Continue work from email replies

- Receive replies with [`onMailhook`](https://docs.automate.ax/reference/triggers/on-mailhook). Filter accepted messages before correlation; treat HTML and attachments as untrusted. Give the initiating occurrence a `correlationId`, use it as the managed `sendEmail` reply address's `plusPath`, then match the reply's `plusPath` with `correlate`. Set a TTL for unmatched requests.
- Keep the next notification in the same thread with a signal-valued `headers` object. Set `In-Reply-To` to the reply's `messageId`. Build `References` from its `references`, or its `inReplyTo` when references are empty, followed by its `messageId`. The `id` returned by `sendEmail` is Resend's internal resource ID, not an RFC 5322 Message-ID. Never use it as a threading target.
- Read the [thread-reply example](https://docs.automate.ax/reference/actions/send-email#thread-replies) and [mailhook data](https://docs.automate.ax/reference/triggers/on-mailhook#trigger-data) first.

### Add an unsupported integration

- When Automate.ax lacks an action, use a [custom action](https://docs.automate.ax/concepts/custom-integrations.md). Its handler can use `fetch`, runtime APIs, and `npm` packages.
- For an unsupported service, store a restricted credential in 1Password and resolve it with `onePassword.resolveSecret`. Pass that sensitive signal directly to the custom action. Limit the connected 1Password service account to the required vault. Never return the credential, log it, include it in an error, or ask the user to paste it into chat.
- If 1Password is unavailable, hardcode a restricted credential inside the custom action handler's closure in private source. Have the user add it locally. Never pass the literal through action inputs or signals because they become durable run data, and never commit source containing it to a public repository.
- Automate.ax has no fully custom triggers. For webhooks, use [`onHttpRequest`](https://docs.automate.ax/concepts/custom-triggers.md) and register its deployed URL. Without webhooks, no equivalent exists. Request a packaged integration through the [integration request form](https://automate.ax/feedback?prefill_What%20would%20you%20like%20us%20to%20know%3F=Integration%20request%3A%20).

### Keep Automate.ax runs deterministic

- Compose durable work synchronously. Put provider and API effects in actions; keep transforms and callbacks pure; keep declaration order stable across replays. Do not run asynchronous setup during declaration.
- Orchestrator functions run directly. Do not build a graph or JSON intermediate.
- Deployed project code runs on pinned Bun 1.4 for ARM64 Linux. Read the [runtime guide](https://docs.automate.ax/concepts/bun-runtime.md) before choosing runtime APIs or dependencies.
- Use Web APIs, Bun built-ins, compatible Node.js APIs, and `npm` packages. Install locally; never rely on production auto-install. Check Bun compatibility for required Node.js APIs. Prefer Bun built-ins over native dependencies.
- Use `Bun.Image` before Sharp for supported JPEG, PNG, or WebP work. Pass untrusted images as bytes and set `maxPixels`.
- Install `@types/bun` and include `"bun"` in `compilerOptions.types` when code uses the `Bun` global.
- Finish work before an action handler returns. Do not use long-lived servers, background processes, or `Bun.cron`. Use `onSchedule` for durable scheduling.

## Validate before deployment

- After each coherent edit and before finishing or deploying, run the formatter, relevant tests, and TypeScript typecheck. Use the project command or local compiler with the strict `tsconfig.json` from `automate init`. Type errors are automation errors.
- Planning validates durable structure. TypeScript checks validate trigger and action inputs, signals, provider shapes, and constrained values. Bundling replaces neither. Follow [Deploy and inspect runs](https://docs.automate.ax/concepts/deployments-and-runs.md).
- Require passing local checks and planning before an authorized deployment. Without deployment authorization, finish with local checks and report that planning did not run.

## Prove each stage before combining it

- Isolate uncertain provider reads, AI generation, transforms, and action inputs. Run pure helpers locally. Test action handlers, runtime behavior, accounts, and provider responses with a small HTTP automation in a disposable project.
- Use an existing project only when the user authorizes replacing its active deployment and every automation is ready.
- Share a TypeScript module between production and proof triggers. Wrap it with the smallest `onHttpRequest` automation. Use representative JSON. When work fits the response window, return its output with `waitForResponse: true` and `respondToHttpRequest`.
- Typecheck, deploy, and invoke each authorized slice. Exercise the success and failure inputs that change signal composition or action inputs.
- Assemble proven stages, typecheck, and plan the combined structure. Working slices may still form an invalid plan.

## Prove the provider result

After deployment and execution authorization, use a realistic event and verify the provider result.

- Prefer a fixture that creates the real upstream event. For example, send identifiable test emails and verify the expected Gmail labels.
- Otherwise wrap the same logic in a temporary `onDashboardRun` form or `onHttpRequest` JSON trigger. One automation may have several triggers when a manual fixture belongs beside the real trigger.
- Exercise each `filter`, `branch`, fan-out, batch, and generated-content path. Inspect the run and changed provider record, message, or file. A trigger receipt, action row, or deployment is not proof.
- Put cross-project fixtures in a disposable project. Adding a fixture or manual trigger to an existing deployment requires explicit authorization.

## Complete one-off work

- Use an ephemeral automation. Use the current project only when the task needs its code, configuration, or account bindings. Otherwise use a temporary directory and project.
- Build the smallest useful `onHttpRequest` automation. Put structured or sensitive input in a JSON body, never secrets in query parameters.
- Use `waitForResponse: true` with `respondToHttpRequest` only when the caller needs the result and work fits the HTTP response window.
- After execution authorization, deploy, read `.automate/deployment.md`, invoke the endpoint with `curl`, and verify the outcome.

## Inspect and debug runs

- Prefer bounded sync: `bunx automate.ax data sync --project <project-id> --since 1h`. Run `data schema` before SQL. Use `query` for exact state and joins. Use `search` for failures, actions, outputs, logs, traces, payloads, and IDs.
- Use `data follow` only in a persistent terminal when it simplifies asynchronous proof. Wait for its ready message before invoking. In a bounded non-interactive turn, invoke first, sync a narrow range, then poll an exact query.
- Capture `eventId` from an HTTP `202` receipt and use it as the first lookup key. Inspect the root context, correlated descendants, actions, and delayed or scheduled invocation provenance before deciding the run completed. Provenance does not establish ancestry.
- Say _run_ to users. Reserve _root context_ and other storage terms for query details.

Follow [Query runs](https://docs.automate.ax/guides/query-execution-data.md) for synchronization, polling queries, execution tables, fan-out, delayed work, logs, and local data cleanup.

## Remove temporary Automate.ax resources

- Keep harnesses, fixtures, manual triggers, and setup automations uncommitted unless asked. Remove them after proof. If deployed, redeploy only the intended automation set.
- Remove disposable provider records, messages, files, labels, and other fixtures that the proof created. Keep production resources created by a setup automation and report their IDs or links.
- Delete disposable projects and local files. Disable temporary endpoints. Ask before deleting deployed resources or changing a pre-existing deployment unless the request authorized cleanup.

## Deploy and manage Automate.ax

- Inspect organization projects, members, and plan before creation, invitations, or billing work.
- Read `bunx automate.ax deploy --help`, then deploy when requested. Deployment publishes every `*.automation.ts` beneath `automate.config.ts` as one snapshot. Confirm the full set before replacing a deployment.
- Let deploy open its authorization page. Assign saved accounts or connect a new one. Use `--cli-authorization` when terminal selection is more reliable.
- If a non-interactive deployment returns `DEPLOYMENT_AUTHORIZATION_REQUIRED`, preserve its deployment ID, give the user the focused browser URL, and keep `bunx automate.ax deployment authorize <deployment-id> --no-open` alive until authorization completes.
- Use `--rebind-accounts` only to replace saved bindings. Use `--cancel-existing` only to replace a known stuck or obsolete deployment.
- Deployment finishes when every required account is assigned and status is `succeeded`. Read `.automate/deployment.md` for automations, trigger URLs or schedules, status, and remaining user action.
- Require explicit intent for account revocation, resource deletion, invitations, membership, API keys, billing changes, and production deployment unless the request already authorizes that action.

## Remove a project

When removing a project:

1. While active, run a one-off cleanup automation through its account bindings. Remove and verify external resources the project created. Record what an integration cannot remove and the exact user action left.
2. Inspect projects, active automations, account bindings, and connected accounts with CLI JSON before deleting Automate.ax resources. Integration accounts belong to the organization and may serve several projects. Even if only the target project uses an account, ask whether to disconnect or revoke it.
3. Delete the project and temporary local files after cleanup. Report what was removed and any remaining external cleanup.

## Upgrade automate.ax and report live state

After updating `automate.ax`, use its declarations and changelog to update code and configuration. Run project checks. Redeploy only when asked to update the live project.

Report changed automations, local checks, login and deployment state, assigned accounts, proof, cleanup, and remaining user action.
