import config from "./infra/config"

export const CORS_TRUSTED_ORIGINS = [
  config.app.TRUSTED_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
]
