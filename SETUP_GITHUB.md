# השלמת חיבור ל-GitHub ולמפתחות

האפליקציה כבר חיה ב-Vercel: **https://medic-practice.vercel.app**

## שלב 1: התחברות ל-GitHub

לאחר התקנת gh CLI, פתח **PowerShell חדש** (לא Claude Code) והקלד:

```powershell
gh auth login
```

בחר:
- GitHub.com
- HTTPS
- Authenticate with browser (פותח דפדפן, ולחיצה על "Authorize")

## שלב 2: יצירת רפוזיטורי ב-GitHub והעלאה

לאחר ההתחברות, מתוך תיקיית הפרויקט:

```powershell
cd "C:\Users\imark\Desktop\יישום ניהול משימות\medic-app"
gh repo create medic-practice --public --source=. --remote=origin --push --description "אפליקציית תרגול חובשים - שאלות, אנמנזה קולית ומבחנים"
```

הפקודה תיצור רפוזיטורי חדש בחשבון שלך (hitprojectscenter-beep), תוסיף remote, ותעלה את הקוד.

## שלב 3: חיבור Vercel ל-GitHub (אופציונלי - לפריסה אוטומטית)

```powershell
vercel link  # אם נדרש - מקשר את הפרויקט המקומי
vercel git connect  # מקשר ל-repo של GitHub
```

או דרך Vercel Dashboard:
1. https://vercel.com/hitprojectscenter-6566s-projects/medic-practice
2. Settings → Git → Connect → בחר את medic-practice ב-GitHub

מכאן, כל push למאסטר יוביל לפריסה אוטומטית.

## שלב 4: הוספת ANTHROPIC_API_KEY ל-Vercel

הכרחי למשוב חכם על אנמנזה (אחרת המערכת תשתמש במשוב מבוסס keywords - תקין אבל פחות חכם).

**צור מפתח חדש** ב-https://console.anthropic.com → Account → API Keys → Create Key.
**חשוב:** המפתח מופיע **פעם אחת בלבד** - העתק אותו מיד.

לאחר מכן, מתוך תיקיית הפרויקט:

```powershell
cd "C:\Users\imark\Desktop\יישום ניהול משימות\medic-app"
vercel env add ANTHROPIC_API_KEY production
# הדבק את המפתח כשמבקש
vercel env add ANTHROPIC_API_KEY preview
vercel env add ANTHROPIC_API_KEY development

# פרוס מחדש כדי שהמשתנים ייטענו
vercel --prod
```

או דרך Vercel Dashboard:
1. https://vercel.com/hitprojectscenter-6566s-projects/medic-practice/settings/environment-variables
2. Add → `ANTHROPIC_API_KEY` → הדבק מפתח → Save

## שלב 5: (אופציונלי) OPENAI_API_KEY ל-Whisper

אם אתה רוצה זיהוי דיבור עברי איכותי במיוחד (במיוחד ב-Safari iOS):

```powershell
vercel env add OPENAI_API_KEY production
```

אחרת המערכת תשתמש ב-Web Speech של הדפדפן (טוב ל-Chrome/Edge/Android).

## הקישורים שלך

- **אפליקציה חיה:** https://medic-practice.vercel.app
- **Vercel Dashboard:** https://vercel.com/hitprojectscenter-6566s-projects/medic-practice
- **GitHub (אחרי שלב 2):** https://github.com/hitprojectscenter-beep/medic-practice
