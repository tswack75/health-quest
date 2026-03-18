const STORAGE_KEY = "health-quest-v2";
const mealSlots = ["morning", "lunch", "afternoon", "dinner", "other"];
const foodOptions = {
  1: { label: "On track", points: 8 },
  2: { label: "OK + portion control", points: 5 },
  3: { label: "Not controlled", points: 2 },
  4: { label: "Out of control", points: 0 },
};

const defaultSettings = {
  displayName: "Adventurer",
  stepGoal: 8000,
  exerciseGoal: 30,
  weightGoal: 185,
  bodyFatGoal: 20,
};

const storyChapters = [
  {
    level: 1,
    title: "The First Camp",
    body: "You are not chasing a miracle day. You are building a field camp: one clean log, one honest number, one controlled meal at a time.",
  },
  {
    level: 2,
    title: "The System Builder",
    body: "Most people wait for motivation. You are building a system instead. The power here is repetition, not drama.",
  },
  {
    level: 4,
    title: "The Discipline Forge",
    body: "Your campaign is shifting from reaction to command. Food choices are becoming planned moves instead of random events.",
  },
  {
    level: 6,
    title: "The Quiet Momentum",
    body: "This is where real change hides: boring days, steady logs, and the refusal to let one rough meal become a rough week.",
  },
  {
    level: 9,
    title: "The Architect",
    body: "Your habits are starting to feel structural. You are no longer hoping for a better outcome; you are designing one.",
  },
];

let state = loadState();

const displayNameInput = document.getElementById("display-name");
const stepGoalInput = document.getElementById("step-goal");
const exerciseGoalInput = document.getElementById("exercise-goal");
const weightGoalInput = document.getElementById("weight-goal");
const bodyFatGoalInput = document.getElementById("body-fat-goal");
const saveProfileButton = document.getElementById("save-profile");

const entryDateInput = document.getElementById("entry-date");
const entryStepsInput = document.getElementById("entry-steps");
const entryExerciseInput = document.getElementById("entry-exercise");
const entryWeightInput = document.getElementById("entry-weight");
const entryBodyFatInput = document.getElementById("entry-body-fat");
const foodLog = document.getElementById("food-log");
const saveEntryButton = document.getElementById("save-entry");

const rewardNameInput = document.getElementById("reward-name");
const rewardLevelInput = document.getElementById("reward-level");
const addRewardButton = document.getElementById("add-reward");

