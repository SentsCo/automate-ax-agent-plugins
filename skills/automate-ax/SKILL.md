---
name: automate-ax
description: Build, deploy, operate, debug, and upgrade Automate.ax automation-as-code projects. Use when a user wants to start an Automate.ax project, turn a business process into TypeScript automations, change an existing automation, connect integration accounts, deploy, manage projects or organizations, handle billing, or upgrade the automate.ax SDK and CLI.
---

# Automate.ax

Own the workflow end to end. Treat the CLI as an implementation detail: run it, answer its non-secret prompts, write the automation code, validate it, and continue through any requested deployment or maintenance work. Do not hand the user a list of commands when you can perform the work.

## Operate the CLI

- Work in the user's intended project directory. Inspect existing files before changing anything.
- Use Bun. If `bun` is unavailable, install it with `curl -fsSL https://bun.com/install | bash` on macOS/Linux or `powershell -c "irm bun.sh/install.ps1|iex"` on Windows, reload the shell environment, and verify `bun --version`.
- For bootstrap and diagnosis without a local installation, run `bunx automate.ax@latest <command>`. Once initialized, prefer the project's installed CLI with `bunx automate.ax <command>` so CLI and SDK stay aligned.
- Run `bunx automate.ax@latest --help` or the relevant subcommand help when flags or capabilities are uncertain. Use JSON output only for non-interactive inspection; it disables interactive authorization flows.
- Run interactive commands in a persistent terminal/PTY. Respond to choices from known context instead of asking the user to operate the CLI.
- Let commands open the user's browser. If a browser cannot open, surface the exact printed URL as a clickable link, keep the command running while it polls, and resume as soon as the user completes the browser step.
- Never ask the user to paste passwords, API keys, or provider secrets into chat. When a CLI form requires a secret, leave its masked terminal prompt active and ask the user to enter it there.
- Keep polling login, authorization, checkout, and deployment commands while they are making progress. Do not abandon the workflow after presenting a URL.

## Set up a project

1. Inspect the directory for `automate.config.ts`, `package.json`, lockfiles, and existing `*.automation.ts` files.
2. Check authentication with `bunx automate.ax@latest --json me`. If it reports that the user is not logged in, run `bunx automate.ax@latest login`, allow the browser to open or provide the printed login URL, and wait for the CLI to confirm login.
3. If no Automate.ax config exists, run `bunx automate.ax@latest init` from the project directory. Let it select or create the project, scaffold the config and example, and install `automate.ax` with the detected package manager.
4. If a config already exists, do not run `init`; inspect and continue from the current project.
5. For a generic website handoff with no automation brief yet, finish setup first, then ask what the user wants to automate.

## Build automations

- Before writing or substantially changing automation code, read [references/execution-model.md](references/execution-model.md). Apply that mental model even when the requested workflow sounds sequential.
- Read the installed `automate.ax` README, exports, and TypeScript declarations plus nearby project examples before choosing APIs. The installed version is authoritative.
- Implement the user's business process directly as TypeScript in `*.automation.ts` files. Orchestrator functions run directly at runtime; do not build a graph or JSON intermediate.
- Preserve existing project conventions. Prefer public integration subpaths and service account helpers such as `googleAccount` over low-level account definitions.
- Infer reasonable defaults and ask only when a missing business decision would materially change behavior or create an unsafe external action.
- Run the project's formatter, typecheck, and relevant tests after editing. Fix ordinary compatibility errors rather than weakening compiler settings.

## Deploy and administer

- Before creating projects, inviting members, or making plan-dependent promises, read [references/plans.md](references/plans.md). Inspect the active organization with `bunx automate.ax@latest --json org show`; live returned limits and current command behavior are authoritative.
- When the user wants the automation live, run `bunx automate.ax deploy` from the project or pass `--dir` when needed.
- Drive account selection and connection prompts during deploy. For OAuth, keep the deployment command alive while the user authorizes in the browser. For credential forms, protect secrets as described above.
- After deployment, read `.automate/deployment.md` and report the deployed automations, trigger URLs, deployment status, and any remaining user action.
- Use `automate project`, `automate org`, `automate org apikey`, `automate org billing`, and `automate org upgrade` on the user's behalf for administrative work. Inspect command help first when the exact subcommand is unclear.
- Require explicit user intent before destructive resource deletion, billing changes, invitations, or production deployment when that intent was not already part of the request.

## Upgrade an existing project

1. Inspect the current `automate.ax` version, lockfile, source, and working-tree state.
2. Update `automate.ax` to the latest release with the project's existing package manager; do not introduce a second lockfile.
3. Read the installed package's current README, declarations, and changelog as needed. Update automation code and config to the current API instead of leaving compatibility aliases.
4. Run the project's checks and fix failures caused by the upgrade.
5. Redeploy only when the user asked to update the live project, then complete any new authorization flow and verify the deployment manifest.

## Finish

Report what was created or changed, which checks passed, whether authentication and deployment completed, and any URL or action that still needs the user. A setup task is not complete merely because the CLI was installed.
