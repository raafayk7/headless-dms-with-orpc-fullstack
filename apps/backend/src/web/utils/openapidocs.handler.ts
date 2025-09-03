import { OpenAPIGenerator } from "@orpc/openapi"
// import { experimental_ZodToJsonSchemaConverter as ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
// import { ZodToJsonSchemaConverter } from "@orpc/zod"
import type { Hono } from "hono"
import { serveStatic } from "hono/bun"
import type { MiddlewareHandler } from "hono/types"
import type { DependencyContainer } from "tsyringe"
import { resolveAuthFromContainer } from "@/infra/auth/better-auth"
import config from "@/infra/config"
import { router } from "../router"
import { EffectSchemaConverter } from "./effect-schema-converter"

const BASIC_AUTH_STR = `docs:${config.auth.DOCS_AUTH_PASS}`
const BASIC_AUTH_STR_ENC = Buffer.from(BASIC_AUTH_STR, "ascii").toString(
  "base64",
)
const EXPECTED_BASIC_AUTH_HEADER = `Basic ${BASIC_AUTH_STR_ENC}`

const docsBasicAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header("Authorization")
  if (!auth || auth !== EXPECTED_BASIC_AUTH_HEADER) {
    return c.text("Cannot access the docs", 401, {
      "WWW-Authenticate": "Basic",
    })
  }

  return await next()
}

const generator = new OpenAPIGenerator({
  // schemaConverters: [new ZodToJsonSchemaConverter()],
  schemaConverters: [new EffectSchemaConverter()],
})

export const addOpenApiDocs = async (
  app: Hono,
  container: DependencyContainer,
) => {
  const auth = resolveAuthFromContainer(container)
  const authSpecs = await auth.api.generateOpenAPISchema({
    // basePath: "/auth"
  })
  
  // Debug: Log the generated paths
  console.log("🔍 Auth OpenAPI paths:", Object.keys(authSpecs.paths || {}))
  
  // Configure server URLs for Better-Auth
  const baseUrl = config.app.BASE_URL
  
  authSpecs.servers = [
    { 
      url: baseUrl, 
      description: config.app.NODE_ENV === "production" ? "Production Server" : "Development Server" 
    } as any
  ]
  
  const authTag = {
    name: "auth",
    description: "Authentication with BetterAuth",
  }
  authSpecs.tags = authSpecs.tags.map((t) => {
    if (t.name !== "Default") return t

    return authTag
  })
  
  // Fix the paths to include the /auth prefix and update tags
  authSpecs.paths = Object.fromEntries(
    Object.entries(authSpecs.paths).map(([uri, specs]) => {
      // Ensure all auth paths start with /auth
      const correctedUri = uri.startsWith('/auth') ? uri : `/auth${uri}`
      
      // Update tags
      if (specs.get?.tags) {
        specs.get.tags = specs.get.tags.map((t) =>
          t === "Default" ? "auth" : t,
        )
      }
      if (specs.post?.tags) {
        specs.post.tags = specs.post.tags.map((t) =>
          t === "Default" ? "auth" : t,
        )
      }

      return [correctedUri, specs]
    }),
  )

  const contractSpecs = await generator.generate(router, {
    info: {
      title: "Headless DMS API",
      version: "1.0.0",
    },
    servers: [
      { 
        url: `${baseUrl}/api`, 
        description: "JSON-REST API" 
      }
    ],
  })

  // if (authSpecs.components?.securitySchemes) {
  //   contractSpecs.components = contractSpecs.components || {}
  //   contractSpecs.components.securitySchemes =
  //     contractSpecs.components.securitySchemes || {}
  //   contractSpecs.components.securitySchemes = {
  //     ...contractSpecs.components.securitySchemes,
  //     ...authSpecs.components.securitySchemes,
  //   }
  //   contractSpecs.security = contractSpecs.security || []
  //   contractSpecs.security.push(...(authSpecs.security || []))
  // }

  return app
    .get("/spec/better-auth.json", docsBasicAuth, (c) => c.json(authSpecs))
    .get("/spec/contract.json", docsBasicAuth, (c) => c.json(contractSpecs))
    .get("/docs", docsBasicAuth, serveStatic({ path: "static/scalar.html" }))
}