const statusMessage = document.getElementById("status-message");
const summaryStats = document.getElementById("summary-stats");
const questList = document.getElementById("quest-list");
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
  entryDateInput.addEventListener("change", handleDateChange);
  saveEntryButton.addEventListener("click", saveDailyEntry);
  addRewardButton.addEventListener("click", addReward);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  render();
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  const fallback = {
    settings: { ...defaultSettings },
    entries: {},
    rewards: [],
  };

  if (!raw) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      settings: { ...defaultSettings, ...(parsed.settings || {}) },
      entries: parsed.entries || {},
      rewards: parsed.rewards || [],
    };
  } catch (error) {
    return fallback;
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function hydrateSettingsForm() {
  displayNameInput.value = state.settings.displayName;
  stepGoalInput.value = state.settings.stepGoal;
  exerciseGoalInput.value = state.settings.exerciseGoal;
  weightGoalInput.value = state.settings.weightGoal;
  bodyFatGoalInput.value = state.settings.bodyFatGoal;
}

function saveProfile() {
  state.settings = {
    displayName: (displayNameInput.value || defaultSettings.displayName).trim().slice(0, 24) || defaultSettings.displayName,
    stepGoal: clampNumber(stepGoalInput.value, 1000, 30000, defaultSettings.stepGoal),
    exerciseGoal: clampNumber(exerciseGoalInput.value, 5, 180, defaultSettings.exerciseGoal),
    weightGoal: clampNumber(weightGoalInput.value, 50, 500, defaultSettings.weightGoal),
    bodyFatGoal: clampNumber(bodyFatGoalInput.value, 3, 60, defaultSettings.bodyFatGoal),
  };

  saveState();
  render();
  setStatus("Goals saved.");
}

function handleDateChange() {
  hydrateEntryForm(getSelectedDateKey());
  renderFoodLog();
  render();
}

function saveDailyEntry() {
  const dateKey = getSelectedDateKey();
  const existing = getEntry(dateKey);

  state.entries[dateKey] = {
    ...existing,
    date: dateKey,
    steps: clampNumber(entryStepsInput.value, 0, 100000, 0),
    exerciseMinutes: clampNumber(entryExerciseInput.value, 0, 300, 0),
    weight: parseOptionalNumber(entryWeightInput.value),
    bodyFat: parseOptionalNumber(entryBodyFatInput.value),
    food: readFoodForm(dateKey),
  };

  saveState();
  render();
  setStatus(`Saved entry for ${formatDisplayDate(dateKey)}.`);
}

function addReward() {
  const name = rewardNameInput.value.trim();
  const unlockLevel = clampNumber(rewardLevelInput.value, 1, 100, 1);

  if (!name) {
    setStatus("Add a reward name first.");
    return;
  }

  state.rewards.push({
    id: createId(),
    name,
    unlockLevel,
    claimed: false,
  });

  rewardNameInput.value = "";
  rewardLevelInput.value = "2";
  saveState();
  render();
  setStatus(`Added reward "${name}".`);
}

function toggleRewardClaim(rewardId) {
  state.rewards = state.rewards.map((reward) =>
    reward.id === rewardId ? { ...reward, claimed: !reward.claimed } : reward
  );
  saveState();
  render();
}

function createId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `reward-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hydrateEntryForm(dateKey) {
  const entry = getEntry(dateKey);
  entryDateInput.value = dateKey;
  entryStepsInput.value = entry.steps || "";
  entryExerciseInput.value = entry.exerciseMinutes || "";
  entryWeightInput.value = entry.weight ?? "";
  entryBodyFatInput.value = entry.bodyFat ?? "";
}

function getEntry(dateKey) {
  return {
    date: dateKey,
    steps: 0,
    exerciseMinutes: 0,
    weight: null,
    bodyFat: null,
    food: createEmptyFoodEntry(),
    ...(state.entries[dateKey] || {}),
    food: {
      ...createEmptyFoodEntry(),
      ...((state.entries[dateKey] || {}).food || {}),
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

function readFoodForm(dateKey) {
  const entry = getEntry(dateKey);
  const food = { ...entry.food };
  for (const slot of mealSlots) {
    const selected = foodLog.querySelector(`input[name="food-${slot}"]:checked`);
    food[slot] = selected ? Number(selected.value) : 1;
  }
  return food;
}

function renderFoodLog() {
  const savedFood = getEntry(getSelectedDateKey()).food;
  const food = mealSlots.reduce((accumulator, slot) => {
    accumulator[slot] = savedFood[slot] ?? 1;
    return accumulator;
  }, {});

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

  syncFoodOptionClasses();

  for (const input of foodLog.querySelectorAll('input[type="radio"]')) {
    input.addEventListener("change", syncFoodOptionClasses);
  }
}

function render() {
  const summary = computeSummary();
  renderSummary(summary);
  renderScorecard(summary.today, summary);
  renderCharts(summary.timeline);
  renderRewards(summary);
  renderStory(summary);
  renderRecentDays(summary.timeline);
}

function computeSummary() {
  const timeline = Object.values(state.entries)
    .map((entry) => scoreDay(entry))
    .sort((a, b) => a.date.localeCompare(b.date));

  const totalXp = timeline.reduce((sum, day) => sum + day.totalScore + day.bonusXp, 0);
  const level = Math.max(1, Math.floor(totalXp / 250) + 1);
  const streak = calculateStreak(timeline);
  const bestStreak = calculateBestStreak(timeline);
  const goalStatus = getGoalStatus(timeline);
  const rewards = state.rewards.map((reward) => ({
    ...reward,
    unlocked: level >= reward.unlockLevel,
  }));

  return {
    timeline,
    totalXp,
    level,
    streak,
    bestStreak,
    today: scoreDay(getEntry(getSelectedDateKey())),
    goalStatus,
    rewards,
  };
}

function scoreDay(entry) {
  const food = { ...createEmptyFoodEntry(), ...(entry.food || {}) };
  const stepPoints = Math.round(Math.min(1, (entry.steps || 0) / state.settings.stepGoal) * 30);
  const exercisePoints = Math.round(Math.min(1, (entry.exerciseMinutes || 0) / state.settings.exerciseGoal) * 20);
  const foodPoints = mealSlots.reduce((sum, slot) => sum + (food[slot] ? foodOptions[food[slot]].points : 0), 0);
  const loggingPoints = (entry.weight != null ? 5 : 0) + (entry.bodyFat != null ? 5 : 0);
  const totalScore = stepPoints + exercisePoints + foodPoints + loggingPoints;
  const successDay = totalScore >= 70;
  const bonusXp = getGoalBonus(entry);

  return {
    ...entry,
    food,
    stepPoints,
    exercisePoints,
    foodPoints,
    loggingPoints,
    totalScore,
    successDay,
    bonusXp,
    quests: [
      { title: "Steps", points: stepPoints },
      { title: "Exercise", points: exercisePoints },
      { title: "Food Control", points: foodPoints },
      { title: "Body Metrics", points: loggingPoints },
    ],
  };
}

function syncFoodOptionClasses() {
  for (const option of foodLog.querySelectorAll(".food-option")) {
    const input = option.querySelector("input");
    option.classList.toggle("active", Boolean(input && input.checked));
  }
}

function getGoalBonus(entry) {
  let bonus = 0;
  if (entry.weight != null && entry.weight <= state.settings.weightGoal) {
    bonus += 50;
  }
  if (entry.bodyFat != null && entry.bodyFat <= state.settings.bodyFatGoal) {
    bonus += 50;
  }
  return bonus;
}

function getGoalStatus(timeline) {
  const latestWithWeight = [...timeline].reverse().find((day) => day.weight != null) || null;
  const latestWithBodyFat = [...timeline].reverse().find((day) => day.bodyFat != null) || null;

  return {
    weightReached: Boolean(latestWithWeight && latestWithWeight.weight <= state.settings.weightGoal),
    bodyFatReached: Boolean(latestWithBodyFat && latestWithBodyFat.bodyFat <= state.settings.bodyFatGoal),
    latestWeight: latestWithWeight?.weight ?? null,
    latestBodyFat: latestWithBodyFat?.bodyFat ?? null,
  };
}

function renderSummary(summary) {
  const avgScore = summary.timeline.length
    ? Math.round(summary.timeline.reduce((sum, day) => sum + day.totalScore, 0) / summary.timeline.length)
    : 0;

  summaryStats.innerHTML = [
    statCard(`Level ${summary.level}`, `${summary.totalXp.toLocaleString()} XP`, `${state.settings.displayName}'s total campaign experience`),
    statCard("Current Streak", `${summary.streak} day${summary.streak === 1 ? "" : "s"}`, `Best streak: ${summary.bestStreak}`),
    statCard("Today's Score", `${summary.today.totalScore} pts`, `${summary.today.bonusXp} bonus XP from goals`),
    statCard("Average Day", `${avgScore} pts`, `${summary.timeline.length} logged day${summary.timeline.length === 1 ? "" : "s"}`),
  ].join("");
}

