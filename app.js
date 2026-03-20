const APP_VERSION = "v4.0.0";
const STORAGE_KEY = "health-quest-v3";
const LEGACY_KEYS = ["health-quest-v2", "health-quest-v1"];
const mealSlots = ["morning", "lunch", "afternoon", "dinner", "other"];
const coreMealSlots = ["morning", "lunch", "afternoon", "dinner"];
const foodOptions = {
  0: { label: "Ate nothing / N/A", quality: null, score: 0 },
  1: { label: "On track", quality: 1 },
  2: { label: "Good food, larger portions or worse food with control", quality: 0.82, score: 0.82 },
  3: { label: "Worse food, little control, still mindful", quality: 0.5, score: 0.5 },
  4: { label: "Ate until full", quality: 0.18, score: 0.18 },
  5: { label: "Stuffed myself", quality: 0, score: 0 },
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
  { level: 1, title: "Ash Gate", body: "The outpost is still standing, but only barely. Inventory is bad, the walls have soft spots, and drift has been moving through the place like weather." },
  { level: 2, title: "The First Ledger", body: "You do not begin with glory. You begin by counting honestly. The first stable record changes the outpost more than any speech ever could." },
  { level: 3, title: "Quiet Repairs", body: "Small corrections start holding. A meal contained here, a walk taken there, one less overreaction after a messy day. The map is not cleaner yet, but it is less chaotic." },
  { level: 4, title: "False Urgency", body: "A courier arrives carrying the old lie: do everything at once. You decline. The outpost survives not by panic, but by repeatable decisions." },
  { level: 5, title: "North Wall Reinforced", body: "Structure begins to show. The wall that used to buckle after one bad night now holds through weather, noise, and convenience." },
  { level: 6, title: "The Reservoir", body: "You discover something useful: consistency stores energy. The calm day you almost dismissed is now carrying the difficult one." },
  { level: 7, title: "The Soft Saboteur", body: "Not every threat arrives like hunger. Some arrive as permission, as reward creep, as the phrase close enough whispered at the wrong hour." },
  { level: 8, title: "Winter Supply Routes", body: "The system starts feeding itself. Routines shorten decision time. Recovery gets quicker. Mistakes stop expanding into campaigns of their own." },
  { level: 9, title: "The Hidden Annex", body: "A sealed part of the outpost opens. Behind it are reserves you thought were gone: patience, restraint, and a talent for boring excellence." },
  { level: 10, title: "Weatherproofing", body: "You no longer need ideal conditions to act like yourself. Bad timing, social meals, poor sleep, and long days lose some of their power." },
  { level: 11, title: "The Watchtower", body: "From higher ground you can finally see the real enemy clearly. It was never food alone. It was drift, haste, and the ease of forgetting." },
  { level: 12, title: "The Counteroffensive", body: "Old reflexes still raid the edges, but they no longer own the center. The outpost now answers pressure with policy, not improvisation." },
  { level: 13, title: "The Long Signal", body: "Your routines begin reaching farther than today. The place is starting to influence tomorrow before tomorrow even arrives." },
  { level: 14, title: "The Deep Stores", body: "Here is the twist: discipline was never the cage. It was the pantry, the fuel line, the quiet reserve that lets the whole system keep moving." },
  { level: 15, title: "Stone Against Entropy", body: "The outpost is no longer merely surviving. It has become a stronghold of honest numbers, controlled responses, and momentum that does not need applause." },
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
const entryNotesInput = document.getElementById("entry-notes");
const habitProteinInput = document.getElementById("habit-protein");
const habitProduceInput = document.getElementById("habit-produce");
const habitStoppedInput = document.getElementById("habit-stopped");
const habitMovementInput = document.getElementById("habit-movement");
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
const updateBanner = document.getElementById("update-banner");
const updateBannerText = document.getElementById("update-banner-text");
const refreshAppButton = document.getElementById("refresh-app");
const summaryStats = document.getElementById("summary-stats");
const guardrailList = document.getElementById("guardrail-list");
const chartWrap = document.getElementById("chart-wrap");
const rewardList = document.getElementById("reward-list");
const storyCard = document.getElementById("story-card");
const dayList = document.getElementById("day-list");
const lastExportStatus = document.getElementById("last-export-status");
const appVersion = document.getElementById("app-version");
const footerVersion = document.getElementById("footer-version");
const logPanel = document.querySelector(".log-panel");
const rewardsPanel = document.querySelector(".rewards-panel");
const storyPanel = document.querySelector(".story-panel");
const activityPanel = document.querySelector(".activity-panel");

initialize();

function initialize() {
  appVersion.textContent = APP_VERSION;
  footerVersion.textContent = `Version ${APP_VERSION}`;
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
  refreshAppButton.addEventListener("click", forceRefreshApp);

  registerServiceWorker();

  renderRewardValueVisibility();
  render();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  navigator.serviceWorker.register(`sw.js?v=${APP_VERSION}`).then((registration) => {
    if (registration.waiting) {
      showUpdateBanner("A newer build is ready. Refresh to switch the installed app to the latest version.");
    }

    registration.addEventListener("updatefound", () => {
      const installing = registration.installing;
      if (!installing) {
        return;
      }
      installing.addEventListener("statechange", () => {
        if (installing.state === "installed" && navigator.serviceWorker.controller) {
          showUpdateBanner("Update available. Refresh to load the newest build.");
        }
      });
    });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });
  }).catch(() => {});
}

