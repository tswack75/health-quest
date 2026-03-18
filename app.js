const STORAGE_KEY = "health-quest-v1";
const mealSlots = ["morning", "lunch", "snack", "dinner", "other"];
const foodOptionLabels = {
  0: "No calories",
  1: "On track",
  2: "Okay",
  3: "Off schedule",
};
const foodScoreMap = {
  0: 3,
  1: 4,
  2: 2,
  3: 0,
};

const defaultSettings = {
  displayName: "Adventurer",
  stepGoal: 8000,
  exerciseGoal: 30,
  sleepGoal: 7.5,
  mindfulGoal: 10,
};

const metricConfig = {
  steps: {
    types: ["HKQuantityTypeIdentifierStepCount"],
    aggregator: "sum",
  },
  exerciseMinutes: {
    types: ["HKQuantityTypeIdentifierAppleExerciseTime"],
    aggregator: "sum",
  },
  distanceKm: {
    types: ["HKQuantityTypeIdentifierDistanceWalkingRunning"],
    aggregator: "sumDistanceKm",
  },
  flights: {
    types: ["HKQuantityTypeIdentifierFlightsClimbed"],
    aggregator: "sum",
  },
  mindfulMinutes: {
    types: ["HKCategoryTypeIdentifierMindfulSession"],
    aggregator: "durationMinutes",
  },
  sleepHours: {
    types: ["HKCategoryTypeIdentifierSleepAnalysis"],
    aggregator: "sleepHours",
  },
};

const badgeDefinitions = [
  { id: "first_import", title: "First Sync", icon: "1", description: "Import your first Apple Health export." },
  { id: "week_streak", title: "7-Day Spark", icon: "7", description: "Reach a 7-day healthy streak." },
  { id: "step_champion", title: "Step Champion", icon: "S", description: "Hit 10,000 steps in a day." },
  { id: "exercise_hour", title: "Power Hour", icon: "E", description: "Reach 60 exercise minutes in a day." },
  { id: "sleep_guardian", title: "Sleep Guardian", icon: "Z", description: "Sleep 8 hours in one night." },
  { id: "mindful_moment", title: "Mindful Moment", icon: "M", description: "Log 15 mindfulness minutes in a day." },
  { id: "all_rounder", title: "All-Rounder", icon: "A", description: "Complete 4 quests in a single day." },
];

let state = loadState();

const fileInput = document.getElementById("file-input");
const demoButton = document.getElementById("demo-button");
const saveProfileButton = document.getElementById("save-profile");
const statusMessage = document.getElementById("status-message");
const summaryStats = document.getElementById("summary-stats");
const questList = document.getElementById("quest-list");
const foodLog = document.getElementById("food-log");
const badgeList = document.getElementById("badge-list");
const dayList = document.getElementById("day-list");

const displayNameInput = document.getElementById("display-name");
const stepGoalInput = document.getElementById("step-goal");
const exerciseGoalInput = document.getElementById("exercise-goal");
const sleepGoalInput = document.getElementById("sleep-goal");
const mindfulGoalInput = document.getElementById("mindful-goal");

initialize();

