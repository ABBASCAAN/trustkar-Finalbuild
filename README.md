# TRUSTKAR — World-Class Escrow Marketplace

Next.js 15 + Firebase + Cloudinary + Tailwind CSS. Deploy-ready for **Vercel**.

> Firebase backend project ID remains `romeo-escrow` (Google registration). All user-facing branding is **TRUSTKAR**.

## Quick start

```bash
cd C:\Users\ZC\Projects\trustkar
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

```
trustkar/
├── src/
│   ├── app/                    # Next.js App Router pages (Phase 2)
│   │   ├── page.js             # Ad Gallery (home)
│   │   ├── post-ad/            # Detailed listing form
│   │   ├── ad/[id]/            # Listing detail + escrow buy
│   │   ├── checkout/           # TRUSTKAR escrow payment flow
│   │   ├── dashboard/          # Buyer/seller transactions
│   │   ├── disputes/           # Raise dispute + evidence
│   │   ├── auth/               # Login, register, KYC
│   │   └── admin/              # Fraud dashboard, oversight
│   ├── components/             # Navbar, AdCard, forms, badges
│   └── lib/
│       ├── firebase.js         # Firebase init
│       ├── cloudinary.js       # Image uploads
│       ├── categories.js       # Category tree
│       ├── constants.js        # Brand + escrow statuses
│       └── firestore-helpers.js
├── firestore.rules             # Deploy to Firebase Console
├── public/
└── package.json
```

## Configuration

| Service    | Location              |
|-----------|------------------------|
| Firebase  | `src/lib/firebase.js`  |
| Cloudinary| `src/lib/cloudinary.js` (`dsea6kjyr` / `Escrow_Cloud`) |

## Features (built)

| Page | Route |
|------|--------|
| Ad gallery + search | `/` |
| Category filter | `/category/[slug]` |
| Post ad (4–8 images, categories) | `/post-ad` |
| Listing detail + buy | `/ad/[id]` |
| Escrow checkout | `/checkout/[id]` |
| My deals | `/dashboard` |
| Disputes | `/disputes`, `/disputes/new` |
| KYC | `/auth/kyc` |
| Admin | `/admin` (set `role: "admin"` in Firestore `users`) |

## Firebase setup (required)

1. **Authentication** → enable Email/Password
2. **Firestore** → create database
3. Deploy rules from `firestore.rules`
4. If index error on home page, create composite index `ads`: `status` + `createdAt` (link in browser console)
5. **Admin**: in Firestore `users/{your-uid}` set field `role` to `"admin"`

## Deploy

1. Push to GitHub.
2. Import repo in Vercel.
3. Add environment variables if you move secrets to `.env.local` later.
4. Deploy `firestore.rules` from Firebase Console → Firestore → Rules.

## License

Private — TRUSTKAR © 2026