function renderScorecard(day, summary) {
  const foodPattern = mealSlots
    .map((slot) => `${capitalize(slot)} ${day.food[slot] ?? "-"}`)
    .join(" | ");
  const goalLines = [
    summary.goalStatus.latestWeight != null
      ? `Weight: ${summary.goalStatus.latestWeight} / goal ${state.settings.weightGoal}`
      : `Weight goal: ${state.settings.weightGoal}`,
    summary.goalStatus.latestBodyFat != null
      ? `Body fat: ${summary.goalStatus.latestBodyFat}% / goal ${state.settings.bodyFatGoal}%`
      : `Body fat goal: ${state.settings.bodyFatGoal}%`,
  ];

  questList.innerHTML = `
    <article class="quest-card complete">
      <div class="quest-top">
        <div class="quest-title">${escapeHtml(formatDisplayDate(day.date))}</div>
        <div class="quest-meta">${day.totalScore} pts + ${day.bonusXp} bonus XP</div>
      </div>
      <div class="score-breakdown">
        ${day.quests.map((quest) => `
          <div class="score-row">
            <span>${escapeHtml(quest.title)}</span>
            <span>${quest.points} pts</span>
          </div>
        `).join("")}
      </div>
      <div class="food-summary-line">Food pattern: ${foodPattern}</div>
      <div class="goal-lines">${goalLines.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div>
    </article>
  `;
}

