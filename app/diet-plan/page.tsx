import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Vegetarian Diet Plan by Age Group — HealthLens",
  description:
    "Science-backed vegetarian meal plans organised by age group — from toddlers to seniors. Covering nutrition requirements, foods to avoid, and pro tips.",
};

// ─── data ─────────────────────────────────────────────────────────────────────
const AGE_GROUPS = [
  {
    id: "toddlers",
    emoji: "🧒",
    label: "Ages 1 – 3 Years",
    title: "Toddlers",
    sub: "Caloric need ~1,000–1,400 kcal/day · Focus: growth, brain development",
    theme: {
      accent: "#d97706",
      badgeBg: "#fef3c7",
      iconGrad: "linear-gradient(135deg,#fbbf24,#f59e0b)",
      chipBg: "#fef3c7",
      chipColor: "#d97706",
    },
    meals: [
      {
        time: "Breakfast",
        title: "Morning Fuel",
        items: [
          "Soft oatmeal porridge with mashed banana & a drizzle of honey (avoid honey under 1 yr)",
          "Whole-milk yogurt with pureed fruit",
          "Small glass of fortified milk (150 ml)",
        ],
        tip: "Offer finger-food-sized pieces to encourage self-feeding.",
        chips: ["Calcium", "Iron", "Vitamin D"],
      },
      {
        time: "Lunch",
        title: "Midday Plate",
        items: [
          "Mashed dal (lentil soup) with soft-cooked rice",
          "Steamed & mashed sweet potato cubes",
          "Soft cooked spinach with ghee",
        ],
        tip: "Add ghee for healthy fats essential for brain development.",
        chips: ["Protein", "Folate", "Healthy Fats"],
      },
      {
        time: "Snack",
        title: "Afternoon Bites",
        items: [
          "Ripe banana or soft mango slices",
          "Small handful of puffed rice (muri)",
          "Diluted fruit juice (no added sugar)",
        ],
        tip: "Keep snacks small — toddler stomachs are tiny!",
        chips: ["Vitamin C", "Fibre"],
      },
      {
        time: "Dinner",
        title: "Evening Meal",
        items: [
          "Khichdi (rice + moong dal) with vegetable purée",
          "Soft roti with mashed paneer & spinach filling",
          "Warm milk at bedtime (200 ml)",
        ],
        tip: "Dinner 2–3 hours before bedtime aids restful sleep.",
        chips: ["Protein", "Calcium", "Zinc"],
      },
    ],
  },
  {
    id: "children",
    emoji: "👦",
    label: "Ages 4 – 12 Years",
    title: "Children",
    sub: "Caloric need ~1,400–2,200 kcal/day · Focus: growth, immunity, concentration",
    theme: {
      accent: "#0ea5e9",
      badgeBg: "#e0f2fe",
      iconGrad: "linear-gradient(135deg,#38bdf8,#0ea5e9)",
      chipBg: "#e0f2fe",
      chipColor: "#0ea5e9",
    },
    meals: [
      {
        time: "Breakfast",
        title: "Rise & Shine",
        items: [
          "Whole-wheat toast with peanut butter & sliced banana",
          "Glass of fortified milk or soy milk",
          "A handful of mixed berries or orange slices",
        ],
        tip: "Protein + complex carbs = sustained focus in school.",
        chips: ["Calcium", "Vitamin C", "Fibre"],
      },
      {
        time: "Lunch",
        title: "School Lunchbox",
        items: [
          "Paneer paratha with mint chutney",
          "Rajma (kidney bean) curry & steamed rice",
          "Fresh cucumber and carrot sticks",
        ],
        tip: "Legumes supply iron that supports cognitive development.",
        chips: ["Iron", "Protein", "B6"],
      },
      {
        time: "Snack",
        title: "After-School Plate",
        items: [
          "Roasted chana (chickpeas) with lemon & spices",
          "Greek yogurt with honey drizzle",
          "Homemade trail mix — nuts, raisins & seeds",
        ],
        tip: "Protein-rich snacks curb pre-dinner junk food cravings.",
        chips: ["Protein", "Healthy Fats"],
      },
      {
        time: "Dinner",
        title: "Family Dinner",
        items: [
          "Vegetable biryani with raita",
          "Dal tadka (tempered lentils) with chapati",
          "Steamed broccoli & peas stir-fry",
        ],
        tip: "Pair iron-rich foods with Vitamin C to boost absorption.",
        chips: ["Iron", "Folate", "Zinc"],
      },
    ],
  },
  {
    id: "teens",
    emoji: "🧑",
    label: "Ages 13 – 18 Years",
    title: "Teenagers",
    sub: "Caloric need ~2,200–3,000 kcal/day · Focus: bone density, hormones, energy",
    theme: {
      accent: "#8b5cf6",
      badgeBg: "#ede9fe",
      iconGrad: "linear-gradient(135deg,#a78bfa,#8b5cf6)",
      chipBg: "#ede9fe",
      chipColor: "#8b5cf6",
    },
    meals: [
      {
        time: "Breakfast",
        title: "Power Start",
        items: [
          "Smoothie bowl — blended mango, banana, spinach topped with granola & seeds",
          "Two boiled eggs (ovo-vegetarian) or tofu scramble",
          "Glass of fortified orange juice",
        ],
        tip: "Calcium & Vitamin D are critical during peak bone-building years.",
        chips: ["Calcium", "Vitamin D", "Protein"],
      },
      {
        time: "Lunch",
        title: "Canteen-Proof Meal",
        items: [
          "Whole-grain wrap with hummus, avocado, tomato & lettuce",
          "Chickpea salad with olive oil & lemon dressing",
          "Low-fat yogurt or a piece of cheese",
        ],
        tip: "Pack iron + Vitamin C together to fight teen anaemia.",
        chips: ["Iron", "Vitamin C", "Healthy Fats"],
      },
      {
        time: "Snack",
        title: "Post-Study Boost",
        items: [
          "Peanut butter on multi-grain crackers",
          "Dark chocolate (70%+) & walnut mix",
          "Fresh fruit — apple or pear",
        ],
        tip: "Omega-3 from walnuts supports mood & exam performance.",
        chips: ["Omega-3", "Magnesium"],
      },
      {
        time: "Dinner",
        title: "Recovery Meal",
        items: [
          "Tofu & vegetable stir-fry with brown rice",
          "Chana masala (spiced chickpeas) with naan",
          "Paneer tikka with mint dip as protein top-up",
        ],
        tip: "Aim for 1.2–1.6 g protein/kg body weight for active teens.",
        chips: ["Protein", "Zinc", "B12"],
      },
    ],
  },
  {
    id: "adults",
    emoji: "🧑",
    label: "Ages 19 – 59 Years",
    title: "Adults",
    sub: "Caloric need ~2,000–2,500 kcal/day · Focus: energy, heart health, weight management",
    theme: {
      accent: "#16a34a",
      badgeBg: "#dcfce7",
      iconGrad: "linear-gradient(135deg,#4ade80,#22c55e)",
      chipBg: "#dcfce7",
      chipColor: "#15803d",
    },
    meals: [
      {
        time: "Breakfast",
        title: "Productive Morning",
        items: [
          "Overnight oats with chia seeds, almond milk & berries",
          "Two multigrain idlis with sambar & coconut chutney",
          "Black coffee or green tea (no added sugar)",
        ],
        tip: "High-fibre breakfasts maintain blood sugar and reduce mid-morning crashes.",
        chips: ["Fibre", "Protein", "Antioxidants"],
      },
      {
        time: "Lunch",
        title: "Balanced Plate",
        items: [
          "Brown rice + dal + mixed sabzi (vegetables) + salad",
          "Palak paneer with whole-wheat roti",
          "Buttermilk (chaas) or lemon water",
        ],
        tip: "Plate rule: ½ vegetables, ¼ grains, ¼ protein.",
        chips: ["Iron", "Calcium", "Vitamin K"],
      },
      {
        time: "Snack",
        title: "Smart Snacking",
        items: [
          "Sprouts chaat with lemon, onion & coriander",
          "A mix of almonds, cashews & dried figs",
          "Coconut water or fresh lime soda",
        ],
        tip: "Sprouts are a protein powerhouse & excellent prebiotic.",
        chips: ["Probiotics", "Healthy Fats"],
      },
      {
        time: "Dinner",
        title: "Light Evening",
        items: [
          "Vegetable soup + multigrain bread (light)",
          "Quinoa salad with roasted veggies & tahini dressing",
          "A cup of low-fat milk with turmeric (golden milk)",
        ],
        tip: "Lighter dinners improve sleep quality & metabolism.",
        chips: ["Antioxidants", "Magnesium", "Tryptophan"],
      },
    ],
  },
  {
    id: "seniors",
    emoji: "👴",
    label: "Ages 60+ Years",
    title: "Seniors",
    sub: "Caloric need ~1,600–2,000 kcal/day · Focus: bone health, joint mobility, digestion",
    theme: {
      accent: "#f97316",
      badgeBg: "#ffedd5",
      iconGrad: "linear-gradient(135deg,#fb923c,#f97316)",
      chipBg: "#ffedd5",
      chipColor: "#f97316",
    },
    meals: [
      {
        time: "Breakfast",
        title: "Gentle Start",
        items: [
          "Soft porridge (daliya) with jaggery & cardamom",
          "Stewed prunes or soaked raisins for regularity",
          "Warm milk with a pinch of turmeric",
        ],
        tip: "Warm, easily digestible foods are gentler on ageing digestive systems.",
        chips: ["Calcium", "Vitamin D", "Fibre"],
      },
      {
        time: "Lunch",
        title: "Nourishing Noon",
        items: [
          "Soft khichdi with mixed vegetables & ghee",
          "Moong dal soup with ajwain (carom) tempering",
          "Steamed soft gourd (lauki) with roti",
        ],
        tip: "Ghee supports joint lubrication & fat-soluble vitamin absorption.",
        chips: ["Protein", "Good Fats", "B12"],
      },
      {
        time: "Snack",
        title: "Afternoon Refresh",
        items: [
          "Soft fruit — ripe papaya or banana",
          "Roasted flaxseeds or a small handful of walnuts",
          "Herbal tea — ginger, tulsi, or chamomile",
        ],
        tip: "Omega-3 from flaxseeds supports heart & brain health.",
        chips: ["Omega-3", "Potassium"],
      },
      {
        time: "Dinner",
        title: "Easy Evening",
        items: [
          "Vegetable & tofu clear soup",
          "Soft idlis with sambar (no excess chilli)",
          "Warm golden milk with ashwagandha powder",
        ],
        tip: "Ashwagandha helps manage stress hormones & improves sleep in seniors.",
        chips: ["Antioxidants", "Calcium", "Adaptogens"],
      },
    ],
  },
];

