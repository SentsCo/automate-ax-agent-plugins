# Plans and limits

Plan state belongs to an organization. Before a plan-sensitive operation, inspect the active organization with:

```bash
bunx automate.ax@latest --json org show
```

Use the returned plan, usage, and limits as the operational truth. If the active organization is ambiguous, inspect or select it before mutating anything.

## Currently enforced limits

The current server plan definitions enforce these limits:

| Plan       |  Projects |     Seats |
| ---------- | --------: | --------: |
| Free       |         1 |         1 |
| Pro        |        25 |        10 |
| Enterprise | Unlimited | Unlimited |

Preflight project creation and invitations before asking the user for a project name or email address. When the limit is reached, explain which resource is exhausted and offer to run the appropriate organization upgrade or billing flow. Do not silently start checkout or change a subscription without explicit user intent.

## Other advertised entitlements

The public pricing surface currently describes additional plan differences: monthly run volume, output retention, trigger availability, integration availability, and enterprise support. These are product descriptions, not all represented in the same live limit response yet. It currently advertises:

- Free: 1,000 runs/month, 24-hour output retention, basic triggers, and a small integration set.
- Pro: 50,000 runs/month, 7-day retention, advanced triggers, and a broader integration set.
- Enterprise: custom run volume, up to 180-day retention, custom integrations and triggers, and priority support.

Do not promise one of these capabilities from this snapshot alone. Check the current pricing page, installed CLI behavior, and any error returned by the API. Treat live server limits as authoritative if static documentation has become stale.

## Agent behavior

- Prefer completing work within the current plan before proposing an upgrade.
- Never delete or repurpose existing resources merely to evade a limit without the user's explicit approval.
- Run `automate org upgrade` or `automate org billing` for the user when they choose to change plans.
- Keep interactive checkout running, allow its browser page to open, or provide the exact URL when opening fails; resume after completion.
- Re-run `org show` after a plan change before retrying the blocked operation.
- If a limit is absent from live output, do not invent one. Explain what is known and verify current product behavior.
