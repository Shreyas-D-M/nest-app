# NEST — Architecture
## Monorepo
Use pnpm workspaces + Turborepo.

apps/
- customer-mobile
- professional-mobile
- admin-web
- api

packages/
- ui
- types
- validation
- config
- eslint-config
- tsconfig

## Mobile
React Native + Expo + TypeScript.
Navigation: Expo Router.
State:
- TanStack Query for server state.
- Lightweight local state for UI.
Do not duplicate server state into global state unnecessarily.

## Backend
NestJS + TypeScript.
Modules:
auth
users
addresses
services
service-requests
professionals
availability
bookings
payments
reviews
messaging
notifications
homes
assets
vehicles
support
admin
trust
ai

## Database
PostgreSQL with Prisma or Drizzle. Choose one and standardize; Prisma is preferred for initial developer velocity.

## Cache/queues
Redis.
Use for:
- short-lived availability data
- rate limits
- job queues
- notification processing
Do not use Redis as the source of truth.

## Realtime
WebSockets for:
- booking status
- professional location during active jobs
- chat typing/read status if required

## Storage
S3-compatible object storage or Cloudinary for:
- profile images
- documents
- portfolio
- job evidence
- customer attachments

## External integrations
- Auth: Firebase Auth or equivalent
- Maps: Google Maps/Places/Routes
- Payments: Razorpay
- Push: Firebase Cloud Messaging
- Email/SMS: provider selected during implementation
- AI: provider abstraction behind a service interface

## Environments
development
staging
production

Separate databases and secrets.

## CI/CD
GitHub Actions:
- lint
- typecheck
- unit tests
- integration tests
- build
- deploy staging
Production deployment requires approval.

## Observability
- structured logs
- request IDs
- error monitoring
- API latency metrics
- booking funnel metrics
- payment failure metrics

## Security
- secrets only in environment/secret manager
- least-privilege DB credentials
- encrypted transport
- secure token storage on mobile
- RBAC for admin
- audit logs
- PII minimization
- retention policy for documents

## Booking consistency
Booking creation must be transactional.
Do not allow double-booking through client-side checks alone.
Use database constraints/transactional locking as appropriate.

## Availability
Initial V1 can use service-area + availability windows.
Later add geospatial ranking and live location.

## Professional matching
Initial score can combine:
- service match
- availability
- distance
- Trust Score
- customer preference
- response reliability

Keep the scoring function versioned and explainable.

## AI architecture
Create an AI gateway:
AIService
- classifyRequest()
- generateClarifyingQuestion()
- summarizeRequest()
- translateRequest()

Store model/version and confidence with AI results.
Never let the model directly mutate booking/payment state.

## Deployment recommendation
Initial:
- Expo/EAS for mobile builds
- managed PostgreSQL
- managed Redis
- containerized NestJS API
- managed object storage
- managed monitoring

Scale infrastructure only when traffic justifies it.