const NUTRITION_TABLE = [
  { group: "🧒 Toddlers (1–3)",  bg: "#fef3c7", color: "#d97706", kcal: "1,000–1,400", protein: "13–16",  calcium: "700–1,000",  iron: "7–10",  b12: "0.9",     focus: "Brain & bone growth"      },
  { group: "👦 Children (4–12)", bg: "#e0f2fe", color: "#0284c7", kcal: "1,400–2,200", protein: "19–34",  calcium: "1,000–1,300",iron: "10–15", b12: "1.2–1.8", focus: "Immunity & cognition"     },
  { group: "🧑 Teens (13–18)",   bg: "#ede9fe", color: "#7c3aed", kcal: "2,200–3,000", protein: "46–59",  calcium: "1,300",       iron: "15–18", b12: "2.4",     focus: "Bone density & hormones" },
  { group: "🧑 Adults (19–59)",  bg: "#dcfce7", color: "#15803d", kcal: "2,000–2,500", protein: "46–56",  calcium: "1,000",       iron: "8–18",  b12: "2.4",     focus: "Heart health & energy"    },
  { group: "👴 Seniors (60+)",   bg: "#ffedd5", color: "#c2410c", kcal: "1,600–2,000", protein: "56–68",  calcium: "1,200",       iron: "8–10",  b12: "2.8",     focus: "Joint & bone health"      },
];

