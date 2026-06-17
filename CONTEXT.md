# Xinao Events — Contesto per Claude

## Stack
- Next.js 14, TypeScript, Supabase, Vercel (auto-deploy da push su `main`)
- Repo GitHub: `andreamabellini89/xinao-invite`
- Deploy: https://xinao-invite.vercel.app

## Persone
- **Andrea Mabellini** — dev che gestisce le modifiche
- **Mattia Bertinetti** — referente tecnico lato cliente
- **Vivi / Nora Gu** — cliente finale (comunicazione via WeChat)

## Struttura chiave
- `src/components/InvitationCard.tsx` — card invito (QR, download PDF/PNG, bilingue)
- `src/app/invite/[eventId]/[guestToken]/page.tsx` — pagina ospite (link personale)
- `src/app/admin/events/[eventId]/page.tsx` — pannello admin evento (tab: overview, email, guests, requests, scanner, settings)
- `src/app/admin/page.tsx` — lista eventi admin
- `src/app/checkin/[eventId]/[qrToken]/page.tsx` — check-in QR
- `src/types/index.ts` — tipi TypeScript (XinaoEvent, Guest, ecc.)
- `public/xinao-logo.svg` — logo definitivo SVG oro

## Database Supabase — tabelle principali
- `events` — eventi (colonne: id, name, subtitle, date, time, location, address, description, status, cover_image_url, event_number, email_copy, agenda, pdf_prefix, created_at, updated_at)
- `guests` — ospiti (id, event_id, first_name, last_name, email, phone, company, status, qr_token, guest_token, registered_at, checked_in_at, created_at, updated_at)
- `registration_requests` — richieste di registrazione pubblica (FK: guest_id → guests.id)

## Bug fixati (storico)
1. **QR Code bianco nel PDF/PNG** — `html-to-image` non cattura `<canvas>`. Fix: sostituito `QRCode.toCanvas()` + `<canvas>` con `QRCode.toDataURL()` + `<img>`.
2. **Guest che riappare dopo cancellazione** — FK constraint `registration_requests_guest_id_fkey`. Fix: cancellare prima `registration_requests` poi `guests`.
3. **Logo XINAO** — sostituito testo inline con `<img src="/xinao-logo.svg">` in `InvitationCard.tsx` e `TopBar.tsx`.

## Feature aggiunte (storico)
1. **Card bilingue EN/中文** — pulsante toggle nella pagina ospite. Stringhe tradotte: PERSONAL INVITATION, FINAL REMINDER, DEAR, welcome text, QR instruction, THANK YOU. PDF/PNG esportato mantiene la lingua scelta. (commit: `2c7e32d`)
2. **Prefisso nome file PDF/PNG** — campo `pdf_prefix` sulla tabella `events`. Admin: tab *Settings* in ogni evento. Default: `xinao-invitation`. File: `[prefisso]-[cognome].pdf`. SQL migration: `ALTER TABLE events ADD COLUMN IF NOT EXISTS pdf_prefix text;` (già eseguita). (commit: `ef12d4e`)

## Come fare deploy
```bash
cd /Users/andreamabellini/Desktop/xinao-invite
git add -A && git commit -m "descrizione" && git push
```
Vercel deploya automaticamente in ~2 minuti.

## Note importanti
- Non toccare Vercel manualmente — tutto passa da git push.
- Le modifiche al DB vanno eseguite da Mattia nel SQL Editor di Supabase.
- Il tema colori è in `src/lib/utils.ts` → `THEME`.