function showUpdateBanner(message) {
  updateBannerText.textContent = message;
  updateBanner.classList.remove("is-hidden");
}

function forceRefreshApp() {
  navigator.serviceWorker.getRegistration().then((registration) => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
      return;
    }
    window.location.reload();
  });
}

function loadState() {
  // Migrate forward from the newest known key first, then older shapes if needed.
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
    version: 4,
    settings: { ...defaultSettings },
    entries: {},
    rewards: [],
    meta: {
      lastExportAt: null,
      lowestAvgWeightRewarded: null,
    },
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

  // Older builds stored different shapes. Reconstruct per-day entries when possible
  // so existing local data remains usable after upgrading the app.
  const legacyEntries = parsed.entries || buildLegacyEntries(parsed);
  const entries = {};
  const sourceVersion = Number(parsed.version || 0);
  for (const [dateKey, rawEntry] of Object.entries(legacyEntries || {})) {
    entries[dateKey] = migrateEntry(dateKey, rawEntry, sourceVersion);
  }

  const rewards = Array.isArray(parsed.rewards)
    ? parsed.rewards.map((reward) => migrateReward(reward))
    : [];

  const meta = {
    lastExportAt: parsed.meta?.lastExportAt || parsed.lastExportAt || null,
    lowestAvgWeightRewarded: parsed.meta?.lowestAvgWeightRewarded ?? null,
  };

  const migrated = {
    version: 4,
    settings,
    entries,
    rewards,
    meta,
  };

  if (sourceKey !== STORAGE_KEY) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  }

  return migrated;
}