const AVOID_ITEMS = [
  { emoji: "🍬", title: "Excess Refined Sugar",   desc: "White sugar, sweets, and sodas cause inflammation, insulin spikes, and displace nutrient-dense foods." },
  { emoji: "🍟", title: "Ultra-Processed Snacks", desc: "Chips, packaged biscuits, and instant noodles are high in trans fats, sodium, and empty calories." },
  { emoji: "☕", title: "Excess Caffeine & Tea",   desc: "More than 2 cups/day can inhibit iron and calcium absorption — space meals & hot drinks apart." },
  { emoji: "🧂", title: "High Sodium Foods",       desc: "Pickles, papadums, and salty snacks raise blood pressure and increase calcium excretion." },
  { emoji: "🥤", title: "Sugary Beverages",        desc: "Fruit juices with added sugar, energy drinks, and aerated drinks contribute to obesity and dental decay." },
  { emoji: "🍞", title: "Excess Refined Grains",   desc: "White bread and maida (all-purpose flour) lack fibre and spike blood sugar. Opt for whole grains." },
];

const TIPS = [
  { emoji: "🌞", title: "Vitamin D Sunlight & Supplements", desc: "Spend 15–20 min in morning sun and consider a Vitamin D3 supplement — most vegetarians are deficient." },
  { emoji: "💊", title: "Supplement B12 Religiously",       desc: "Vitamin B12 is found almost exclusively in animal products. All vegetarians should supplement 500–1000 mcg weekly." },
  { emoji: "🫘", title: "Soak & Sprout Your Legumes",       desc: "Soaking reduces phytic acid, increasing the absorption of iron, zinc, and calcium from beans and lentils." },
  { emoji: "🍋", title: "Pair Iron With Vitamin C",         desc: "Non-haem iron from plants is less bioavailable. Add lemon juice or tomatoes to iron-rich meals to boost uptake." },
  { emoji: "💧", title: "Hydrate Smartly",                  desc: "Aim for 8–10 glasses of water daily. High-fibre diets need more fluids to aid digestion." },
  { emoji: "🥜", title: "Diversify Your Protein Sources",   desc: "Rotate dal, paneer, tofu, beans, quinoa, and nuts to ensure a complete amino acid profile." },
];

