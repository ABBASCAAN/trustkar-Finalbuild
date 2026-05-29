# Git Bash Commands for TrustKar

Use these commands in Git Bash to push your code to GitHub.

---

## One-time setup (if you haven't already)

```bash
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

---

## Every time you want to push updates

Open **Git Bash** inside your project folder, then run these commands one by one:

```bash
git add .
```

```bash
git commit -m "Updated TrustKar: Added new features and fixed layout bugs"
```

```bash
git push origin main
```

---

## All in one line (quick push)

```bash
git add . && git commit -m "Updated TrustKar: Added new features and fixed layout bugs" && git push origin main
```

---

## If push fails or gives error

First pull the latest changes, then push again:

```bash
git pull origin main --rebase
```

```bash
git push origin main
```

---

## Check status before committing

```bash
git status
```

---

## Your Repository Details

- **Repo URL:** https://github.com/ABBASCAAN/TrustkarFInalBuild.git
- **Branch:** main
