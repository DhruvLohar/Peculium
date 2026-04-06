# Peculium

> _I googled Latin words for savings_

A minimal, fast expense tracker built with React Native and Expo.

---

## App Walkthrough


### Built with AI Assistance

The architecture and core idea are 100% my own. AI agents (Claude, Copilot) + CLAUDE.md conventions enabled 5x faster development—writing only the essential logic while AI handled scaffolding, schema design, and component structure. Leveraging smart prompting + architectural docs keeps code quality high while accelerating delivery.

---

## How It's Built

- **Expo** — React Native framework
- **Performance** — `React.memo`, `useCallback`, `useMemo` on every component
- **Data** — Supabase + TanStack Query
- **UI** — Portal system for bottom sheets, Neo-Brutalism design system
- **Forms** — Zod + React Hook Form
>Learnt these architectural practices during my freelancing + internships

---

## Screens

**Home**  
Overview of balance, monthly budget (feature), last 7 days spending chart, spending streaks (feature), and micro-spend analysis.

**Transactions**  
Search, filter, and manage all income/expense transactions. Infinite scroll with pull-to-refresh.

**Insights**  
Category spend breakdown and weekly spending comparisons.

---

## Database

Powered by **Supabase** (PostgreSQL)

**Tables:**
- `profiles` — User onboarding state, current/longest spending streaks
- `transactions` — Income/expense entries with 8 categories, timestamps, notes
- `monthly_budgets` — Per-month spend limits (one budget per user per month)

**Demo Login**

To see a pre-seeded user with transaction history:
- Email: `dhruvlohar09@gmail.com`
- OTP: Enter any number (magic links enabled)
