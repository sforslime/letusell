# LetuSell — Claude Instructions

## Project Overview
University food marketplace MVP. Students browse vendors, order food, pay via Paystack, pick up on campus.

## Tech Stack
- Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- Supabase (PostgreSQL, Auth, Storage, Realtime)
- Paystack payments (inline JS + HMAC webhook)
- Zustand v5 (cart state, localStorage persist)
- react-hook-form + Zod v4 (forms/validation)
- Radix UI primitives, lucide-react icons
- Recharts (analytics charts)
- PostHog (analytics)
- Vercel hosting

## Key Architecture Rules

### Money
- All prices stored as **integers in kobo** (1 NGN = 100 kobo). Never use floats.
- Server-side repricing always happens in `/api/checkout/initialize` — never trust client amounts.

### Supabase clients
- `src/lib/supabase/admin.ts` uses the service role key — **server-only**, never import in client components.
- Browser client uses placeholder URL/key fallback so SSG build doesn't crash when env vars are absent.

### Cart
- CartDrawer is rendered at root in `src/components/layout/providers.tsx`, NOT inside Header — prevents stacking context bugs.
- Cart enforces single-vendor: adding an item from a different vendor prompts to clear.

### Orders
- `order_items.item_name` and `order_items.item_price` are **immutable snapshots** — never join to `menu_items` for receipt display.
- `orders.user_id` can be null (anonymous checkout supported).

### Auth / Middleware
- `src/middleware.ts` handles role-based route protection: admin, vendor, user, anonymous.
- Roles: `admin`, `vendor`, `user` — stored in `profiles.role`.

## Database Tables
`universities`, `profiles` (→ auth.users), `vendors`, `menus`, `menu_item_categories`, `menu_items`, `orders`, `order_items`, `reviews`

All tables have `university_id` for multi-tenant support.

Migrations in `supabase/migrations/` — run in order 0001–0005.

## Supabase Storage
- Bucket: `menu-images` (public) — vendor menu item photos and vendor cover images.

## Key File Locations
| File | Purpose |
|------|---------|
| `src/app/api/checkout/initialize/route.ts` | Creates order + Paystack transaction |
| `src/app/api/webhooks/paystack/route.ts` | HMAC-verified webhook, updates order status, awards loyalty points |
| `src/app/api/orders/[id]/route.ts` | Fetch order + items + vendor (guest-accessible by UUID) |
| `src/app/api/orders/lookup/route.ts` | Guest order lookup by email + order ID |
| `src/app/api/vendors/[slug]/availability/route.ts` | Generates pickup time slots |
| `src/app/api/vendors/[slug]/upload/route.ts` | Vendor image upload (validation + storage) |
| `src/middleware.ts` | Role-based route protection |
| `src/store/cart.store.ts` | Zustand cart, single-vendor enforcement |
| `src/lib/supabase/admin.ts` | Service-role client (server-only) |
| `src/components/layout/providers.tsx` | Client wrapper — renders CartDrawer at root |

## Commands
```bash
npm run dev      # Start dev server
npm run build    # Build (TypeScript must pass)
npm run lint     # ESLint
```

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
PAYSTACK_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_POSTHOG_HOST
```

## Coding Conventions
- No emojis in UI unless already present in the design.
- Amounts always in kobo; format for display using a utility (divide by 100, add ₦ prefix).
- Keep responses and code concise — no unnecessary abstraction.
- Prefer editing existing files over creating new ones.
- Do not add comments unless logic is non-obvious.
