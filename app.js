const STORAGE_KEY = "health-quest-v3";
const LEGACY_KEYS = ["health-quest-v2", "health-quest-v1"];
const mealSlots = ["morning", "lunch", "afternoon", "dinner", "other"];
const coreMealSlots = ["morning", "lunch", "afternoon", "dinner"];
const foodOptions = {
  0: { label: "N/A / skipped", quality: null },
  1: { label: "On track", quality: 1 },
  2: { label: "OK + portion control", quality: 0.65 },
  3: { label: "Not controlled", quality: 0.25 },
  4: { label: "Out of control", quality: 0 },
};

const defaultSettings = {
  displayName: "Adventurer",
  mode: "full",
  stepGoal: 8000,
  exerciseGoal: 30,
  weightGoal: 185,
  bodyFatGoal: 20,
};

const storyChapters = [
  {
    level: 1,
    title: "The Honest Ledger",
    body: "This campaign begins when you stop trying to look perfect in the log. Real progress starts when the numbers tell the truth.",
  },
  {
    level: 3,
    title: "The Long Game",
    body: "You are no longer building around urgency. You are building something that can survive normal weeks, rushed days, and imperfect meals.",
  },
  {
    level: 6,
    title: "The Maintenance Guild",
    body: "This is the quiet professional tier: steady entries, smaller overreactions, and fewer all-or-nothing swings. Boring is becoming powerful.",
  },
  {
    level: 10,
    title: "The Architect",
    body: "The system now carries more of the weight. Your job is not to feel heroic every day. Your job is to keep the structure alive.",
  },
];

let state = loadState();

const displayNameInput = document.getElementById("display-name");
const modeToggle = document.getElementById("mode-toggle");
const stepGoalInput = document.getElementById("step-goal");
const exerciseGoalInput = document.getElementById("exercise-goal");
const weightGoalInput = document.getElementById("weight-goal");
const bodyFatGoalInput = document.getElementById("body-fat-goal");
const saveProfileButton = document.getElementById("save-profile");
const exportJsonButton = document.getElementById("export-json");
const importJsonInput = document.getElementById("import-json");

const entryDateInput = document.getElementById("entry-date");
const entryStepsInput = document.getElementById("entry-steps");
const entryExerciseInput = document.getElementById("entry-exercise");
const entryWeightInput = document.getElementById("entry-weight");
const entryBodyFatInput = document.getElementById("entry-body-fat");
const habitProteinInput = document.getElementById("habit-protein");
const habitProduceInput = document.getElementById("habit-produce");
const habitStoppedInput = document.getElementById("habit-stopped");
const foodSection = document.getElementById("food-section");
const foodLog = document.getElementById("food-log");
const saveEntryButton = document.getElementById("save-entry");

const rewardNameInput = document.getElementById("reward-name");
const rewardTypeInput = document.getElementById("reward-type");
const rewardValueWrap = document.getElementById("reward-value-wrap");
const rewardValueInput = document.getElementById("reward-value");
const addRewardButton = document.getElementById("add-reward");

const statusMessage = document.getElementById("status-message");
const todayCard = document.getElementById("today-card");
const summaryStats = document.getElementById("summary-stats");
const chartWrap = document.getElementById("chart-wrap");
const rewardList = document.getElementById("reward-list");
const storyCard = document.getElementById("story-card");
const dayList = document.getElementById("day-list");

initialize();

function initialize() {
  hydrateSettingsForm();
  entryDateInput.value = getTodayKey();
  hydrateEntryForm(getSelectedDateKey());
  renderFoodLog();

  saveProfileButton.addEventListener("click", saveProfile);
  modeToggle.addEventListener("change", handleModeChange);
  entryDateInput.addEventListener("change", handleDateChange);
  saveEntryButton.addEventListener("click", saveDailyEntry);
  addRewardButton.addEventListener("click", addReward);
  rewardTypeInput.addEventListener("change", renderRewardValueVisibility);
  exportJsonButton.addEventListener("click", exportJson);
  importJsonInput.addEventListener("change", importJson);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  renderRewardValueVisibility();
  render();
}

function loadState() {
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    const raw = localStorage.getItem(key);
    if (!raw) {
      continue;
    }

    try {
      const parsed = JSON.parse(raw);
      return migrateState(parsed, key);
    } catch (error) {
      continue;
    }
  }

  return createEmptyState();
}

