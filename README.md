# Apache Airavata Next.js Portal

A modern, full-featured web portal for Apache Airavata built with Next.js 14, React 18, and TypeScript. This portal provides a complete frontend for managing computational experiments, projects, and resources through the Airavata REST API.

## Features

- **Dashboard** - Overview statistics, recent experiments, and quick actions
- **Projects Management** - Create, edit, delete, and organize research projects
- **Experiments** - Create experiments from applications, monitor status, view outputs
- **Applications** - Browse available applications and their configurations
- **Storage** - File browser for managing experiment data
- **Administration** - Manage compute resources, storage, applications, and gateways
- **Authentication** - Keycloak OAuth/OIDC integration via NextAuth.js

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **State Management**: TanStack Query (React Query) + Zustand
- **Authentication**: NextAuth.js with Keycloak provider
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios
- **Visualization**: React Flow (workflow diagrams), Recharts (charts)

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm
- Running Airavata REST API server
- Keycloak server for authentication

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd airavata-nextjs-portal
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Airavata API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080

# Default Gateway
NEXT_PUBLIC_DEFAULT_GATEWAY_ID=default

# Keycloak Configuration
KEYCLOAK_CLIENT_ID=airavata-portal
KEYCLOAK_CLIENT_SECRET=your-client-secret
KEYCLOAK_ISSUER=http://localhost:8443/realms/airavata

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── (auth)/                   # Authentication routes
│   │   └── login/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── dashboard/
│   │   ├── projects/
│   │   ├── experiments/
│   │   ├── applications/
│   │   ├── storage/
│   │   └── admin/
│   ├── api/auth/[...nextauth]/   # NextAuth API routes
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # React components
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   ├── dashboard/                # Dashboard components
│   ├── project/                  # Project components
│   ├── experiment/               # Experiment components
│   │   ├── input-editors/        # Dynamic input editors
│   │   └── output-displays/      # Output display components
│   ├── application/              # Application components
│   ├── storage/                  # Storage components
│   ├── admin/                    # Admin components
│   └── workflow/                 # Workflow visualization
├── lib/                          # Utilities and configurations
│   ├── api/                      # API client and services
│   ├── auth/                     # Authentication config
│   └── utils/                    # Helper functions
├── hooks/                        # Custom React hooks
├── store/                        # State management
└── types/                        # TypeScript type definitions
```

## API Integration

The portal connects to the Airavata REST API with endpoints at `/api/v1/`:

| Endpoint | Description |
|----------|-------------|
| `/experiments` | Experiment management |
| `/projects` | Project management |
| `/processes` | Process tracking |
| `/jobs` | Job monitoring |
| `/application-interfaces` | Application configuration |
| `/application-modules` | Application modules |
| `/compute-resources` | Compute resource management |
| `/storage-resources` | Storage resource management |
| `/data-products` | Data product management |
| `/gateways` | Gateway configuration |
| `/workflows` | Workflow management |
| `/user-resource-profiles` | User preferences |
| `/group-resource-profiles` | Group preferences |

## Development

### Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Lint code
npm run lint
```

### Code Style

- ESLint for code linting
- Prettier for code formatting
- TypeScript strict mode enabled

### Adding New Features

1. **New API endpoint**: Add service in `src/lib/api/`
2. **New hook**: Create in `src/hooks/`
3. **New component**: Add to appropriate folder in `src/components/`
4. **New page**: Create in `src/app/(dashboard)/`

## Authentication

The portal uses NextAuth.js with Keycloak as the identity provider:

1. Users authenticate via Keycloak OAuth/OIDC flow
2. JWT tokens are stored in session
3. API requests include Bearer token authorization
4. Token refresh is handled automatically

### Keycloak Setup

1. Create a new client in Keycloak
2. Configure redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
3. Enable "Client authentication" (confidential client)
4. Add client secret to environment variables

## Deployment

### Build for Production

```bash
npm run build
```

### Docker

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
ENV PORT 3000
CMD ["node", "server.js"]
```

### Environment Variables

For production, ensure all environment variables are properly set:

- `NEXT_PUBLIC_API_URL` - Airavata API URL
- `KEYCLOAK_CLIENT_ID` - Keycloak client ID
- `KEYCLOAK_CLIENT_SECRET` - Keycloak client secret
- `KEYCLOAK_ISSUER` - Keycloak issuer URL
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for session encryption

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

Licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for details.

## End-to-End Testing

For a complete walkthrough of setting up resources, creating applications, and running experiments, see [END_TO_END_TESTING.md](END_TO_END_TESTING.md).

### Quick Start Testing Flow

1. **Start Test Infrastructure** (from airavata repository):
   ```bash
   cd ../airavata/.devcontainer
   docker compose --profile test up -d
   ```

2. **Create Resources**:
   - Compute Resource: `localhost:10022` (SLURM test cluster)
   - Storage Resource: `localhost:10023` (SFTP test server)
   - Credentials: `testuser` / `testpass`

3. **Create Applications**:
   - **Echo**: Simple echo command (`/bin/echo`)
   - **Sleep**: Sleep command (`/bin/sleep`)

4. **Create Group & Profile**:
   - Create a group
   - Create group resource profile with compute preferences

5. **Run Experiments**:
   - Create project
   - Create experiments from applications
   - Launch and monitor execution

See [END_TO_END_TESTING.md](END_TO_END_TESTING.md) for detailed step-by-step instructions.

## Related Projects

- [Apache Airavata](https://github.com/apache/airavata) - Main middleware platform
- [Airavata Django Portal](https://github.com/apache/airavata-django-portal) - Reference Django implementation
- [Airavata Custos](https://github.com/apache/airavata-custos) - Identity and access management
