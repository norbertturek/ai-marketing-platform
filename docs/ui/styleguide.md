# AI Marketing Platform UI Styleguide

This styleguide defines the shared UI language for the AI Marketing Platform across:

- The **Angular app** (`apps/web`)
- The **React bundle** (`AI Marketing Platform/`)
- AI assistants (Cursor / Claude) generating new UI

New UI should reuse these patterns instead of inventing new ad-hoc layouts or styles.

---

## Foundations

### Color system

The base theme tokens are defined in `apps/web/src/styles.scss`:

- Light mode (`:root`)
  - `--background`: `oklch(1 0 0)` – white surfaces
  - `--foreground`: `oklch(0.145 0 0)` – main text
  - `--card`: `oklch(1 0 0)` / `--card-foreground`: `oklch(0.145 0 0)`
  - `--muted`: `oklch(0.97 0 0)` / `--muted-foreground`: `oklch(0.556 0 0)`
  - `--border`: `oklch(0.922 0 0)`
  - `--primary`: dark neutral text on light (`oklch(0.205 0 0)`)
- Dark mode (`:root.dark`)
  - `--background`: `oklch(0.145 0 0)` – very dark neutral background
  - `--foreground`: `oklch(0.985 0 0)` – light text
  - `--card`: `oklch(0.205 0 0)` – slightly raised card surface
  - `--muted`: `oklch(0.269 0 0)` / `--muted-foreground`: `oklch(0.708 0 0)`
  - `--border`: `oklch(1 0 0 / 10%)`

**Auth screens** use a dark, high-contrast treatment that matches the React app:

- Outer background: `bg-[#0a0a0a]`
- Card / inner surfaces: `bg-zinc-900` with `border-zinc-800`
- Primary text: `text-white`
- Secondary text: `text-zinc-500`

When possible, prefer semantic classes (`bg-background`, `text-foreground`, `border-border`) for general pages, and reserve raw hex / `zinc-*` colors for full-bleed dark experiences like auth.

### Typography and radius

- Base font: `--font-sans` (system stack) from `styles.scss`
- Border radius: `--radius: 0.625rem` – use rounded rectangles; avoid full pills unless called out
- Headings:
  - Page titles: `text-2xl md:text-3xl font-medium` or `font-semibold`
  - Auth titles: `text-xl md:text-2xl font-medium`
- Body:
  - Regular copy: `text-sm`
  - Secondary / helper text: `text-xs md:text-sm text-zinc-500` or `text-muted-foreground`

---

## Layout patterns

### Auth full-screen layout

Used for **signin** and **signup** in both Angular and React. Common structure:

- Full viewport, centered content:
  - `class="dark min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4"`
- Top-left “back to app” link with subtle icon:
  - Position: `absolute top-4 left-4 md:top-6 md:left-6`
  - Style: `text-xs md:text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-2`
- Centered card container:
  - `w-full max-w-md px-4`
- Header block:
  - Small logo / badge: square or circle, `bg-zinc-900 border border-zinc-700 rounded-2xl`, centered
  - Title + short tagline: stacked, centered, using the typography rules above

In Angular, this pattern is implemented in `signin.page.ts` and `signup.page.ts` templates and should be reused for any future auth-like flows (password reset, magic link, etc.).

### Cards

Cards are the primary content container:

- Layout:
  - Rounded rectangle with border and subtle shadow
  - Typical padding: `p-4` or `p-6` depending on density
- Light theme:
  - `bg-card text-card-foreground border-border`
- Dark auth surfaces:
  - `bg-zinc-900 border border-zinc-800 rounded-lg` or `rounded-xl`

Bonus / informational cards (e.g. “500 free credits”) follow the same pattern but can include an inline emoji and slightly denser copy.

### Main app shell

For the main Angular dashboard and React project views:

- Use `bg-background text-foreground` on `body` (already applied in `styles.scss`)
- Use a clear page header:
  - Title, optional description, and primary action(s) grouped in a responsive row
- Avoid full-bleed cards stacked without spacing; keep consistent vertical rhythm (`space-y-4` / `space-y-6`).

---

## Form patterns

Forms should feel consistent across Angular and React.

### Structure

- Vertical stack with `space-y-4` or `space-y-5`
- Each field:
  - Label: `text-xs text-zinc-400 mb-2 block`
  - Control:
    - Auth inputs: `h-11 w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 text-sm text-white shadow-xs outline-none placeholder:text-zinc-600 focus-visible:border-zinc-500 focus-visible:ring-[3px] focus-visible:ring-zinc-500/40`
  - Error text (when present):
    - `mt-1 text-xs text-red-400`

Validation copy:

- Email required: “Email is required”
- Email invalid: “Provide a valid email address”
- Password required: “Password is required”
- Password length: “Password must be at least 8 characters”

These strings already exist in the Angular auth pages and should be reused.

### Buttons

- Primary action on dark auth background:
  - `class="w-full h-11 bg-white text-black hover:bg-zinc-200 text-sm"`
- Secondary / less prominent actions:
  - Use spartan-ng `variant="outline"` or minimal text links:
    - `text-sm text-zinc-500 hover:text-white` on dark

The primary action button should be disabled during submission, and its label should change to reflect the current operation (e.g. “Signing in…”, “Creating account…”).

---

## Feedback patterns

### Inline errors

- Field-level errors:
  - Shown under the relevant field after touch/dirty
  - Use `text-red-400 text-xs` on dark auth, `text-destructive` and `text-xs` on light
- Form-level errors:
  - Display a single short message above the primary button, e.g. “Invalid email or password”

Angular pages use:

- `errorMessage` signal for form-level error
- Per-field getters (`emailError`, `passwordError`) for input-level messages

### Toasts

The React bundle uses `sonner` (`Toaster` in `AI Marketing Platform/src/app/App.tsx`) for global feedback. When using toasts:

- Reserve success toasts for clear, positive events (login success, account created, etc.)
- Keep messages short and action-oriented

Angular can follow the same patterns if a toast system is introduced; until then, rely on inline messages.

---

## Framework-specific notes

### Angular (apps/web)

- Use **standalone components** and **signals**, as in `.cursor/skills/angular21-frontend/SKILL.md`.
- For auth pages:
  - Templates follow the auth full-screen layout described above.
  - Use spartan-ng helm buttons: `HlmButtonImports` and `hlmBtn` directive.
  - Keep existing reactive form structure and error mapping; only adjust layout and classes for design changes.

When generating new Angular UI:

- Prefer semantic classes (`bg-background`, `text-foreground`, `border-border`) for regular pages.
- For auth-like surfaces, reuse the exact auth layout pattern and input/button classes from the signin/signup pages.

### React (AI Marketing Platform/)

- Use shared UI primitives from `AI Marketing Platform/src/app/components/ui/*` (e.g. `Button`, `Input`, `Label`).
- Auth pages (`LoginPage.tsx`, `RegisterPage.tsx`) are the visual source of truth for:
  - Full-screen dark layout
  - Back-to-app link
  - Header and bonus info card
  - Form spacing and copy tone

New React pages should:

- Reuse the card and form patterns from auth where appropriate.
- Match typography and spacing rules defined in this styleguide.

---

## How assistants should use this styleguide

When Cursor or Claude generate UI code for this repo:

- **Always** reference this file (`docs/ui/styleguide.md`) before creating new components or pages.
- For **auth** or onboarding flows, copy the existing auth layout and adjust only the content.
- For general pages, use the color tokens and layout spacing described above, and avoid introducing new ad-hoc colors or radii.
- Keep error handling and validation UX consistent with the patterns in Angular auth pages and the React Login/Register screens.