function createEmptyState() {
  return {
    version: 3,
    settings: { ...defaultSettings },
    entries: {},
    rewards: [],
  };
}

function migrateState(parsed, sourceKey) {
  const base = createEmptyState();
  const settings = {
    ...base.settings,
    ...(parsed.settings || {}),
  };

  if (!settings.mode) {
    settings.mode = "full";
  }

  const legacyEntries = parsed.entries || buildLegacyEntries(parsed);
  const entries = {};
  for (const [dateKey, rawEntry] of Object.entries(legacyEntries || {})) {
    entries[dateKey] = migrateEntry(dateKey, rawEntry);
  }

  const rewards = Array.isArray(parsed.rewards)
    ? parsed.rewards.map((reward) => migrateReward(reward))
    : [];

  const migrated = {
    version: 3,
    settings,
    entries,
    rewards,
  };

  if (sourceKey !== STORAGE_KEY) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }

  return migrated;
}

function buildLegacyEntries(parsed) {
  const legacy = {};
  const days = parsed.summary?.days || [];

  for (const day of days) {
    if (!day?.date) {
      continue;
    }
    legacy[day.date] = {
      date: day.date,
      mode: "full",
      steps: day.steps || 0,
      exerciseMinutes: day.exerciseMinutes || 0,
      weight: day.weight ?? null,
      bodyFat: day.bodyFat ?? null,
      food: parsed.foodLogs?.[day.date] || createEmptyFoodEntry(),
      habits: {},
    };
  }

  for (const [dateKey, food] of Object.entries(parsed.foodLogs || {})) {
    legacy[dateKey] = {
      ...(legacy[dateKey] || {
        date: dateKey,
        mode: "full",
        steps: 0,
        exerciseMinutes: 0,
        weight: null,
        bodyFat: null,
        habits: {},
      }),
      food,
    };
  }

  return legacy;
}

function migrateEntry(dateKey, rawEntry) {
  const migratedFood = createEmptyFoodEntry();
  for (const slot of mealSlots) {
    const value = rawEntry?.food?.[slot];
    migratedFood[slot] = normalizeFoodValue(value);
  }

  return {
    date: dateKey,
    mode: rawEntry?.mode || "full",
    steps: Number(rawEntry?.steps) || 0,
    exerciseMinutes: Number(rawEntry?.exerciseMinutes) || 0,
    weight: rawEntry?.weight == null ? null : Number(rawEntry.weight),
    bodyFat: rawEntry?.bodyFat == null ? null : Number(rawEntry.bodyFat),
    food: migratedFood,
    habits: {
      protein: Boolean(rawEntry?.habits?.protein),
      produce: Boolean(rawEntry?.habits?.produce),
      stoppedBeforeStuffed: Boolean(rawEntry?.habits?.stoppedBeforeStuffed),
    },
  };
}

function migrateReward(reward) {
  if (reward.criteriaType) {
    return {
      id: reward.id || createId(),
      name: reward.name || "Reward",
      criteriaType: reward.criteriaType,
      criteriaValue: reward.criteriaValue ?? 0,
      claimed: Boolean(reward.claimed),
    };
  }

  return {
    id: reward.id || createId(),
    name: reward.name || "Reward",
    criteriaType: "level",
    criteriaValue: reward.unlockLevel ?? 1,
    claimed: Boolean(reward.claimed),
  };
}

