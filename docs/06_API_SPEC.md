# NEST — API Specification
## API style
REST JSON for core CRUD and command operations.
WebSockets for live booking/status/chat where needed.
Version prefix: /api/v1

## Authentication
POST /auth/otp/request
POST /auth/otp/verify
POST /auth/social
POST /auth/refresh
POST /auth/logout
GET /me

## Customer
GET /me
PATCH /me
GET /me/addresses
POST /me/addresses
PATCH /me/addresses/:id
DELETE /me/addresses/:id

POST /service-requests
GET /service-requests/:id
POST /service-requests/:id/attachments

GET /services
GET /services/:id

GET /professionals
GET /professionals/:id
GET /professionals/:id/reviews
GET /professionals/:id/portfolio
GET /professionals/:id/availability

POST /bookings
GET /bookings
GET /bookings/:id
POST /bookings/:id/cancel
POST /bookings/:id/confirm-extra-work
POST /bookings/:id/reject-extra-work
POST /bookings/:id/review

POST /bookings/:id/payment
GET /bookings/:id/invoice

GET /favorites
POST /favorites/:professionalId
DELETE /favorites/:professionalId

GET /homes
POST /homes
GET /homes/:id/assets
POST /homes/:id/assets
GET /assets/:id
GET /assets/:id/maintenance

GET /notifications
POST /notifications/:id/read

POST /support/tickets
GET /support/tickets

## Professional
POST /professional/onboarding
GET /professional/profile
PATCH /professional/profile
POST /professional/documents
GET /professional/services
PUT /professional/services
GET /professional/availability
PUT /professional/availability
POST /professional/status

GET /professional/jobs
GET /professional/jobs/:id
POST /professional/jobs/:id/accept
POST /professional/jobs/:id/decline
POST /professional/jobs/:id/arrived
POST /professional/jobs/:id/start
POST /professional/jobs/:id/extra-work
POST /professional/jobs/:id/complete

GET /professional/earnings
GET /professional/reviews
GET /professional/analytics

## Admin
GET /admin/overview
GET /admin/bookings
GET /admin/professionals
GET /admin/professionals/:id
POST /admin/professionals/:id/approve
POST /admin/professionals/:id/reject
POST /admin/professionals/:id/request-changes
GET /admin/customers
GET /admin/services
POST /admin/services
PATCH /admin/services/:id
GET /admin/payments
GET /admin/refunds
POST /admin/refunds
GET /admin/support
PATCH /admin/support/:id
GET /admin/audit-logs

## Error format
{
  "error": {
    "code": "BOOKING_NOT_AVAILABLE",
    "message": "No professional is available for the selected time.",
    "details": {}
  },
  "requestId": "..."
}

## Security requirements
- Validate every request with DTO/schema validation.
- Authorize every resource access.
- Rate-limit OTP, auth and high-cost endpoints.
- Never trust client-provided prices.
- Server calculates final amount.
- Idempotency keys for payment/booking creation.
- Audit admin actions.
- Sanitize user-generated content.
- Signed URLs for private media.
