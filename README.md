# Headless Document Management System (DMS)

A production-ready, headless Document Management System built with modern TypeScript, Effect, and clean architecture principles. This system provides secure document storage, user management, and role-based access control with both RESTful and RPC API interfaces.

## 🏗️ Architecture

This project follows a **clean, layered architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Monorepo Structure                       │
├─────────────────────────────────────────────────────────────┤
│  packages/          │  apps/                               │
│  ├── domain/        │  └── backend/                        │
│  ├── application/   │      ├── infra/                      │
│  ├── contract/      │      ├── web/                        │
│  └── typescript-config/ │  └── scripts/                   │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

- **Domain Layer**: Core business logic and entities
- **Application Layer**: Use cases and workflows
- **Contract Layer**: API definitions and schemas
- **Infrastructure Layer**: Database, storage, and external services
- **Web Layer**: HTTP handlers and routing

## 🚀 Quick Start

### Prerequisites

- **Bun** >= 1.2.16
- **PostgreSQL** >= 14
- **Node.js** >= 18 (for compatibility)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd headless-dms-with-orpc-fullstack

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dms_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key
HASH_SECRET=your-hash-secret
DOCS_AUTH_PASS=your-docs-password

# Application
NODE_ENV=production
PORT=3000
APP_NAME=Headless DMS

# Storage
STORAGE_BACKEND=local
STORAGE_PATH=./uploads

# CORS
CORS_TRUSTED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Database Setup

```bash
# Generate database migrations
bun run db:generate

# Run migrations
bun run db:migrate

# Seed the database (optional)
bun run db:seed
```

### Development

```bash
# Start development server
bun run dev

# Run tests
bun run test

# Lint code
bun run lint

# Type check
bun run check-types
```

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:3000`
- **Production**: `https://yourdomain.com`

### API Endpoints

#### Authentication
- `POST /auth/sign-up/email` - User registration
- `POST /auth/sign-in/email` - User login
- `POST /auth/sign-out` - User logout
- `GET /auth/session` - Get current session

#### Documents (Admin Only)
- `GET /api/document` - List documents with filtering
- `GET /api/document/:id` - Get document by ID
- `POST /api/document/upload` - Upload document
- `PATCH /api/document/:id` - Update document
- `DELETE /api/document/:id` - Delete document
- `GET /api/document/:id/download-link` - Generate download link

#### Users (Admin Only)
- `GET /api/user` - List users with filtering
- `GET /api/user/:id` - Get user by ID
- `PATCH /api/user/:id/role` - Update user role
- `DELETE /api/user/:id` - Delete user

#### File Downloads
- `GET /api/files/download?token=<token>` - Download file by token

### Interactive Documentation

Access the interactive API documentation at:
- **Development**: `http://localhost:3000/docs`
- **Production**: `https://yourdomain.com/docs`

## 🔧 Configuration

### Storage Backends

#### Local Storage
```env
STORAGE_BACKEND=local
STORAGE_PATH=./uploads
```

#### S3 Storage
```env
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket
```

### Database Configuration

The system uses PostgreSQL with Drizzle ORM. Configure your database connection:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dms_db
```

### Authentication

Better-Auth handles authentication with session-based security:

```env
JWT_SECRET=your-super-secret-jwt-key
HASH_SECRET=your-hash-secret
```

## 🚀 Deployment

### Docker Deployment

```bash
# Build the application
bun run build

# Run with Docker
docker build -t headless-dms .
docker run -p 3000:3000 --env-file .env headless-dms
```

### Production Build

```bash
# Build all packages
bun run build

# Start production server
bun run start
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@db:5432/dms
JWT_SECRET=production-secret-key
HASH_SECRET=production-hash-secret
STORAGE_BACKEND=s3
AWS_ACCESS_KEY_ID=your-production-key
AWS_SECRET_ACCESS_KEY=your-production-secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-production-bucket
CORS_TRUSTED_ORIGINS=https://yourdomain.com
```

## 🔒 Security

### Authentication & Authorization

- **Session-based authentication** with secure HTTP-only cookies
- **Role-based access control** (Admin/User roles)
- **Argon2id password hashing** for security
- **JWT tokens** for download links with expiration

### Data Protection

- **Input validation** with Effect Schema
- **SQL injection protection** via Drizzle ORM
- **CORS configuration** for trusted origins
- **File type validation** and size limits

### Security Headers

The application includes security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Content-Security-Policy` (configurable)

## 📊 Monitoring & Observability

### Logging

The application provides structured logging:
- Request/response logging
- Error tracking
- Authentication events
- File operations

### Health Checks

Monitor application health:
- `GET /health` - Basic health check
- Database connectivity
- Storage backend availability

## 🧪 Testing

```bash
# Run all tests
bun run test

# Run tests with coverage
bun run test:coverage

# Run specific test suites
bun test packages/domain
bun test packages/application
bun test apps/backend
```

## 📦 Package Management

This project uses **Bun** as the package manager and runtime:

```bash
# Install dependencies
bun install

# Add new dependency
bun add <package-name>

# Add dev dependency
bun add -d <package-name>

# Update dependencies
bun update
```

## 🔄 Database Migrations

```bash
# Generate new migration
bun run db:generate --name migration-name

# Apply migrations
bun run db:migrate

# Rollback migrations (if supported)
bun run db:rollback

# View database schema
bun run db:studio
```

## 🛠️ Development Tools

### Code Quality

- **Biome**: Linting and formatting
- **TypeScript**: Static type checking
- **Effect Schema**: Runtime validation

### Development Commands

```bash
# Start development server with hot reload
bun run dev

# Lint and fix code
bun run lint:fix

# Type check
bun run check-types

# Build for production
bun run build
```

## 📈 Performance

### Optimization Features

- **Connection pooling** for database
- **File streaming** for large downloads
- **Caching** for session management
- **Compression** for API responses

### Scaling Considerations

- **Horizontal scaling** with load balancers
- **Database connection pooling**
- **CDN integration** for file storage
- **Redis caching** for sessions (optional)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards

- Follow TypeScript best practices
- Use Effect Schema for validation
- Maintain immutable patterns in domain layer
- Write comprehensive tests
- Document public APIs

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the API documentation at `/docs`
- Review the code examples in the test files

## 🔗 Related Links

- [Effect Documentation](https://effect.website/)
- [Better-Auth Documentation](https://www.better-auth.com/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Bun Documentation](https://bun.sh/docs)