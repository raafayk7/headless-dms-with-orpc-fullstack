// biome-ignore assist/source/organizeImports: Need reflect-metadata for decorators
import "reflect-metadata"

import { Hono } from "hono"
import { showRoutes } from "hono/dev"
import { logger } from "hono/logger"
import { cors } from "hono/cors"
import { addOpenApiHandler } from "./web/utils/openapi.handler"
import { addRpcHandler } from "./web/utils/rpc.handler"
import { container } from "tsyringe"
import config from "@/infra/config"
import { addOpenApiDocs } from "./web/utils/openapidocs.handler"
import { wireDi } from "@/infra/di"
import { CORS_TRUSTED_ORIGINS } from "@/constants"
import { DocumentWorkflows } from "@application/workflows"
import { getFileStreamingOptions, getContentDisposition, getCacheHeaders } from "./web/utils/file-streaming.utils"


// =============================================================================
// BOOTSTRAP FUNCTIONS
// =============================================================================

function loadConfigs() {
  console.log("📋 Loading configurations...")
  
  // Validate essential configs
  if (!config.db.DB_URL) {
    throw new Error("Database URL is required")
  }
  if (!config.auth.JWT_SECRET) {
    throw new Error("JWT secret is required")
  }
  if (!config.auth.HASH_SECRET) {
    throw new Error("Hash secret is required")
  }
  
  console.log("✅ Configurations loaded successfully")
  console.log(`   Environment: ${config.app.NODE_ENV}`)
  console.log(`   Port: ${config.app.PORT}`)
  console.log(`   Storage Backend: ${config.storage.backend}`)
  
  return config
}

function initializeDI() {
  console.log("🔧 Initializing dependency injection...")
  wireDi()
  console.log("✅ Dependency injection initialized")
}

function addFileDownloadRoute(app: Hono, container: any) {
  // Direct file download route that bypasses ORPC validation
  app.get("/api/files/download", async (c) => {
    try {
      const token = c.req.query("token")
      
      if (!token) {
        return c.json({ error: "Token is required" }, 400)
      }
      
      const documentWorkflows = container.resolve(DocumentWorkflows)
      const result = await documentWorkflows.downloadDocumentByToken(token)
      
      if (result.isErr()) {
        const error = result.unwrapErr()
        return c.json({ error: error.message }, 404)
      }
      
      const { document, file } = result.unwrap()
      
      // Get enhanced file streaming options
      const streamingOptions = getFileStreamingOptions(document.name, document.mimeType, file)
      const contentDisposition = getContentDisposition(document.name, streamingOptions.mimeType)
      const cacheHeaders = getCacheHeaders(streamingOptions.mimeType)
      
      // Return streaming file response with proper headers
      return new Response(streamingOptions.fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': streamingOptions.mimeType,
          'Content-Length': streamingOptions.fileSize.toString(),
          'Content-Disposition': contentDisposition,
          'Accept-Ranges': 'bytes',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          ...cacheHeaders,
        },
      })
    } catch (error) {
      console.error("File download error:", error)
      return c.json({ error: "Internal server error" }, 500)
    }
  })
}



function createServer(): Hono {
  console.log("🚀 Creating Hono server...")
  
  const app = new Hono()
  
  // Add middleware
  app.use(logger())
  app.use(
    "/*",
    cors({
      origin: CORS_TRUSTED_ORIGINS,
      allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH", "HEAD"],
      credentials: true,
      exposeHeaders: ["Set-Cookie"],
    }),
  )
  
  // Add direct file download route FIRST (before ORPC to avoid conflicts)
  addFileDownloadRoute(app, container)
  
  // Add route handlers
  addRpcHandler(app, container)
  addOpenApiDocs(app, container)
  addOpenApiHandler(app, container)
  
  // Add Better-Auth routes
  const { initAuthRouter } = require("./web/router/auth")
  initAuthRouter(app, container)
  
  console.log("✅ Hono server created successfully")
  return app
}



function setupGracefulShutdown(server: any) {
  const shutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, initiating graceful shutdown...`)
    
    try {
      // Close server
      if (server) {
        await server.close()
        console.log("✅ Server closed")
      }
      
      console.log("✅ Graceful shutdown completed")
      process.exit(0)
    } catch (error) {
      console.error("❌ Error during shutdown:", error)
      process.exit(1)
    }
  }
  
  process.on("SIGTERM", () => shutdown("SIGTERM"))
  process.on("SIGINT", () => shutdown("SIGINT"))
  
  console.log("✅ Graceful shutdown handlers configured")
}

// =============================================================================
// MAIN BOOTSTRAP ORCHESTRATOR
// =============================================================================

async function bootstrap() {
  try {
    console.log("🚀 Starting Headless DMS application...")
    console.log("=" .repeat(50))
    
    // Step 1: Load configurations
    const configs = loadConfigs()
    
    // Step 2: Initialize dependency injection
    initializeDI()
    
    // Step 3: Create server
    const app = createServer()
    
    // Step 4: Setup graceful shutdown
    setupGracefulShutdown(app)
    
    // Step 6: Start server
    console.log(`\n🌐 Starting server on port ${configs.app.PORT}...`)
    
    const server = Bun.serve({
      port: configs.app.PORT,
      fetch: app.fetch,
    })
    
    console.log(`✅ Server started successfully!`)
    console.log(`   URL: http://localhost:${configs.app.PORT}`)
    console.log(`   Environment: ${configs.app.NODE_ENV}`)
    console.log("=" .repeat(50))
    
    return { app, server, configs }
  } catch (error) {
    console.error("❌ Bootstrap failed:", error)
    process.exit(1)
  }
}

// =============================================================================
// APPLICATION ENTRY POINT
// =============================================================================

// Start the application
if (import.meta.main) {
  await bootstrap()
}

export { bootstrap }