// ─── page ──────────────────────────────────────────────────────────────────────
export default function DietPlanPage() {
  return (
    <main style={{ fontFamily: "var(--font-sans, system-ui, sans-serif)", background: "#f8fafc", color: "#1e293b" }}>

      {/* ── Emergency banner ── */}
      <div style={{
        background: "linear-gradient(90deg,#b91c1c,#dc2626,#b91c1c)",
        color: "#fff",
        textAlign: "center",
        padding: "10px 16px",
        fontSize: ".85rem",
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
      }}>
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fff", display: "inline-block", flexShrink: 0 }} />
        🚨 Medical Emergency? Call&nbsp;
        <a href="tel:104" style={{ color: "#fff", fontWeight: 900, fontSize: "1.05rem", borderBottom: "2px solid rgba(255,255,255,.6)" }}>
          104
        </a>
        &nbsp;immediately — Available 24/7
        <span style={{ width: 9, height: 9, borderRadius: "50%", background: "#fff", display: "inline-block", flexShrink: 0 }} />
      </div>

      {/* ── Hero ── */}
      <section style={{
        background: "linear-gradient(135deg,#064e3b 0%,#065f46 30%,#047857 60%,#059669 100%)",
        color: "#fff",
        padding: "72px 24px 88px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "relative", zIndex: 1, maxWidth: 720, margin: "0 auto" }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.3)",
            color: "#d1fae5", fontSize: ".75rem", fontWeight: 700, letterSpacing: ".08em",
            textTransform: "uppercase", padding: "5px 14px", borderRadius: 9999, marginBottom: 20,
          }}>
            🌱 Science-backed nutrition
          </span>

          <h1 style={{ fontSize: "clamp(1.9rem,5vw,3.2rem)", fontWeight: 900, lineHeight: 1.15, marginBottom: 16, letterSpacing: "-.02em" }}>
            Vegetarian Diet Plan<br />
            <span style={{ color: "#34d399" }}>by Age Group</span>
          </h1>

          <p style={{ fontSize: "clamp(.9rem,2vw,1.1rem)", opacity: .9, maxWidth: 540, margin: "0 auto 32px" }}>
            Evidence-based meal plans tailored for every stage of life — from toddlers to seniors.
            Fuel your body, nourish your mind.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            {["🧒 Toddlers 1–3 yrs","👦 Children 4–12 yrs","🧑 Teens 13–18 yrs","🧑 Adults 19–59 yrs","👴 Seniors 60+ yrs"].map(p => (
              <span key={p} style={{
                background: "rgba(255,255,255,.14)", border: "1px solid rgba(255,255,255,.25)",
                color: "#fff", padding: "7px 16px", borderRadius: 9999,
                fontSize: ".82rem", fontWeight: 600,
              }}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div style={{ background: "linear-gradient(135deg,#15803d,#059669)", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 24, textAlign: "center" }}>
          {[
            { v: "5",    l: "Age Groups Covered" },
            { v: "40+",  l: "Curated Meal Ideas" },
            { v: "100%", l: "Plant-Based" },
            { v: "104",  l: "Emergency Helpline" },
          ].map(s => (
            <div key={s.l}>
              <div style={{ fontSize: "2rem", fontWeight: 900, color: "#34d399", lineHeight: 1, marginBottom: 6 }}>{s.v}</div>
              <div style={{ fontSize: ".8rem", fontWeight: 600, opacity: .85 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Anchor quick-links ── */}
      <nav aria-label="Jump to age group" style={{
        background: "#fff", borderBottom: "1px solid #e2e8f0",
        position: "sticky", top: 64, zIndex: 30,
        boxShadow: "0 1px 3px rgba(0,0,0,.06)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", gap: 4, overflowX: "auto" }}>
          {AGE_GROUPS.map(g => (
            <a key={g.id} href={`#${g.id}`} className="dp-tab-link" style={{
              flexShrink: 0, padding: "13px 18px",
              fontSize: ".84rem", fontWeight: 700,
              borderBottom: "3px solid transparent", whiteSpace: "nowrap",
              textDecoration: "none", transition: "color .2s",
            }}>
              {g.emoji} {g.title}
            </a>
          ))}
        </div>
      </nav>

      {/* ── Age groups  ── */}
      <section id="diet-groups" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
          {AGE_GROUPS.map((group, gi) => (
            <div key={group.id}>
              {gi > 0 && <div style={{ height: 1, background: "#e2e8f0", margin: "0 0 48px" }} />}

              <div id={group.id} style={{ scrollMarginTop: 128, marginBottom: 48 }}>
                {/* Group header */}
                <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28, flexWrap: "wrap" }}>
                  <div style={{
                    width: 60, height: 60, borderRadius: 14,
                    background: group.theme.iconGrad,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1.7rem", flexShrink: 0,
                  }}>
                    {group.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: ".7rem", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: group.theme.accent, marginBottom: 4 }}>
                      {group.label}
                    </div>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: group.theme.accent, letterSpacing: "-.02em" }}>
                      {group.title}
                    </div>
                    <div style={{ fontSize: ".86rem", color: "#64748b", marginTop: 2 }}>{group.sub}</div>
                  </div>
                </div>

                {/* Meal cards grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(270px,1fr))", gap: 18 }}>
                  {group.meals.map(meal => (
                    <div key={meal.time} className="dp-meal-card" style={{
                      background: "#fff", borderRadius: 18,
                      border: "1px solid #e2e8f0", overflow: "hidden",
                    }}>
                      <div style={{ padding: "16px 20px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{
                          fontSize: ".7rem", fontWeight: 800, letterSpacing: ".08em",
                          textTransform: "uppercase", padding: "4px 10px",
                          borderRadius: 9999, background: group.theme.badgeBg, color: group.theme.accent,
                        }}>
                          {meal.time}
                        </span>
                        <span style={{ fontSize: ".96rem", fontWeight: 700, color: "#1e293b" }}>{meal.title}</span>
                      </div>

                      <div style={{ padding: "0 20px 16px" }}>
                        <ul style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                          {meal.items.map(item => (
                            <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 9, fontSize: ".87rem", color: "#334155" }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: group.theme.accent, marginTop: 6, flexShrink: 0, display: "block" }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                        <div style={{
                          marginTop: 12, padding: "9px 12px",
                          background: "#f8fafc", borderRadius: 8, borderLeft: "3px solid #4ade80",
                          fontSize: ".79rem", color: "#64748b",
                        }}>
                          💡 {meal.tip}
                        </div>
                      </div>

                      <div style={{ padding: "12px 20px 16px", borderTop: "1px solid #f1f5f9", display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {meal.chips.map(c => (
                          <span key={c} style={{
                            fontSize: ".7rem", fontWeight: 700, padding: "3px 10px",
                            borderRadius: 9999, background: group.theme.chipBg, color: group.theme.chipColor,
                          }}>{c}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Nutrition table ── */}
      <section id="nutrition-table" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 14px", borderRadius: 9999, marginBottom: 12 }}>
              📊 Reference Chart
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em", marginBottom: 10 }}>
              Daily Nutritional Requirements
            </h2>
            <p style={{ fontSize: ".95rem", color: "#64748b", maxWidth: 520, margin: "0 auto" }}>
              Approximate recommended daily intakes for vegetarians across all age groups.
            </p>
          </div>

          <div style={{ overflowX: "auto", borderRadius: 18, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ background: "linear-gradient(90deg,#15803d,#059669)", color: "#fff" }}>
                  {["Age Group","Calories (kcal)","Protein (g)","Calcium (mg)","Iron (mg)","Vitamin B12 (mcg)","Key Focus"].map(h => (
                    <th key={h} style={{ padding: "13px 16px", textAlign: "left", fontSize: ".77rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NUTRITION_TABLE.map((row, i) => (
                  <tr key={row.group} style={{ background: i % 2 === 1 ? "#f8fafc" : "#fff" }}>
                    <td style={{ padding: "12px 16px", fontSize: ".86rem", color: "#334155", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 9999, fontSize: ".73rem", fontWeight: 700, background: row.bg, color: row.color }}>
                        {row.group}
                      </span>
                    </td>
                    {[row.kcal, row.protein, row.calcium, row.iron, row.b12, row.focus].map(v => (
                      <td key={v} style={{ padding: "12px 16px", fontSize: ".86rem", color: "#334155", borderBottom: "1px solid #f1f5f9" }}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Foods to avoid ── */}
      <section id="avoid" style={{ background: "#f8fafc" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 14px", borderRadius: 9999, marginBottom: 12 }}>
              🚫 Caution
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em", marginBottom: 10 }}>
              Foods &amp; Habits to Avoid
            </h2>
            <p style={{ fontSize: ".95rem", color: "#64748b", maxWidth: 520, margin: "0 auto" }}>
              Common pitfalls in vegetarian diets that can undermine your health goals.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {AVOID_ITEMS.map(item => (
              <div key={item.title} style={{
                background: "#fff", border: "1px solid #f43f5e", borderRadius: 14, padding: 18,
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{item.emoji}</span>
                <div>
                  <div style={{ fontSize: ".88rem", fontWeight: 700, color: "#f43f5e", marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: ".79rem", color: "#64748b", lineHeight: 1.55 }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tips ── */}
      <section id="tips" style={{ background: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <span style={{ display: "inline-block", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "4px 14px", borderRadius: 9999, marginBottom: 12 }}>
              ✨ Pro Tips
            </span>
            <h2 style={{ fontSize: "clamp(1.5rem,3vw,2.2rem)", fontWeight: 800, color: "#0f172a", letterSpacing: "-.02em", marginBottom: 10 }}>
              Optimize Your Vegetarian Diet
            </h2>
            <p style={{ fontSize: ".95rem", color: "#64748b", maxWidth: 520, margin: "0 auto" }}>
              Simple, science-backed strategies to get the most from plant-based eating.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {TIPS.map(tip => (
              <div key={tip.title} style={{
                background: "#fff", borderRadius: 18, padding: 24,
                border: "1px solid #e2e8f0",
                borderTop: "4px solid #22c55e",
              }}>
                <div style={{ fontSize: "1.9rem", marginBottom: 14 }}>{tip.emoji}</div>
                <div style={{ fontSize: ".97rem", fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>{tip.title}</div>
                <div style={{ fontSize: ".84rem", color: "#64748b", lineHeight: 1.6 }}>{tip.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Emergency CTA ── */}
      <section style={{ background: "linear-gradient(135deg,#7f1d1d,#991b1b,#b91c1c)", color: "#fff", padding: "60px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <div style={{ fontSize: "2.8rem", marginBottom: 14 }}>🆘</div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, marginBottom: 10 }}>Medical Emergency?</h2>
          <p style={{ opacity: .9, marginBottom: 28, fontSize: ".94rem", lineHeight: 1.65 }}>
            If you or someone around you is experiencing a severe allergic reaction, choking, chest pain,
            or any life-threatening situation — do not wait. Call the emergency helpline immediately.
          </p>
          <a href="tel:104" style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#fff", color: "#b91c1c",
            fontSize: "1.35rem", fontWeight: 900, padding: "14px 38px",
            borderRadius: 9999, textDecoration: "none", letterSpacing: ".04em",
            boxShadow: "0 0 0 4px rgba(255,255,255,.2), 0 10px 40px rgba(0,0,0,.15)",
          }}>
            📞 Call 104
          </a>
          <p style={{ marginTop: 18, fontSize: ".78rem", opacity: .7 }}>
            National Health Helpline · Available 24 hours, 7 days a week · Free of charge
          </p>
        </div>
      </section>

      {/* ── Back to HealthLens ── */}
      <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "24px", textAlign: "center" }}>
        <Link href="/" style={{ color: "#0d9488", fontWeight: 600, fontSize: ".9rem", textDecoration: "none" }}>
          ← Back to HealthLens
        </Link>
        <span style={{ margin: "0 16px", color: "#cbd5e1" }}>|</span>
        <Link href="/emergency" style={{ color: "#0d9488", fontWeight: 600, fontSize: ".9rem", textDecoration: "none" }}>
          Emergency Guide
        </Link>
        <span style={{ margin: "0 16px", color: "#cbd5e1" }}>|</span>
        <Link href="/checker" style={{ color: "#0d9488", fontWeight: 600, fontSize: ".9rem", textDecoration: "none" }}>
          Symptom Checker
        </Link>
      </div>
    </main>
  );
}
