# XINAO Invite System

Event invitation management — Next.js 14 + Supabase + Vercel.

---

## What it does Test

| Role | Path | Description |
|------|------|-------------|
| **Admin** | `/admin` | Login, manage events, view/sort guests, scanner |
| **Guest** | `/invite/[eventId]/[guestToken]` | Register and download personal invitation with QR |
| **Scanner** | `/scanner` | Scan QR codes at event entrance |

---

## Quick start — local dev (15 minutes)

### 1. Prerequisites
- Node.js 18+ — download from [nodejs.org](https://nodejs.org)
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (for deploy)

### 2. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/xinao-invite.git
cd xinao-invite
npm install
```

### 3. Set up Supabase

1. Go to [supabase.com](https://supabase.com) → New project
2. Choose a name (e.g. `xinao-invite`) and a strong database password
3. Wait ~2 minutes for the project to spin up
4. Go to **SQL Editor** → **New query**
5. Copy and paste the entire content of `supabase/schema.sql`
6. Click **Run** — this creates all tables, indexes, and seed data

### 4. Get your Supabase keys

1. In Supabase: **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abc123.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

### 5. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJyour-anon-key-here
NEXT_PUBLIC_ADMIN_PASSWORD=your-secure-password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel (10 minutes)

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/xinao-invite.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repository
3. In **Environment Variables**, add the same 4 variables from `.env.local`
4. Change `NEXT_PUBLIC_SITE_URL` to your Vercel URL (e.g. `https://xinao-invite.vercel.app`)
5. Click **Deploy** — done in ~2 minutes

### 3. Custom domain (optional)

In Vercel: **Settings** → **Domains** → add your domain.
Cost: ~€10-15/year for a domain on Namecheap or Google Domains.

---

## Sending invite links to guests

After adding guests in the admin, each guest has a unique URL:

```
https://your-domain.com/invite/[eventId]/[guestToken]
```

You can find the full link in the guest detail panel (click ▼ on any guest row).

Send via email, WhatsApp, or any messaging platform.

---

## Adding guests (CSV import)

The `src/lib/supabase.ts` file includes an `importGuestsCSV()` function.

CSV format:
```csv
first_name,last_name,email,phone
Marco,Conti,m.conti@example.com,+39 02 1234567
Sophia,Martini,s.martini@example.com,
```

---

## Switching from mock data to Supabase

The app ships with mock data so it works without a database.
To connect to real Supabase data, replace the mock arrays in each page with calls from `src/lib/supabase.ts`.

Example in `src/app/admin/page.tsx`:
```typescript
// Replace this:
const [events, setEvents] = useState(MOCK_EVENTS)

// With this:
const [events, setEvents] = useState<XinaoEvent[]>([])
useEffect(() => {
  getEvents().then(setEvents).catch(console.error)
}, [])
```

---

## Project structure

```
xinao-invite/
├── src/
│   ├── app/
│   │   ├── page.tsx                          # Landing (role selector)
│   │   ├── admin/
│   │   │   ├── page.tsx                      # Admin login + events list
│   │   │   └── events/[eventId]/page.tsx     # Event detail + guests + scanner
│   │   ├── invite/
│   │   │   ├── demo/page.tsx                 # Demo guest portal
│   │   │   └── [eventId]/[guestToken]/page.tsx  # Guest registration
│   │   └── scanner/page.tsx                  # QR scanner
│   ├── components/
│   │   ├── Badge.tsx          # Status badges
│   │   ├── ImageUpload.tsx    # Image upload widget
│   │   ├── InvitationCard.tsx # The invitation with QR + download
│   │   ├── Modal.tsx          # Confirm/delete modal
│   │   ├── QRCode.tsx         # SVG QR generator
│   │   └── TopBar.tsx         # Navigation bar
│   ├── lib/
│   │   ├── supabase.ts        # All database operations
│   │   └── utils.ts           # Theme, formatting helpers
│   └── types/
│       └── index.ts           # TypeScript types
├── supabase/
│   └── schema.sql             # Database schema + seed data
├── .env.example               # Environment variable template
└── README.md
```

---

## Costs

| Service | Free tier | Paid |
|---------|-----------|------|
| Supabase | 500MB DB, unlimited auth | $25/month |
| Vercel | Hobby (personal projects) | $20/month (Pro) |
| Domain | — | ~€10-15/year |

**For most events: €0/month.** The free tiers handle hundreds of guests easily.

---

## Admin password

Default demo password: `xinao2026`

Change it in `.env.local`:
```
NEXT_PUBLIC_ADMIN_PASSWORD=your-new-secure-password
```

For production, consider using Supabase Auth instead (already wired up in `src/lib/supabase.ts`).

---

## Tech stack

- **Next.js 14** — React framework with App Router
- **TypeScript** — type safety throughout
- **Tailwind CSS** — utility styling
- **Supabase** — PostgreSQL database + auth + file storage
- **html-to-image** — invitation PNG download
- **Vercel** — hosting and deployment
