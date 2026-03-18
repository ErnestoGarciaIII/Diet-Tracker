# PlatePilot — Connecting Frontend to Backend
## Setup Guide (No prior web dev experience needed)

---

## What was built

| File | What it does |
|------|-------------|
| `app.py` | The Flask server — the "bridge" between your HTML and Python |
| `foodLog.html` | Food log with search bar (calls the DB) + expandable nutrient bars |
| `settings.html` | Profile form that feeds Height/Weight/Age/Sex/Activity/Goal to PlatePilotUser.py |

---

## How it all connects

```
Browser (settings.html)
   │  fills in your profile → clicks Save
   │  POST /api/dri  ──────────────────────────→  app.py
                                                     │
                                                     └──→ PlatePilotUser.py
                                                           calculates macros/micros
                                                           ← returns JSON targets

Browser (foodLog.html)
   │  types food name → search box
   │  GET /api/search?q=chicken  ──────────────→  app.py
                                                     │
                                                     └──→ master_food.db (SQLite)
                                                           returns nutrient rows
                                                           ← shown as dropdown

   │  clicks "Log Food"
   └─ reads saved targets from browser storage
      updates progress bars in real time
```

---

## Step-by-step setup

### 1. Install Flask (one time only)

Open a terminal / command prompt:

```bash
pip install flask
```

### 2. Place files in the right locations

Your project folder should look like this:

```
your-project/
├── app.py                  ← NEW (put here)
├── PlatePilotUser.py       ← already exists
├── buildQuery.py           ← already exists (no longer needed for the web app)
├── foodLog.html            ← NEW (replace existing)
├── settings.html           ← NEW (replace existing)
├── dashboard.html
├── history.html
├── stylesheets/
│   └── mainStyleS.css
├── js files/
│   └── dashboard.js
└── ../db/
    └── master_food.db      ← your database (one folder up from project)
```

> If your database is in a different location, open `app.py` and change the `DB_PATH` line near the top to the correct path.

### 3. Start the server

In your terminal, navigate to your project folder:

```bash
cd path/to/your-project
python app.py
```

You should see:
```
PlatePilot server running at http://localhost:5000
```

### 4. Open the app

Open your browser and go to:
```
http://localhost:5000/settings.html
```

**First visit: always go to Settings first** and fill in your profile. Click "Save & Recalculate" — this sends your data to PlatePilotUser.py and stores your personalised nutrient targets in the browser.

Then navigate to:
```
http://localhost:5000/foodLog.html
```

---

## How the nutrient bars work

- **Macros bar** — tracks Protein, Carbs, Fats (from your logged foods)
- **Minerals bar** — tracks Calcium, Iron, Magnesium, etc.
- **Vitamins bar** — tracks Vitamin A, C, D, B-12, etc.

Each bar shows an **average % of your daily target** across all nutrients in that group.  
**Click any bar** to expand it and see each individual nutrient.

The targets come from `PlatePilotUser.py` (your `setDRI()` function). The progress comes from the food database nutrients returned by the search.

---

## How the food search works

1. The search box calls `GET /api/search?q=<your text>` (in `app.py`)
2. `app.py` runs the SQL query from `buildQuery.py` against `master_food.db`
3. Results appear as a dropdown — click one to select it
4. Hit **Log Food** — the nutrient amounts get added to your daily totals
5. Bars update instantly

---

## Stopping the server

Press `Ctrl + C` in the terminal.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: flask` | Run `pip install flask` |
| `Unable to connect to the database` | Check `DB_PATH` in `app.py` points to the right folder |
| Bars show 0% even after logging | Go to Settings first and save your profile |
| Search returns no results | Make sure the server is running (`python app.py`) |
