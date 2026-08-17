import { encode } from "@automate.ax/codec"
import { getHttpTriggerEndpointKey } from "@automate.ax/catalog"
import { encryptSecret } from "@internal/api/lib/integrations/crypto"
import { hashEventSource } from "@internal/api/lib/utils"
import { runtimeConfig } from "@internal/config/runtime"
import type { DB } from "@internal/db"
import { sql, type Kysely } from "kysely"
import { z } from "zod"

const SEED_USER_EMAIL = "zachsents@gmail.com"
const SEED_ORGANIZATION_SLUG = "automate-ax-dev-seed"
const HOUR_MS = 60 * 60 * 1_000
const DAY_MS = 24 * HOUR_MS

/**
 * Populate a local database with canonical kitchen-sink development data.
 *
 * @param db - Migrator-provided local database.
 */
export async function seed(db: Kysely<DB>) {
  z.url().includes("localhost").parse(runtimeConfig.databaseUrl)

  const now = new Date()
  const currentPeriodStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  )
  const INTEGRATION_ENCRYPTION_KEY = runtimeConfig.integrationEncryptionKey
  const [googleSecret, slackSecret, resendSecret] = await Promise.all([
    encryptSecret(
      {
        accessToken: "dev-google-access-token",
        refreshToken: "dev-google-refresh-token",
        tokenType: "Bearer",
      },
      INTEGRATION_ENCRYPTION_KEY,
    ),
    encryptSecret(
      { accessToken: "xoxb-dev-seed-token", tokenType: "bot" },
      INTEGRATION_ENCRYPTION_KEY,
    ),
    encryptSecret(
      { apiKey: "re_dev_seed_invalid" },
      INTEGRATION_ENCRYPTION_KEY,
    ),
  ])

  const result = await db.transaction().execute(async (trx) => {
    if (
      await trx
        .selectFrom("organization")
        .select("id")
        .where("slug", "=", SEED_ORGANIZATION_SLUG)
        .executeTakeFirst()
    ) {
      throw new Error(
        "Development data is already seeded. Run `bun run db:reseed` to replace it.",
      )
    }

    const user = await trx
      .insertInto("user")
      .values({
        email: SEED_USER_EMAIL,
        emailVerified: true,
        name: "Zach Sents",
      })
      .onConflict((conflict) =>
        conflict.column("email").doUpdateSet({ emailVerified: true }),
      )
      .returning(["email", "id"])
      .executeTakeFirstOrThrow()
    // Keep the teammate named because its generated ID belongs in the membership.
    const teammate = await trx
      .insertInto("user")
      .values({
        email: "jamie@example.com",
        emailVerified: true,
        name: "Jamie Chen",
      })
      .onConflict((conflict) => conflict.column("email").doNothing())
      .returning("id")
      .executeTakeFirst()
    // Resolve the existing row when this user predates the canonical seed.
    const teammateId =
      teammate?.id ??
      (
        await trx
          .selectFrom("user")
          .select("id")
          .where("email", "=", "jamie@example.com")
          .executeTakeFirstOrThrow()
      ).id
    const organization = await trx
      .insertInto("organization")
      .values({
        isDefault: true,
        name: "Automate.ax Dev",
        slug: SEED_ORGANIZATION_SLUG,
      })
      .returning(["id", "name"])
      .executeTakeFirstOrThrow()

    await trx
      .insertInto("member")
      .values([
        {
          organizationId: organization.id,
          role: "owner",
          userId: user.id,
        },
        {
          organizationId: organization.id,
          role: "admin",
          userId: teammateId,
        },
      ])
      .execute()
    await trx
      .insertInto("invitation")
      .values({
        email: "developer@example.com",
        expiresAt: new Date(now.getTime() + 7 * DAY_MS),
        inviterId: user.id,
        organizationId: organization.id,
        role: "member",
        status: "pending",
      })
      .execute()
    await trx
      .insertInto("subscription")
      .values({
        billingInterval: "month",
        periodEnd: new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
        ),
        periodStart: currentPeriodStart,
        plan: "pro",
        referenceId: organization.id,
        seats: 10,
        status: "active",
      })
      .execute()
    await trx
      .insertInto("providerRuntimeUsage")
      .values([
        {
          organizationId: organization.id,
          periodStart: currentPeriodStart,
          resource: "ai_spend",
          usage: 18_750_000,
        },
        {
          organizationId: organization.id,
          periodStart: currentPeriodStart,
          resource: "email_recipient",
          usage: 1_240,
        },
      ])
      .execute()

    const accounts = await trx
      .insertInto("integrationAccount")
      .values([
        {
          checkedAt: new Date(now.getTime() - HOUR_MS),
          connectionId: "default",
          encryptedSecret: googleSecret,
          label: SEED_USER_EMAIL,
          scopes: sql<string[]>`${JSON.stringify([
            "email",
            "openid",
            "profile",
            "https://www.googleapis.com/auth/gmail.modify",
          ])}::jsonb`,
          serviceId: "google",
          serviceSub: "dev-seed-google",
        },
        {
          checkedAt: new Date(now.getTime() - 2 * HOUR_MS),
          connectionId: "default",
          encryptedSecret: slackSecret,
          label: "Automate.ax Dev",
          scopes: sql<string[]>`${JSON.stringify([
            "channels:read",
            "chat:write",
          ])}::jsonb`,
          serviceId: "slack",
          serviceSub: "TDEVSEED",
        },
        {
          checkedAt: new Date(now.getTime() - 6 * HOUR_MS),
          connectionId: "api-key",
          encryptedSecret: resendSecret,
          error: {
            code: "invalid_credentials",
            message: "The development API key needs to be replaced.",
          },
          label: "Staging email",
          scopes: sql<string[]>`${JSON.stringify(["emails:send"])}::jsonb`,
          serviceId: "resend",
          serviceSub: "dev-seed-resend",
        },
      ])
      .returning(["id", "serviceId"])
      .execute()
    const accountLinks = await trx
      .insertInto("integrationAccountLink")
      .values(
        accounts.map((account) => ({
          accountId: account.id,
          organizationId: organization.id,
        })),
      )
      .returning(["accountId", "id"])
      .execute()

    const supportProject = await trx
      .insertInto("project")
      .values({
        createdAt: new Date(now.getTime() - 60 * DAY_MS),
        createdBy: user.id,
        isDefault: true,
        name: "Support Operations",
        organizationId: organization.id,
      })
      .returning(["id", "name"])
      .executeTakeFirstOrThrow()
    const financeProject = await trx
      .insertInto("project")
      .values({
        createdAt: new Date(now.getTime() - 21 * DAY_MS),
        createdBy: user.id,
        name: "Finance Sync",
        organizationId: organization.id,
      })
      .returning(["id", "name"])
      .executeTakeFirstOrThrow()
    await trx
      .insertInto("project")
      .values({
        createdAt: new Date(now.getTime() - 2 * DAY_MS),
        createdBy: user.id,
        name: "Empty Playground",
        organizationId: organization.id,
      })
      .execute()

    const deployments = await trx
      .insertInto("deployment")
      .values([
        {
          completedAt: new Date(now.getTime() - 14 * DAY_MS + 3 * 60 * 1_000),
          createdAt: new Date(now.getTime() - 14 * DAY_MS),
          createdBy: user.id,
          gitCommitSha: "1111111111111111111111111111111111111111",
          gitDirty: false,
          gitProjectPath: "",
          gitRepositoryUrl: "https://github.com/automate-ax/examples.git",
          projectId: supportProject.id,
          status: "failed",
        },
        {
          completedAt: new Date(now.getTime() - 10 * DAY_MS + 60 * 1_000),
          createdAt: new Date(now.getTime() - 10 * DAY_MS),
          createdBy: user.id,
          gitCommitSha: "2222222222222222222222222222222222222222",
          gitDirty: true,
          gitProjectPath: "",
          gitRepositoryUrl: "https://github.com/automate-ax/examples.git",
          projectId: supportProject.id,
          status: "cancelled",
        },
        {
          completedAt: new Date(now.getTime() - 7 * DAY_MS + 4 * 60 * 1_000),
          createdAt: new Date(now.getTime() - 7 * DAY_MS),
          createdBy: user.id,
          gitCommitSha: "3333333333333333333333333333333333333333",
          gitDirty: false,
          gitProjectPath: "",
          gitRepositoryUrl: "https://github.com/automate-ax/examples.git",
          lambdaVersion: "7",
          projectId: supportProject.id,
          status: "succeeded",
        },
        {
          createdAt: new Date(now.getTime() - 30 * 60 * 1_000),
          createdBy: user.id,
          gitCommitSha: "4444444444444444444444444444444444444444",
          gitDirty: false,
          gitProjectPath: "",
          gitRepositoryUrl: "https://github.com/automate-ax/examples.git",
          projectId: financeProject.id,
          status: "awaiting_authorization",
        },
      ])
      .returning(["id", "projectId", "status"])
      .execute()
    const activeDeployment = deployments.find(
      ({ status }) => status === "succeeded",
    )!

    await trx
      .updateTable("project")
      .set({ activeDeploymentId: activeDeployment.id })
      .where("id", "=", supportProject.id)
      .execute()

    const automations = await trx
      .insertInto("automation")
      .values([
        {
          identityKey: "automations/triage-support.automation.ts",
          projectId: supportProject.id,
        },
        {
          identityKey: "automations/daily-digest.automation.ts",
          projectId: supportProject.id,
        },
        {
          identityKey: "automations/sync-invoices.automation.ts",
          projectId: financeProject.id,
        },
      ])
      .returning(["id", "identityKey"])
      .execute()
    const triageAutomation = automations.find(({ identityKey }) =>
      identityKey.includes("triage-support"),
    )!
    const digestAutomation = automations.find(({ identityKey }) =>
      identityKey.includes("daily-digest"),
    )!

    const httpConfig = { scope: "trigger", waitForResponse: true } as const
    const cronConfig = {
      schedule: "0 9 * * 1-5",
      timeZone: "America/Los_Angeles",
    }
    const triagePlan = {
      accountDeclarations: [
        {
          binding: "inbox",
          connectionOptionGroups: [
            [
              {
                connectionId: "default",
                requiredScopes: [
                  "https://www.googleapis.com/auth/gmail.modify",
                ],
              },
            ],
          ],
          serviceId: "google",
        },
        {
          binding: "team",
          connectionOptionGroups: [
            [{ connectionId: "default", requiredScopes: ["chat:write"] }],
          ],
          serviceId: "slack",
        },
      ],
      accountUses: [],
      description: "Triage incoming support requests and notify the team.",
      subscriptions: [
        { config: httpConfig, eventType: "http.request", hookSlot: 0 },
      ],
    }
    await trx
      .insertInto("automationBundle")
      .values([
        {
          automationId: triageAutomation.id,
          deploymentId: deployments.find(({ status }) => status === "failed")!
            .id,
          plan: {
            ...triagePlan,
            description: "Earlier support-triage deployment.",
          },
        },
        {
          automationId: triageAutomation.id,
          deploymentId: activeDeployment.id,
          plan: triagePlan,
        },
        {
          automationId: digestAutomation.id,
          deploymentId: activeDeployment.id,
          plan: {
            accountDeclarations: [],
            accountUses: [],
            description: "Summarize support activity every weekday morning.",
            subscriptions: [
              { config: cronConfig, eventType: "cron.tick", hookSlot: 0 },
            ],
          },
        },
        {
          automationId: automations.find(({ identityKey }) =>
            identityKey.includes("sync-invoices"),
          )!.id,
          deploymentId: deployments.find(
            ({ status }) => status === "awaiting_authorization",
          )!.id,
          plan: {
            accountDeclarations: [
              {
                binding: "warehouse",
                connectionOptionGroups: [
                  [{ connectionId: "default", requiredScopes: [] }],
                ],
                serviceId: "postgres",
              },
            ],
            accountUses: [],
            description: "Copy paid invoices into the finance warehouse.",
            subscriptions: [],
          },
        },
      ])
      .execute()
    await trx
      .insertInto("deploymentAccountBinding")
      .values([
        {
          accountLinkId: accountLinks.find(
            ({ accountId }) =>
              accountId ===
              accounts.find(({ serviceId }) => serviceId === "google")!.id,
          )!.id,
          binding: "inbox",
          deploymentId: activeDeployment.id,
          serviceId: "google",
        },
        {
          accountLinkId: accountLinks.find(
            ({ accountId }) =>
              accountId ===
              accounts.find(({ serviceId }) => serviceId === "slack")!.id,
          )!.id,
          binding: "team",
          deploymentId: activeDeployment.id,
          serviceId: "slack",
        },
      ])
      .execute()

    const httpSourceKey = getHttpTriggerEndpointKey({
      automationId: triageAutomation.id,
      hookSlot: 0,
      projectId: supportProject.id,
      scope: httpConfig.scope,
    })
    const httpSource = await trx
      .insertInto("eventSource")
      .values({
        hash: hashEventSource({ key: httpSourceKey, type: "http.endpoint" }),
        key: JSON.stringify(httpSourceKey),
        state: { endpoint: httpSourceKey },
        status: "active",
        type: "http.endpoint",
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    const cronSource = await trx
      .insertInto("eventSource")
      .values({
        hash: hashEventSource({ key: cronConfig, type: "cron.schedule" }),
        key: JSON.stringify(cronConfig),
        reconciliationError:
          "Scheduled delivery is intentionally disabled in seeded data.",
        state: {},
        status: "inactive",
        type: "cron.schedule",
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    const subscriptions = await trx
      .insertInto("eventSubscription")
      .values([
        {
          automationId: triageAutomation.id,
          config: httpConfig,
          deploymentId: activeDeployment.id,
          eventSourceId: httpSource.id,
          eventType: "http.request",
          hookSlot: 0,
        },
        {
          automationId: digestAutomation.id,
          config: cronConfig,
          deploymentId: activeDeployment.id,
          eventSourceId: cronSource.id,
          eventType: "cron.tick",
          hookSlot: 0,
        },
      ])
      .returning(["eventType", "id"])
      .execute()
    const httpSubscription = subscriptions.find(
      ({ eventType }) => eventType === "http.request",
    )!

    const events = await trx
      .insertInto("event")
      .values([
        {
          createdAt: new Date(now.getTime() - 3 * HOUR_MS),
          eventSourceId: httpSource.id,
          eventType: "http.request",
          idempotencyKey: "dev-seed-completed-request",
          payload: Buffer.from(
            await encode({
              body: {
                customer: "Acme",
                priority: "high",
                ticketId: "SUP-1842",
              },
              headers: { "content-type": "application/json" },
              method: "POST",
              path: "/support",
              query: { source: "website" },
              url: "https://automate.ax/support",
            }),
          ),
        },
        {
          createdAt: new Date(now.getTime() - 45 * 60 * 1_000),
          eventSourceId: httpSource.id,
          eventType: "http.request",
          idempotencyKey: "dev-seed-failed-request",
          payload: Buffer.from(
            await encode({
              body: {
                customer: "Globex",
                priority: "normal",
                ticketId: "SUP-1843",
              },
              method: "POST",
              path: "/support",
            }),
          ),
        },
        {
          createdAt: new Date(now.getTime() - 2 * 60 * 1_000),
          eventSourceId: httpSource.id,
          eventType: "http.request",
          idempotencyKey: "dev-seed-running-request",
          payload: Buffer.from(
            await encode({
              body: {
                customer: "Soylent",
                priority: "urgent",
                ticketId: "SUP-1844",
              },
              method: "POST",
              path: "/support",
            }),
          ),
        },
        {
          createdAt: new Date(now.getTime() - 24 * HOUR_MS),
          eventSourceId: cronSource.id,
          eventType: "cron.tick",
          idempotencyKey: "dev-seed-digest-tick",
          payload: Buffer.from(
            await encode({
              scheduledAt: new Date(now.getTime() - 24 * HOUR_MS),
            }),
          ),
        },
      ])
      .returning(["id", "idempotencyKey"])
      .execute()
    const contexts = await trx
      .insertInto("automationContext")
      .values([
        {
          automationId: triageAutomation.id,
          completedAt: new Date(now.getTime() - 3 * HOUR_MS + 12_000),
          createdAt: new Date(now.getTime() - 3 * HOUR_MS),
          status: "completed",
        },
        {
          automationId: triageAutomation.id,
          completedAt: new Date(now.getTime() - 44 * 60 * 1_000),
          createdAt: new Date(now.getTime() - 45 * 60 * 1_000),
          errorMessage: "Slack rejected the development token.",
          errorName: "SlackApiError",
          status: "failed",
        },
        {
          automationId: triageAutomation.id,
          createdAt: new Date(now.getTime() - 2 * 60 * 1_000),
          status: "running",
        },
        {
          automationId: digestAutomation.id,
          completedAt: new Date(now.getTime() - 24 * HOUR_MS + 8_000),
          createdAt: new Date(now.getTime() - 24 * HOUR_MS),
          status: "completed",
        },
      ])
      .returning(["automationId", "id", "status"])
      .execute()
    const completedContext = contexts.find(
      ({ automationId, status }) =>
        automationId === triageAutomation.id && status === "completed",
    )!
    const failedContext = contexts.find(
      ({ automationId, status }) =>
        automationId === triageAutomation.id && status === "failed",
    )!
    const runningContext = contexts.find(
      ({ automationId, status }) =>
        automationId === triageAutomation.id && status === "running",
    )!
    const digestContext = contexts.find(
      ({ automationId }) => automationId === digestAutomation.id,
    )!
    const automationEvents = await trx
      .insertInto("automationEvent")
      .values([
        {
          config: httpConfig,
          contextId: completedContext.id,
          eventId: events.find(
            ({ idempotencyKey }) =>
              idempotencyKey === "dev-seed-completed-request",
          )!.id,
          eventSubscriptionId: httpSubscription.id,
          hookSlot: 0,
        },
        {
          config: httpConfig,
          contextId: failedContext.id,
          eventId: events.find(
            ({ idempotencyKey }) =>
              idempotencyKey === "dev-seed-failed-request",
          )!.id,
          eventSubscriptionId: httpSubscription.id,
          hookSlot: 0,
        },
        {
          config: httpConfig,
          contextId: runningContext.id,
          eventId: events.find(
            ({ idempotencyKey }) =>
              idempotencyKey === "dev-seed-running-request",
          )!.id,
          eventSubscriptionId: httpSubscription.id,
          hookSlot: 0,
        },
        {
          config: cronConfig,
          contextId: digestContext.id,
          eventId: events.find(
            ({ idempotencyKey }) => idempotencyKey === "dev-seed-digest-tick",
          )!.id,
          eventSubscriptionId: subscriptions.find(
            ({ eventType }) => eventType === "cron.tick",
          )!.id,
          hookSlot: 0,
        },
      ])
      .returning(["contextId", "id"])
      .execute()
    const actions = await trx
      .insertInto("automationActionInvocation")
      .values([
        {
          actionDependencyIds: [],
          completedAt: new Date(now.getTime() - 3 * HOUR_MS + 12_000),
          contextId: completedContext.id,
          createdAt: new Date(now.getTime() - 3 * HOUR_MS + 2_000),
          description: "Post the triage summary to Slack",
          eventDependencyIds: [
            automationEvents.find(
              ({ contextId }) => contextId === completedContext.id,
            )!.id,
          ],
          inputHash: "dev-seed-send-slack-summary",
          name: "Send Slack summary",
          outcomeSeq: 2,
          output: Buffer.from(
            await encode({
              channelId: "CDEVSEED",
              timestamp: "1712345678.000100",
            }),
          ),
          slot: 0,
          status: "succeeded",
        },
        {
          actionDependencyIds: [],
          completedAt: new Date(now.getTime() - 44 * 60 * 1_000),
          contextId: failedContext.id,
          createdAt: new Date(now.getTime() - 45 * 60 * 1_000 + 2_000),
          description: "Post the triage summary to Slack",
          errorMessage: "Slack rejected the development token.",
          errorName: "SlackApiError",
          eventDependencyIds: [
            automationEvents.find(
              ({ contextId }) => contextId === failedContext.id,
            )!.id,
          ],
          inputHash: "dev-seed-failed-slack-summary",
          name: "Send Slack summary",
          outcomeSeq: 4,
          slot: 0,
          status: "failed",
        },
        {
          actionDependencyIds: [],
          contextId: runningContext.id,
          createdAt: new Date(now.getTime() - 90_000),
          description: "Post the triage summary to Slack",
          eventDependencyIds: [
            automationEvents.find(
              ({ contextId }) => contextId === runningContext.id,
            )!.id,
          ],
          inputHash: "dev-seed-running-slack-summary",
          name: "Send Slack summary",
          slot: 0,
          status: "pending",
        },
        {
          actionDependencyIds: [],
          completedAt: new Date(now.getTime() - 24 * HOUR_MS + 8_000),
          contextId: digestContext.id,
          createdAt: new Date(now.getTime() - 24 * HOUR_MS + 1_000),
          description: "Build the daily support summary",
          eventDependencyIds: [
            automationEvents.find(
              ({ contextId }) => contextId === digestContext.id,
            )!.id,
          ],
          inputHash: "dev-seed-daily-digest",
          name: "Generate daily digest",
          outcomeSeq: 7,
          output: Buffer.from(
            await encode({ openTickets: 12, resolvedTickets: 34 }),
          ),
          slot: 0,
          status: "succeeded",
        },
      ])
      .returning(["contextId", "id"])
      .execute()
    await trx
      .insertInto("automationOutput")
      .values({
        actionInvocationId: actions.find(
          ({ contextId }) => contextId === completedContext.id,
        )!.id,
        contextId: completedContext.id,
        outputIndex: 0,
        value: Buffer.from(
          await encode({
            data: { priority: "high", ticketId: "SUP-1842" },
            type: "support.ticket.triaged",
          }),
        ),
      })
      .execute()

    return {
      activeDeploymentId: activeDeployment.id,
      actionCount: actions.length,
      organization,
      supportProject,
      user,
    }
  })

  console.log(
    [
      "Seeded local development data.",
      `User: ${result.user.email} (${result.user.id})`,
      `Organization: ${result.organization.name} (${result.organization.id})`,
      `Project: ${result.supportProject.name} (${result.supportProject.id})`,
      `Active deployment: ${result.activeDeploymentId}`,
      `Seeded execution actions: ${result.actionCount}`,
      "Sign in with the one-time code sent to zachsents@gmail.com.",
    ].join("\n"),
  )
}
