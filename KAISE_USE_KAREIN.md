# TRUSTKAR — Aasan Guide (Urdu)

Yeh guide **bina mushkil commands** ke website chalane ke liye hai.

---

## Aap ke paas 3 cheezen chahiye (ek dafa)

1. **GitHub account** — [github.com](https://github.com) (free)
2. **Vercel account** — [vercel.com](https://vercel.com) (free, GitHub se login)
3. **Firebase** — aapka project `romeo-escrow` (pehle se hai)

---

## Roz ka kaam — sirf 2 jagah

| Kaam | Kahan |
|------|--------|
| Code / design badalna | Cursor (yahan chat + files) |
| Live website update | **Double-click:** `upload-github.bat` |

Vercel **khud** nayi site banata hai jab GitHub par code jata hai.

---

## Pehli dafa setup (15 minute, ek bar)

### Step 1 — GitHub par repo

1. Login → **+** → **New repository**
2. Name: `trustkar`
3. **Create** (README mat add karo)

### Step 2 — Git pehli dafa (sirf ek bar)

**Git Bash** kholo, yeh 6 lines copy-paste karo (ek ek karke Enter):

```
cd /c/Users/ZC/Projects/trustkar
git init
git add .
git commit -m "Pehli upload TRUSTKAR"
git branch -M main
git remote add origin https://github.com/ABBASCAAN/trustkar.git
git push -u origin main
```

Login mangay to GitHub username + password (ya Token).

### Step 3 — Vercel connect (sirf ek bar)

1. [vercel.com/new](https://vercel.com/new)
2. Repo **trustkar** choose → **Deploy**
3. Link save karo (jaise `trustkar.vercel.app`)

### Step 4 — Firebase (sirf ek bar)

1. [console.firebase.google.com](https://console.firebase.google.com) → `romeo-escrow`
2. **Authentication** → Email/Password **ON**
3. **Firestore** → database banao
4. **Rules** → `firestore.rules` file ka text copy → Publish

---

## Roz jab Cursor se kuch badlo

1. Cursor mein changes save hon
2. Folder kholo: `C:\Users\ZC\Projects\trustkar`
3. **`upload-github.bat`** par **double-click**
4. 2 minute wait → Vercel par site update

**Bas.** Git Bash ya commands yaad rakhne ki zaroorat nahi.

---

## Website par kya kya hai

| Page | Link |
|------|------|
| Home (ads) | `/` |
| Post ad | `/post-ad` |
| Login | `/auth/login` |
| My deals | `/dashboard` |

---

## Agar kuch kharab ho

- Site purani dikhe → browser **Ctrl + F5**
- Upload fail → Git Bash dobara mat kholo; screenshot bhej kar poocho
- Ads nahi dikhen → Firebase Firestore + Rules check karo

---

## Design badalna (rang / search)

| Kya badalna | File |
|-------------|------|
| Light blue hero | `src/components/HeroSearch.js` |
| Navbar (upar wala) | `src/components/Navbar.js` |
| Poori site ka rang | `src/app/globals.css` |

Cursor mein file kholo, bolo: *"hero ko aur halka blue karo"* — phir `upload-github.bat` chalao.
