# Domain layer

Server-authoritative business logic lives here.

## Why this directory exists

CLAUDE.md requires that the server is the only authority for prices, permissions
and booking state, and that booking, pricing, permissions, payments and Trust
Score logic are covered by tests. Code in this directory is therefore:

- **framework-free** — no NestJS decorators, no HTTP types, no Prisma client, so
  it can be unit-tested directly and quickly;
- **pure where possible** — decisions in, decisions out; persistence and
  transport happen in the surrounding modules;
- **not shared with clients** — it is deliberately not published as a workspace
  package, because a client that can re-derive a price can disagree with the
  server about one.

## What will live here

| Phase | Contents |
| --- | --- |
| Booking state machine | Legal state transitions, guards, cancellation policy evaluation |
| Pricing | Estimate and final-amount calculation in integer minor units |
| Permissions | Role and ownership checks, independent of the auth provider |
| Trust Score | Score computation, once the formula is defined and versioned |
| Matching | The versioned, explainable professional-ranking function |

## Phase 0 status

Empty. No business rules have been approved for implementation yet, and a
placeholder implementation of any of the above would be exactly the "placeholder
business logic in production paths" that CLAUDE.md prohibits.