function initialize() {
  hydrateSettingsForm();
  fileInput.addEventListener("change", handleFileUpload);
  demoButton.addEventListener("click", loadDemoData);
  saveProfileButton.addEventListener("click", saveProfile);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  render();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      settings: { ...defaultSettings },
      foodLogs: {},
      summary: null,
      importedAt: null,
      sourceName: null,
    };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      foodLogs: parsed.foodLogs || {},
      summary: parsed.summary || null,
      importedAt: parsed.importedAt || null,
      sourceName: parsed.sourceName || null,
    };
  } catch (error) {
    return {
      settings: { ...defaultSettings },
      foodLogs: {},
      summary: null,
      importedAt: null,
      sourceName: null,
    };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateSettingsForm() {
  displayNameInput.value = state.settings.displayName;
  stepGoalInput.value = state.settings.stepGoal;
  exerciseGoalInput.value = state.settings.exerciseGoal;
  sleepGoalInput.value = state.settings.sleepGoal;
  mindfulGoalInput.value = state.settings.mindfulGoal;
}

function saveProfile() {
  state.settings = {
    displayName: (displayNameInput.value || defaultSettings.displayName).trim().slice(0, 24) || defaultSettings.displayName,
    stepGoal: clampNumber(stepGoalInput.value, 1000, 30000, defaultSettings.stepGoal),
    exerciseGoal: clampNumber(exerciseGoalInput.value, 5, 180, defaultSettings.exerciseGoal),
    sleepGoal: clampNumber(sleepGoalInput.value, 4, 12, defaultSettings.sleepGoal),
    mindfulGoal: clampNumber(mindfulGoalInput.value, 0, 60, defaultSettings.mindfulGoal),
  };

  if (state.summary) {
    state.summary = computeGameSummary(state.summary.days, state.settings, state.foodLogs);
  }

  saveState();
  render();
  setStatus("Goals saved on this device.");
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

async function handleFileUpload(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  if (!file.name.toLowerCase().endsWith(".xml")) {
    setStatus("This web app currently supports Apple Health export.xml files. If Apple gave you a zip, unzip it first and choose export.xml.");
    return;
  }

  setStatus(`Reading ${file.name}...`);

  try {
    const xmlText = await file.text();
    const days = parseHealthXml(xmlText);
    if (!days.length) {
      throw new Error("No supported Apple Health records were found.");
    }
    state.summary = computeGameSummary(days, state.settings, state.foodLogs);
    state.importedAt = new Date().toISOString();
    state.sourceName = file.name;
    saveState();
    render();
    setStatus(`Imported ${days.length} day${days.length === 1 ? "" : "s"} from ${file.name}.`);
  } catch (error) {
    setStatus(error.message || "Import failed. Please try a different export.xml file.");
  } finally {
    fileInput.value = "";
  }
}

function parseHealthXml(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  const parseError = xml.querySelector("parsererror");
  if (parseError) {
    throw new Error("That file could not be parsed as Apple Health XML.");
  }

  const dailyMap = new Map();
  const records = Array.from(xml.getElementsByTagName("Record"));

  for (const record of records) {
    const type = record.getAttribute("type");
    const metricName = getMetricName(type);
    if (!metricName) {
      continue;
    }

    const startDate = record.getAttribute("startDate");
    const endDate = record.getAttribute("endDate");
    const value = Number(record.getAttribute("value") || "0");
    const unit = record.getAttribute("unit") || "";
    const dayKey = getDayKey(startDate);

    if (!dayKey) {
      continue;
    }

    if (!dailyMap.has(dayKey)) {
      dailyMap.set(dayKey, createEmptyDay(dayKey));
    }

    const day = dailyMap.get(dayKey);

    switch (metricConfig[metricName].aggregator) {
      case "sum":
        day[metricName] += Number.isFinite(value) ? value : 0;
        break;
      case "sumDistanceKm":
        day[metricName] += convertDistanceToKm(value, unit);
        break;
      case "durationMinutes":
        day[metricName] += getDurationMinutes(startDate, endDate);
        break;
      case "sleepHours":
        if (isAsleepCategory(record.getAttribute("value"))) {
          day[metricName] += getDurationMinutes(startDate, endDate) / 60;
        }
        break;
      default:
        break;
    }
  }

  return Array.from(dailyMap.values())
    .map((day) => ({
      ...day,
      steps: Math.round(day.steps),
      exerciseMinutes: roundToOne(day.exerciseMinutes),
      distanceKm: roundToOne(day.distanceKm),
      flights: Math.round(day.flights),
      mindfulMinutes: roundToOne(day.mindfulMinutes),
      sleepHours: roundToOne(day.sleepHours),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getMetricName(type) {
  return Object.keys(metricConfig).find((metric) => metricConfig[metric].types.includes(type)) || null;
}

function createEmptyDay(dayKey) {
  return {
    date: dayKey,
    steps: 0,
    exerciseMinutes: 0,
    distanceKm: 0,
    flights: 0,
    mindfulMinutes: 0,
    sleepHours: 0,
    food: createEmptyFoodEntry(),
  };
}

function createEmptyFoodEntry() {
  return {
    morning: null,
    lunch: null,
    snack: null,
    dinner: null,
    other: null,
  };
}

function getDayKey(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString("en-CA");
}

function convertDistanceToKm(value, unit) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const normalized = String(unit || "").toLowerCase();
  if (normalized.includes("mi")) {
    return value * 1.60934;
  }
  if (normalized.includes("m") && !normalized.includes("km")) {
    return value / 1000;
  }
  return value;
}

function getDurationMinutes(startDateString, endDateString) {
  const startDate = new Date(startDateString);
  const endDate = new Date(endDateString);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 0;
  }
  return Math.max(0, (endDate.getTime() - startDate.getTime()) / 60000);
}

function isAsleepCategory(value) {
  return ["HKCategoryValueSleepAnalysisAsleep", "HKCategoryValueSleepAnalysisAsleepCore", "HKCategoryValueSleepAnalysisAsleepDeep", "HKCategoryValueSleepAnalysisAsleepREM", "1", "3", "4", "5"].includes(String(value));
}

function computeGameSummary(days, settings, foodLogs = {}) {
  const timelineDays = fillDateGaps(mergeFoodLogsIntoDays(days, foodLogs));
  const enrichedDays = timelineDays.map((day) => enrichDay(day, settings));
  const scoredDays = enrichedDays.filter((day) => day.totalScore > 0 || day.questCount > 0);
  const totalScore = scoredDays.reduce((sum, day) => sum + day.totalScore, 0);
  const currentStreak = calculateCurrentStreak(enrichedDays);
  const bestStreak = calculateBestStreak(enrichedDays);
  const level = Math.max(1, Math.floor(totalScore / 500) + 1);
  const todayKey = getDayKey(new Date().toISOString());
  const today = enrichedDays.find((day) => day.date === todayKey) || enrichedDays[enrichedDays.length - 1] || enrichDay(createEmptyDay(todayKey), settings);
  const badges = computeBadges(scoredDays, currentStreak, bestStreak);

  return {
    generatedAt: new Date().toISOString(),
    days,
    enrichedDays,
    totalScore,
    currentStreak,
    bestStreak,
    level,
    activeDays: scoredDays.length,
    today,
    badges,
  };
}

function fillDateGaps(days) {
  if (!days.length) {
    return [];
  }

  const dayMap = new Map(days.map((day) => [day.date, day]));
  const startDate = new Date(`${days[0].date}T12:00:00`);
  const endDate = new Date(`${days[days.length - 1].date}T12:00:00`);
  const filled = [];
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const key = getDayKey(cursor.toISOString());
    filled.push(dayMap.get(key) || createEmptyDay(key));
    cursor.setDate(cursor.getDate() + 1);
  }

  return filled;
}

function mergeFoodLogsIntoDays(days, foodLogs) {
  const mergedMap = new Map(days.map((day) => [day.date, { ...createEmptyDay(day.date), ...day, food: { ...createEmptyFoodEntry(), ...(day.food || {}) } }]));

  for (const [dateKey, foodEntry] of Object.entries(foodLogs || {})) {
    const current = mergedMap.get(dateKey) || createEmptyDay(dateKey);
    mergedMap.set(dateKey, {
      ...current,
      food: {
        ...createEmptyFoodEntry(),
        ...(current.food || {}),
        ...(foodEntry || {}),
      },
    });
  }

  return Array.from(mergedMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function enrichDay(day, settings) {
  const food = { ...createEmptyFoodEntry(), ...(day.food || {}) };
  const foodTrackCount = mealSlots.filter((slot) => food[slot] === 0 || food[slot] === 1).length;
  const foodLoggedCount = mealSlots.filter((slot) => food[slot] !== null && food[slot] !== undefined).length;
  const foodScore = mealSlots.reduce((sum, slot) => {
    const rating = food[slot];
    return sum + (rating in foodScoreMap ? foodScoreMap[rating] : 0);
  }, 0);

  const quests = [
    buildQuest("Steps", day.steps, settings.stepGoal, "steps"),
    buildQuest("Exercise", day.exerciseMinutes, settings.exerciseGoal, "min"),
    buildQuest("Sleep", day.sleepHours, settings.sleepGoal, "hr"),
    buildQuest("Mindfulness", day.mindfulMinutes, settings.mindfulGoal, "min"),
    buildQuest("Distance", day.distanceKm, 5, "km"),
    buildQuest("Food Rhythm", foodTrackCount, 4, "wins"),
  ];

  const totalScore =
    scoreRatio(day.steps, settings.stepGoal, 35) +
    scoreRatio(day.exerciseMinutes, settings.exerciseGoal, 25) +
    scoreRatio(day.sleepHours, settings.sleepGoal, 20) +
    scoreRatio(day.mindfulMinutes, Math.max(settings.mindfulGoal, 1), 10) +
    scoreRatio(day.distanceKm, 5, 5) +
    scoreRatio(day.flights, 10, 5) +
    foodScore;

  const questCount = quests.filter((quest) => quest.complete).length;
  const successDay = totalScore >= 70 || questCount >= 3;

  return {
    ...day,
    food,
    foodTrackCount,
    foodLoggedCount,
    foodScore,
    quests,
    questCount,
    totalScore,
    successDay,
  };
}

function buildQuest(title, actual, goal, unit) {
  const safeGoal = Math.max(goal, 1);
  const progress = Math.min(1, actual / safeGoal);
  return {
    title,
    actual,
    goal,
    unit,
    progress,
    complete: actual >= goal,
  };
}

function scoreRatio(actual, goal, maxScore) {
  if (goal <= 0) {
    return maxScore;
  }
  return Math.round(Math.min(1, actual / goal) * maxScore);
}

function calculateCurrentStreak(days) {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!days[index].successDay) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function calculateBestStreak(days) {
  let streak = 0;
  let best = 0;
  for (const day of days) {
    streak = day.successDay ? streak + 1 : 0;
    best = Math.max(best, streak);
  }
  return best;
}

function computeBadges(days, currentStreak, bestStreak) {
  const unlocked = new Set();
  if (days.length) {
    unlocked.add("first_import");
  }
  if (Math.max(currentStreak, bestStreak) >= 7) {
    unlocked.add("week_streak");
  }
  if (days.some((day) => day.steps >= 10000)) {
    unlocked.add("step_champion");
  }
  if (days.some((day) => day.exerciseMinutes >= 60)) {
    unlocked.add("exercise_hour");
  }
  if (days.some((day) => day.sleepHours >= 8)) {
    unlocked.add("sleep_guardian");
  }
  if (days.some((day) => day.mindfulMinutes >= 15)) {
    unlocked.add("mindful_moment");
  }
  if (days.some((day) => day.questCount >= 4)) {
    unlocked.add("all_rounder");
  }

  return badgeDefinitions.map((badge) => ({
    ...badge,
    unlocked: unlocked.has(badge.id),
  }));
}

function render() {
  hydrateSettingsForm();
  renderSummary();
  renderQuests();
  renderFoodLog();
  renderBadges();
  renderDays();
}

function renderSummary() {
  if (!state.summary) {
    summaryStats.innerHTML = `<div class="empty-state">No quest data yet. Import Apple Health <code>export.xml</code> to unlock your dashboard.</div>`;
    return;
  }

  const { totalScore, currentStreak, bestStreak, level, activeDays, today } = state.summary;
  const avgScore = activeDays ? Math.round(totalScore / activeDays) : 0;

  summaryStats.innerHTML = [
    statCard(`Level ${level}`, `${totalScore.toLocaleString()} XP`, `${state.settings.displayName}'s lifetime health score`),
    statCard("Current Streak", `${currentStreak} day${currentStreak === 1 ? "" : "s"}`, `Best streak: ${bestStreak}`),
    statCard("Today", `${today.totalScore} pts`, `${today.questCount} quests complete`),
    statCard("Average Day", `${avgScore} pts`, `${activeDays} tracked day${activeDays === 1 ? "" : "s"}`),
  ].join("");
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

function renderQuests() {
  if (!state.summary) {
    questList.innerHTML = `<div class="empty-state">Your next quests appear after you import data.</div>`;
    return;
  }

  questList.innerHTML = state.summary.today.quests
    .map((quest) => `
      <article class="quest-card ${quest.complete ? "complete" : ""}">
        <div class="quest-top">
          <div class="quest-title">${escapeHtml(quest.title)}</div>
          <div class="quest-meta">${formatMetric(quest.actual, quest.unit)} / ${formatMetric(quest.goal, quest.unit)}</div>
        </div>
        <div class="progress-bar"><span style="width: ${Math.round(quest.progress * 100)}%"></span></div>
      </article>
    `)
    .join("");
}

function renderBadges() {
  const badges = state.summary?.badges || badgeDefinitions.map((badge) => ({ ...badge, unlocked: false }));
  badgeList.innerHTML = badges
    .map((badge) => `
      <article class="badge-card ${badge.unlocked ? "" : "locked"}">
        <div class="badge-row">
          <div class="badge-icon">${escapeHtml(badge.icon)}</div>
          <div>
            <div class="badge-title">${escapeHtml(badge.title)}</div>
            <div class="badge-meta">${escapeHtml(badge.description)}</div>
          </div>
        </div>
      </article>
    `)
    .join("");
}

function renderFoodLog() {
  const todayKey = getDayKey(new Date().toISOString());
  const todayFood = {
    ...createEmptyFoodEntry(),
    ...(state.foodLogs[todayKey] || state.summary?.today?.food || {}),
  };

  foodLog.innerHTML = mealSlots
    .map((slot) => `
      <article class="food-row">
        <div class="food-label">${escapeHtml(capitalize(slot))}</div>
        <div>
          <div class="food-options">
            ${[0, 1, 2, 3].map((option) => `
              <button
                type="button"
                class="food-option ${todayFood[slot] === option ? "active" : ""}"
                data-slot="${escapeHtml(slot)}"
                data-value="${option}"
              >${option}</button>
            `).join("")}
          </div>
          <div class="food-summary">${escapeHtml(foodOptionLabels[todayFood[slot]] || "Not logged yet")}</div>
        </div>
      </article>
    `)
    .join("");

  for (const button of foodLog.querySelectorAll(".food-option")) {
    button.addEventListener("click", handleFoodLogClick);
  }
}

function handleFoodLogClick(event) {
  const slot = event.currentTarget.dataset.slot;
  const value = Number(event.currentTarget.dataset.value);
  const todayKey = getDayKey(new Date().toISOString());
  const currentFood = {
    ...createEmptyFoodEntry(),
    ...(state.foodLogs[todayKey] || {}),
  };

  currentFood[slot] = value;
  state.foodLogs[todayKey] = currentFood;
  state.summary = computeGameSummary(state.summary?.days || [], state.settings, state.foodLogs);
  saveState();
  render();
  setStatus(`${capitalize(slot)} food log updated for ${formatDisplayDate(todayKey)}.`);
}

function renderDays() {
  if (!state.summary) {
    dayList.innerHTML = `<div class="empty-state">Recent activity cards will show up here after import.</div>`;
    return;
  }

  const recentDays = [...state.summary.enrichedDays].reverse().slice(0, 10);
  dayList.innerHTML = recentDays
    .map((day) => `
      <article class="day-card">
        <div class="day-top">
          <div class="day-title">${escapeHtml(formatDisplayDate(day.date))}</div>
          <div class="day-meta">${day.totalScore} pts${day.successDay ? " | streak day" : ""}</div>
        </div>
        <div class="metric-row">
          <span class="metric-pill">${day.steps.toLocaleString()} steps</span>
          <span class="metric-pill">${roundToOne(day.exerciseMinutes)} min exercise</span>
          <span class="metric-pill">${roundToOne(day.sleepHours)} hr sleep</span>
          <span class="metric-pill">${roundToOne(day.mindfulMinutes)} min mindful</span>
          <span class="metric-pill">${roundToOne(day.distanceKm)} km</span>
          <span class="metric-pill">Food ${day.foodTrackCount}/5 on track</span>
        </div>
      </article>
    `)
    .join("");
}

function formatMetric(value, unit) {
  const rounded = unit === "steps" ? Math.round(value).toLocaleString() : roundToOne(value);
  return `${rounded} ${unit}`;
}

function roundToOne(value) {
  return Math.round(value * 10) / 10;
}

function formatDisplayDate(dayKey) {
  const date = new Date(`${dayKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dayKey;
  }
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function loadDemoData() {
  const today = new Date();
  const days = [];
  for (let offset = 14; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - offset);
    const dayIndex = 14 - offset;
    days.push({
      date: getDayKey(date.toISOString()),
      steps: 5500 + (dayIndex * 870) % 7200,
      exerciseMinutes: 12 + (dayIndex * 9) % 55,
      distanceKm: 2.2 + (dayIndex * 0.7) % 6,
      flights: 3 + (dayIndex % 9),
      mindfulMinutes: [0, 5, 10, 15][dayIndex % 4],
      sleepHours: 6.1 + ((dayIndex * 0.43) % 2.6),
    });
  }

  state.foodLogs = buildDemoFoodLogs(days);
  state.summary = computeGameSummary(days, state.settings, state.foodLogs);
  state.importedAt = new Date().toISOString();
  state.sourceName = "demo-data";
  saveState();
  render();
  setStatus("Demo data loaded. You can now explore the game loop before importing your own export.");
}

function buildDemoFoodLogs(days) {
  const logs = {};
  for (let index = 0; index < days.length; index += 1) {
    const day = days[index];
    logs[day.date] = {
      morning: [1, 1, 2, 0][index % 4],
      lunch: [1, 2, 1, 3][index % 4],
      snack: [0, 1, 2, 3][index % 4],
      dinner: [1, 1, 2, 3][index % 4],
      other: [0, 0, 2, 3][index % 4],
    };
  }
  return logs;
}
