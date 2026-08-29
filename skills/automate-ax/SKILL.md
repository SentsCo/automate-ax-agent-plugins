---
name: automate-ax
description: Build and operate Automate.ax automation-as-code projects. Use for creating, adopting, changing, deploying, debugging, upgrading, or administering automations, integrations, projects, organizations, and billing.
---

# Automate.ax

Complete the user's original request. Don't stop after setup or explain this skill as the result.

Read `https://docs.automate.ax/llms.txt`, then open only the relevant Markdown pages it links. Don't fetch `llms-full.txt` during normal work. Inspect the installed `automate.ax` TypeScript declarations for exact action and trigger shapes, and run command-line `--help` before using an unfamiliar command. Live state and the installed package are authoritative.

Handle routine directory setup, project creation or adoption, initialization, authoring, validation, and terminal prompts yourself. Preserve an existing repository's package manager, instructions, automation files, and user-specific ignore rules. Don't commit credentials, account bindings, deployment URLs, `.automate/`, or generated local configuration.

Pause only for:

- Browser authorization or a privately entered secret.
- A material choice the request doesn't answer.
- An external effect the user didn't authorize.
- Destructive organization, account, billing, membership, API-key, or production administration without explicit intent.

Never ask the user to paste passwords, API keys, OAuth codes, provider credentials, environment secrets, or command-line session files into chat. Don't inspect or print session tokens.

When the user authorizes deployment, continue through account assignment, a realistic safe proof, inspection of the actual run and external result, and cleanup. Prefer a disposable upstream fixture. Otherwise use a temporary HTTP or dashboard trigger around the same production logic. Remove temporary source and external artifacts, redeploy the intended automation set, inspect `.automate/deployment.md`, and verify only intended automations remain enabled.

Use a disposable project unless the request depends on an existing project's code, configuration, or bindings. One deployment publishes every `*.automation.ts` file in the project. Don't replace an existing active deployment without authorization covering the complete snapshot.

Finish with validated behavior, deployment and authorization status, proof evidence, cleanup, and the exact remaining user action. Source code, type checking, or deployment status alone isn't proof.
