# Database Seeding

This directory contains scripts for seeding the database with test data.

## Seed Script

The `seed.ts` script creates initial test data for development and testing purposes.

### What it creates:

- **Test User**:
  - Email: Configurable via `SEED_USER_EMAIL` (default: `test@dev.com`)
  - Password: Configurable via `SEED_USER_PASSWORD` (default: `testpass`)
  - Name: Configurable via `SEED_USER_NAME` (default: `Test User`)
  - Email verified: `true`

- **Grocery Lists**: 3 sample grocery lists with realistic items:
  - **Weekly Groceries**: Regular shopping items (6 items)
  - **Party Supplies**: Party-related items (5 items)
  - **Healthy Meal Prep**: Healthy meal prep ingredients (7 items)

### Usage:

```bash
# Run with default credentials (development)
bun run db:seed

# Run with custom credentials (recommended for shared environments)
SEED_USER_EMAIL="dev@example.com" SEED_USER_PASSWORD="secure123" bun run db:seed

# Or set in your .env file
echo "SEED_USER_EMAIL=dev@yourcompany.com" >> .env
echo "SEED_USER_PASSWORD=your-secure-password" >> .env
bun run db:seed
```

### Security Considerations:

- **Default Credentials**: Default credentials are provided for convenience in local development
- **Environment Variables**: Use environment variables to override defaults in shared or production-like environments
- **Never commit sensitive data**: Add any custom `.env` files to `.gitignore`
- **Production Safety**: This script should only be used in development/testing environments

### Features:

- **Configurable**: Credentials can be set via environment variables
- **Idempotent**: Safe to run multiple times - won't create duplicates
- **Password Security**: Uses proper Argon2id hashing via Bun's password API
- **Realistic Data**: Contains realistic grocery items with categories and notes
- **Authentication Ready**: Creates both user and account records for email/password auth

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
