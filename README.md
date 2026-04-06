# Med Coach 🫒

אפליקציית ליווי אישית לדיאטה ים-תיכונית — React + Vite + Tailwind. מותאמת לנייד, שומרת נתונים ב-localStorage, ומותאמת אישית (גיל 56, זכר, אשטנגה יוגה 4×/שבוע, יעד 76.2 → 70 ק״ג).

## הרצה מקומית

```bash
npm install
npm run dev
```

פתח `http://localhost:5173`.

## בנייה

```bash
npm run build
npm run preview
```

## פריסה ל-Vercel (הדרך המהירה ביותר לנייד)

### אפשרות א׳ — דרך GitHub (מומלץ)

1. פתח ריפו חדש ב-GitHub (לדוגמה `med-coach`).
2. בתוך תיקיית הפרויקט:
   ```bash
   git init
   git add .
   git commit -m "initial"
   git branch -M main
   git remote add origin https://github.com/<username>/med-coach.git
   git push -u origin main
   ```
3. היכנס ל-[vercel.com](https://vercel.com) → **Add New Project** → בחר את הריפו.
4. Vercel יזהה Vite אוטומטית. לחץ **Deploy**.
5. תקבל כתובת כמו `https://med-coach.vercel.app` — פתח אותה בנייד והוסף למסך הבית (Share → Add to Home Screen).

### אפשרות ב׳ — Vercel CLI

```bash
npm i -g vercel
vercel
```

עקוב אחרי ההנחיות. לפריסה לפרודקשן: `vercel --prod`.

## התקנה כאפליקציה בנייד (PWA-lite)

1. פתח את הכתובת מ-Vercel ב-Safari (iOS) או Chrome (Android).
2. שתף → "הוסף למסך הבית".
3. האפליקציה תיפתח במסך מלא, עם שם ואייקון.

## מבנה

```
med-coach/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
├── public/
│   └── manifest.webmanifest
└── src/
    ├── main.jsx
    ├── App.jsx
    └── index.css
```
