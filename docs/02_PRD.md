# NEST — Product Requirements Document (PRD)
## V1 scope

### P0 Customer features
- Phone OTP authentication
- Google/Apple sign-in where supported
- Location and saved addresses
- Home dashboard
- Problem-first service request
- Text input
- Voice input
- Optional photo/video attachment
- Service recommendation
- Professional discovery
- Filters: availability, distance, rating, price, experience
- Professional profile
- Trust Score
- Portfolio
- Service menu
- Booking
- Date/time selection
- ASAP/Available Now where supported
- Estimate and fee breakdown
- Customer approval for additional work
- In-app chat
- Call action
- Booking timeline
- Payment
- Invoice/receipt
- Rating/review
- Favorites / Your People
- Booking history
- Basic Home Passport
- Notifications
- Help/support

### P0 Professional features
- Registration/login
- Identity/KYC workflow
- Service/category selection
- Service area
- Working hours
- Online/offline status
- Job requests
- Accept/decline
- Job details
- Customer location
- Navigation handoff
- Start/complete service
- Add extra work request
- Upload before/after evidence
- Earnings
- Booking history
- Reviews
- Profile/storefront
- Basic analytics

### P0 Admin features
- Admin authentication/RBAC
- Customer management
- Professional verification queue
- Service/category management
- Professional/service-area management
- Booking management
- Payment/refund visibility
- Dispute/support queue
- Review moderation
- Basic analytics
- Audit log

## P1
- Kannada/Hindi/Hinglish UI
- AI problem assistant
- Live professional location
- Recurring maintenance reminders
- Home Passport expansion
- My Garage
- Coupons/referrals
- Professional subscriptions
- Advanced analytics
- Scheduled maintenance

## P2
- Apartment society accounts
- Business accounts
- Parts/material marketplace
- Warranty integrations
- Predictive maintenance
- Loyalty membership
- Automated low-risk support resolution

## User stories

### Customer
As a customer, I can describe my problem in natural language so I don't need to know the exact service category.
As a customer, I can compare professionals before choosing.
As a customer, I can see meaningful trust information.
As a customer, I can book someone now or later.
As a customer, I can approve/reject extra work.
As a customer, I can rebook a trusted professional.
As a customer, I can see what was done previously.
As a customer, I can get support when something goes wrong.

### Professional
As a professional, I can create a business profile.
As a professional, I can control when I am available.
As a professional, I can accept jobs that fit my service area.
As a professional, I can earn and track my money.
As a professional, I can build repeat business.
As a professional, I can document work completed.

## Core booking states
REQUESTED → ACCEPTED → ARRIVING → ARRIVED → IN_PROGRESS → EXTRA_APPROVAL_PENDING (optional) → COMPLETED → PAYMENT_PENDING → PAID → REVIEWED

Cancellation may occur before completion, subject to policy.

## Cancellation policy principles
- Customer should see cancellation terms before confirmation.
- No fee for early cancellation where practical.
- Late cancellation/no-show fees must be transparent.
- Professional cancellation should trigger reassignment/support.
- Repeated abusive cancellations may reduce marketplace privileges.
- Exact fee rules should be configurable by service.

## Payment rules
- Customer sees an estimated or fixed price before confirmation.
- Fixed-price services should not silently change.
- Variable jobs require inspection/quotation.
- Additional work requires explicit customer approval.
- Every completed booking creates an invoice/receipt.
- Refunds are handled through an auditable admin flow.

## Trust & safety
- Never claim "verified" unless the defined verification step is complete.
- Store verification status and expiry where relevant.
- Professionals should have clear identity/business information.
- Customer and professional should have report/block/support options.
- High-risk categories may require extra verification.
- Keep a booking audit trail.
- Minimize sensitive personal data.
- Do not expose exact customer address until operationally necessary.
- Do not allow AI to approve charges, diagnose dangerous faults, or make safety-critical decisions.

## AI requirements
AI is a routing and assistance layer.
It may:
- classify a service request;
- ask clarifying questions;
- summarize a customer problem;
- suggest relevant service types;
- help find matching professionals;
- translate common requests;
- summarize job history.

AI must:
- show uncertainty where appropriate;
- allow manual correction;
- avoid claiming professional-level diagnosis;
- escalate safety-critical cases;
- never silently change price or booking details.

## Success metrics
North-star metric:
- Completed, successfully resolved local service jobs per active household per month.

Supporting metrics:
- Search/request → booking conversion
- Booking completion rate
- Median time to professional acceptance
- Median time to arrival
- Repeat booking rate
- Professional acceptance rate
- Cancellation rate
- Refund/dispute rate
- Average Trust Score of active professionals
- Customer rating
- 30/90-day customer retention
- Professional 30/90-day retention
- Average jobs per active professional
- Contribution margin per completed job

## Launch gates
Do not expand beyond initial service zones until:
- booking completion is reliable;
- support/dispute process works;
- enough professionals are active in each launched category;
- repeat usage shows real demand;
- payment/refund reconciliation is reliable.
