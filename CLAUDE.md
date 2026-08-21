# NEST — Claude Code Instructions

## Mission
Build NEST, a hyperlocal service marketplace and personal maintenance assistant. Read all files in /docs before implementing any feature.

## Mandatory source of truth
- docs/01_PRODUCT_VISION.md
- docs/02_PRD.md
- docs/03_USER_FLOWS.md
- docs/04_DESIGN_SYSTEM.md
- docs/05_DATABASE.md
- docs/06_API_SPEC.md
- docs/07_ARCHITECTURE.md

If code conflicts with these documents, stop and explain the conflict before making a broad architectural change.

## Engineering rules
- TypeScript everywhere possible.
- Strict TypeScript.
- No `any` unless explicitly justified.
- Reuse existing components.
- No duplicate business logic.
- Validate all external input.
- Server is authoritative for prices, permissions and booking state.
- Never hardcode secrets.
- Never commit .env files.
- Use migrations for database changes.
- Add tests for booking, pricing, permissions, payments and Trust Score logic.
- Use UTC timestamps internally.
- Monetary values must use integer minor units or precise decimal types.
- Use idempotency for booking/payment commands.
- Do not expose private customer addresses unnecessarily.
- Do not claim professional verification unless the verification status is complete.
- Do not allow AI to mutate payments/bookings directly.
- Prefer simple, maintainable code over clever abstractions.

## UI rules
- Follow DESIGN_SYSTEM.md.
- Do not copy Urban Company or another competitor's UI.
- Avoid generic category-grid-heavy screens.
- Keep the home screen focused on "What do you need help with?"
- Every screen needs a clear primary action.
- Support accessibility and dynamic text.
- Use reusable components from packages/ui.
- Keep strings externalizable for localization.

## Git rules
Before major changes:
1. Inspect current branch and status.
2. Make focused changes.
3. Run lint/typecheck/tests.
4. Summarize changed files and tests.
5. Never reset/delete user work without explicit permission.

## Implementation workflow
For each feature:
1. Restate the relevant requirement.
2. Inspect existing code.
3. Plan the smallest coherent change.
4. Implement.
5. Test.
6. Report what changed and any assumptions.

## Do not
- Build all apps in one giant pass.
- Add dependencies without explaining why.
- Rewrite working modules just for style.
- Generate fake payment integrations.
- Fake verification.
- Invent backend APIs that are not documented.
- Use placeholder business logic in production paths.

## First task
Do not build features immediately. First:
1. Inspect repository.
2. Confirm whether it is empty or existing.
3. Propose the monorepo skeleton.
4. Wait for approval before implementing the first major feature.
