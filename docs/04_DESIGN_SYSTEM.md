# NEST — Design System
## Design direction
Premium, calm, local, personal. Avoid generic marketplace UI.

Reference mood:
- Apple-like restraint
- Airbnb-like confidence in cards and photography
- modern fintech-like clarity
- warm local-service personality

## Brand personality
Trustworthy, calm, capable, friendly, modern.

## Color tokens
Use semantic tokens so the palette can change without rewriting components.

Primary:
- NEST Ink: #101614
- NEST Forest: #123B32
- NEST Sage: #DCE8E1
- NEST Cream: #F7F5EF
- NEST White: #FFFFFF

Supporting:
- Text Primary: #101614
- Text Secondary: #65716C
- Border: #E4E8E5
- Success: #237A55
- Warning: #B7791F
- Danger: #C44536
- Info: #3B6EA8

Use color sparingly. The app should feel mostly light, with dark ink text and restrained green accents.

## Typography
Mobile:
- Display: 30–34 px, semibold
- H1: 24–28 px, semibold
- H2: 20–22 px, semibold
- Body: 16 px
- Secondary: 14 px
- Caption: 12–13 px

Use Inter or SF Pro on Apple platforms and a comparable Android system font fallback.

## Spacing
Base unit: 4 px.
Common spacing: 8, 12, 16, 20, 24, 32.

## Radius
- Small: 10
- Medium: 16
- Large: 24
- Pill: 999

Avoid excessive rounded rectangles. Use shape intentionally.

## Buttons
Primary: dark ink background, white text.
Secondary: light neutral surface.
Success/action: forest.
Danger: red only for destructive actions.
Buttons should have clear pressed states.

## Cards
Cards should be content-led, not decorative.
Professional cards show:
- name
- rating
- Trust Score
- distance
- availability
- starting estimate
- primary CTA

## Icons
Use a consistent outline icon set.
Do not mix icon families.
Icons must have labels where meaning is not obvious.

## Navigation
Customer: bottom tab bar with Home, Explore, Bookings, You.
Professional: Home, Jobs, Earnings, Business.

## Motion
Use subtle 150–250 ms transitions.
Use spring animation for:
- booking confirmation
- favorite toggle
- status changes
Avoid animation on every element.

## Home screen hierarchy
1. Greeting/location
2. Problem input
3. Quick categories
4. Available Now
5. Your People
6. Home Passport
7. Local recommendations

## Problem input component
Large, high-contrast card:
"Tell us what happened..."
Microphone icon
Photo icon
Send action

## Professional card variants
- Recommended
- Fastest
- Cheapest
- Most experienced
- Preferred professional

Never imply a ranking is objective unless the ranking algorithm is defined.

## Trust Score
Always show why the score exists.
Use a ring or horizontal meter plus expandable breakdown.

## Empty states
Be helpful:
- Explain why it is empty.
- Provide the next action.
Example: "No professionals are available right now. Try 6 PM or widen your service area."

## Accessibility
- Minimum 44x44 pt touch targets.
- Good contrast.
- Dynamic text support.
- Screen-reader labels.
- Do not encode status using color alone.

## Localization
Design for longer strings.
Support English first; prepare for Kannada/Hindi/Hinglish.
Do not bake strings into UI code.

## Design anti-patterns
Do not:
- copy Urban Company layouts;
- use endless category grids;
- overuse gradients;
- use fake urgency;
- hide fees;
- use star ratings without context;
- overload the home screen.
