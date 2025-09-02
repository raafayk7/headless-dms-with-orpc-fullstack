# Database Seeding

This directory contains scripts for seeding the database with test data for the Headless DMS.

## Seed Script

The `seed.ts` script creates realistic test data for development and testing purposes using Faker.js.

### What it creates:

- **5 Users**:
  - 1 Admin user: `admin@dms.local`
  - 4 Regular users: `user1@dms.local`, `user2@dms.local`, etc.
  - Password: Configurable via `SEED_PASSWORD` (default: `password123`)
  - All users have email verified: `true`

- **10 Documents** with 4 file types:
  - **TXT files**: Lorem ipsum text content
  - **PDF files**: Simple PDF format with document titles
  - **JPG files**: Minimal JPEG format with dummy data
  - **PNG files**: Minimal PNG format with dummy data
  - All files are **actually uploaded** to your configured storage backend (local or S3)

### Usage:

```bash
# Run with default password (development)
bun run db:seed

# Run with custom password (recommended for shared environments)
SEED_PASSWORD="your-secure-password" bun run db:seed

# Or set in your .env file
echo "SEED_PASSWORD=your-secure-password" >> .env
bun run db:seed
```

### Security Considerations:

- **Default Password**: Default password is provided for convenience in local development
- **Environment Variables**: Use environment variables to override defaults in shared or production-like environments
- **Never commit sensitive data**: Add any custom `.env` files to `.gitignore`
- **Production Safety**: This script should only be used in development/testing environments

### Features:

- **Configurable**: Password can be set via environment variables
- **Idempotent**: Safe to run multiple times - won't create duplicates
- **Password Security**: Uses proper Argon2id hashing via Bun's password API
- **Realistic Data**: Uses Faker.js for realistic user names, document names, and metadata
- **Real File Storage**: Actually uploads files to your configured storage backend
- **Authentication Ready**: Creates both user and account records for email/password auth
- **Multiple File Types**: Generates TXT, PDF, JPG, and PNG files with proper MIME types
- **Rich Metadata**: Each document includes realistic metadata (author, department, project, etc.)
- **Tag System**: Documents include relevant tags for categorization

### Database Requirements:

Make sure your database migrations are up to date before running the seed:

```bash
bun run db:migrate
```

### Testing Login:

After seeding, you can test login with the credentials you configured:

**Default credentials:**
- Email: `test@dev.com`
- Password: `testpass`

**Custom credentials:**
- Use the values you set in environment variables
