import "dotenv/config"
import * as env from "env-var"

export type StorageBackend = "local" | "s3"

const STORAGE_BACKEND = env
  .get("STORAGE_BACKEND")
  .default("local")
  .asEnum(["local", "s3"] as const)

const STORAGE_PATH = env.get("STORAGE_PATH").default("./uploads").asString()

// S3 Configuration
const S3_BUCKET_NAME = env.get("S3_BUCKET_NAME").asString()
const S3_REGION = env.get("S3_REGION").default("us-east-1").asString()
const S3_ACCESS_KEY_ID = env.get("S3_ACCESS_KEY_ID").asString()
const S3_SECRET_ACCESS_KEY = env.get("S3_SECRET_ACCESS_KEY").asString()
const S3_ENDPOINT = env.get("S3_ENDPOINT").asString()

const storageConfig = {
  backend: STORAGE_BACKEND,
  path: STORAGE_PATH,
  s3: {
    bucketName: S3_BUCKET_NAME,
    region: S3_REGION,
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    endpoint: S3_ENDPOINT,
  },
} as const

export default storageConfig