function normalizeFoodValue(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (numeric < 0 || numeric > 4) {
    return null;
  }
  return numeric;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateSettingsForm() {
  displayNameInput.value = state.settings.displayName;
  modeToggle.value = state.settings.mode;
  stepGoalInput.value = state.settings.stepGoal;
  exerciseGoalInput.value = state.settings.exerciseGoal;
  weightGoalInput.value = state.settings.weightGoal;
  bodyFatGoalInput.value = state.settings.bodyFatGoal;
}

function saveProfile() {
  state.settings = {
    displayName: (displayNameInput.value || defaultSettings.displayName).trim().slice(0, 24) || defaultSettings.displayName,
    mode: modeToggle.value,
    stepGoal: clampNumber(stepGoalInput.value, 1000, 30000, defaultSettings.stepGoal),
    exerciseGoal: clampNumber(exerciseGoalInput.value, 5, 180, defaultSettings.exerciseGoal),
    weightGoal: clampNumber(weightGoalInput.value, 50, 500, defaultSettings.weightGoal),
    bodyFatGoal: clampNumber(bodyFatGoalInput.value, 3, 60, defaultSettings.bodyFatGoal),
  };

  saveState();
  render();
  setStatus("Settings saved.");
}

function handleModeChange() {
  state.settings.mode = modeToggle.value;
  saveState();
  render();
  setStatus(`${capitalize(state.settings.mode)} mode enabled.`);
}

function handleDateChange() {
  hydrateEntryForm(getSelectedDateKey());
  renderFoodLog();
  render();
}

function hydrateEntryForm(dateKey) {
  const entry = getEntry(dateKey);
  entryDateInput.value = dateKey;
  entryStepsInput.value = entry.steps || "";
  entryExerciseInput.value = entry.exerciseMinutes || "";
  entryWeightInput.value = entry.weight ?? "";
  entryBodyFatInput.value = entry.bodyFat ?? "";
  habitProteinInput.checked = entry.habits.protein;
  habitProduceInput.checked = entry.habits.produce;
  habitStoppedInput.checked = entry.habits.stoppedBeforeStuffed;
}

function getEntry(dateKey) {
  return {
    date: dateKey,
    mode: state.settings.mode,
    steps: 0,
    exerciseMinutes: 0,
    weight: null,
    bodyFat: null,
    food: createEmptyFoodEntry(),
    habits: {
      protein: false,
      produce: false,
      stoppedBeforeStuffed: false,
    },
    ...(state.entries[dateKey] || {}),
    food: {
      ...createEmptyFoodEntry(),
      ...((state.entries[dateKey] || {}).food || {}),
    },
    habits: {
      protein: Boolean((state.entries[dateKey] || {}).habits?.protein),
      produce: Boolean((state.entries[dateKey] || {}).habits?.produce),
      stoppedBeforeStuffed: Boolean((state.entries[dateKey] || {}).habits?.stoppedBeforeStuffed),
    },
  };
}

function createEmptyFoodEntry() {
  return {
    morning: null,
    lunch: null,
    afternoon: null,
    dinner: null,
    other: null,
  };
}

function saveDailyEntry() {
  const dateKey = getSelectedDateKey();
  state.entries[dateKey] = {
    date: dateKey,
    mode: state.settings.mode,
    steps: clampNumber(entryStepsInput.value, 0, 100000, 0),
    exerciseMinutes: clampNumber(entryExerciseInput.value, 0, 300, 0),
    weight: parseOptionalNumber(entryWeightInput.value),
    bodyFat: parseOptionalNumber(entryBodyFatInput.value),
    food: readFoodForm(),
    habits: {
      protein: habitProteinInput.checked,
      produce: habitProduceInput.checked,
      stoppedBeforeStuffed: habitStoppedInput.checked,
    },
  };

  saveState();
  render();
  setStatus(`Saved entry for ${formatDisplayDate(dateKey)}.`);
}

function readFoodForm() {
  const food = createEmptyFoodEntry();
  for (const slot of mealSlots) {
    const selected = foodLog.querySelector(`input[name="food-${slot}"]:checked`);
    food[slot] = selected ? normalizeFoodValue(selected.value) : null;
  }
  return food;
}

function renderFoodLog() {
  const food = getEntry(getSelectedDateKey()).food;

  foodLog.innerHTML = mealSlots
    .map((slot) => `
      <article class="food-row">
        <div class="food-label">${escapeHtml(capitalize(slot))}</div>
        <div class="food-options">
          ${Object.entries(foodOptions).map(([value]) => `
            <label class="food-option ${Number(value) === food[slot] ? "active" : ""}">
              <input
                type="radio"
                name="food-${escapeHtml(slot)}"
                value="${value}"
                ${Number(value) === food[slot] ? "checked" : ""}
              >
              <span>${value}</span>
            </label>
          `).join("")}
        </div>
      </article>
    `)
    .join("");

  for (const input of foodLog.querySelectorAll('input[type="radio"]')) {
    input.addEventListener("change", syncFoodOptionClasses);
  }

  syncFoodOptionClasses();
}

function syncFoodOptionClasses() {
  for (const option of foodLog.querySelectorAll(".food-option")) {
    const input = option.querySelector("input");
    option.classList.toggle("active", Boolean(input && input.checked));
  }
}

function addReward() {
  const name = rewardNameInput.value.trim();
  if (!name) {
    setStatus("Add a reward name first.");
    return;
  }

  const criteriaType = rewardTypeInput.value;
  const criteriaValue = criteriaType === "lowest_avg_weight"
    ? 0
    : clampNumber(rewardValueInput.value, 1, 999, 1);

  state.rewards.push({
    id: createId(),
    name,
    criteriaType,
    criteriaValue,
    claimed: false,
  });

  rewardNameInput.value = "";
  rewardValueInput.value = "2";
  saveState();
  render();
  setStatus(`Added reward "${name}".`);
}

function renderRewardValueVisibility() {
  const hideValue = rewardTypeInput.value === "lowest_avg_weight";
  rewardValueWrap.classList.toggle("is-hidden", hideValue);
}

function toggleRewardClaim(rewardId) {
  state.rewards = state.rewards.map((reward) =>
    reward.id === rewardId ? { ...reward, claimed: !reward.claimed } : reward
  );
  saveState();
  render();
}

function exportJson() {
  const payload = JSON.stringify(state, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `health-quest-export-${getTodayKey()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  setStatus("Exported your local data as JSON.");
}

async function importJson(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    state = migrateState(parsed, "import");
    saveState();
    hydrateSettingsForm();
    hydrateEntryForm(getSelectedDateKey());
    renderFoodLog();
    renderRewardValueVisibility();
    render();
    setStatus(`Imported data from ${file.name}.`);
  } catch (error) {
    setStatus("Import failed. Please choose a valid Health Quest JSON export.");
  } finally {
    importJsonInput.value = "";
  }
}

function render() {
  const summary = computeSummary();
  renderTodayCard(summary);
  renderWeeklySummary(summary);
  renderCharts(summary);
  renderRewards(summary);
  renderStory(summary);
  renderRecentDays(summary.timelineLogged);
  foodSection.classList.toggle("is-hidden", state.settings.mode === "maintenance");
}

function computeSummary() {
  const loggedEntries = Object.values(state.entries)
    .map((entry) => scoreDay(migrateEntry(entry.date, entry)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const timelineFilled = buildFilledTimeline(loggedEntries);
  const totalXp = loggedEntries.reduce((sum, day) => sum + day.totalScore + day.bonusXp, 0);
  const level = Math.max(1, Math.floor(totalXp / 250) + 1);
  const regularStreak = calculateStreak(timelineFilled, (day) => day.totalScore >= 55);
  const eliteStreak = calculateStreak(timelineFilled, (day) => day.totalScore >= 70);
  const bestRegularStreak = calculateBestStreak(timelineFilled, (day) => day.totalScore >= 55);
  const bestEliteStreak = calculateBestStreak(timelineFilled, (day) => day.totalScore >= 70);
  const weekly = computeWeeklyMetrics(loggedEntries);
  const rewards = state.rewards.map((reward) => ({
    ...reward,
    unlocked: isRewardUnlocked(reward, { level, regularStreak, loggedEntries, weekly }),
  }));

  return {
    timelineLogged: loggedEntries,
    timelineFilled,
    totalXp,
    level,
    regularStreak,
    eliteStreak,
    bestRegularStreak,
    bestEliteStreak,
    today: scoreDay(getEntry(getSelectedDateKey())),
    weekly,
    rewards,
  };
}

function scoreDay(entry) {
  const dayMode = entry.mode || "full";
  const stepPoints = Math.round(Math.min(1, (entry.steps || 0) / state.settings.stepGoal) * 25);
  const exercisePoints = Math.round(Math.min(1, (entry.exerciseMinutes || 0) / state.settings.exerciseGoal) * 20);

  const answeredMeals = mealSlots.filter((slot) => entry.food[slot] !== null);
  const scoredMeals = answeredMeals.filter((slot) => foodOptions[entry.food[slot]].quality !== null);
  const foodAverage = scoredMeals.length
    ? scoredMeals.reduce((sum, slot) => sum + foodOptions[entry.food[slot]].quality, 0) / scoredMeals.length
    : 0;
  const foodCompletionBonus = coreMealSlots.every((slot) => entry.food[slot] !== null) ? 3 : 0;
  const foodPoints = Math.min(25, Math.round(foodAverage * 22) + foodCompletionBonus);

  const bodyMetricPoints = (entry.weight != null ? 5 : 0) + (entry.bodyFat != null ? 5 : 0);
  const habitBase = (entry.habits.protein ? 6 : 0) + (entry.habits.produce ? 6 : 0) + (entry.habits.stoppedBeforeStuffed ? 6 : 0);
  const habitPoints = habitBase + (entry.habits.protein && entry.habits.produce && entry.habits.stoppedBeforeStuffed ? 2 : 0);
  const rawTotal = stepPoints + exercisePoints + (dayMode === "full" ? foodPoints : 0) + bodyMetricPoints + habitPoints;
  const scoreCap = dayMode === "full" ? 100 : 75;
  const totalScore = Math.round((rawTotal / scoreCap) * 100);
  const bonusXp = getGoalBonus(entry, answeredMeals.length);

  return {
    ...entry,
    mode: dayMode,
    stepPoints,
    exercisePoints,
    foodPoints,
    bodyMetricPoints,
    habitPoints,
    totalScore,
    dayType: totalScore >= 70 ? "win" : totalScore >= 55 ? "solid" : "reset",
    bonusXp,
    answeredMeals,
  };
}

function getGoalBonus(entry, answeredMealsCount) {
  let bonus = 0;
  if (entry.weight != null && entry.weight <= state.settings.weightGoal) {
    bonus += 30;
  }
  if (entry.bodyFat != null && entry.bodyFat <= state.settings.bodyFatGoal) {
    bonus += 30;
  }
  if (answeredMealsCount === coreMealSlots.length) {
    bonus += 10;
  }
  return bonus;
}

function buildFilledTimeline(loggedEntries) {
  if (!loggedEntries.length) {
    return [];
  }

  const entryMap = new Map(loggedEntries.map((day) => [day.date, day]));
  const start = new Date(`${loggedEntries[0].date}T12:00:00`);
  const end = new Date(`${getTodayKey()}T12:00:00`);
  const filled = [];
  const cursor = new Date(start);

  while (cursor <= end) {
    const key = cursor.toISOString().slice(0, 10);
    filled.push(entryMap.get(key) || { date: key, totalScore: 0, dayType: "reset" });
    cursor.setDate(cursor.getDate() + 1);
  }

  return filled;
}

function calculateStreak(days, qualifies) {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!qualifies(days[index])) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function calculateBestStreak(days, qualifies) {
  let streak = 0;
  let best = 0;
  for (const day of days) {
    streak = qualifies(day) ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return best;
}

function computeWeeklyMetrics(loggedEntries) {
  const today = new Date(`${getTodayKey()}T12:00:00`);
  const start = new Date(today);
  start.setDate(start.getDate() - 6);

  const inWindow = loggedEntries.filter((day) => {
    const date = new Date(`${day.date}T12:00:00`);
    return date >= start && date <= today;
  });

  const scoreAverage = average(inWindow.map((day) => day.totalScore));
  const weightAverage = average(inWindow.filter((day) => day.weight != null).map((day) => day.weight));
  const bodyFatAverage = average(inWindow.filter((day) => day.bodyFat != null).map((day) => day.bodyFat));
  const loggedDays = inWindow.length;

  const allWeeklyWeightAverages = buildRollingAverageSeries(loggedEntries, "weight");
  const latestWeeklyWeightAverage = allWeeklyWeightAverages.length ? allWeeklyWeightAverages[allWeeklyWeightAverages.length - 1].value : null;
  const lowestWeeklyWeightAverage = allWeeklyWeightAverages.length
    ? Math.min(...allWeeklyWeightAverages.map((item) => item.value))
    : null;
  const isNewLowestWeightAverage = latestWeeklyWeightAverage != null && latestWeeklyWeightAverage === lowestWeeklyWeightAverage;

  return {
    scoreAverage,
    weightAverage,
    bodyFatAverage,
    loggedDays,
    latestWeeklyWeightAverage,
    isNewLowestWeightAverage,
  };
}

function buildRollingAverageSeries(loggedEntries, key) {
  const series = [];
  for (let index = 0; index < loggedEntries.length; index += 1) {
    if (index < 6) {
      continue;
    }
    const window = loggedEntries.slice(Math.max(0, index - 6), index + 1).filter((day) => day[key] != null);
    if (!window.length) {
      continue;
    }
    series.push({
      date: loggedEntries[index].date,
      value: average(window.map((day) => day[key])),
    });
  }
  return series;
}

function isRewardUnlocked(reward, context) {
  switch (reward.criteriaType) {
    case "level":
      return context.level >= reward.criteriaValue;
    case "streak":
      return context.regularStreak >= reward.criteriaValue;
    case "logged_days":
      return context.loggedEntries.length >= reward.criteriaValue;
    case "lowest_avg_weight":
      return context.weekly.isNewLowestWeightAverage;
    default:
      return false;
  }
}

function renderTodayCard(summary) {
  const today = summary.today;
  const selectedDateLabel = formatDisplayDate(getSelectedDateKey());
  const quickStats = [
    { label: "Score", value: `${today.totalScore}` },
    { label: "XP", value: `+${today.totalScore + today.bonusXp}` },
    { label: "Day Type", value: capitalize(today.dayType) },
        { label: "Mode", value: capitalize(today.mode) },
  ];

  todayCard.innerHTML = `
    <div class="today-grid">
      <div class="today-main">
        <div class="today-kicker">${escapeHtml(selectedDateLabel)}</div>
        <div class="today-score">${today.totalScore}</div>
        <div class="today-copy">Win day at 70+. Solid day at 55+. Regular streak survives solid days; elite streak needs wins.</div>
      </div>
      <div class="today-stats">
        ${quickStats.map((item) => `
          <article class="today-stat">
            <div class="stat-label">${escapeHtml(item.label)}</div>
            <div class="stat-value small">${escapeHtml(item.value)}</div>
          </article>
        `).join("")}
      </div>
      <div class="today-breakdown">
        <div class="score-row"><span>Steps</span><span>${today.stepPoints}/25</span></div>
        <div class="score-row"><span>Exercise</span><span>${today.exercisePoints}/20</span></div>
        ${today.mode === "full" ? `<div class="score-row"><span>Food</span><span>${today.foodPoints}/25</span></div>` : ""}
        <div class="score-row"><span>Body metrics</span><span>${today.bodyMetricPoints}/10</span></div>
        <div class="score-row"><span>Habits</span><span>${today.habitPoints}/20</span></div>
      </div>
    </div>
  `;
}

function renderWeeklySummary(summary) {
  summaryStats.innerHTML = [
    statCard(`Level ${summary.level}`, `${summary.totalXp.toLocaleString()} XP`, `${state.settings.displayName}'s total campaign experience`),
    statCard("Regular Streak", `${summary.regularStreak} days`, `Best: ${summary.bestRegularStreak}`),
    statCard("Elite Streak", `${summary.eliteStreak} days`, `Best: ${summary.bestEliteStreak}`),
    statCard("7-day Avg Score", formatMaybe(summary.weekly.scoreAverage), `${summary.weekly.loggedDays} days logged this week`),
    statCard("7-day Avg Weight", formatMaybe(summary.weekly.weightAverage, 1), `Goal: ${state.settings.weightGoal}`),
    statCard("7-day Avg Body Fat", formatMaybe(summary.weekly.bodyFatAverage, 1, "%"), `Goal: ${state.settings.bodyFatGoal}%`),
  ].join("");
}

function renderCharts(summary) {
  const weightDays = summary.timelineLogged.filter((day) => day.weight != null);
  const bodyFatDays = summary.timelineLogged.filter((day) => day.bodyFat != null);
  const scoreDays = summary.timelineLogged;

  chartWrap.innerHTML = `
    ${renderLineChart("Weight", weightDays, "weight", state.settings.weightGoal)}
    ${renderLineChart("Body Fat %", bodyFatDays, "bodyFat", state.settings.bodyFatGoal)}
    ${renderLineChart("Daily Score", scoreDays, "totalScore", 70)}
  `;
}

function renderLineChart(title, data, key, goal) {
  if (!data.length) {
    return `<div class="empty-state">${escapeHtml(title)} graph appears after you log a few days.</div>`;
  }

  const width = 320;
  const height = 160;
  const padding = 18;
  const values = data.map((item) => item[key]);
  const min = Math.min(...values, goal);
  const max = Math.max(...values, goal);
  const range = Math.max(1, max - min);

  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - ((item[key] - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const goalY = height - padding - ((goal - min) / range) * (height - padding * 2);

  return `
    <div class="chart-card">
      <div class="chart-title">${escapeHtml(title)}</div>
      <svg viewBox="0 0 ${width} ${height}" class="trend-chart" role="img" aria-label="${escapeHtml(title)} trend">
        <line x1="${padding}" y1="${goalY}" x2="${width - padding}" y2="${goalY}" class="goal-line"></line>
        <polyline points="${points}" class="trend-line"></polyline>
        ${data.map((item, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
          const y = height - padding - ((item[key] - min) / range) * (height - padding * 2);
          return `<circle cx="${x}" cy="${y}" r="4" class="trend-point"></circle>`;
        }).join("")}
      </svg>
      <div class="chart-meta">Reference line: ${goal}</div>
    </div>
  `;
}

function renderRewards(summary) {
  if (!summary.rewards.length) {
    rewardList.innerHTML = `<div class="empty-state">Add rewards that unlock by level, streak, logged days, or a new lowest 7-day average weight.</div>`;
    return;
  }

  rewardList.innerHTML = summary.rewards
    .map((reward) => `
      <article class="reward-card ${reward.unlocked ? "unlocked" : "locked"}">
        <div>
          <div class="reward-title">${escapeHtml(reward.name)}</div>
          <div class="reward-meta">${escapeHtml(formatRewardRule(reward))}</div>
        </div>
        <button
          type="button"
          class="reward-button"
          data-reward-id="${escapeHtml(reward.id)}"
          ${reward.unlocked ? "" : "disabled"}
        >${reward.claimed ? "Claimed" : reward.unlocked ? "Claim Reward" : "Locked"}</button>
      </article>
    `)
    .join("");

  for (const button of rewardList.querySelectorAll(".reward-button")) {
    button.addEventListener("click", (event) => toggleRewardClaim(event.currentTarget.dataset.rewardId));
  }
}

function renderStory(summary) {
  const chapter = [...storyChapters].reverse().find((item) => summary.level >= item.level) || storyChapters[0];
  storyCard.innerHTML = `
    <div class="story-kicker">Chapter for level ${summary.level}</div>
    <h3>${escapeHtml(chapter.title)}</h3>
    <p>${escapeHtml(chapter.body)}</p>
    <p>This story still leans on the few things I actually know: you prefer practical systems, lower-friction tools, and something strong enough to survive ordinary life. If you want, we can later theme it around a setting you genuinely care about.</p>
  `;
}

function renderRecentDays(days) {
  if (!days.length) {
    dayList.innerHTML = `<div class="empty-state">Save your first day to begin the log.</div>`;
    return;
  }

  dayList.innerHTML = [...days].reverse().slice(0, 12)
    .map((day) => `
      <article class="day-card">
        <div class="day-top">
          <div class="day-title">${escapeHtml(formatDisplayDate(day.date))}</div>
          <div class="day-meta">${day.totalScore} pts | ${capitalize(day.dayType)}</div>
        </div>
        <div class="metric-row">
          <span class="metric-pill">${day.steps || 0} steps</span>
          <span class="metric-pill">${day.exerciseMinutes || 0} min exercise</span>
          ${day.mode === "full" ? `<span class="metric-pill">Food ${day.foodPoints}/25</span>` : ""}
          <span class="metric-pill">Habits ${day.habitPoints}/20</span>
          <span class="metric-pill">${day.weight != null ? `${day.weight} lb` : "No weight"}</span>
          <span class="metric-pill">${day.bodyFat != null ? `${day.bodyFat}% fat` : "No body fat"}</span>
        </div>
      </article>
    `)
    .join("");
}

function formatRewardRule(reward) {
  switch (reward.criteriaType) {
    case "level":
      return `Unlock at level ${reward.criteriaValue}`;
    case "streak":
      return `Unlock at regular streak ${reward.criteriaValue}`;
    case "logged_days":
      return `Unlock at ${reward.criteriaValue} logged days`;
    case "lowest_avg_weight":
      return "Unlock on a new lowest 7-day average weight";
    default:
      return "Unlock rule";
  }
}

function statCard(label, value, detail) {
  return `
    <article class="stat-card">
      <div class="stat-label">${escapeHtml(label)}</div>
      <div class="stat-value">${escapeHtml(value)}</div>
      <div class="stat-detail">${escapeHtml(detail)}</div>
    </article>
  `;
}

function formatMaybe(value, decimals = 0, suffix = "") {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }
  return `${value.toFixed(decimals)}${suffix}`;
}

function average(values) {
  if (!values.length) {
    return null;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function getSelectedDateKey() {
  return entryDateInput.value || getTodayKey();
}

function getTodayKey() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `reward-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

function parseOptionalNumber(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function formatDisplayDate(dateKey) {
  const date = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(date.getTime())
    ? dateKey
    : date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function setStatus(message) {
  statusMessage.textContent = message;
}
