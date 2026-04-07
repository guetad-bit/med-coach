import React, { useState, useEffect, useMemo, useRef } from "react";

const START_WEIGHT = 76.2;
const TARGET_WEIGHT = 70;
const TOTAL_DAYS = 42;
const START_DATE = "2026-04-06";
const PROTEIN_TARGET = 110; // grams/day
const CAL_TARGETS = { morning: 1800, evening: 1800, rest: 1600 };
const CAL_TIPS = {
  morning: "תרגול בוקר — ארוחת הבוקר היא ארוחת התאוששות. דאג לחלבון איכותי אחרי התרגול.",
  evening: "תרגול ערב — ארוחת צהריים עשירה, חטיף קל 1-2 שעות לפני, וארוחת ערב קלה אחרי.",
  rest: "יום מנוחה — מעט פחות קלוריות, אבל שמור על החלבון כדי לתמוך בהתאוששות.",
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const daysSinceStart = () => {
  const s = new Date(START_DATE);
  const t = new Date(todayKey());
  return Math.max(0, Math.floor((t - s) / 86400000));
};

// Per-serving calories and protein (typical portion)
// c = kcal per default serving, p = protein g per default serving, unit hint
const FOOD_DB = [
  { k: ["chicken breast", "חזה עוף"], c: 165, p: 31, serve: 100 }, // per 100g
  { k: ["chicken", "עוף"], c: 200, p: 25, serve: 120 },
  { k: ["turkey", "הודו"], c: 150, p: 29, serve: 120 },
  { k: ["salmon", "סלמון"], c: 210, p: 23, serve: 120 },
  { k: ["tuna", "טונה"], c: 130, p: 28, serve: 120 },
  { k: ["fish", "דג", "לברק", "מושט", "דניס"], c: 160, p: 24, serve: 120 },
  { k: ["shrimp", "שרימפס", "חסילון"], c: 100, p: 20, serve: 100 },
  { k: ["egg", "ביצה", "ביצים"], c: 78, p: 6, serve: 1 }, // per egg
  { k: ["yogurt", "יוגורט"], c: 120, p: 12, serve: 150 }, // greek 150g
  { k: ["cottage", "קוטג"], c: 90, p: 12, serve: 100 },
  { k: ["oats", "שיבולת", "קוואקר"], c: 150, p: 5, serve: 40 }, // dry 40g
  { k: ["bread slice", "פרוסת לחם"], c: 80, p: 3, serve: 1 },
  { k: ["bread", "לחם", "פיתה"], c: 160, p: 5, serve: 60 },
  { k: ["avocado", "אבוקדו"], c: 160, p: 2, serve: 100 }, // half
  { k: ["hummus", "חומוס"], c: 170, p: 6, serve: 60 },
  { k: ["tahini", "טחינה"], c: 180, p: 5, serve: 30 },
  { k: ["feta", "פטה"], c: 75, p: 4, serve: 30 },
  { k: ["halloumi", "חלומי"], c: 120, p: 7, serve: 40 },
  { k: ["cheese", "גבינה"], c: 100, p: 6, serve: 30 },
  { k: ["tomato", "עגבני"], c: 20, p: 1, serve: 100 },
  { k: ["cucumber", "מלפפון"], c: 15, p: 1, serve: 100 },
  { k: ["salad", "סלט"], c: 80, p: 2, serve: 1 },
  { k: ["olive oil", "שמן זית", "כף שמן"], c: 120, p: 0, serve: 1 }, // 1 tbsp
  { k: ["olives", "זיתים"], c: 50, p: 0, serve: 30 },
  { k: ["lentil", "עדש"], c: 230, p: 18, serve: 1 }, // cooked cup
  { k: ["chickpea", "גרגרי חומוס"], c: 210, p: 12, serve: 1 },
  { k: ["beans", "שעועית"], c: 220, p: 15, serve: 1 },
  { k: ["quinoa", "קינואה"], c: 220, p: 8, serve: 1 },
  { k: ["rice", "אורז"], c: 210, p: 4, serve: 1 },
  { k: ["pasta", "פסטה"], c: 260, p: 9, serve: 1 },
  { k: ["potato", "תפוח אדמה", "בטטה"], c: 150, p: 3, serve: 200 },
  { k: ["almond", "שקד"], c: 160, p: 6, serve: 28 }, // handful
  { k: ["walnut", "אגוז מלך"], c: 185, p: 4, serve: 28 },
  { k: ["nuts", "אגוז"], c: 170, p: 5, serve: 28 },
  { k: ["peanut butter", "חמאת בוטנים"], c: 190, p: 7, serve: 30 },
  { k: ["apple", "תפוח"], c: 80, p: 0, serve: 1 },
  { k: ["banana", "בננה"], c: 100, p: 1, serve: 1 },
  { k: ["berries", "פירות יער"], c: 60, p: 1, serve: 100 },
  { k: ["fruit", "פרי"], c: 70, p: 1, serve: 1 },
  { k: ["honey", "דבש"], c: 60, p: 0, serve: 1 }, // 1 tsp
  { k: ["wine", "יין"], c: 125, p: 0, serve: 1 }, // glass
  { k: ["beer", "בירה"], c: 150, p: 0, serve: 1 },
  { k: ["chocolate", "שוקולד"], c: 150, p: 2, serve: 30 },
  { k: ["coffee", "קפה"], c: 5, p: 0, serve: 1 },
  { k: ["milk", "חלב"], c: 100, p: 6, serve: 200 },
];

// Parse leading/inline quantity: "2 eggs", "3 ביצים", "half", "חצי"
const WORD_NUM = {
  half: 0.5, "חצי": 0.5, one: 1, two: 2, three: 3, four: 4, five: 5,
  "שתי": 2, "שני": 2, "שלוש": 3, "שלושה": 3, "ארבע": 4, "ארבעה": 4,
};
function parseQty(segment) {
  const m = segment.match(/(\d+(?:[.,]\d+)?)/);
  if (m) return parseFloat(m[1].replace(",", "."));
  for (const w of Object.keys(WORD_NUM)) {
    if (segment.includes(w)) return WORD_NUM[w];
  }
  return 1;
}

function estimate(text) {
  if (!text) return { kcal: 0, protein: 0 };
  const t = text.toLowerCase();
  // split by common separators so each item gets its own qty
  const parts = t.split(/[,+،/·]|\sו(?=[א-ת])|\sand\s|\swith\s|\sעם\s/);
  let kcal = 0, protein = 0, hit = false;
  parts.forEach((part) => {
    FOOD_DB.forEach((f) => {
      if (f.k.some((w) => part.includes(w))) {
        const qty = parseQty(part);
        kcal += Math.round(f.c * qty);
        protein += Math.round(f.p * qty);
        hit = true;
      }
    });
  });
  if (!hit) { kcal = 350; protein = 12; }
  return { kcal, protein };
}

function estimateCalories(text) { return estimate(text).kcal; }
function estimateProtein(text) { return estimate(text).protein; }

const RECIPES = {
  "יוגורט יווני עם פירות יער, אגוזי מלך ודבש": {
    kcal: 340,
    time: "5 דק'",
    ingredients: [
      "200 גרם יוגורט יווני 2%",
      "חופן פירות יער",
      "6 אגוזי מלך",
      "כפית דבש",
      "כפית זרעי צ'יה",
    ],
    steps: [
      "שפוך את היוגורט לקערה.",
      "הוסף מעל פירות יער ואגוזים.",
      "גרסי דבש וזרעי צ'יה ובחוש קלות.",
    ],
  },
  "שיבולת שועל עם שקדים, בננה וקינמון": {
    kcal: 360,
    time: "10 דק'",
    ingredients: [
      "½ כוס שיבולת שועל",
      "כוס חלב",
      "בננה פרוסה",
      "10 שקדים קצוצים",
      "קינמון",
    ],
    steps: [
      "בשל את השיבולת עם החלב 5 דקות.",
      "הוסף בננה, שקדים וקינמון.",
      "הגש חם.",
    ],
  },
  "טוסט מחיטה מלאה, אבוקדו וביצים עלומות": {
    kcal: 380,
    time: "12 דק'",
    ingredients: [
      "2 פרוסות לחם מחיטה מלאה",
      "½ אבוקדו",
      "2 ביצים",
      "מלח, פלפל, לימון",
      "שמן זית",
    ],
    steps: [
      "קלה את הלחם.",
      "מחץ את האבוקדו עם לימון ומלח.",
      "הכן ביצים עלומות והנח מעל.",
    ],
  },
  "שקשוקה עם פטה ופיתה מלאה": {
    kcal: 370,
    time: "15 דק'",
    ingredients: [
      "2 עגבניות מרוסקות",
      "בצל קצוץ",
      "2 ביצים",
      "50 גרם פטה",
      "כמון, פפריקה, שמן זית",
      "פיתה מחיטה מלאה",
    ],
    steps: [
      "טגן בצל בשמן זית, הוסף עגבניות ותבלנים.",
      "צור גומות, שבור ביצים פנימה.",
      "פזר פטה וכסה 5 דקות.",
    ],
  },
  "סלט יווני עם חזה עוף בגריל ושמן זית": {
    kcal: 480,
    time: "20 דק'",
    ingredients: [
      "150 גרם חזה עוף",
      "עגבניות, מלפפון, בצל סגול",
      "זיתי קלמטה",
      "50 גרם פטה",
      "שמן זית, לימון, אורגנו",
    ],
    steps: [
      "תבל את העוף וצלה בגריל 6 דקות מכל צד.",
      "חתוך ירקות וערבב עם זיתים ופטה.",
      "פרוס את העוף מעל ותבל בשמן זית ולימון.",
    ],
  },
  "קערת עדשים וירקות קלויים עם פטה": {
    kcal: 460,
    time: "30 דק'",
    ingredients: [
      "1 כוס עדשים ירוקות מבושלות",
      "חציל, קישוא, פלפל",
      "50 גרם פטה",
      "שמן זית, זעתר, רימון",
    ],
    steps: [
      "קלה את הירקות בתנור 20 דקות ב-200°.",
      "ערבב עם העדשים.",
      "פזר פטה, זעתר וזרעי רימון.",
    ],
  },
  "ניסואז טונה עם ביצה וזיתים": {
    kcal: 470,
    time: "15 דק'",
    ingredients: [
      "קופסת טונה בשמן זית",
      "2 ביצים קשות",
      "חופן שעועית ירוקה",
      "זיתים שחורים",
      "חסה, עגבניות שרי",
    ],
    steps: [
      "הרתח שעועית 3 דקות וצנן.",
      "סדר את כל הרכיבים בצלחת.",
      "תבל בשמן זית, חרדל ולימון.",
    ],
  },
  "טאבולה חומוס עם חלומי צלוי": {
    kcal: 490,
    time: "20 דק'",
    ingredients: [
      "כוס גרגרי חומוס מבושלים",
      "פטרוזיליה, נענע, עגבניה",
      "בורגול מבושל",
      "100 גרם חלומי",
      "לימון, שמן זית",
    ],
    steps: [
      "קצוץ עשבי תיבול וערבב עם החומוס והבורגול.",
      "צלה את החלומי במחבת עד להזהבה.",
      "הגש את הטאבולה עם החלומי מעל.",
    ],
  },
  "סלמון בתנור, קינואה וירקות ירוקים מאודים": {
    kcal: 520,
    time: "25 דק'",
    ingredients: [
      "150 גרם פילה סלמון",
      "כוס קינואה",
      "ברוקולי, שעועית ירוקה",
      "לימון, שום, שמן זית",
    ],
    steps: [
      "אפה את הסלמון עם שמן זית, לימון ושום 15 דקות ב-200°.",
      "בשל קינואה לפי ההוראות.",
      "אדה ירקות 5 דקות והגש יחד.",
    ],
  },
  "לברק בגריל, רטטוי ושמן זית": {
    kcal: 500,
    time: "35 דק'",
    ingredients: [
      "פילה לברק",
      "חציל, קישוא, פלפל, עגבניה",
      "בצל, שום",
      "עשבי תיבול, שמן זית",
    ],
    steps: [
      "הכן רטטוי – טגן בצל ושום, הוסף ירקות ובשל 20 דק'.",
      "צלה את הלברק בגריל 4 דק' מכל צד.",
      "הגש את הדג על מצע הרטטוי.",
    ],
  },
  "כדורי הודו ברוטב עגבניות וקישואים": {
    kcal: 510,
    time: "30 דק'",
    ingredients: [
      "250 גרם טחון הודו",
      "ביצה, פירורי לחם, שום",
      "רוטב עגבניות",
      "2 קישואים",
      "בזיליקום",
    ],
    steps: [
      "ערבב את ההודו עם ביצה, פירורים ושום וצור כדורים.",
      "בשל ברוטב עגבניות 15 דקות.",
      "הגש על ספגטי קישואים.",
    ],
  },
  "תבשיל שעועית לבנה עם רוזמרין ועוף": {
    kcal: 505,
    time: "40 דק'",
    ingredients: [
      "כוס שעועית לבנה מבושלת",
      "150 גרם חזה עוף",
      "רוזמרין, שום, עגבניות",
      "שמן זית",
    ],
    steps: [
      "הזהב את העוף עם שום ורוזמרין.",
      "הוסף עגבניות ושעועית.",
      "בשל על אש נמוכה 20 דקות.",
    ],
  },
  "חופן שקדים ותפוח": {
    kcal: 180,
    time: "1 דק'",
    ingredients: ["20 שקדים", "תפוח"],
    steps: ["שטוף את התפוח והגש עם השקדים."],
  },
  "חומוס עם מקלות מלפפון": {
    kcal: 170,
    time: "2 דק'",
    ingredients: ["3 כפות חומוס", "מלפפון", "שמן זית"],
    steps: ["חתוך את המלפפון לרצועות וטבול בחומוס עם טפטוף שמן זית."],
  },
  "יוגורט יווני עם דבש": {
    kcal: 160,
    time: "1 דק'",
    ingredients: ["150 גרם יוגורט יווני", "כפית דבש"],
    steps: ["ערבב ואכול."],
  },
  "תפוז ו-4 אגוזי מלך": {
    kcal: 150,
    time: "1 דק'",
    ingredients: ["תפוז", "4 אגוזי מלך"],
    steps: ["קלף את התפוז ואכול עם האגוזים."],
  },
};

const PLAN_POOL = {
  breakfast: [
    "יוגורט יווני עם פירות יער, אגוזי מלך ודבש",
    "שיבולת שועל עם שקדים, בננה וקינמון",
    "טוסט מחיטה מלאה, אבוקדו וביצים עלומות",
    "שקשוקה עם פטה ופיתה מלאה",
  ],
  lunch: [
    "סלט יווני עם חזה עוף בגריל ושמן זית",
    "קערת עדשים וירקות קלויים עם פטה",
    "ניסואז טונה עם ביצה וזיתים",
    "טאבולה חומוס עם חלומי צלוי",
  ],
  dinner: [
    "סלמון בתנור, קינואה וירקות ירוקים מאודים",
    "לברק בגריל, רטטוי ושמן זית",
    "כדורי הודו ברוטב עגבניות וקישואים",
    "תבשיל שעועית לבנה עם רוזמרין ועוף",
  ],
  snack: [
    "חופן שקדים ותפוח",
    "חומוס עם מקלות מלפפון",
    "יוגורט יווני עם דבש",
    "תפוז ו-4 אגוזי מלך",
  ],
};

const DEFAULT_DISLIKES = ["קישוא", "חציל"];

function filterPool(pool, dislikes) {
  const filtered = pool.filter((name) => {
    const r = RECIPES[name];
    const hay = name + " " + (r?.ingredients || []).join(" ");
    return !dislikes.some((d) => d && hay.includes(d));
  });
  return filtered.length ? filtered : pool;
}

function pickMeal(type, seed, offset, dislikes) {
  const pool = filterPool(PLAN_POOL[type], dislikes);
  return pool[(seed + offset) % pool.length];
}

function pickPlan(seed = 0, dislikes = DEFAULT_DISLIKES) {
  return {
    breakfast: pickMeal("breakfast", seed, 0, dislikes),
    lunch: pickMeal("lunch", seed, 1, dislikes),
    dinner: pickMeal("dinner", seed, 2, dislikes),
    snack: pickMeal("snack", seed, 3, dislikes),
  };
}

function useLocal(key, initial) {
  const [val, setVal] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal];
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [userCode, setUserCode] = useLocal("med-user-code", "");
  const [meals, setMeals] = useLocal("med-meals", {});
  const [weights, setWeights] = useLocal("med-weights", {
    [todayKey()]: START_WEIGHT,
  });
  const [planSeed, setPlanSeed] = useLocal("med-plan-seed", 0);
  const [streak, setStreak] = useLocal("med-streak", 1);
  const [lastLog, setLastLog] = useLocal("med-lastlog", "");
  const [openRecipe, setOpenRecipe] = useState(null);
  const [dislikes, setDislikes] = useLocal("med-dislikes", DEFAULT_DISLIKES);
  const [swaps, setSwaps] = useLocal("med-swaps", {}); // {type: offset}
  const [practiceLog, setPracticeLog] = useLocal("med-practice", {}); // {date: morning|evening|rest}
  const [syncStatus, setSyncStatus] = useState("idle"); // idle|loading|saving|saved|error
  const hydratedRef = useRef(false);

  // Supabase config from build-time env vars
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabaseReady = Boolean(SUPABASE_URL && SUPABASE_KEY);
  const sbHeaders = {
    apikey: SUPABASE_KEY || "",
    Authorization: `Bearer ${SUPABASE_KEY || ""}`,
    "Content-Type": "application/json",
  };

  // Pull state on first load when userCode is set
  useEffect(() => {
    if (!userCode || !supabaseReady) { hydratedRef.current = true; return; }
    setSyncStatus("loading");
    fetch(
      `${SUPABASE_URL}/rest/v1/med_state?user_code=eq.${encodeURIComponent(userCode)}&select=data`,
      { headers: sbHeaders }
    )
      .then((r) => r.json())
      .then((rows) => {
        const data = rows && rows[0] && rows[0].data;
        if (data) {
          if (data.meals) setMeals(data.meals);
          if (data.weights) setWeights(data.weights);
          if (data.planSeed != null) setPlanSeed(data.planSeed);
          if (data.streak != null) setStreak(data.streak);
          if (data.lastLog != null) setLastLog(data.lastLog);
          if (data.dislikes) setDislikes(data.dislikes);
          if (data.swaps) setSwaps(data.swaps);
          if (data.practiceLog) setPracticeLog(data.practiceLog);
        }
        hydratedRef.current = true;
        setSyncStatus("saved");
      })
      .catch(() => { hydratedRef.current = true; setSyncStatus("error"); });
  }, [userCode, supabaseReady]);

  // Debounced push on state change (after hydration)
  useEffect(() => {
    if (!userCode || !hydratedRef.current || !supabaseReady) return;
    setSyncStatus("saving");
    const t = setTimeout(() => {
      fetch(`${SUPABASE_URL}/rest/v1/med_state?on_conflict=user_code`, {
        method: "POST",
        headers: { ...sbHeaders, Prefer: "resolution=merge-duplicates,return=minimal" },
        body: JSON.stringify({
          user_code: userCode,
          data: { meals, weights, planSeed, streak, lastLog, dislikes, swaps, practiceLog },
        }),
      })
        .then((r) => (r.ok ? setSyncStatus("saved") : setSyncStatus("error")))
        .catch(() => setSyncStatus("error"));
    }, 800);
    return () => clearTimeout(t);
  }, [userCode, supabaseReady, meals, weights, planSeed, streak, lastLog, dislikes, swaps, practiceLog]);

  const today = todayKey();
  const todayMeals = meals[today] || [];
  const consumed = todayMeals.reduce((s, m) => s + m.kcal, 0);
  const proteinToday = todayMeals.reduce(
    (s, m) => s + (m.protein || estimateProtein(m.text)),
    0
  );
  const practiceMode = practiceLog[today] || "morning";
  const dailyCalTarget = CAL_TARGETS[practiceMode];
  const setPractice = (mode) =>
    setPracticeLog({ ...practiceLog, [today]: mode });

  const sortedDates = Object.keys(weights).sort();
  const currentWeight =
    weights[today] || weights[sortedDates[sortedDates.length - 1]] || START_WEIGHT;

  const lost = Math.max(0, START_WEIGHT - currentWeight);
  const goal = START_WEIGHT - TARGET_WEIGHT;
  const progressPct = Math.min(100, Math.round((lost / goal) * 100));
  const daysLeft = Math.max(0, TOTAL_DAYS - daysSinceStart());

  const plan = useMemo(() => {
    const base = planSeed + daysSinceStart();
    return {
      breakfast: pickMeal("breakfast", base, 0 + (swaps.breakfast || 0), dislikes),
      lunch: pickMeal("lunch", base, 1 + (swaps.lunch || 0), dislikes),
      dinner: pickMeal("dinner", base, 2 + (swaps.dinner || 0), dislikes),
      snack: pickMeal("snack", base, 3 + (swaps.snack || 0), dislikes),
    };
  }, [planSeed, swaps, dislikes]);

  const swapMeal = (type) =>
    setSwaps({ ...swaps, [type]: (swaps[type] || 0) + 1 });

  const statusColor =
    consumed <= dailyCalTarget - 100
      ? "bg-emerald-500"
      : consumed <= dailyCalTarget + 100
      ? "bg-amber-500"
      : "bg-red-500";
  const statusLabel =
    consumed <= dailyCalTarget - 100
      ? "במסלול"
      : consumed <= dailyCalTarget + 100
      ? "קרוב ליעד"
      : "מעל היעד";

  const addMeal = (text, overrideKcal, overrideProtein) => {
    if (!text.trim()) return;
    const est = estimate(text);
    const kcal = overrideKcal != null && overrideKcal !== "" ? Number(overrideKcal) : est.kcal;
    const protein = overrideProtein != null && overrideProtein !== "" ? Number(overrideProtein) : est.protein;
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const next = { ...meals, [today]: [...todayMeals, { text, kcal, protein, time }] };
    setMeals(next);
    if (lastLog !== today) {
      setStreak(streak + 1);
      setLastLog(today);
    }
  };
  const removeMeal = (i) => {
    const next = { ...meals, [today]: todayMeals.filter((_, idx) => idx !== i) };
    setMeals(next);
  };
  const updateMealDateTime = (i, newDate, newTime) => {
    const meal = todayMeals[i];
    const updated = { ...meal, time: newTime };
    if (newDate === today) {
      const arr = [...todayMeals];
      arr[i] = updated;
      setMeals({ ...meals, [today]: arr });
    } else {
      // move meal to a different date bucket
      const fromArr = todayMeals.filter((_, idx) => idx !== i);
      const toArr = [...(meals[newDate] || []), updated];
      setMeals({ ...meals, [today]: fromArr, [newDate]: toArr });
    }
  };
  const setTodayWeight = (w) => {
    const n = parseFloat(w);
    if (!isNaN(n)) setWeights({ ...weights, [today]: n });
  };

  const feedback = useMemo(() => {
    if (todayMeals.length === 0) return "רשום את הארוחה הראשונה כדי לקבל תובנה.";
    const diff = consumed - dailyCalTarget;
    if (proteinToday < PROTEIN_TARGET - 30)
      return `חלבון נמוך (${proteinToday}ג מתוך ${PROTEIN_TARGET}ג). הוסף דג, עוף או יוגורט יווני.`;
    if (diff > 200)
      return `היית ${diff} קק״ל מעל — כנראה חטיפים או שמנים. מחר נקל על הערב.`;
    if (diff > 0) return `רק ${diff} קק״ל מעל — כמעט מושלם. המשך לשתות מים.`;
    if (diff > -200) return "בדיוק על היעד. איזון ים-תיכוני מצוין היום.";
    return "מתחת ליעד — ודא שאכלת מספיק חלבון לשמירה על שריר.";
  }, [consumed, todayMeals.length, proteinToday, dailyCalTarget]);

  const weeklyAvg = useMemo(() => {
    const last7 = sortedDates.slice(-7).map((d) => weights[d]);
    if (!last7.length) return currentWeight;
    return (last7.reduce((a, b) => a + b, 0) / last7.length).toFixed(1);
  }, [weights]);

  if (!userCode) return <CodeGate onSubmit={setUserCode} />;

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 text-stone-800 font-sans">
      <div className="max-w-md mx-auto pb-28">
        <header className="px-6 pt-8 pb-4 flex justify-between items-start">
          <div>
            <p className="text-sm text-stone-500">יום טוב, דודו</p>
            <h1 className="text-2xl font-semibold" style={{ color: "#556B2F" }}>
              המסע הים-תיכוני שלך 👨
            </h1>
          </div>
          <div className="text-xs text-stone-400 text-left">
            <p>קוד: {userCode}</p>
            <p>{syncStatus === "saving" ? "שומר…" : syncStatus === "saved" ? "✓ מסונכרן" : syncStatus === "loading" ? "טוען…" : syncStatus === "error" ? "⚠ שגיאה" : ""}</p>
          </div>
        </header>

        {tab === "home" && (
          <div className="px-6 space-y-4">
            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    נוכחי
                  </p>
                  <p className="text-4xl font-light">
                    {currentWeight}
                    <span className="text-lg text-stone-400">ק״ג</span>
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs uppercase tracking-wide text-stone-400">
                    יעד
                  </p>
                  <p className="text-2xl font-light text-stone-500">
                    {TARGET_WEIGHT}ק״ג
                  </p>
                </div>
              </div>
              <div className="mt-4 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressPct}%`, background: "#6B8E23" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-stone-500">
                <span>{progressPct}% הושלמו</span>
                <span>{daysLeft} ימים נותרו</span>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-2">
                <p className="text-xs uppercase tracking-wide text-stone-400">
                  קלוריות היום
                </p>
                <span
                  className={`px-2 py-0.5 rounded-full text-white text-xs ${statusColor}`}
                >
                  {statusLabel}
                </span>
              </div>
              <p className="text-3xl font-light">
                {consumed}
                <span className="text-base text-stone-400">
                  {" "}
                  / {dailyCalTarget} קק״ל
                </span>
              </p>
              <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${statusColor} transition-all`}
                  style={{
                    width: `${Math.min(100, (consumed / dailyCalTarget) * 100)}%`,
                  }}
                />
              </div>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-xs text-stone-400">חלבון</p>
                <p className="text-xs text-stone-500">
                  {proteinToday}ג / {PROTEIN_TARGET}ג
                </p>
              </div>
              <div className="mt-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (proteinToday / PROTEIN_TARGET) * 100)}%`,
                    background: "#556B2F",
                  }}
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-stone-400 mb-3">
                🧘 אשטנגה היום
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["morning", "בוקר"],
                  ["evening", "ערב"],
                  ["rest", "מנוחה"],
                ].map(([k, l]) => (
                  <button
                    key={k}
                    onClick={() => setPractice(k)}
                    className={`py-2 rounded-xl text-sm ${
                      practiceMode === k
                        ? "text-white"
                        : "bg-stone-50 text-stone-500"
                    }`}
                    style={
                      practiceMode === k ? { background: "#6B8E23" } : {}
                    }
                  >
                    {l}
                  </button>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-3 leading-relaxed">
                {CAL_TIPS[practiceMode]}
              </p>
            </div>

            <button
              onClick={() => setTab("log")}
              className="w-full py-4 rounded-2xl text-white text-lg font-medium shadow-sm"
              style={{ background: "#6B8E23" }}
            >
              👉 תעד את הארוחות שלך היום
            </button>

            <div className="bg-white rounded-3xl p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-stone-400 mb-2">
                תובנת היום
              </p>
              <p className="text-stone-700 leading-relaxed">{feedback}</p>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm text-center">
                <p className="text-xs uppercase text-stone-400">רצף</p>
                <p className="text-2xl font-light">🔥 {streak}</p>
              </div>
              <div className="flex-1 bg-white rounded-3xl p-5 shadow-sm text-center">
                <p className="text-xs uppercase text-stone-400">ממוצע 7 ימים</p>
                <p className="text-2xl font-light">{weeklyAvg}ק״ג</p>
              </div>
            </div>
          </div>
        )}

        {tab === "log" && (
          <LogScreen
            todayMeals={todayMeals}
            consumed={consumed}
            statusColor={statusColor}
            addMeal={addMeal}
            removeMeal={removeMeal}
            dailyCalTarget={dailyCalTarget}
            proteinToday={proteinToday}
            today={today}
            updateMealDateTime={updateMealDateTime}
          />
        )}

        {tab === "plan" && (
          <PlanScreen
            plan={plan}
            onRegen={() => setPlanSeed(planSeed + 1)}
            onOpenRecipe={(name) => setOpenRecipe(name)}
            onSwapMeal={swapMeal}
            dislikes={dislikes}
            setDislikes={setDislikes}
          />
        )}

        {tab === "weight" && (
          <WeightScreen
            weights={weights}
            setTodayWeight={setTodayWeight}
            weeklyAvg={weeklyAvg}
          />
        )}
      </div>

      {openRecipe && (
        <RecipeModal
          name={openRecipe}
          onClose={() => setOpenRecipe(null)}
        />
      )}

      <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-stone-100">
        <div className="max-w-md mx-auto grid grid-cols-4 text-xs">
          {[
            ["home", "בית", "🏡"],
            ["log", "יומן", "🍽️"],
            ["plan", "תפריט", "🌿"],
            ["weight", "משקל", "⚖️"],
          ].map(([k, l, i]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={`py-3 flex flex-col items-center ${
                tab === k ? "text-stone-900" : "text-stone-400"
              }`}
            >
              <span className="text-lg">{i}</span>
              <span>{l}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

function LogScreen({
  todayMeals,
  consumed,
  statusColor,
  addMeal,
  removeMeal,
  dailyCalTarget,
  proteinToday,
  today,
  updateMealDateTime,
}) {
  const [text, setText] = useState("");
  const [kcalOverride, setKcalOverride] = useState("");
  const [proteinOverride, setProteinOverride] = useState("");
  const preview = estimate(text);
  const submit = () => {
    addMeal(text, kcalOverride, proteinOverride);
    setText(""); setKcalOverride(""); setProteinOverride("");
  };
  return (
    <div className="px-6 space-y-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <p className="text-xs uppercase text-stone-400">היום</p>
        <p className="text-3xl font-light">
          {consumed}{" "}
          <span className="text-base text-stone-400">
            / {dailyCalTarget} קק״ל
          </span>
        </p>
        <div className="mt-3 h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className={`h-full ${statusColor}`}
            style={{
              width: `${Math.min(100, (consumed / dailyCalTarget) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-stone-500 mt-3">
          חלבון: {proteinToday}ג / {PROTEIN_TARGET}ג
        </p>
      </div>

      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="למשל: 2 ביצים, פרוסת לחם, חצי אבוקדו"
          className="w-full bg-stone-100 text-stone-900 placeholder-stone-400 rounded-2xl px-4 py-3 outline-none"
        />
        <p className="text-xs text-stone-400 mt-2">
          הערכה: {preview.kcal} קק״ל · {preview.protein}ג חלבון. אפשר לדרוס ידנית למטה.
        </p>
        <div className="flex gap-2 mt-3">
          <input
            type="number"
            inputMode="numeric"
            value={kcalOverride}
            onChange={(e) => setKcalOverride(e.target.value)}
            placeholder="קק״ל ידני"
            className="w-1/2 bg-stone-100 text-stone-900 placeholder-stone-400 rounded-2xl px-4 py-3 outline-none text-sm"
          />
          <input
            type="number"
            inputMode="numeric"
            value={proteinOverride}
            onChange={(e) => setProteinOverride(e.target.value)}
            placeholder="חלבון ג׳"
            className="w-1/2 bg-stone-100 text-stone-900 placeholder-stone-400 rounded-2xl px-4 py-3 outline-none text-sm"
          />
        </div>
        <button
          onClick={submit}
          className="w-full mt-3 py-3 rounded-2xl text-white font-medium"
          style={{ background: "#6B8E23" }}
        >
          הוסף ארוחה
        </button>
      </div>

      <div className="space-y-2">
        {todayMeals.length === 0 && (
          <p className="text-center text-stone-400 text-sm py-6">
            עדיין לא תועדו ארוחות היום.
          </p>
        )}
        {todayMeals.map((m, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 shadow-sm"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-stone-800">{m.text}</p>
                <p className="text-xs text-stone-400">{m.kcal} קק״ל · {m.protein || 0}ג חלבון</p>
              </div>
              <button
                onClick={() => removeMeal(i)}
                className="text-stone-300 text-lg px-2"
              >
                ×
              </button>
            </div>
            <div className="flex gap-2 mt-3" dir="ltr">
              <input
                type="date"
                value={today}
                onChange={(e) => updateMealDateTime(i, e.target.value, m.time || "12:00")}
                className="bg-stone-50 rounded-xl px-3 py-2 text-xs outline-none flex-1"
              />
              <input
                type="time"
                value={m.time || "12:00"}
                onChange={(e) => updateMealDateTime(i, today, e.target.value)}
                className="bg-stone-50 rounded-xl px-3 py-2 text-xs outline-none w-24"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlanScreen({ plan, onRegen, onOpenRecipe, onSwapMeal, dislikes, setDislikes }) {
  const [showPrefs, setShowPrefs] = useState(false);
  const [newDislike, setNewDislike] = useState("");
  const items = [
    ["ארוחת בוקר", plan.breakfast, "☀️", "breakfast"],
    ["ארוחת צהריים", plan.lunch, "🥗", "lunch"],
    ["ארוחת ערב", plan.dinner, "🐟", "dinner"],
    ["חטיף", plan.snack, "🫒", "snack"],
  ];
  const total = items.reduce((s, [, n]) => s + (RECIPES[n]?.kcal || 0), 0);
  return (
    <div className="px-6 space-y-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs uppercase text-stone-400">תפריט היום</p>
            <p className="text-3xl font-light">{total} קק״ל</p>
            <p className="text-sm text-stone-500 mt-1">
              עשיר בחלבון · ים-תיכוני · מאוזן
            </p>
          </div>
          <button
            onClick={() => setShowPrefs(!showPrefs)}
            className="text-xs text-stone-500 border border-stone-200 rounded-full px-3 py-1"
          >
            העדפות
          </button>
        </div>
        {showPrefs && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <p className="text-xs text-stone-500 mb-2">מרכיבים שאני לא אוהב:</p>
            <div className="flex flex-wrap gap-2 mb-2">
              {dislikes.map((d, i) => (
                <span
                  key={i}
                  className="bg-stone-100 rounded-full px-3 py-1 text-xs flex items-center gap-1"
                >
                  {d}
                  <button
                    onClick={() =>
                      setDislikes(dislikes.filter((_, j) => j !== i))
                    }
                    className="text-stone-400"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={newDislike}
                onChange={(e) => setNewDislike(e.target.value)}
                placeholder="הוסף מרכיב..."
                className="flex-1 bg-stone-50 rounded-full px-3 py-1 text-sm outline-none"
              />
              <button
                onClick={() => {
                  if (newDislike.trim()) {
                    setDislikes([...dislikes, newDislike.trim()]);
                    setNewDislike("");
                  }
                }}
                className="text-xs text-white rounded-full px-3 py-1"
                style={{ background: "#6B8E23" }}
              >
                הוסף
              </button>
            </div>
          </div>
        )}
      </div>
      {items.map(([label, name, icon, type]) => {
        const r = RECIPES[name];
        return (
          <div key={label} className="bg-white rounded-3xl p-5 shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs uppercase tracking-wide text-stone-400">
                {icon} {label}
              </p>
              <p className="text-xs text-stone-400">{r?.kcal} קק״ל</p>
            </div>
            <p className="text-stone-800 text-lg leading-snug">{name}</p>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onOpenRecipe(name)}
                className="flex-1 text-xs py-2 rounded-xl bg-stone-50 text-stone-600"
              >
                מתכון מלא ←
              </button>
              <button
                onClick={() => onSwapMeal(type)}
                className="flex-1 text-xs py-2 rounded-xl bg-stone-50 text-stone-600"
              >
                🔄 החלף ארוחה
              </button>
            </div>
          </div>
        );
      })}
      <button
        onClick={onRegen}
        className="w-full py-4 rounded-2xl font-medium border border-stone-200 bg-white"
      >
        ✨ צור לי יום טוב יותר מחר
      </button>
    </div>
  );
}

function RecipeModal({ name, onClose }) {
  const r = RECIPES[name];
  const [ingredients, setIngredients] = useState(r?.ingredients || []);
  const [swapIdx, setSwapIdx] = useState(null);

  const SWAP_MAP = {
    יוגורט: "קוטג' 5%",
    שקדים: "אגוזי מלך",
    "אגוזי מלך": "שקדים",
    לחם: "פיתה מלאה",
    אבוקדו: "טחינה",
    עוף: "הודו",
    סלמון: "מושט",
    קינואה: "בורגול",
    פטה: "גבינה בולגרית",
    חומוס: "פול",
    בננה: "תפוח",
    עדשים: "שעועית לבנה",
  };

  const swap = (i) => {
    const original = ingredients[i];
    const key = Object.keys(SWAP_MAP).find((k) => original.includes(k));
    if (!key) {
      setSwapIdx(i);
      setTimeout(() => setSwapIdx(null), 1500);
      return;
    }
    const replaced = original.replace(key, SWAP_MAP[key]);
    const next = [...ingredients];
    next[i] = replaced;
    setIngredients(next);
  };

  if (!r) return null;
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-stone-50 w-full max-w-md rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h2 className="text-xl font-semibold leading-tight pl-4">{name}</h2>
            <button onClick={onClose} className="text-stone-400 text-2xl leading-none">
              ×
            </button>
          </div>
          <p className="text-sm text-stone-500 mb-4">
            {r.kcal} קק״ל · {r.time}
          </p>

          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
            <p className="text-xs uppercase text-stone-400 mb-3">מצרכים</p>
            <ul className="space-y-2">
              {ingredients.map((ing, i) => (
                <li
                  key={i}
                  className="flex justify-between items-center text-stone-700"
                >
                  <span>• {ing}</span>
                  <button
                    onClick={() => swap(i)}
                    className="text-xs text-stone-400 border border-stone-200 rounded-full px-2 py-0.5"
                  >
                    {swapIdx === i ? "אין חלופה" : "החלף"}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <p className="text-xs uppercase text-stone-400 mb-3">הכנה</p>
            <ol className="space-y-3">
              {r.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-stone-700">
                  <span
                    className="flex-shrink-0 w-6 h-6 rounded-full text-white text-xs flex items-center justify-center"
                    style={{ background: "#6B8E23" }}
                  >
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightScreen({ weights, setTodayWeight, weeklyAvg }) {
  const [val, setVal] = useState("");
  const entries = Object.entries(weights).sort();
  const values = entries.map(([, v]) => v);
  const min = Math.min(...values, TARGET_WEIGHT - 0.5);
  const max = Math.max(...values, START_WEIGHT + 0.5);
  const W = 300;
  const H = 140;
  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * W;
      const y = H - ((v - min) / (max - min)) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="px-6 space-y-4">
      <div className="bg-white rounded-3xl p-6 shadow-sm">
        <p className="text-xs uppercase text-stone-400">ממוצע שבועי</p>
        <p className="text-3xl font-light">{weeklyAvg} ק״ג</p>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-4">
          <polyline
            fill="none"
            stroke="#6B8E23"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={pts}
          />
          {values.map((v, i) => {
            const x = (i / Math.max(1, values.length - 1)) * W;
            const y = H - ((v - min) / (max - min)) * H;
            return <circle key={i} cx={x} cy={y} r="4" fill="#6B8E23" />;
          })}
        </svg>
      </div>
      <div className="bg-white rounded-3xl p-5 shadow-sm">
        <p className="text-xs uppercase text-stone-400 mb-2">שקילת בוקר</p>
        <input
          type="number"
          step="0.1"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="למשל 75.4"
          className="w-full bg-stone-100 text-stone-900 placeholder-stone-400 rounded-2xl px-4 py-3 outline-none"
        />
        <button
          onClick={() => {
            setTodayWeight(val);
            setVal("");
          }}
          className="w-full mt-3 py-3 rounded-2xl text-white font-medium"
          style={{ background: "#6B8E23" }}
        >
          שמור
        </button>
      </div>
    </div>
  );
}

function CodeGate({ onSubmit }) {
  const [code, setCode] = useState("dudu-2026");
  const submit = () => {
    const c = code.trim().toLowerCase();
    if (c.length >= 3) onSubmit(c);
  };
  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 flex items-start justify-center p-6 pt-16">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-sm">
        <h1 className="text-2xl font-semibold mb-2" style={{ color: "#556B2F" }}>Med Coach</h1>
        <p className="text-sm text-stone-500 mb-5">
          הזן קוד אישי כדי לסנכרן נתונים בין מכשירים. השתמש באותו קוד בדפדפן ובנייד.
        </p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          placeholder="dudu-2026"
          dir="ltr"
          className="w-full bg-stone-100 text-stone-900 placeholder-stone-400 rounded-2xl px-4 py-3 outline-none mb-3 text-right"
          autoComplete="off"
          autoCapitalize="none"
        />
        <button
          onClick={submit}
          className="w-full py-3 rounded-2xl text-white font-medium"
          style={{ background: "#6B8E23" }}
        >
          המשך
        </button>
        <p className="text-xs text-stone-400 mt-4">
          שמור את הקוד — זו הגישה לנתונים שלך. ללא סיסמה, ללא הרשמה.
        </p>
      </div>
    </div>
  );
}