function renderCharts(timeline) {
  const weightDays = timeline.filter((day) => day.weight != null);
  const bodyFatDays = timeline.filter((day) => day.bodyFat != null);

  chartWrap.innerHTML = `
    ${renderLineChart("Weight", weightDays, "weight", state.settings.weightGoal)}
    ${renderLineChart("Body Fat %", bodyFatDays, "bodyFat", state.settings.bodyFatGoal)}
  `;
}

function renderLineChart(title, data, key, goal) {
  if (!data.length) {
    return `<div class="empty-state">${escapeHtml(title)} graph appears once you log at least one value.</div>`;
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
      <div class="chart-meta">Goal line: ${goal}</div>
    </div>
  `;
}

function renderRewards(summary) {
  if (!summary.rewards.length) {
    rewardList.innerHTML = `<div class="empty-state">Add rewards you can unlock at specific levels.</div>`;
    return;
  }

  rewardList.innerHTML = summary.rewards
    .map((reward) => `
      <article class="reward-card ${reward.unlocked ? "unlocked" : "locked"}">
        <div>
          <div class="reward-title">${escapeHtml(reward.name)}</div>
          <div class="reward-meta">Unlocks at level ${reward.unlockLevel}</div>
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
  const goalRewardText = [
    summary.goalStatus.weightReached ? "Weight goal reached: the caravan moves lighter." : "Weight goal still ahead: keep the march measured.",
    summary.goalStatus.bodyFatReached ? "Body-fat goal reached: your armor fits closer." : "Body-fat goal still ahead: tighten the pattern, not your emotions.",
  ];

  storyCard.innerHTML = `
    <div class="story-kicker">Chapter for level ${summary.level}</div>
    <h3>${escapeHtml(chapter.title)}</h3>
    <p>${escapeHtml(chapter.body)}</p>
    <p>The story is built around what I know so far: you like practical systems, straightforward tracking, and tools that make real life easier. We can later rewrite this around a setting you actually love.</p>
    <div class="goal-lines">${goalRewardText.map((line) => `<div>${escapeHtml(line)}</div>`).join("")}</div>
  `;
}

function renderRecentDays(timeline) {
  if (!timeline.length) {
    dayList.innerHTML = `<div class="empty-state">Save your first day to start the campaign log.</div>`;
    return;
  }

  dayList.innerHTML = [...timeline].reverse().slice(0, 12)
    .map((day) => `
      <article class="day-card">
        <div class="day-top">
          <div class="day-title">${escapeHtml(formatDisplayDate(day.date))}</div>
          <div class="day-meta">${day.totalScore} pts${day.bonusXp ? ` + ${day.bonusXp} bonus XP` : ""}</div>
        </div>
        <div class="metric-row">
          <span class="metric-pill">${day.steps || 0} steps</span>
          <span class="metric-pill">${day.exerciseMinutes || 0} min exercise</span>
          <span class="metric-pill">Food ${day.foodPoints}/40</span>
          <span class="metric-pill">${day.weight != null ? `${day.weight} lb` : "No weight"}</span>
          <span class="metric-pill">${day.bodyFat != null ? `${day.bodyFat}% fat` : "No body fat"}</span>
        </div>
      </article>
    `)
    .join("");
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

function calculateStreak(days) {
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

function getSelectedDateKey() {
  return entryDateInput.value || getTodayKey();
}

function getTodayKey() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 10);
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