function buildLegacyEntries(parsed) {
  // v1/v2 data may have timeline days plus separate food logs instead of the current
  // unified entry schema. This bridges those formats into v3 entries.
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

function migrateEntry(dateKey, rawEntry, sourceVersion = 4) {
  const migratedFood = createEmptyFoodEntry();
  for (const slot of mealSlots) {
    const value = rawEntry?.food?.[slot];
    migratedFood[slot] = normalizeFoodValue(value, sourceVersion);
  }

  return {
    date: dateKey,
    mode: rawEntry?.mode || "full",
    steps: Number(rawEntry?.steps) || 0,
    exerciseMinutes: Number(rawEntry?.exerciseMinutes) || 0,
    weight: rawEntry?.weight == null ? null : Number(rawEntry.weight),
    bodyFat: rawEntry?.bodyFat == null ? null : Number(rawEntry.bodyFat),
    notes: typeof rawEntry?.notes === "string" ? rawEntry.notes.slice(0, 120) : "",
    food: migratedFood,
    habits: {
      protein: Boolean(rawEntry?.habits?.protein),
      produce: Boolean(rawEntry?.habits?.produce),
      stoppedBeforeStuffed: Boolean(rawEntry?.habits?.stoppedBeforeStuffed),
      movement: Boolean(rawEntry?.habits?.movement),
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

function normalizeFoodValue(value, sourceVersion = 4) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return null;
  }
  if (numeric < 0 || numeric > 5) {
    return null;
  }
  if (numeric === 4 && sourceVersion < 4) {
    return 5;
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
  lastExportStatus.textContent = formatRelativeExport(state.meta?.lastExportAt);
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
  entryNotesInput.value = entry.notes || "";
  habitProteinInput.checked = entry.habits.protein;
  habitProduceInput.checked = entry.habits.produce;
  habitStoppedInput.checked = entry.habits.stoppedBeforeStuffed;
  habitMovementInput.checked = entry.habits.movement;
}

function getEntry(dateKey) {
  return {
    date: dateKey,
    mode: state.settings.mode,
    steps: 0,
    exerciseMinutes: 0,
    weight: null,
    bodyFat: null,
    notes: "",
    food: createEmptyFoodEntry(),
    habits: {
      protein: false,
      produce: false,
      stoppedBeforeStuffed: false,
      movement: false,
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
      movement: Boolean((state.entries[dateKey] || {}).habits?.movement),
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
    notes: (entryNotesInput.value || "").trim().slice(0, 120),
    food: readFoodForm(),
    habits: {
      protein: habitProteinInput.checked,
      produce: habitProduceInput.checked,
      stoppedBeforeStuffed: habitStoppedInput.checked,
      movement: habitMovementInput.checked,
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
              <span>${value}<small>${escapeHtml(foodOptions[value].label)}</small></span>
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
  state.meta.lastExportAt = new Date().toISOString();
  saveState();
  lastExportStatus.textContent = formatRelativeExport(state.meta.lastExportAt);
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
  lastExportStatus.textContent = formatRelativeExport(state.meta?.lastExportAt);
  document.body.classList.toggle("maintenance-mode", state.settings.mode === "maintenance");
  foodSection.classList.toggle("is-hidden", state.settings.mode === "maintenance");
  logPanel.classList.toggle("is-hidden", state.settings.mode === "maintenance");
  rewardsPanel.classList.toggle("is-hidden", state.settings.mode === "maintenance");
  storyPanel.classList.toggle("is-hidden", state.settings.mode === "maintenance");
  activityPanel.classList.toggle("is-hidden", state.settings.mode === "maintenance");
}

function computeSummary() {
  const loggedEntries = Object.values(state.entries)
    .map((entry) => scoreDay(migrateEntry(entry.date, entry)))
    .sort((a, b) => a.date.localeCompare(b.date));

  const timelineFilled = buildFilledTimeline(loggedEntries);
  const totalXp = loggedEntries.reduce((sum, day) => sum + day.totalScore + day.bonusXp, 0);
  const level = getLevelFromXp(totalXp);
  const nextLevel = level + 1;
  const nextLevelXp = getXpForLevel(nextLevel);
  const xpToNext = getXpToNextLevel(totalXp);
  const regularStreak = calculateStreak(timelineFilled, (day) => day.totalScore >= 55);
  const eliteStreak = calculateStreak(timelineFilled, (day) => day.totalScore >= 70);
  const bestRegularStreak = calculateBestStreak(timelineFilled, (day) => day.totalScore >= 55);
  const bestEliteStreak = calculateBestStreak(timelineFilled, (day) => day.totalScore >= 70);
  const weekly = computeWeeklyMetrics(loggedEntries);
  syncRewardMilestones(weekly);
  const rewards = state.rewards.map((reward) => ({
    ...reward,
    unlocked: isRewardUnlocked(reward, { level, regularStreak, loggedEntries, weekly }),
  }));

  return {
    timelineLogged: loggedEntries,
    timelineFilled,
    totalXp,
    level,
    nextLevel,
    nextLevelXp,
    xpToNext,
    regularStreak,
    eliteStreak,
    bestRegularStreak,
    bestEliteStreak,
    today: scoreDay(getDraftEntry()),
    weekly,
    rewards,
    bossFight: getBossFight({ loggedEntries, weekly, regularStreak, eliteStreak }),
  };
}

function getDraftEntry() {
  const dateKey = getSelectedDateKey();
  return {
    ...getEntry(dateKey),
    date: dateKey,
    mode: state.settings.mode,
    steps: clampNumber(entryStepsInput.value, 0, 100000, 0),
    exerciseMinutes: clampNumber(entryExerciseInput.value, 0, 300, 0),
    weight: parseOptionalNumber(entryWeightInput.value),
    bodyFat: parseOptionalNumber(entryBodyFatInput.value),
    notes: (entryNotesInput.value || "").trim().slice(0, 120),
    food: readFoodForm(),
    habits: {
      protein: habitProteinInput.checked,
      produce: habitProduceInput.checked,
      stoppedBeforeStuffed: habitStoppedInput.checked,
      movement: habitMovementInput.checked,
    },
  };
}

function scoreDay(entry) {
  const dayMode = entry.mode || "full";
  const stepPoints = Math.round(Math.min(1, (entry.steps || 0) / state.settings.stepGoal) * 25);
  const exercisePoints = Math.round(Math.min(1, (entry.exerciseMinutes || 0) / state.settings.exerciseGoal) * 20);

  const answeredMeals = mealSlots.filter((slot) => entry.food[slot] !== null);
  const scoredMeals = answeredMeals.filter((slot) => foodOptions[entry.food[slot]].quality !== null);
  const foodAverage = scoredMeals.length
    ? scoredMeals.reduce((sum, slot) => sum + (foodOptions[entry.food[slot]].score ?? foodOptions[entry.food[slot]].quality ?? 0), 0) / scoredMeals.length
    : 0;
  const foodCompletionBonus = coreMealSlots.every((slot) => entry.food[slot] !== null) ? 2 : 0;
  const foodPoints = Math.min(25, Math.round(foodAverage * 23) + foodCompletionBonus);

  const bodyMetricPoints = (entry.weight != null ? 5 : 0) + (entry.bodyFat != null ? 5 : 0);
  const habitPoints =
    (entry.habits.protein ? 5 : 0) +
    (entry.habits.produce ? 5 : 0) +
    (entry.habits.stoppedBeforeStuffed ? 5 : 0) +
    (entry.habits.movement ? 5 : 0);
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

function getXpForLevel(level) {
  return Math.max(0, (level - 1) * 250);
}

function getLevelFromXp(xp) {
  return Math.max(1, Math.floor(xp / 250) + 1);
}

function getXpToNextLevel(xp) {
  return getXpForLevel(getLevelFromXp(xp) + 1) - xp;
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
  const previousWeeklyWeightAverages = allWeeklyWeightAverages.slice(0, -1).map((item) => item.value);
  const priorLowestWeeklyWeightAverage = previousWeeklyWeightAverages.length
    ? Math.min(...previousWeeklyWeightAverages)
    : null;
  const lowestWeeklyWeightAverage = allWeeklyWeightAverages.length
    ? Math.min(...allWeeklyWeightAverages.map((item) => item.value))
    : null;
  const isNewLowestWeightAverage = latestWeeklyWeightAverage != null && (
    priorLowestWeeklyWeightAverage == null || latestWeeklyWeightAverage <= priorLowestWeeklyWeightAverage - 0.2
  );

  const scoreSeries = buildRollingAverageSeries(loggedEntries, "totalScore");
  const latestScoreAverage = scoreSeries.length ? scoreSeries[scoreSeries.length - 1].value : null;
  const priorScoreAverage = scoreSeries.length > 1 ? scoreSeries[scoreSeries.length - 2].value : null;

  const weightSeries = buildRollingAverageSeries(loggedEntries, "weight");
  const latestWeightAverage = weightSeries.length ? weightSeries[weightSeries.length - 1].value : null;
  const priorWeightAverage = weightSeries.length > 1 ? weightSeries[weightSeries.length - 2].value : null;

  return {
    scoreAverage,
    weightAverage,
    bodyFatAverage,
    loggedDays,
    latestWeeklyWeightAverage,
    priorLowestWeeklyWeightAverage,
    lowestWeeklyWeightAverage,
    isNewLowestWeightAverage,
    latestScoreAverage,
    priorScoreAverage,
    latestWeightAverage,
    priorWeightAverage,
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
      return state.meta.lowestAvgWeightRewarded != null && reward.claimed === false;
    default:
      return false;
  }
}

function syncRewardMilestones(weekly) {
  if (weekly.isNewLowestWeightAverage && weekly.latestWeeklyWeightAverage != null) {
    const priorRewarded = state.meta.lowestAvgWeightRewarded;
    if (priorRewarded == null || weekly.latestWeeklyWeightAverage <= priorRewarded - 0.2) {
      state.meta.lowestAvgWeightRewarded = weekly.latestWeeklyWeightAverage;
      saveState();
    }
  }
}

function renderTodayCard(summary) {
  const today = summary.today;
  const selectedDateLabel = formatDisplayDate(getSelectedDateKey());
  const isMaintenance = state.settings.mode === "maintenance";
  const quickStats = [
    { label: "Score", value: `${today.totalScore}` },
    { label: "XP", value: `+${today.totalScore + today.bonusXp}` },
    { label: "Day Type", value: capitalize(today.dayType) },
    { label: "Mode", value: capitalize(today.mode) },
  ];
  const noteMarkup = `
    <label class="quick-field quick-notes">
      <span>Notes</span>
      <input id="today-notes" type="text" maxlength="120" value="${escapeHtml(today.notes || "")}" placeholder="client lunch, poor sleep, field day">
    </label>
  `;

  todayCard.innerHTML = `
    <div class="today-grid">
      <div class="today-main">
        <div class="today-kicker">${escapeHtml(selectedDateLabel)}</div>
        <div class="today-score">${today.totalScore}</div>
        <div class="today-copy">Win day at 70+. Solid day at 55+. Regular streak survives solid days; elite streak needs wins.</div>
        <div class="xp-progress-card">
          <div class="xp-line">Level ${summary.level} | ${summary.totalXp.toLocaleString()} XP total</div>
          <div class="xp-line">Next level at ${summary.nextLevelXp.toLocaleString()} XP</div>
          <div class="xp-line">${summary.xpToNext.toLocaleString()} XP to go</div>
          <div class="xp-progress"><span style="width:${Math.max(0, Math.min(100, ((summary.totalXp - getXpForLevel(summary.level)) / 250) * 100))}%"></span></div>
        </div>
        <div class="boss-fight-card">
          <div class="boss-title">Boss Fight: ${escapeHtml(summary.bossFight.title)}</div>
          <div class="boss-copy">${escapeHtml(summary.bossFight.body)}</div>
        </div>
        <div class="quick-fields">
          ${isMaintenance ? "" : `
            <label class="quick-field">
              <span>Date</span>
              <input id="today-date" type="date" value="${escapeHtml(getSelectedDateKey())}">
            </label>
          `}
          <label class="quick-field">
            <span>Steps</span>
            <input id="today-steps" type="number" min="0" max="100000" step="100" value="${today.steps || ""}">
          </label>
          <label class="quick-field">
            <span>Exercise</span>
            <input id="today-exercise" type="number" min="0" max="300" step="5" value="${today.exerciseMinutes || ""}">
          </label>
          <label class="quick-field">
            <span>Weight</span>
            <input id="today-weight" type="number" min="50" max="500" step="0.1" value="${today.weight ?? ""}">
          </label>
          <label class="quick-field">
            <span>Body Fat %</span>
            <input id="today-body-fat" type="number" min="3" max="60" step="0.1" value="${today.bodyFat ?? ""}">
          </label>
          ${noteMarkup}
        </div>
        <div class="today-habits">
          <label class="checkbox-row compact"><input id="today-habit-protein" type="checkbox" ${today.habits.protein ? "checked" : ""}> Protein</label>
          <label class="checkbox-row compact"><input id="today-habit-produce" type="checkbox" ${today.habits.produce ? "checked" : ""}> Produce</label>
          <label class="checkbox-row compact"><input id="today-habit-stopped" type="checkbox" ${today.habits.stoppedBeforeStuffed ? "checked" : ""}> Stopped before stuffed</label>
          <label class="checkbox-row compact"><input id="today-habit-movement" type="checkbox" ${today.habits.movement ? "checked" : ""}> Movement target</label>
        </div>
      </div>
      <div class="today-stats">
        ${quickStats.map((item) => `
          <article class="today-stat">
            <div class="stat-label">${escapeHtml(item.label)}</div>
            <div class="stat-value small">${escapeHtml(item.value)}</div>
          </article>
        `).join("")}
      </div>
      <div class="today-breakdown ${isMaintenance ? "is-hidden" : ""}">
        <div class="score-row"><span>Steps</span><span>${today.stepPoints}/25</span></div>
        <div class="score-row"><span>Exercise</span><span>${today.exercisePoints}/20</span></div>
        ${today.mode === "full" ? `<div class="score-row"><span>Food</span><span>${today.foodPoints}/25</span></div>` : ""}
        <div class="score-row"><span>Body metrics</span><span>${today.bodyMetricPoints}/10</span></div>
        <div class="score-row"><span>Habits</span><span>${today.habitPoints}/20</span></div>
      </div>
    </div>
  `;

  wireTodayQuickInputs();
}

function wireTodayQuickInputs() {
  syncQuickInput("today-date", entryDateInput, true);
  syncQuickInput("today-steps", entryStepsInput);
  syncQuickInput("today-exercise", entryExerciseInput);
  syncQuickInput("today-weight", entryWeightInput);
  syncQuickInput("today-body-fat", entryBodyFatInput);
  syncQuickInput("today-notes", entryNotesInput);
  syncQuickCheckbox("today-habit-protein", habitProteinInput);
  syncQuickCheckbox("today-habit-produce", habitProduceInput);
  syncQuickCheckbox("today-habit-stopped", habitStoppedInput);
  syncQuickCheckbox("today-habit-movement", habitMovementInput);
}

function syncQuickInput(sourceId, targetInput, rerender = false) {
  const source = document.getElementById(sourceId);
  if (!source || !targetInput) {
    return;
  }
  source.addEventListener("input", () => {
    targetInput.value = source.value;
  });
  source.addEventListener("change", () => {
    targetInput.value = source.value;
    if (rerender) {
      handleDateChange();
    } else {
      render();
    }
  });
}

function syncQuickCheckbox(sourceId, targetInput) {
  const source = document.getElementById(sourceId);
  if (!source || !targetInput) {
    return;
  }
  source.addEventListener("change", () => {
    targetInput.checked = source.checked;
    render();
  });
}

function renderWeeklySummary(summary) {
  summaryStats.innerHTML = [
    statCard(`Level ${summary.level}`, `${summary.totalXp.toLocaleString()} XP`, `${state.settings.displayName}'s total campaign experience`),
    statCard("Regular Streak", `${summary.regularStreak} days`, `Best: ${summary.bestRegularStreak}`),
    statCard("Elite Streak", `${summary.eliteStreak} days`, `Best: ${summary.bestEliteStreak}`),
    statCard("Next Level", `${summary.nextLevelXp.toLocaleString()} XP`, `${summary.xpToNext.toLocaleString()} XP remaining`),
    statCard("7-day Avg Score", formatMaybe(summary.weekly.scoreAverage), `${summary.weekly.loggedDays} days logged this week`),
    statCard("7-day Avg Weight", formatMaybe(summary.weekly.weightAverage, 1), `Goal: ${state.settings.weightGoal}`),
    statCard("7-day Avg Body Fat", formatMaybe(summary.weekly.bodyFatAverage, 1, "%"), `Goal: ${state.settings.bodyFatGoal}%`),
  ].join("");

  guardrailList.innerHTML = buildGuardrails(summary)
    .map((message) => `<div class="guardrail-item">${escapeHtml(message)}</div>`)
    .join("");
}

function renderCharts(summary) {
  const weightDays = summary.timelineLogged.filter((day) => day.weight != null);
  const bodyFatDays = summary.timelineLogged.filter((day) => day.bodyFat != null);
  const scoreDays = summary.timelineLogged;

  chartWrap.innerHTML = `
    ${renderLineChart("Weight", weightDays, "weight", state.settings.weightGoal, buildRollingAverageSeries(weightDays, "weight"))}
    ${renderLineChart("Body Fat %", bodyFatDays, "bodyFat", state.settings.bodyFatGoal, buildRollingAverageSeries(bodyFatDays, "bodyFat"))}
    ${renderLineChart("Daily Score", scoreDays, "totalScore", 70)}
  `;
}

function renderLineChart(title, data, key, goal, movingAverageSeries = []) {
  if (!data.length) {
    return `<div class="empty-state">${escapeHtml(title)} graph appears after you log a few days.</div>`;
  }

  const width = 320;
  const height = 160;
  const padding = 18;
  const values = data.map((item) => item[key]).concat(movingAverageSeries.map((item) => item.value));
  const min = Math.min(...values, goal);
  const max = Math.max(...values, goal);
  const range = Math.max(1, max - min);

  const dateIndexMap = new Map(data.map((item, index) => [item.date, index]));
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - ((item[key] - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");
  const movingAveragePoints = movingAverageSeries.map((item) => {
    const index = dateIndexMap.get(item.date);
    const x = padding + (index * (width - padding * 2)) / Math.max(1, data.length - 1);
    const y = height - padding - ((item.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(" ");

  const goalY = height - padding - ((goal - min) / range) * (height - padding * 2);
  const latest = data[data.length - 1]?.[key] ?? null;
  const sevenAgo = data.length > 7 ? data[data.length - 8]?.[key] ?? null : null;
  const change = latest != null && sevenAgo != null ? latest - sevenAgo : null;
  const currentAverage = movingAverageSeries.length ? movingAverageSeries[movingAverageSeries.length - 1].value : null;
  const seriesStats = getSeriesStats(data, key);
  const decimals = key === "totalScore" ? 0 : 1;

  return `
    <div class="chart-card">
      <div class="chart-title">${escapeHtml(title)}</div>
      <div class="chart-summary">
        <span>Latest: ${formatMaybe(latest, decimals)}</span>
        <span>Historic max: ${formatMaybe(seriesStats.max, decimals)}</span>
        <span>Historic min: ${formatMaybe(seriesStats.min, decimals)}</span>
        <span>Total change: ${formatSigned(seriesStats.totalChange, decimals)}</span>
        <span>${escapeHtml(seriesStats.recentLabel)}: ${formatSigned(seriesStats.recentChange, decimals)}</span>
        <span>7-day avg: ${formatMaybe(currentAverage, decimals)}</span>
        <span>vs 7 days ago: ${formatSigned(change, decimals)}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" class="trend-chart" role="img" aria-label="${escapeHtml(title)} trend">
        <line x1="${padding}" y1="${goalY}" x2="${width - padding}" y2="${goalY}" class="goal-line"></line>
        <polyline points="${points}" class="trend-line"></polyline>
        ${movingAveragePoints ? `<polyline points="${movingAveragePoints}" class="trend-line trend-line-average"></polyline>` : ""}
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

function buildGuardrails(summary) {
  const messages = [];
  if (summary.weekly.loggedDays < 4) {
    messages.push(`You logged only ${summary.weekly.loggedDays} of the last 7 days.`);
  }
  if (summary.weekly.latestScoreAverage != null && summary.weekly.priorScoreAverage != null && summary.weekly.latestScoreAverage < summary.weekly.priorScoreAverage - 5) {
    messages.push("Average score is down this week.");
  }
  if (
    summary.weekly.latestWeightAverage != null &&
    summary.weekly.priorWeightAverage != null &&
    summary.weekly.latestWeightAverage <= summary.weekly.priorWeightAverage + 0.2 &&
    summary.weekly.latestWeightAverage >= summary.weekly.priorWeightAverage - 0.2
  ) {
    const latestWeight = summary.timelineLogged.filter((day) => day.weight != null).slice(-1)[0]?.weight ?? null;
    const previousWeight = summary.timelineLogged.filter((day) => day.weight != null).slice(-8, -7)[0]?.weight ?? null;
    if (latestWeight != null && previousWeight != null && latestWeight > previousWeight) {
      messages.push("Weight is up, but the 7-day average is still stable.");
    }
  }
  if (!messages.length) {
    messages.push("Weekly trend is steady. Keep the system simple and consistent.");
  }
  return messages;
}

function getBossFight(context) {
  const recent = context.loggedEntries.slice(-5);
  if (context.loggedEntries.length < 3) {
    return {
      title: "The Fog of Drift",
      body: "The main threat is not failure yet. It is vagueness. Log a few clean days so the map stops lying by omission.",
    };
  }

  const last = recent[recent.length - 1];
  const answeredMeals = recent.map((day) => day.answeredMeals?.length || 0);
  const loggingDays = context.weekly.loggedDays;

  if (loggingDays < 4) {
    return {
      title: "The Vanishing Trail",
      body: "Awareness is thinning out. The danger is not one bad choice; it is losing contact with the pattern long enough for drift to take the gate.",
    };
  }

  if (context.regularStreak >= 5) {
    return {
      title: "False Summit",
      body: "Several good days can whisper that structure is optional now. Keep the rails up a little longer than your confidence says you need to.",
    };
  }

  if (recent.some((day) => day.foodPoints <= 6 && day.mode === "full")) {
    return {
      title: "Reward Creep",
      body: "A rough meal can recruit company fast. Watch for the old instinct to turn one indulgence into an all-evening permission slip.",
    };
  }

  if (recent.some((day) => day.exerciseMinutes >= state.settings.exerciseGoal && day.habitPoints < 10)) {
    return {
      title: "The Easy Extra",
      body: "High activity can create fake moral credit. Do not let movement quietly negotiate away meal structure or portion awareness.",
    };
  }

  if (last.weight != null && context.weekly.latestWeightAverage != null && last.weight < context.weekly.latestWeightAverage) {
    return {
      title: "Quiet Rationalization",
      body: "A strong weigh-in can make the perimeter feel safer than it is. Guard against the subtle idea that today earned a looser system tomorrow.",
    };
  }

  return {
    title: "The Fog of Close Enough",
    body: "The current risk is not collapse. It is softening standards by a few small degrees until the whole map tilts. Stay exact where it matters.",
  };
}

function getSeriesStats(data, key) {
  if (!data.length) {
    return {
      max: null,
      min: null,
      totalChange: null,
      recentChange: null,
      recentLabel: "Recent change",
    };
  }

  const values = data.map((item) => item[key]);
  const first = values[0];
  const last = values[values.length - 1];
  const latestDate = new Date(`${data[data.length - 1].date}T12:00:00`);
  const cutoff = new Date(latestDate);
  cutoff.setDate(cutoff.getDate() - 30);
  const recentWindow = data.filter((item) => new Date(`${item.date}T12:00:00`) >= cutoff);
  const recentStart = recentWindow.length ? recentWindow[0][key] : first;

  return {
    max: Math.max(...values),
    min: Math.min(...values),
    totalChange: last - first,
    recentChange: recentWindow.length ? last - recentStart : null,
    recentLabel: recentWindow.length >= 30 ? "Last 30 days" : `Last ${recentWindow.length || 1} entries`,
  };
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
        ${day.notes ? `<div class="day-notes">${escapeHtml(day.notes)}</div>` : ""}
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

function formatSigned(value, decimals = 0) {
  if (value == null || Number.isNaN(value)) {
    return "--";
  }
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(decimals)}`;
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

function formatRelativeExport(timestamp) {
  if (!timestamp) {
    return "Never";
  }
  const then = new Date(timestamp);
  if (Number.isNaN(then.getTime())) {
    return "Never";
  }
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - then.getTime()) / 86400000);
  if (diffDays <= 0) {
    return "Today";
  }
  if (diffDays === 1) {
    return "1 day ago";
  }
  return `${diffDays} days ago`;
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
