# LocalStack Setup Guide

Simple setup for LocalStack S3 emulator for local development.

## Prerequisites

- Docker installed and running
- Environment variables configured (already done in `.env`)

## Quick Setup

### 1. Start LocalStack

```bash
# Start LocalStack with S3 service
docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 \
  localstack/localstack:latest
```
or 

```bash
sudo docker run --rm -it -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack:latest

```

### 2. Create S3 Bucket

```bash
# Using AWS CLI with LocalStack endpoint
aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket

# or if u don't have .env variables
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket

# Or using LocalStack CLI
localstack start
awslocal s3 mb s3://my-bucket
```

### 3. Verify Setup

```bash
# List buckets to verify
aws --endpoint-url=http://localhost:4566 s3 ls

#or if u don't have .env variables
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 aws --endpoint-url=http://localhost:4566 s3 ls

# Should show: my-bucket
```

## Environment Variables

Your `.env` file already has the correct configuration:

```bash
STORAGE_BACKEND=s3
S3_BUCKET_NAME=my-bucket
S3_ENDPOINT=http://localhost:4566
S3_ACCESS_KEY_ID=test
S3_SECRET_ACCESS_KEY=test
S3_REGION=us-east-1
```

## Testing Storage

Once LocalStack is running, your storage service will automatically use it:

```typescript
// The S3StorageStrategy will connect to LocalStack
// No code changes needed - just environment variables
```

To check saved files

```bash
AWS_ACCESS_KEY_ID=test AWS_SECRET_ACCESS_KEY=test AWS_DEFAULT_REGION=us-east-1 aws --endpoint-url=http://localhost:4566 s3 ls s3://my-bucket --recursive
```

## Troubleshooting

### LocalStack Not Starting
```bash
# Check if port 4566 is available
lsof -i :4566

# If occupied, kill the process or use different port
```

### Bucket Creation Fails
```bash
# Ensure LocalStack is fully started
curl http://localhost:4566/_localstack/health

# Should return healthy status
```

### Connection Issues
```bash
# Test S3 connection
aws --endpoint-url=http://localhost:4566 s3 ls

# If this fails, LocalStack isn't ready yet
```

## Development Workflow

1. **Start LocalStack**: `docker run --rm -it -p 4566:4566 localstack/localstack:latest`
2. **Create bucket**: `aws --endpoint-url=http://localhost:4566 s3 mb s3://my-bucket`
3. **Run your app**: `bun run dev`
4. **Test uploads**: Your storage service will use LocalStack automatically

## Production vs Development

- **Development**: Uses LocalStack (S3_ENDPOINT=http://localhost:4566)
- **Production**: Uses real S3 (no S3_ENDPOINT, or set to real S3 endpoint)

The storage service automatically switches based on environment variables.
