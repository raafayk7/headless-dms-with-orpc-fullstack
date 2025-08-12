import { NewUserSchema } from "@contract/schemas/user"
import config from "@infra/config"
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { openAPI } from "better-auth/plugins"
import { z } from "zod/v4"
import { CORS_TRUSTED_ORIGINS } from "@/constants"
import type { AppDatabase } from "../db/conn"

const beforeHooks = createAuthMiddleware(async (ctx) => {
  if (ctx.path === "/sign-up/email") {
    const validationResult = NewUserSchema.safeParse(ctx.body)

    if (!validationResult.success) {
      throw new APIError("UNPROCESSABLE_ENTITY", {
        code: "INPUT_VALIDATION_FAILED",
        message: "Input validation failed",
        data: z.flattenError(validationResult.error),
      })
    }
  }
})

// biome-ignore lint/suspicious/noExplicitAny: Need it for type inference
export const createBetterAuthInstance = <T extends Record<string, any>>(
  db: AppDatabase,
  schema?: T,
) => {
  const auth = betterAuth({
    basePath: "/auth",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema,
    }),

    emailAndPassword: {
      enabled: true,
      password: {
        hash: (password) =>
          Bun.password.hash(password, { algorithm: "argon2id" }),
        verify: ({ password, hash }) =>
          Bun.password.verify(password, hash, "argon2id"),
      },
    },
    appName: config.app.APP_NAME,
    trustedOrigins: CORS_TRUSTED_ORIGINS,
    plugins: [openAPI({ disableDefaultReference: true })],
    // https://www.better-auth.com/docs/guides/optimizing-for-performance#cookie-cache

    // TODO: add redis for shared session cache storage
    // secondaryStorage: redisThing,

    session: {
      cookieCache: { enabled: true, maxAge: 60 * 5 }, // check session in database every 5 minutes
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // update session every day
    },

    advanced: {
      database: { generateId: false }, // generate uuids via drizzle
    },

    // https://www.better-auth.com/docs/concepts/hooks#example-enforce-email-domain-restriction
    hooks: {
      before: beforeHooks,
    },
  })

  return auth
}
