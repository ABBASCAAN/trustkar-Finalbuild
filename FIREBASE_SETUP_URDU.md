# TRUSTKAR — Firebase Setup (zaroori, ek bar)

Bina iske **Sign in** aur **Ads** kaam nahi karenge.

## 1. Authentication (Sign in)

1. [Firebase Console](https://console.firebase.google.com) → project **romeo-escrow**
2. **Build** → **Authentication** → **Get started**
3. **Sign-in method** tab
4. **Email/Password** → **Enable** → Save

## 2. Firestore Database

1. **Build** → **Firestore Database**
2. **Create database**
3. Location: closest (e.g. `asia-south1` Mumbai) → **Next**
4. Start in **production mode** → **Create**

## 3. Security Rules (bahut zaroori)

1. Firestore → **Rules** tab
2. Poora text delete karo
3. Apne PC se file copy karo: `firestore.rules` (project folder)
4. **Publish**

## 4. Authorized domain (live site)

1. **Authentication** → **Settings** → **Authorized domains**
2. Add: `localhost` (testing)
3. Add: `your-app.vercel.app` (apni Vercel URL)

## 5. Test flow

1. Site → **Join TRUSTKAR** → account banao
2. **Post Ad** → 4 photos + details → Publish
3. **Home** par apni ad dikhni chahiye (1–2 sec)

## Data kahan save hota hai?

| Data | Firebase location |
|------|-------------------|
| User (email, name) | Authentication + Firestore `users` |
| Ads | Firestore `ads` |
| Photos | Cloudinary (images URLs Firestore mein) |

## Agar ads nahi dikhen

- Rules publish hue?
- Ad post karte waqt error aaya?
- Browser F12 → Console → red error screenshot bhejo
