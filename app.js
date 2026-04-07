const APP_VERSION = "v4.8.4";
const STORAGE_KEY = "health-quest-v3";
const LEGACY_KEYS = ["health-quest-v2", "health-quest-v1"];
const FOOD_SCORING_UPDATE_DATE = "2026-04-06";
const mealSlots = ["morning", "lunch", "afternoon", "dinner", "other"];
const coreMealSlots = ["morning", "lunch", "afternoon", "dinner"];
const foodStructureItems = [
  {
    key: "breakfastControlled",
    label: "Breakfast Controlled",
    helper: "Protein-forward, controlled sugar, no oversized sweet breakfast.",
  },
  {
    key: "lunchAnchorMeal",
    label: "Lunch Anchor Meal",
    helper: "Protein + fiber + portion control. No routine dessert.",
  },
  {
    key: "afternoonSnackControlled",
    label: "Afternoon Snack Controlled",
    helper: "Intentional snack, protein-based or paired, no grazing.",
  },
  {
    key: "dinnerPortionControlled",
    label: "Dinner Portion Controlled",
    helper: "One plate, protein included, no seconds.",
  },
  {
    key: "noNightEating",
    label: "No Night Eating",
    helper: "No snacks after dinner cutoff.",
  },
];
const scoringWeights = {
  steps: 30,
  exercise: 25,
  food: {
    total: 30,
    core: 24,
    other: 4,
    completion: 2,
  },
  habits: {
    protein: 3,
    produce: 3,
    stoppedBeforeStuffed: 3,
    movement: 1,
  },
  bodyMetrics: {
    total: 5,
    weightLogged: 1,
    bodyFatLogged: 1,
    bothLoggedBonus: 1,
    trendBonus: 2,
  },
};
const dayThresholds = {
  win: 75,
  solid: 55,
};
const foodOptions = {
  0: {
    shortLabel: "N/A",
    label: "Ate nothing / N/A",
    description: "Meal not eaten, fasting, or not applicable.",
    quality: null,
    score: 0,
    bucket: "n/a",
  },
  1: {
    shortLabel: "On track",
    label: "On track",
    description: "Ate with control and intention. Food choices and portions were appropriate. No loss of control. Could include treats if handled reasonably.",
    quality: 1,
    score: 1,
    bucket: "in_control",
  },
  2: {
    shortLabel: "Slight drift",
    label: "Good, but a little off",
    description: "Either food quality or portions were somewhat off. Still in control overall. No real overeating.",
    quality: 0.84,
    score: 0.84,
    bucket: "in_control",
  },
  3: {
    shortLabel: "Warning",
    label: "Worse food or less control, but still mindful",
    description: "Noticeable slip. Ate more than needed or made weaker choices, but still somewhat aware. This is a warning-level score.",
    quality: 0.5,
    score: 0.5,
    bucket: "warning",
  },
  4: {
    shortLabel: "Overate",
    label: "Ate until full",
    description: "Clear overeating. Low control during at least part of the eating episode or day. Ate to fullness or beyond what was needed.",
    quality: 0.16,
    score: 0.16,
    bucket: "off_track",
  },
  5: {
    shortLabel: "Stuffed",
    label: "Stuffed myself",
    description: "Fully off track. Ate well past fullness. Strong loss of control. Physically uncomfortable or clearly overdid it.",
    quality: 0,
    score: 0,
    bucket: "off_track",
  },
};

const defaultSettings = {
  displayName: "Adventurer",
  mode: "full",
  stepGoal: 8000,
  exerciseGoal: 30,
  weightGoal: 185,
  bodyFatGoal: 20,
};
const defaultStrengthSettings = {
  enabled: true,
  daysPerWeek: 3,
  preferredDays: ["Mon", "Wed", "Fri"],
  defaultWorkoutDuration: 30,
  equipment: ["dumbbells", "bodyweight"],
  storyIntegration: true,
};
const defaultStrengthPlan = {
  version: 1,
  name: "Beginner Full Body",
  workouts: [
    {
      id: "full-body-a",
      name: "Strength Quest A",
      exercises: [
        {
          name: "Goblet Squat",
          sets: 3,
          reps: 8,
          repRange: [8, 10],
          helpSlug: "goblet-squat",
        },
        {
          name: "Dumbbell Bench Press",
          sets: 3,
          reps: 8,
          repRange: [8, 10],
          helpSlug: "dumbbell-bench-press",
          alternateHelpSlug: "incline-push-ups",
        },
        {
          name: "One-Arm Dumbbell Row",
          sets: 3,
          reps: 8,
          repRange: [8, 10],
          helpSlug: "one-arm-dumbbell-row",
        },
        {
          name: "Romanian Deadlift",
          sets: 3,
          reps: 8,
          repRange: [8, 10],
          helpSlug: "romanian-deadlift",
        },
        {
          name: "Plank",
          sets: 3,
          reps: "30 sec",
          repRange: [30, 45],
          optional: true,
          helpSlug: "plank",
          alternateHelpSlug: "dead-bug",
        },
      ],
    },
  ],
};

const campaignMeta = {
  title: "The Breakwater Station",
  subtitle: "A long campaign against drift, decay, and the easy surrender of good ground.",
  themeLine: "No dramatic rescue is coming. The work itself is the rescue.",
};

const storyChapters = [
  { level: 1, title: "Survey Mark", subtitle: "The first honest measurement", body: "The Station is not ruined, just weathered. The outer walls still stand, but the gauges are unreliable and old habits move like fog through the corridors. The first task is not repair. It is measurement. You place the first survey mark and decide, without drama, to stop guessing." },
  { level: 2, title: "The Sounding Line", subtitle: "Learning the depth beneath the surface", body: "At first the water looks calm enough. But calm water lies. You lower a sounding line and learn what is really there: hidden depth, buried drag, accumulated drift. Nothing glamorous happens. Still, the map gets better. That is how competent recoveries begin." },
  { level: 3, title: "Routine Watch", subtitle: "Small checks prevent large failures", body: "A station does not fail all at once. It softens by degrees. Bolts loosen. Doors stick. Crews stop noticing. So you begin the watch: routine checks, early corrections, no speeches. The place does not become impressive overnight. It becomes dependable." },
  { level: 4, title: "Cold-Weather Systems", subtitle: "Building habits that hold in bad conditions", body: "Any plan works when the weather is easy. The problem is never the easy day. The Station needs systems that hold in wind, distraction, celebration, fatigue, and long afternoons when no one feels particularly noble. You begin building for weather, not for mood." },
  { level: 5, title: "The Hidden Load", subtitle: "Not all weight is visible", body: "You discover that the Station has been carrying more than anyone admitted. Deferred maintenance. Old stress. Misleading comfort. Quiet overages that looked harmless because they were familiar. The fix is not punishment. It is redistribution: less waste, more support, better load paths." },
  { level: 6, title: "Breakwater Repairs", subtitle: "Strength is built at the edge", body: "The waves do their work at the boundary first. The breakwater takes the hit so the harbor can stay calm. You begin repairs there: the margins, the transitions, the hours that used to drift. What seemed minor turns out to be structural. Protect the edge and the whole harbor changes." },
  { level: 7, title: "False Summit", subtitle: "Early success is not the finish line", body: "The Station improves, and with improvement comes a familiar danger: the thought that the hard part is over. It is not. Early gains are real, but they are not yet permanent. This chapter teaches restraint in victory. Do not celebrate by reopening the leak." },
  { level: 8, title: "The Long Wall", subtitle: "Quiet competence where no one applauds", body: "This part of the campaign is less exciting and more important. You are not discovering the Station now. You are proving you can keep it. The long wall gets rebuilt stone by stone, and most days there is no audience for the work. That is fine. Enduring structures are not built for applause." },
  { level: 9, title: "The Archive Room", subtitle: "Patterns replace guesswork", body: "Old logs, old maps, old failures—once scattered—begin to make sense together. What felt random was not random. The Station has rhythms. Weak points. Conditions under which drift reappears. You are no longer reacting in the dark. You are learning the behavior of the whole system." },
  { level: 10, title: "Harbor Discipline", subtitle: "Order without rigidity", body: "A good harbor is not chaos and it is not prison. It has lanes, priorities, and enough flexibility to handle real weather. Your discipline begins to mature here. It is no longer fragile, no longer theatrical. You can accommodate a storm, a feast, a delayed day, and still keep the structure sound." },
  { level: 11, title: "The Inland Fleet", subtitle: "Momentum becomes infrastructure", body: "What once felt like effort now starts to feel like capacity. The Station can move more, recover faster, and hold shape under demand. You are not just repairing damage anymore. You are expanding capability. The harbor that once barely held is beginning to support traffic." },
  { level: 12, title: "Saboteur Weather", subtitle: "The old reflexes return disguised as reason", body: "Drift gets smarter when it starts losing. It no longer arrives as obvious collapse. It comes dressed as harmless exceptions, deserved rewards, efficient shortcuts, and the soft logic of ‘close enough.’ This chapter is not about fear. It is about recognition. The saboteur usually sounds reasonable." },
  { level: 13, title: "Deep Foundation", subtitle: "Building below the visible line", body: "The strongest work is often the least visible. Below the platform, below the wall, below the praise—there are anchors, piles, and buried systems holding everything upright. You are building that now: the kind of strength that remains even when motivation is absent and weather is unfriendly." },
  { level: 14, title: "Winter Harbor", subtitle: "Keeping the station alive in lean seasons", body: "Every serious campaign reaches a cold stretch. Progress slows. The water hardens. The work feels less rewarding. But winter does not mean failure. It means stewardship. This is where shallow systems quit and durable ones prove themselves. You keep the harbor open anyway." },
  { level: 15, title: "The Second Map", subtitle: "You are no longer working from the old assumptions", body: "At some point you realize the original map is obsolete. The routes, tolerances, and warnings that once defined the Station no longer fit the reality on the ground. You issue a second map: not a fantasy, not a reinvention—an updated truth built from earned evidence." },
  { level: 16, title: "The Lift Bridge", subtitle: "Strength that moves when needed", body: "Some structures fail because they are weak. Others fail because they are rigid. The Lift Bridge teaches another kind of strength: the ability to rise, adjust, and still return to alignment. Social meals, celebrations, travel, fatigue, and imperfect days are not breaches. They are load cases." },
  { level: 17, title: "Quiet Season, Strong Season", subtitle: "Less drama, more proof", body: "This is the chapter where the campaign stops looking dramatic from the outside. There are fewer visible victories, but more structural certainty. The walls do not need to announce themselves. The harbor does not need to shout. Quiet seasons often hold the strongest proof." },
  { level: 18, title: "The Unseen Current", subtitle: "Success creates its own risks", body: "When the Station becomes reliable, a new current appears beneath it: complacency. Not collapse. Not chaos. Just the subtle belief that because the structure is stronger, the standards can soften. This chapter reminds you that the current beneath a stable harbor can still move a ship off line." },
  { level: 19, title: "Signal Fires on the Shore", subtitle: "The station begins to guide others", body: "A restored harbor does more than protect itself. It becomes a signal point. Others notice the steadiness, the practical order, the lack of wasted motion. You do not need to preach. The signal travels because the structure is visible from a distance." },
  { level: 20, title: "Master of the Breakwater", subtitle: "Not finished-established", body: "There is no final cinematic victory here. No trumpet, no magical transformation, no permanent exemption from maintenance. Instead there is something better: establishment. The Breakwater Station now holds because you hold it. The campaign continues, but it is no longer fragile. The harbor is yours to keep." },
];

const bossFightLibrary = [
  { key: "false_summit", title: "Boss Fight: False Summit", body: "A good weigh-in can make a man careless. The threat today is not failure. It is the soft thought that the hard part is over. Hold the line. Early success is a checkpoint, not a pardon." },
  { key: "reward_creep", title: "Boss Fight: Reward Creep", body: "The danger is not one planned indulgence. The danger is the second one that quietly claims to belong with it. Watch the stacking instinct. One reward is a choice. A chain of them is drift in disguise." },
  { key: "quiet_rationalization", title: "Boss Fight: Quiet Rationalization", body: "Nothing dramatic is trying to beat you today. Just a calm internal voice offering small exceptions that add up. Be wary of arguments that sound reasonable mainly because they are familiar." },
  { key: "the_easy_extra", title: "Boss Fight: The Easy Extra", body: "You are not at war with hunger. You are watching for the unnecessary addition: the extra handful, the automatic side, the dessert that arrives because it is near. The easy extra has sunk more campaigns than open rebellion." },
  { key: "fog_of_close_enough", title: "Boss Fight: The Fog of 'Close Enough'", body: "Today's threat is blur. Logging less carefully. Estimating too generously. Letting the edges go soft because the general direction feels good. Fog does not wreck a harbor in one moment. It slowly makes navigation sloppy." },
  { key: "drift_after_victory", title: "Boss Fight: Drift After Victory", body: "A few strong days in a row can tempt you to loosen the bolts early. Don't. Stability is not declared; it is demonstrated repeatedly. Stay boring. Boring is how walls survive weather." },
  { key: "social_current", title: "Boss Fight: Social Current", body: "Meals with other people change the current. Portions drift. Attention scatters. Signals get noisy. Your task is not to refuse the occasion. It is to remain captain of your own plate while the harbor gets crowded." },
  { key: "underfuel_overreach", title: "Boss Fight: Underfuel Overreach", body: "Strong movement can create a trap: the belief that effort has earned neglect. Don't confuse activity with immunity. Fuel cleanly, stay honest, and avoid the rebound that follows underfed confidence." },
  { key: "maintenance_amnesia", title: "Boss Fight: Maintenance Amnesia", body: "When the system starts working, people forget what made it work. Today's threat is not appetite. It is forgetting the value of routine. The station does not stay strong because it once was repaired." },
];

const regionDefinitions = [
  {
    id: "unsteady-ground",
    name: "The Unsteady Ground",
    phase: "early",
    focus: "Awareness begins. The terrain is inconsistent, but the map is getting honest.",
    rewardTitle: "Surveyor",
  },
  {
    id: "stabilization-zone",
    name: "The Stabilization Zone",
    phase: "early",
    focus: "Daily structure starts holding. Fewer slips come from chaos alone.",
    rewardTitle: "Stabilizer",
  },
  {
    id: "consistency-ridge",
    name: "The Consistency Ridge",
    phase: "middle",
    focus: "Momentum is no longer accidental. Discipline is starting to feel familiar.",
    rewardTitle: "Pathfinder",
  },
  {
    id: "strength-plateau",
    name: "The Strength Plateau",
    phase: "middle",
    focus: "Training becomes part of the system. Capacity is being rebuilt on purpose.",
    rewardTitle: "Load-Bearer",
  },
  {
    id: "control-frontier",
    name: "The Control Frontier",
    phase: "late",
    focus: "Control holds in varied conditions. Pressure no longer means automatic drift.",
    rewardTitle: "Operator",
  },
  {
    id: "command-state",
    name: "The Command State",
    phase: "late",
    focus: "The system is internalized. Refinement matters more than rescue now.",
    rewardTitle: "Steady Hand",
  },
];

const regionThresholds = {
  stabilizationAvgFood10: 3.5,
  consistencyStreak: 7,
  consistencyDays14: 10,
  consistencyMinFoodScore: 4,
  strengthPlateauWorkouts14: 6,
  strengthPlateauAvgFood14: 4,
  controlFrontierMinDays21: 10,
  controlFrontierWeekendAvg: 3.8,
  controlFrontierWeekendGap: 0.6,
  commandStateMinDays30: 24,
  commandStateStrongFoodDays30: 24,
  commandStateWorkouts30: 10,
};

const miniQuestTemplates = [
  {
    id: "hold-the-line",
    title: "Hold the Line",
    description: "Maintain structure through the evening and avoid post-dinner drift.",
    type: "weekend",
    duration: "1 day",
    xpReward: 50,
  },
  {
    id: "steady-saturday",
    title: "Steady Saturday",
    description: "Keep the weekend from feeling like open terrain. Hold structure all day.",
    type: "weekend",
    duration: "1 day",
    xpReward: 60,
  },
  {
    id: "stop-at-enough",
    title: "Stop at Enough",
    description: "Finish dinner under control and keep the line closed afterward.",
    type: "portion",
    duration: "1 day",
    xpReward: 40,
  },
  {
    id: "single-plate-rule",
    title: "Single Plate Rule",
    description: "Dinner stays to one plate. No seconds, no drift-by-default.",
    type: "portion",
    duration: "1 day",
    xpReward: 35,
  },
  {
    id: "clean-afternoon",
    title: "Clean Afternoon",
    description: "Make the afternoon snack deliberate instead of reactive.",
    type: "snack",
    duration: "1 day",
    xpReward: 35,
  },
  {
    id: "planned-fuel-only",
    title: "Planned Fuel Only",
    description: "Only planned snacks count today. No random grazing.",
    type: "snack",
    duration: "1 day",
    xpReward: 45,
  },
  {
    id: "protein-anchor",
    title: "Protein Anchor",
    description: "Use breakfast, lunch, and dinner to reinforce protein and structure.",
    type: "protein",
    duration: "1 day",
    xpReward: 60,
  },
  {
    id: "lift-and-fuel",
    title: "Lift + Fuel",
    description: "Complete the workout and support it with structured meals.",
    type: "strength",
    duration: "1 day",
    xpReward: 75,
  },
  {
    id: "three-day-chain",
    title: "Three-Day Chain",
    description: "Stack three straight days of strong food structure.",
    type: "consistency",
    duration: "3 days",
    xpReward: 125,
  },
  {
    id: "no-drift-day",
    title: "No Drift Day",
    description: "A fully structured day. Tight inputs, no late leak.",
    type: "consistency",
    duration: "1 day",
    xpReward: 80,
  },
];

const levelRewardTitles = [
  "Survey Marker",
  "Bearing Keeper",
  "Line Holder",
  "Section Chief",
  "Quiet Builder",
  "Load-Bearer",
  "Systems Captain",
  "Breakwater Steward",
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
const exportFoodCsvButton = document.getElementById("export-food-csv");
const exportBodyCsvButton = document.getElementById("export-body-csv");
const exportStrengthCsvButton = document.getElementById("export-strength-csv");
const exportSummaryCsvButton = document.getElementById("export-summary-csv");
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
const exerciseHelpSheet = document.getElementById("exercise-help-sheet");
const exerciseHelpContent = document.getElementById("exercise-help-content");
const exerciseHelpTitle = document.getElementById("exercise-help-title");
const closeExerciseHelpButton = document.getElementById("close-exercise-help");
const tabButtons = Array.from(document.querySelectorAll(".tab-button"));
const viewSections = Array.from(document.querySelectorAll("[data-view]"));
const summaryStats = document.getElementById("summary-stats");
const signalsList = document.getElementById("signals-list");
const guardrailList = document.getElementById("guardrail-list");
const chartWrap = document.getElementById("chart-wrap");
const strengthCard = document.getElementById("strength-card");
const scorecardCard = document.getElementById("scorecard-card");
const progressCard = document.getElementById("progress-card");
const rewardList = document.getElementById("reward-list");
const storyCard = document.getElementById("story-card");
const dayList = document.getElementById("day-list");
const lastExportStatus = document.getElementById("last-export-status");
const appVersion = document.getElementById("app-version");
const footerVersion = document.getElementById("footer-version");
const logPanel = document.querySelector(".log-panel");
const strengthPanel = document.querySelector(".strength-panel");
const scorecardPanel = document.querySelector(".scorecard-panel");
const progressPanel = document.querySelector(".progress-panel");
const rewardsPanel = document.querySelector(".rewards-panel");
const storyPanel = document.querySelector(".story-panel");
const activityPanel = document.querySelector(".activity-panel");

initialize();

function initialize() {
  if (appVersion) {
    appVersion.textContent = APP_VERSION;
  }
  if (footerVersion) {
    footerVersion.textContent = `Version ${APP_VERSION}`;
  }
  hydrateSettingsForm();
  entryDateInput.value = getTodayKey();
  hydrateEntryForm(getSelectedDateKey());
  renderFoodLog();

  if (saveProfileButton) {
    saveProfileButton.addEventListener("click", saveProfile);
  }
  if (modeToggle) {
    modeToggle.addEventListener("change", handleModeChange);
  }
  if (entryDateInput) {
    entryDateInput.addEventListener("change", handleDateChange);
  }
  if (saveEntryButton) {
    saveEntryButton.addEventListener("click", saveDailyEntry);
  }
  if (addRewardButton) {
    addRewardButton.addEventListener("click", addReward);
  }
  if (rewardTypeInput) {
    rewardTypeInput.addEventListener("change", renderRewardValueVisibility);
  }
  if (exportJsonButton) {
    exportJsonButton.addEventListener("click", exportJson);
  }
  if (exportFoodCsvButton) {
    exportFoodCsvButton.addEventListener("click", () => exportCsv("food"));
  }
  if (exportBodyCsvButton) {
    exportBodyCsvButton.addEventListener("click", () => exportCsv("body"));
  }
  if (exportStrengthCsvButton) {
    exportStrengthCsvButton.addEventListener("click", () => exportCsv("strength"));
  }
  if (exportSummaryCsvButton) {
    exportSummaryCsvButton.addEventListener("click", () => exportCsv("summary"));
  }
  if (importJsonInput) {
    importJsonInput.addEventListener("change", importJson);
  }
  if (refreshAppButton) {
    refreshAppButton.addEventListener("click", forceRefreshApp);
  }
  if (closeExerciseHelpButton) {
    closeExerciseHelpButton.addEventListener("click", closeExerciseHelp);
  }
  if (exerciseHelpSheet) {
    exerciseHelpSheet.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.dataset.helpClose === "true") {
        closeExerciseHelp();
      }
    });
  }
  for (const button of tabButtons) {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  }

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
  if (!updateBanner || !updateBannerText) {
    return;
  }
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
  // Compare every known key and keep the richest usable state instead of
  // blindly trusting the newest key. This helps recover from builds that may
  // have written a nearly-empty current state while older local keys still
  // contain the real history.
  const candidates = [];
  for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }
      const parsed = unwrapImportedState(JSON.parse(raw));
      const migrated = migrateState(parsed, key);
      candidates.push({ key, state: migrated, richness: getStateRichness(migrated) });
    } catch (error) {
      continue;
    }
  }

  if (!candidates.length) {
    return createEmptyState();
  }

  candidates.sort((a, b) => b.richness - a.richness);
  const best = candidates[0];

  if (best.key !== STORAGE_KEY && best.richness > 0) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(best.state));
    } catch (error) {
      // Keep the recovered state in memory even if persistence temporarily fails.
    }
  }

  return best.state;
}

function createEmptyState() {
  return {
    version: 7,
    settings: { ...defaultSettings },
    strengthSettings: { ...defaultStrengthSettings },
    strengthPlan: JSON.parse(JSON.stringify(defaultStrengthPlan)),
    strengthHistory: [],
    entries: {},
    rewards: [],
    meta: {
      lastExportAt: null,
      lowestAvgWeightRewarded: null,
      bestSevenDayAvgWeight: null,
      lastUnlockedSevenDayAvgWeight: null,
      lastClaimedSevenDayAvgWeight: null,
      currentStrengthSession: null,
      activeTab: "today",
      storyArchiveMode: "summary",
      currentRegionId: "unsteady-ground",
      unlockedRegionIds: ["unsteady-ground"],
      storyArchive: [],
      storyRewards: [],
      questCompletions: [],
    },
  };
}

function getStateRichness(candidateState) {
  const entryCount = Object.keys(candidateState?.entries || {}).length;
  const strengthCount = Array.isArray(candidateState?.strengthHistory) ? candidateState.strengthHistory.length : 0;
  const rewardCount = Array.isArray(candidateState?.rewards) ? candidateState.rewards.length : 0;
  const archiveCount = Array.isArray(candidateState?.meta?.storyArchive) ? candidateState.meta.storyArchive.length : 0;
  const settingsWeight = candidateState?.settings ? 1 : 0;
  return (entryCount * 100) + (strengthCount * 20) + (rewardCount * 5) + archiveCount + settingsWeight;
}

function unwrapImportedState(parsed) {
  if (!parsed || typeof parsed !== "object") {
    return parsed;
  }
  if (parsed.entries || parsed.summary || parsed.foodLogs || parsed.strengthHistory) {
    return parsed;
  }
  return parsed.state || parsed.healthQuest || parsed.data || parsed.payload || parsed;
}

function getStateInventory(candidateState) {
  return {
    entries: Object.keys(candidateState?.entries || {}).length,
    strengthSessions: Array.isArray(candidateState?.strengthHistory) ? candidateState.strengthHistory.length : 0,
    rewards: Array.isArray(candidateState?.rewards) ? candidateState.rewards.length : 0,
    storyEvents: Array.isArray(candidateState?.meta?.storyArchive) ? candidateState.meta.storyArchive.length : 0,
  };
}

function migrateState(parsed, sourceKey) {
  const base = createEmptyState();
  const settings = {
    ...base.settings,
    ...(parsed.settings || {}),
  };
  const strengthSettings = {
    ...base.strengthSettings,
    ...(parsed.strengthSettings || {}),
  };
  const strengthPlan = parsed.strengthPlan?.workouts?.length
    ? parsed.strengthPlan
    : JSON.parse(JSON.stringify(defaultStrengthPlan));

  if (!settings.mode) {
    settings.mode = "full";
  }

  // Older builds stored different shapes. Reconstruct per-day entries when possible
  // so existing local data remains usable after upgrading the app.
  const legacyEntries = parsed.entries || buildLegacyEntries(parsed);
  const entries = {};
  const sourceVersion = Number(parsed.version || 0);
  for (const [dateKey, rawEntry] of Object.entries(legacyEntries || {})) {
    try {
      entries[dateKey] = migrateEntry(dateKey, rawEntry, sourceVersion);
    } catch (error) {
      continue;
    }
  }

  const rewards = Array.isArray(parsed.rewards)
    ? parsed.rewards.map((reward) => {
      try {
        return migrateReward(reward);
      } catch (error) {
        return null;
      }
    }).filter(Boolean)
    : [];

  const meta = {
    lastExportAt: parsed.meta?.lastExportAt || parsed.lastExportAt || null,
    lowestAvgWeightRewarded: parsed.meta?.lowestAvgWeightRewarded ?? null,
    bestSevenDayAvgWeight: parsed.meta?.bestSevenDayAvgWeight ?? parsed.meta?.lowestAvgWeightRewarded ?? null,
    lastUnlockedSevenDayAvgWeight: parsed.meta?.lastUnlockedSevenDayAvgWeight ?? parsed.meta?.lowestAvgWeightRewarded ?? null,
    lastClaimedSevenDayAvgWeight: parsed.meta?.lastClaimedSevenDayAvgWeight ?? null,
    currentStrengthSession: migrateStrengthSession(parsed.meta?.currentStrengthSession, strengthPlan),
    activeTab: parsed.meta?.activeTab || "today",
    storyArchiveMode: parsed.meta?.storyArchiveMode || "summary",
    currentRegionId: parsed.meta?.currentRegionId || "unsteady-ground",
    unlockedRegionIds: Array.isArray(parsed.meta?.unlockedRegionIds) && parsed.meta.unlockedRegionIds.length
      ? parsed.meta.unlockedRegionIds
      : ["unsteady-ground"],
    storyArchive: Array.isArray(parsed.meta?.storyArchive) ? parsed.meta.storyArchive : [],
    storyRewards: Array.isArray(parsed.meta?.storyRewards) ? parsed.meta.storyRewards : [],
    questCompletions: Array.isArray(parsed.meta?.questCompletions) ? parsed.meta.questCompletions : [],
  };

  const migrated = {
    version: 7,
    settings,
    strengthSettings,
    strengthPlan,
    strengthHistory: Array.isArray(parsed.strengthHistory)
      ? parsed.strengthHistory.map((session) => {
        try {
          return migrateStrengthSession(session, strengthPlan);
        } catch (error) {
          return null;
        }
      }).filter(Boolean)
      : [],
    entries,
    rewards,
    meta,
  };

  if (sourceKey !== STORAGE_KEY) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    } catch (error) {
      // Keep the migrated state in memory even if persistence temporarily fails.
    }
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
  const migratedFoodStructure = createEmptyFoodStructure();
  for (const item of foodStructureItems) {
    migratedFoodStructure[item.key] = Boolean(rawEntry?.foodStructure?.[item.key]);
  }
  const hasStructuredFood = Boolean(rawEntry?.foodModel === "structure-v1" || rawEntry?.foodStructure);

  return {
    date: dateKey,
    mode: rawEntry?.mode || "full",
    steps: Number(rawEntry?.steps) || 0,
    exerciseMinutes: Number(rawEntry?.exerciseMinutes) || 0,
      weight: rawEntry?.weight == null ? null : Number(rawEntry.weight),
      bodyFat: rawEntry?.bodyFat == null ? null : Number(rawEntry.bodyFat),
      notes: typeof rawEntry?.notes === "string" ? rawEntry.notes.slice(0, 120) : "",
      foodNote: typeof rawEntry?.foodNote === "string" ? rawEntry.foodNote.slice(0, 120) : "",
      foodStructureNote: typeof rawEntry?.foodStructureNote === "string" ? rawEntry.foodStructureNote.slice(0, 120) : "",
      foodModel: hasStructuredFood ? "structure-v1" : "legacy",
      food: migratedFood,
      foodStructure: migratedFoodStructure,
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

function migrateStrengthSession(session, strengthPlan = defaultStrengthPlan) {
  if (!session) {
    return null;
  }

  const workout = strengthPlan.workouts.find((item) => item.id === session.workoutId) || strengthPlan.workouts[0];
  const exerciseMap = new Map((session.exercises || []).map((exercise) => [exercise.name, exercise]));
  const exerciseAliases = {
    "Dumbbell Bench Press": "Dumbbell Bench Press / Incline Push-Ups",
    "Plank": "Plank / Dead Bug",
  };

  return {
    id: session.id || createId(),
    date: session.date || getTodayKey(),
    workoutId: session.workoutId || workout.id,
    workoutName: session.workoutName || workout.name,
    completed: Boolean(session.completed),
    durationMinutes: Number(session.durationMinutes) || defaultStrengthSettings.defaultWorkoutDuration,
    workoutScore: session.workoutScore == null ? null : Number(session.workoutScore),
    workoutScoreOverride: session.workoutScoreOverride == null ? null : Number(session.workoutScoreOverride),
    note: typeof session.note === "string" ? session.note.slice(0, 160) : "",
    exercises: workout.exercises.map((exercise) => {
      const prior = exerciseMap.get(exercise.name) || exerciseMap.get(exerciseAliases[exercise.name]) || {};
      return {
        name: exercise.name,
        helpSlug: exercise.helpSlug || prior.helpSlug || slugifyExerciseName(exercise.name),
        alternateHelpSlug: exercise.alternateHelpSlug || prior.alternateHelpSlug || null,
        targetSets: Number(prior.targetSets || exercise.sets) || exercise.sets,
        targetReps: prior.targetReps ?? exercise.reps,
        actualSets: Array.isArray(prior.actualSets) ? prior.actualSets.map((set, index) => ({
          set: index + 1,
          weight: set.weight ?? "",
          reps: set.reps ?? "",
          completed: Boolean(set.completed),
        })) : Array.from({ length: exercise.sets }, (_, index) => ({
          set: index + 1,
          weight: "",
          reps: "",
          completed: false,
        })),
        completed: Boolean(prior.completed),
        progressed: Boolean(prior.progressed),
        pr: Boolean(prior.pr),
        increaseNextTime: Boolean(prior.increaseNextTime),
        note: typeof prior.note === "string" ? prior.note.slice(0, 120) : "",
      };
    }),
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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    return false;
  }
}

function hydrateSettingsForm() {
  if (displayNameInput) {
    displayNameInput.value = state.settings.displayName;
  }
  if (modeToggle) {
    modeToggle.value = state.settings.mode;
  }
  if (stepGoalInput) {
    stepGoalInput.value = state.settings.stepGoal;
  }
  if (exerciseGoalInput) {
    exerciseGoalInput.value = state.settings.exerciseGoal;
  }
  if (weightGoalInput) {
    weightGoalInput.value = state.settings.weightGoal;
  }
  if (bodyFatGoalInput) {
    bodyFatGoalInput.value = state.settings.bodyFatGoal;
  }
  if (lastExportStatus) {
    lastExportStatus.textContent = formatRelativeExport(state.meta?.lastExportAt);
  }
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

function setActiveTab(tab) {
  state.meta.activeTab = tab;
  renderTabState();
  saveState();
}

function renderTabState() {
  const activeTab = state.meta.activeTab || "today";
  for (const button of tabButtons) {
    button.classList.toggle("active", button.dataset.tab === activeTab);
  }
  for (const section of viewSections) {
    const allowedViews = section.dataset.view.split(" ");
    const shouldShowForTab = allowedViews.includes(activeTab);
    const maintenanceBlocked = state.settings.mode === "maintenance" && (
      section === logPanel ||
      section === rewardsPanel ||
      section === storyPanel ||
      section === activityPanel
    );
    const strengthBlocked = section === strengthPanel && !state.strengthSettings.enabled;
    section.classList.toggle("is-hidden", !shouldShowForTab || maintenanceBlocked || strengthBlocked);
  }
}

function openStoryArchive(mode = "summary") {
  state.meta.storyArchiveMode = mode;
  state.meta.activeTab = "progress";
  render();
  saveState();
  requestAnimationFrame(() => {
    storyPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
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
      foodNote: "",
      foodStructureNote: "",
      foodModel: dateKey >= FOOD_SCORING_UPDATE_DATE ? "structure-v1" : "legacy",
      food: createEmptyFoodEntry(),
      foodStructure: createEmptyFoodStructure(),
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
    foodStructure: {
      ...createEmptyFoodStructure(),
      ...((state.entries[dateKey] || {}).foodStructure || {}),
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

function createEmptyFoodStructure() {
  return {
    breakfastControlled: false,
    lunchAnchorMeal: false,
    afternoonSnackControlled: false,
    dinnerPortionControlled: false,
    noNightEating: false,
  };
}

function isStructuredFoodEntry(entry) {
  return (entry?.foodModel || "") === "structure-v1";
}

function getDateDiffFromToday(dateKey) {
  const today = new Date(`${getTodayKey()}T12:00:00`);
  const target = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(today.getTime()) || Number.isNaN(target.getTime())) {
    return null;
  }
  return Math.round((today.getTime() - target.getTime()) / 86400000);
}

function shouldUseStructuredFoodUI(entry) {
  if (!entry) {
    return false;
  }
  const recentEditablePastDay = (() => {
    const diff = getDateDiffFromToday(entry.date);
    return diff != null && diff >= 0 && diff <= 1;
  })();
  return isStructuredFoodEntry(entry) || entry.date >= FOOD_SCORING_UPDATE_DATE || recentEditablePastDay;
}

function saveDailyEntry() {
  const dateKey = getSelectedDateKey();
  const existing = getEntry(dateKey);
  const foodModel = shouldUseStructuredFoodUI(existing) || dateKey >= FOOD_SCORING_UPDATE_DATE
    ? "structure-v1"
    : (existing.foodModel || "legacy");
  state.entries[dateKey] = {
    date: dateKey,
    mode: state.settings.mode,
    steps: clampNumber(entryStepsInput.value, 0, 100000, 0),
    exerciseMinutes: clampNumber(entryExerciseInput.value, 0, 300, 0),
      weight: parseOptionalNumber(entryWeightInput.value),
      bodyFat: parseOptionalNumber(entryBodyFatInput.value),
      notes: (entryNotesInput.value || "").trim().slice(0, 120),
      foodNote: foodModel === "legacy"
        ? (document.getElementById("today-food-note")?.value || existing.foodNote || "").trim().slice(0, 120)
        : existing.foodNote || "",
      foodStructureNote: foodModel === "structure-v1"
        ? (document.getElementById("today-food-structure-note")?.value || document.getElementById("food-structure-note")?.value || existing.foodStructureNote || "").trim().slice(0, 120)
        : existing.foodStructureNote || "",
      foodModel,
      food: foodModel === "legacy" ? readFoodForm(existing.food) : existing.food,
      foodStructure: foodModel === "structure-v1" ? readFoodStructureForm(existing.foodStructure) : existing.foodStructure,
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

function readFoodStructureForm(fallbackStructure = createEmptyFoodStructure()) {
  const structure = { ...createEmptyFoodStructure(), ...fallbackStructure };
  for (const item of foodStructureItems) {
    const source =
      document.getElementById(`today-food-structure-${item.key}`) ||
      document.getElementById(`food-structure-${item.key}`);
    if (source) {
      structure[item.key] = Boolean(source.checked);
    }
  }
  return structure;
}

function readFoodForm(fallbackFood = createEmptyFoodEntry()) {
  const food = { ...createEmptyFoodEntry(), ...fallbackFood };
  for (const slot of mealSlots) {
    const selected =
      document.querySelector(`#today-card input[name="today-food-${slot}"]:checked`) ||
      foodLog.querySelector(`input[name="food-${slot}"]:checked`);
    if (selected) {
      food[slot] = normalizeFoodValue(selected.value);
    }
  }
  return food;
}

function renderFoodLog() {
  foodLog.innerHTML = Object.entries(foodOptions)
    .map(([value, option]) => `
      <article class="food-row legend-row">
        <div class="food-label">${value}</div>
        <div class="food-legend-copy"><strong>${escapeHtml(option.shortLabel)}</strong> — ${escapeHtml(option.description)}</div>
      </article>
    `)
    .join("");
}

function syncFoodOptionClasses() {
  for (const option of foodLog.querySelectorAll(".food-option")) {
    const input = option.querySelector("input");
    option.classList.toggle("active", Boolean(input && input.checked));
  }
}

function getFoodStructureScore(foodStructure = createEmptyFoodStructure()) {
  return foodStructureItems.reduce((sum, item) => sum + (foodStructure[item.key] ? 1 : 0), 0);
}

function getFoodStructureCoaching(score) {
  if (score >= 5) {
    return "Strong food day. Keep stacking these.";
  }
  if (score >= 4) {
    return "Solid day. One small improvement available.";
  }
  if (score >= 3) {
    return "Acceptable, but there's room to tighten structure.";
  }
  return "Today drifted. Focus on the next meal, not perfection.";
}

function getFoodStructureRating(score) {
  if (score >= 5) {
    return "excellent day";
  }
  if (score >= 4) {
    return "strong day";
  }
  if (score >= 3) {
    return "acceptable day";
  }
  return "off-track day";
}

function getLegacyFoodAverage(day) {
  const values = (day.answeredMeals || [])
    .map((slot) => day.food?.[slot])
    .filter((value) => value != null);
  return values.length ? average(values) : null;
}

function getUnifiedFoodMetric(day) {
  if (day.foodModel === "structure-v1") {
    return day.foodStructureScore ?? getFoodStructureScore(day.foodStructure);
  }
  return getLegacyFoodAverage(day);
}

function renderFoodLog() {
  const entry = getEntry(getSelectedDateKey());
  if (shouldUseStructuredFoodUI(entry)) {
    const preview = scoreFood(entry);
    foodLog.innerHTML = `
      <div class="food-structure-grid">
        ${foodStructureItems.map((item) => `
          <label class="food-structure-item">
            <input id="food-structure-${item.key}" type="checkbox" ${entry.foodStructure[item.key] ? "checked" : ""}>
            <span class="food-structure-copy">
              <strong>${escapeHtml(item.label)}</strong>
              <small>${escapeHtml(item.helper)}</small>
            </span>
          </label>
        `).join("")}
      </div>
      <div class="food-structure-summary">
        <div class="food-structure-score">Food Structure Score: ${preview.foodStructureScore}/5</div>
        <div class="food-structure-coaching">${escapeHtml(preview.foodCoachingCopy)}</div>
        <div class="food-structure-hint">Consistent food structure + lifting is the main win.</div>
        <label class="quick-field quick-notes">
          <span>Food structure note</span>
          <input id="food-structure-note" type="text" maxlength="120" value="${escapeHtml(entry.foodStructureNote || "")}" placeholder="What helped, or what pushed food off track?">
        </label>
      </div>
    `;
    for (const input of foodLog.querySelectorAll('input[id^="food-structure-"]')) {
      input.addEventListener("change", () => render());
    }
    const noteInput = document.getElementById("food-structure-note");
    if (noteInput) {
      noteInput.addEventListener("input", () => {
        const todayNote = document.getElementById("today-food-structure-note");
        if (todayNote) {
          todayNote.value = noteInput.value;
        }
      });
    }
    return;
  }

  foodLog.innerHTML = Object.entries(foodOptions)
    .map(([value, option]) => `
      <article class="food-row legend-row">
        <div class="food-label">${value}</div>
        <div class="food-legend-copy"><strong>${escapeHtml(option.shortLabel)}</strong> - ${escapeHtml(option.description)}</div>
      </article>
    `)
    .join("");
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
  state.rewards = state.rewards.map((reward) => {
    if (reward.id !== rewardId) {
      return reward;
    }

    const nextClaimed = !reward.claimed;
    if (reward.criteriaType === "lowest_avg_weight" && nextClaimed) {
      state.meta.lastClaimedSevenDayAvgWeight = state.meta.lastUnlockedSevenDayAvgWeight ?? state.meta.lastClaimedSevenDayAvgWeight;
    }

    return { ...reward, claimed: nextClaimed };
  });
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
    const parsed = unwrapImportedState(JSON.parse(text));
    state = migrateState(parsed, "import");
    saveState();
    hydrateSettingsForm();
    hydrateEntryForm(getSelectedDateKey());
    renderFoodLog();
    renderRewardValueVisibility();
    render();
    const inventory = getStateInventory(state);
    setStatus(`Imported ${inventory.entries} entries, ${inventory.strengthSessions} workouts, ${inventory.rewards} rewards, and ${inventory.storyEvents} story events from ${file.name}.`);
  } catch (error) {
    setStatus("Import failed. Please choose a valid Health Quest JSON export.");
  } finally {
    importJsonInput.value = "";
  }
}

function render() {
  let summary;
  try {
    summary = computeSummary();
  } catch (error) {
    console.error("Health Quest summary computation failed", error);
    setStatus("The app hit a loading problem while computing your dashboard. Refresh once; if it persists, export JSON before changing anything.");
    return;
  }

  renderSection("today", todayCard, () => renderTodayCard(summary));
  renderSection("strength", strengthCard, () => renderStrengthCard(summary));
  renderSection("weekly-summary", summaryStats, () => renderWeeklySummary(summary));
  if (signalsList && guardrailList) {
    renderSection("signals", signalsList, () => renderSignals(summary));
  }
  renderSection("scorecard", scorecardCard, () => renderScorecard(summary));
  renderSection("progress", progressCard, () => renderProgress(summary));
  renderSection("charts", chartWrap, () => renderCharts(summary));
  renderSection("rewards", rewardList, () => renderRewards(summary));
  renderSection("story", storyCard, () => renderStory(summary));
  renderSection("recent-days", dayList, () => renderRecentDays(summary.timelineLogged));
  if (lastExportStatus) {
    lastExportStatus.textContent = formatRelativeExport(state.meta?.lastExportAt);
  }
  document.body.classList.toggle("maintenance-mode", state.settings.mode === "maintenance");
  if (foodSection) {
    foodSection.classList.toggle("is-hidden", state.settings.mode === "maintenance");
  }
  renderTabState();
}

function computeSummary() {
  const orderedEntries = Object.values(state.entries)
    .map((entry) => migrateEntry(entry.date, entry))
    .sort((a, b) => a.date.localeCompare(b.date));
  const loggedEntries = orderedEntries.map((entry, index) => scoreDay(entry, { priorEntries: orderedEntries.slice(0, index) }));

  const timelineFilled = buildFilledTimeline(loggedEntries);
  const totalXp = loggedEntries.reduce((sum, day) => sum + day.totalScore + day.bonusXp, 0);
  const level = getLevelFromXp(totalXp);
  const nextLevel = level + 1;
  const nextLevelXp = getXpForLevel(nextLevel);
  const xpToNext = getXpToNextLevel(totalXp);
  const regularStreak = calculateStreak(timelineFilled, (day) => day.totalScore >= 55);
  const eliteStreak = calculateStreak(timelineFilled, (day) => day.totalScore >= dayThresholds.win);
  const bestRegularStreak = calculateBestStreak(timelineFilled, (day) => day.totalScore >= 55);
  const bestEliteStreak = calculateBestStreak(timelineFilled, (day) => day.totalScore >= dayThresholds.win);
  const weekly = computeWeeklyMetrics(loggedEntries);
  syncRewardMilestones(weekly);
  const strengthSession = getStrengthSessionForDate(getSelectedDateKey());
  const strengthStatus = getStrengthStatus(getSelectedDateKey());
  const strengthSummary = {
    session: strengthSession,
    status: strengthStatus,
    nextDay: getNextStrengthDay(getSelectedDateKey()),
    progress: getStrengthProgressSummary(),
  };
  const region = computeRegionState(loggedEntries, strengthSummary);
  const rewards = state.rewards.map((reward) => ({
    ...reward,
    unlocked: isRewardUnlocked(reward, { level, regularStreak, loggedEntries, weekly }),
  }));
  const summary = {
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
    today: scoreDay(getDraftEntry(), {
      priorEntries: orderedEntries.filter((entry) => entry.date < getSelectedDateKey()),
    }),
    weekly,
    rewards,
    region,
    currentChapter: getCurrentChapter(level),
    bossFight: getBossFight({ loggedEntries, weekly, regularStreak, eliteStreak }),
    strength: strengthSummary,
    signals: buildSignals(loggedEntries, weekly, strengthSummary),
    scorecard: buildWeeklyScorecard(loggedEntries, weekly, strengthSummary),
    progress: buildProgressSummary(loggedEntries, weekly, strengthSummary),
  };
  const narrativeChanged = syncNarrativeProgress(summary);
  if (narrativeChanged) {
    saveState();
  }
  summary.storyRewards = state.meta.storyRewards || [];
  summary.storyArchive = state.meta.storyArchive || [];
  summary.dailyDispatch = buildDailyDispatch(summary);
  summary.storySummary = buildStorySummary(summary);
  return summary;
}

function getCurrentChapter(level) {
  return [...storyChapters].reverse().find((chapter) => level >= chapter.level) || storyChapters[0];
}

function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getRegionById(regionId) {
  return regionDefinitions.find((region) => region.id === regionId) || regionDefinitions[0];
}

function getRecentFoodScores(entries, limit = 14) {
  return entries
    .filter((day) => day.mode === "full")
    .slice(-limit)
    .map((day) => getUnifiedFoodMetric(day))
    .filter((value) => value != null);
}

function getFoodSuccessStreak(entries, threshold = 4) {
  let streak = 0;
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const day = entries[index];
    if (day.mode !== "full") {
      continue;
    }
    const metric = getUnifiedFoodMetric(day);
    if (metric == null || metric < threshold) {
      break;
    }
    streak += 1;
  }
  return streak;
}

function computeRegionState(loggedEntries, strengthSummary) {
  const recent10Food = getRecentFoodScores(loggedEntries, 10);
  const recent14FoodEntries = loggedEntries.slice(-14).filter((day) => day.mode === "full");
  const recent14FoodScores = recent14FoodEntries.map((day) => getUnifiedFoodMetric(day)).filter((value) => value != null);
  const recent21 = loggedEntries.slice(-21).filter((day) => day.mode === "full");
  const weekends = recent21.filter((day) => {
    const weekday = new Date(`${day.date}T12:00:00`).getDay();
    return weekday === 0 || weekday === 6;
  });
  const weekdays = recent21.filter((day) => {
    const weekday = new Date(`${day.date}T12:00:00`).getDay();
    return weekday >= 1 && weekday <= 5;
  });
  const last30 = loggedEntries.slice(-30);
  const last30FoodStrong = last30.filter((day) => day.mode === "full" && (getUnifiedFoodMetric(day) ?? 0) >= 4).length;
  const workouts14 = getCompletedStrengthWorkoutsInWindow(14).length;
  const workouts30 = getCompletedStrengthWorkoutsInWindow(30).length;
  const avg10Food = average(recent10Food);
  const avg14Food = average(recent14FoodScores);
  const weekendAvg = average(weekends.map((day) => getUnifiedFoodMetric(day)).filter((value) => value != null));
  const weekdayAvg = average(weekdays.map((day) => getUnifiedFoodMetric(day)).filter((value) => value != null));
  const unlocked = ["unsteady-ground"];

  if (avg10Food != null && avg10Food >= regionThresholds.stabilizationAvgFood10) {
    unlocked.push("stabilization-zone");
  }
  if (
    getFoodSuccessStreak(loggedEntries, regionThresholds.consistencyMinFoodScore) >= regionThresholds.consistencyStreak ||
    recent14FoodEntries.filter((day) => (getUnifiedFoodMetric(day) ?? 0) >= regionThresholds.consistencyMinFoodScore).length >= regionThresholds.consistencyDays14
  ) {
    unlocked.push("consistency-ridge");
  }
  if (workouts14 >= regionThresholds.strengthPlateauWorkouts14 && avg14Food != null && avg14Food >= regionThresholds.strengthPlateauAvgFood14) {
    unlocked.push("strength-plateau");
  }
  if (
    unlocked.includes("strength-plateau") &&
    recent21.length >= regionThresholds.controlFrontierMinDays21 &&
    weekendAvg != null &&
    weekdayAvg != null &&
    weekendAvg >= regionThresholds.controlFrontierWeekendAvg &&
    weekendAvg >= weekdayAvg - regionThresholds.controlFrontierWeekendGap
  ) {
    unlocked.push("control-frontier");
  }
  if (
    unlocked.includes("control-frontier") &&
    last30.length >= regionThresholds.commandStateMinDays30 &&
    last30FoodStrong >= regionThresholds.commandStateStrongFoodDays30 &&
    workouts30 >= regionThresholds.commandStateWorkouts30
  ) {
    unlocked.push("command-state");
  }

  const currentRegionId = unlocked[unlocked.length - 1];
  return {
    currentRegionId,
    currentRegion: getRegionById(currentRegionId),
    unlockedRegionIds: unlocked,
    metrics: {
      avg10Food,
      avg14Food,
      weekendAvg,
      weekdayAvg,
      workouts14,
      workouts30,
      last30FoodStrong,
      foodSuccessStreak: getFoodSuccessStreak(loggedEntries, 4),
    },
  };
}

function buildLevelReward(level) {
  const rewardTitle = levelRewardTitles[(Math.max(1, level) - 1) % levelRewardTitles.length];
  return {
    id: `level-${level}`,
    type: "level",
    title: rewardTitle,
    label: `Level ${level} title unlocked`,
    detail: rewardTitle,
  };
}

function createLevelStoryEvent(level, context) {
  const region = context.region.currentRegion;
  const recentLiftCount = context.strengthSummary.progress.workoutsThisWeek.length;
  const foodTone = (context.weekly.avgFoodScore || 0) >= 4
    ? "Fuel has been cleaner and more deliberate, which means the system is getting steadier instead of noisier."
    : "The record shows some drag and some uneven footing, but it also shows follow-through instead of denial.";
  const liftTone = recentLiftCount >= 2
    ? "Training is no longer theoretical; it is being folded back into the structure of the week."
    : "The structure is still being reinforced in a way that respects a real calendar instead of fantasy momentum.";
  const twistTone = level >= 7 && level < 12
    ? "This is also the phase where false summits show up. Systems start to work, and the old reflex is to loosen standards early. The campaign gets more interesting here because the weak points become subtler."
    : level >= 12
      ? "At this depth, the obvious problems are rarely the main ones. The real friction comes from rationalization, hurry, and the quiet belief that a capable system can tolerate softer edges indefinitely."
      : "In the early part of the campaign, the map mostly improves through measurement. Later it improves because judgment gets sharper and the structure underneath it gets stronger.";
  const reward = buildLevelReward(level);
  return {
    id: `level-${level}`,
    type: "level",
    date: getTodayKey(),
    title: `Level ${level}: ${reward.title}`,
    subtitle: `${region.name} milestone`,
    reward,
    body: `This level was not granted by one unusually good day. It was assembled the way durable systems are assembled: through repeated inputs, ordinary decisions, and a refusal to confuse friction with failure. ${foodTone} ${liftTone}\n\nWhat matters about this milestone is not that it looks dramatic from the outside. It is that capacity is being rebuilt in a way that can survive a real calendar, real work, and real family obligations. The campaign is starting to resemble an engineered system again: clearer load paths, fewer hidden leaks, better response under stress. That is what earned progress looks like.\n\n${twistTone} The next phase does not ask for heroics. It asks for another stretch of competent days, another run of controlled decisions, another week where the system works because you work it. That is how ground is reclaimed and then held.`,
  };
}

function createRegionStoryEvent(region, context) {
  const regionLines = {
    "unsteady-ground": "The first phase is less about conquest than about refusing self-deception. The gauges come back online, and the terrain stops being described in wishful terms.",
    "stabilization-zone": "You are not merely having isolated better days. You are reducing the amount of chaos the system has to absorb.",
    "consistency-ridge": "The ridge matters because it exposes both range and weather. From here, momentum is visible, but so are the routes by which old habits try to circle back.",
    "strength-plateau": "Physical capacity is now part of the campaign, not a side note. The structure is being reinforced from underneath, which changes what the whole system can carry.",
    "control-frontier": "This is the part of the map where weekends, social meals, and fatigue stop being automatic breaches. Control travels farther with you now.",
    "command-state": "The work has shifted from rescue to stewardship. You are no longer trying to become someone else; you are establishing what reliable operation looks like.",
  };
  return {
    id: `region-${region.id}`,
    type: "region",
    date: getTodayKey(),
    title: region.name,
    subtitle: "Region entered",
    reward: {
      id: `region-reward-${region.id}`,
      type: "region",
      title: region.rewardTitle,
      label: "Region title unlocked",
      detail: region.rewardTitle,
    },
    body: `The terrain has changed because the underlying behavior has changed. ${region.focus} ${regionLines[region.id] || ""}\n\nThis region is not a decorative unlock. It marks a shift in what the system can be trusted to do under ordinary pressure. The map expands when food structure holds without drama, when training shows up on the calendar instead of in the imagination, and when setbacks are treated as terrain rather than verdicts. This is one of those moments.`,
  };
}

function syncNarrativeProgress(summary) {
  let changed = false;
  const archive = Array.isArray(state.meta.storyArchive) ? [...state.meta.storyArchive] : [];
  const storyRewards = Array.isArray(state.meta.storyRewards) ? [...state.meta.storyRewards] : [];

  if (!archive.some((item) => item.id === `level-${summary.level}`) && summary.level > 1) {
    const levelEvent = createLevelStoryEvent(summary.level, summary);
    archive.unshift(levelEvent);
    storyRewards.unshift(levelEvent.reward);
    changed = true;
  }

  for (const regionId of summary.region.unlockedRegionIds) {
    if (!archive.some((item) => item.id === `region-${regionId}`)) {
      const event = createRegionStoryEvent(getRegionById(regionId), summary);
      archive.unshift(event);
      storyRewards.unshift(event.reward);
      changed = true;
    }
  }

  const uniqueRewards = [];
  const seenRewardIds = new Set();
  for (const reward of storyRewards) {
    if (!reward || seenRewardIds.has(reward.id)) {
      continue;
    }
    seenRewardIds.add(reward.id);
    uniqueRewards.push(reward);
  }

  state.meta.currentRegionId = summary.region.currentRegionId;
  state.meta.unlockedRegionIds = [...summary.region.unlockedRegionIds];
  state.meta.storyArchive = archive.slice(0, 40);
  state.meta.storyRewards = uniqueRewards;
  return changed;
}

function getQuestTemplate(questId) {
  return miniQuestTemplates.find((quest) => quest.id === questId);
}

function getFoodMetricForQuest(entry) {
  if (entry.foodModel === "structure-v1") {
    return entry.foodStructureScore ?? getFoodStructureScore(entry.foodStructure);
  }
  const legacyAverage = getLegacyFoodAverage(entry);
  return legacyAverage == null ? 0 : Math.max(0, 5 - legacyAverage);
}

function didCompleteStrengthOnDate(dateKey) {
  const session = getStrengthSessionForDate(dateKey);
  return Boolean(session?.completed);
}

function evaluateMiniQuest(template, entry, context) {
  const foodMetric = getFoodMetricForQuest(entry);
  const weekday = new Date(`${entry.date}T12:00:00`).getDay();
  const prior = context.priorEntries || [];
  switch (template.id) {
    case "hold-the-line":
      return weekday === 5 && foodMetric >= 4 && Boolean(entry.foodStructure?.noNightEating);
    case "steady-saturday":
      return weekday === 6 && foodMetric >= 4 && Boolean(entry.foodStructure?.noNightEating);
    case "stop-at-enough":
      return Boolean(entry.foodStructure?.dinnerPortionControlled) && Boolean(entry.foodStructure?.noNightEating);
    case "single-plate-rule":
      return Boolean(entry.foodStructure?.dinnerPortionControlled);
    case "clean-afternoon":
      return Boolean(entry.foodStructure?.afternoonSnackControlled);
    case "planned-fuel-only":
      return Boolean(entry.foodStructure?.afternoonSnackControlled) && Boolean(entry.foodStructure?.noNightEating);
    case "protein-anchor":
      return Boolean(entry.foodStructure?.breakfastControlled) && Boolean(entry.foodStructure?.lunchAnchorMeal) && Boolean(entry.foodStructure?.dinnerPortionControlled);
    case "lift-and-fuel":
      return didCompleteStrengthOnDate(entry.date) && foodMetric >= 4;
    case "three-day-chain": {
      const recent = [...prior.slice(-2), entry];
      return recent.length === 3 && recent.every((day) => getFoodMetricForQuest(day) >= 4);
    }
    case "no-drift-day":
      return foodMetric >= 5;
    default:
      return false;
  }
}

function buildQuestNarrativeLine(completedQuests) {
  if (!completedQuests.length) {
    return "";
  }
  const lines = [
    "You held the line where you used to drift.",
    "Structure carried through pressure today.",
    "That was controlled, not accidental.",
    "The terrain changed because the decision held.",
  ];
  return lines[completedQuests.length % lines.length];
}

function selectMiniQuestIds(dateKey, context) {
  const weekday = new Date(`${dateKey}T12:00:00`).getDay();
  const recentFood = getRecentFoodScores(context.loggedEntries, 10);
  const avgFood = average(recentFood) || 0;
  const recentWorkoutCount = getCompletedStrengthWorkoutsInWindow(7).length;
  const recentNightDrift = context.loggedEntries.slice(-7).filter((day) => day.foodModel === "structure-v1" && !day.foodStructure?.noNightEating).length;
  const ids = [];

  if (weekday === 5) {
    ids.push("hold-the-line");
  }
  if (weekday === 6) {
    ids.push("steady-saturday");
  }
  if (isStrengthDay(dateKey)) {
    ids.push("lift-and-fuel", "protein-anchor");
  }
  if (recentNightDrift >= 2) {
    ids.push("stop-at-enough", "single-plate-rule");
  }
  if (avgFood < 4) {
    ids.push("clean-afternoon", "planned-fuel-only");
  }
  if (context.region.currentRegion.phase !== "early") {
    ids.push("three-day-chain", "no-drift-day");
  }
  if (recentWorkoutCount < 2) {
    ids.push("lift-and-fuel");
  }
  ids.push("stop-at-enough", "clean-afternoon", "protein-anchor", "no-drift-day");

  const unique = [];
  for (const id of ids) {
    if (!unique.includes(id)) {
      unique.push(id);
    }
  }
  const seeded = hashString(`${dateKey}-${context.region.currentRegionId}`);
  return unique.sort((a, b) => (hashString(`${a}-${seeded}`) % 7) - (hashString(`${b}-${seeded}`) % 7)).slice(0, 3);
}

function getMiniQuestStateForDate(entry, context) {
  const questIds = selectMiniQuestIds(entry.date, context);
  const activeQuests = questIds
    .map((id) => getQuestTemplate(id))
    .filter(Boolean)
    .map((template) => {
      const completed = evaluateMiniQuest(template, entry, context);
      return {
        ...template,
        completed,
      };
    });
  const questXp = activeQuests.filter((quest) => quest.completed).reduce((sum, quest) => sum + quest.xpReward, 0);
  return {
    activeQuests,
    questXp,
    questNarrative: buildQuestNarrativeLine(activeQuests.filter((quest) => quest.completed)),
  };
}

function buildDailyDispatch(summary) {
  const region = summary.region.currentRegion;
  const today = summary.today;
  const liftStatus = summary.strength.status;
  const streak = summary.regularStreak;
  const dispatchLabel = "Today's Dispatch";
  const entryTone = {
    early: "The work is still about establishing reliable footing and refusing friendly lies from the surface.",
    middle: "The work is becoming more about rhythm, load paths, and protecting momentum from subtle erosion.",
    late: "The system is shifting toward refinement and command, where the enemy is softness at the edges rather than obvious collapse.",
  }[region.phase];
  const foodLine = today.foodModel === "structure-v1" && (today.foodStructureScore ?? 0) >= 4
    ? "Food structure is acting like clean fuel today: steady enough to support judgment, training, and recovery."
    : today.foodModel === "structure-v1" && (today.foodStructureScore ?? 0) <= 2
      ? "Food inputs show some drift. That does not erase the campaign, but it does distort the readings if left unattended."
      : "Food is still being shaped into something more stable, less reactive, and better able to hold under a normal life."
  ;
  const liftLine = liftStatus === "due"
    ? "Training is scheduled today, so the assignment is simple: reinforce the structure without chasing theatrics."
    : liftStatus === "complete"
      ? "The lifting work is already on the board. Capacity was reinforced before the day had a chance to negotiate it away."
      : "This is a consolidation day. Use it to protect the gains already made and close easy leaks before they widen.";
  const streakLine = streak >= 10
    ? "Momentum is real now, which is exactly when false summits tend to appear and ask for softer standards."
    : streak >= 4
      ? "There is enough continuity here to feel the system biting into the ground."
      : "This is still the stretch where plain follow-through matters more than any dramatic effort.";
  const seed = hashString(`${summary.today.date}-${region.id}-${summary.level}`);
  const twistLine = [
    "One of the recurring lessons of this campaign is that the map changes only after the underlying ground changes.",
    "Old habits rarely return as open rebellion; they come back disguised as efficiency, reward, or harmless exception.",
    "The terrain is getting more legible, which means the next obstacles will be subtler, not larger.",
    "Each steady day narrows the space where drift can hide.",
  ][seed % 4];
  const questLine = summary.today.questNarrative || "A smaller targeted objective is enough; the campaign is won through repeatable pieces.";
  return {
    label: dispatchLabel,
    title: `${region.name}`,
    body: `${entryTone} ${foodLine} ${liftLine} ${streakLine} ${twistLine} ${questLine}`.slice(0, 600),
  };
}

function buildStorySummary(summary) {
  const region = summary.region.currentRegion;
  const recentArchive = (summary.storyArchive || []).slice(0, 4);
  const recentTitles = recentArchive.map((item) => item.title).join(", ");
  const rewardCount = (summary.storyRewards || []).length;
  return `You are currently operating in ${region.name}, where the focus is ${region.focus.toLowerCase()} Level ${summary.level} reflects accumulated work rather than a burst of effort, and ${rewardCount} campaign markers have been unlocked along the way. Recent milestones include ${recentTitles || "the early survey marks of the campaign"}. The larger arc has moved from measurement and stabilization toward repeatability, physical capacity, and better control under pressure. The system is becoming more trustworthy, and the next gains come from steady judgment rather than intensity.`;
}

function getDraftEntry() {
  const dateKey = getSelectedDateKey();
  const existing = getEntry(dateKey);
  const foodModel = existing.foodModel || (dateKey >= FOOD_SCORING_UPDATE_DATE ? "structure-v1" : "legacy");
  return {
    ...existing,
    date: dateKey,
    mode: state.settings.mode,
    steps: clampNumber(entryStepsInput.value, 0, 100000, 0),
    exerciseMinutes: clampNumber(entryExerciseInput.value, 0, 300, 0),
      weight: parseOptionalNumber(entryWeightInput.value),
      bodyFat: parseOptionalNumber(entryBodyFatInput.value),
      notes: (entryNotesInput.value || "").trim().slice(0, 120),
      foodNote: foodModel === "legacy"
        ? (document.getElementById("today-food-note")?.value || existing.foodNote || "").trim().slice(0, 120)
        : existing.foodNote || "",
      foodStructureNote: foodModel === "structure-v1"
        ? (document.getElementById("today-food-structure-note")?.value || document.getElementById("food-structure-note")?.value || existing.foodStructureNote || "").trim().slice(0, 120)
        : existing.foodStructureNote || "",
      foodModel,
      food: foodModel === "legacy" ? readFoodForm(existing.food) : existing.food,
      foodStructure: foodModel === "structure-v1" ? readFoodStructureForm(existing.foodStructure) : existing.foodStructure,
    habits: {
      protein: habitProteinInput.checked,
      produce: habitProduceInput.checked,
      stoppedBeforeStuffed: habitStoppedInput.checked,
      movement: habitMovementInput.checked,
    },
  };
}

function scoreFood(entry) {
  if (entry.foodModel === "structure-v1") {
    const foodStructure = { ...createEmptyFoodStructure(), ...(entry.foodStructure || {}) };
    const foodStructureScore = getFoodStructureScore(foodStructure);
    const foodPoints = Math.round((foodStructureScore / foodStructureItems.length) * scoringWeights.food.total);
    return {
      foodModel: "structure-v1",
      foodPoints,
      foodStructureScore,
      foodCoachingCopy: getFoodStructureCoaching(foodStructureScore),
      foodStructureRating: getFoodStructureRating(foodStructureScore),
      foodIsProvisional: false,
      coreAnsweredCount: foodStructureScore,
      answeredCheckpoints: foodStructureItems.filter((item) => foodStructure[item.key]).length,
    };
  }

  const getFoodScore = (value) => foodOptions[value]?.score ?? foodOptions[value]?.quality ?? 0;
  const coreAnswered = coreMealSlots.filter((slot) => entry.food[slot] !== null);
  const coreScored = coreAnswered.filter((slot) => foodOptions[entry.food[slot]]?.quality !== null);
  const coreAverage = coreScored.length
    ? average(coreScored.map((slot) => getFoodScore(entry.food[slot])))
    : 0;
  const coreFoodPoints = Math.round(coreAverage * scoringWeights.food.core);

  const otherValue = entry.food.other;
  let otherFoodPoints = 0;
  if (otherValue != null && foodOptions[otherValue]?.quality !== null) {
    otherFoodPoints = Math.round(getFoodScore(otherValue) * scoringWeights.food.other);
  }

  const completionBonus = coreAnswered.length >= 4
    ? scoringWeights.food.completion
    : coreAnswered.length >= 3
      ? 1
      : 0;

  const dinnerDrift = (entry.food.dinner ?? -1) >= 3;
  const otherDrift = (entry.food.other ?? -1) >= 3;
  const driftPenalty = dinnerDrift && otherDrift ? 5 : dinnerDrift || otherDrift ? 2 : 0;

  const foodPoints = Math.max(
    0,
    Math.min(
      scoringWeights.food.total,
      coreFoodPoints + otherFoodPoints + completionBonus - driftPenalty
    )
  );

  return {
    foodModel: "legacy",
    foodPoints,
    coreFoodPoints,
    otherFoodPoints,
    completionBonus,
    driftPenalty,
    coreAnsweredCount: coreAnswered.length,
    coreAverage,
    foodIsProvisional: coreAnswered.length < 3,
  };
}

function scoreHabits(entry) {
  return (
    (entry.habits.protein ? scoringWeights.habits.protein : 0) +
    (entry.habits.produce ? scoringWeights.habits.produce : 0) +
    (entry.habits.stoppedBeforeStuffed ? scoringWeights.habits.stoppedBeforeStuffed : 0) +
    (entry.habits.movement ? scoringWeights.habits.movement : 0)
  );
}

function getTrailingMetricAverage(priorEntries, key, windowSize = 7) {
  const values = priorEntries
    .filter((day) => day[key] != null)
    .slice(-windowSize)
    .map((day) => day[key]);

  if (values.length < windowSize) {
    return null;
  }

  return average(values);
}

function scoreBodyMetrics(entry, priorEntries = []) {
  let points = 0;
  if (entry.weight != null) {
    points += scoringWeights.bodyMetrics.weightLogged;
  }
  if (entry.bodyFat != null) {
    points += scoringWeights.bodyMetrics.bodyFatLogged;
  }
  if (entry.weight != null && entry.bodyFat != null) {
    points += scoringWeights.bodyMetrics.bothLoggedBonus;
  }

  const trailingWeightAverage = getTrailingMetricAverage(priorEntries, "weight");
  const trailingBodyFatAverage = getTrailingMetricAverage(priorEntries, "bodyFat");
  const hitWeightTrend = entry.weight != null &&
    trailingWeightAverage != null &&
    entry.weight <= trailingWeightAverage - 0.3;
  const hitBodyFatTrend = entry.bodyFat != null &&
    trailingBodyFatAverage != null &&
    entry.bodyFat <= trailingBodyFatAverage - 0.1;
  const trendBonus = hitWeightTrend || hitBodyFatTrend ? scoringWeights.bodyMetrics.trendBonus : 0;

  return {
    bodyMetricPoints: Math.min(scoringWeights.bodyMetrics.total, points + trendBonus),
    trendBonus,
    trailingWeightAverage,
    trailingBodyFatAverage,
  };
}

function scoreDay(entry, context = {}) {
  const dayMode = entry.mode || "full";
  const priorEntries = context.priorEntries || [];
  const stepPoints = Math.round(Math.min(1, (entry.steps || 0) / state.settings.stepGoal) * scoringWeights.steps);
  const exercisePoints = Math.round(Math.min(1, (entry.exerciseMinutes || 0) / state.settings.exerciseGoal) * scoringWeights.exercise);
  const food = scoreFood(entry);
  const habitPoints = scoreHabits(entry);
  const bodyMetrics = scoreBodyMetrics(entry, priorEntries);
  const provisionalRegion = computeRegionState(priorEntries, { progress: { workoutsThisWeek: [] } });
  const miniQuestState = dayMode === "full"
    ? getMiniQuestStateForDate(
        { ...entry, ...food },
        { priorEntries, loggedEntries: priorEntries, region: provisionalRegion }
      )
    : { activeQuests: [], questXp: 0, questNarrative: "" };
  const rawTotal = stepPoints + exercisePoints + (dayMode === "full" ? food.foodPoints : 0) + bodyMetrics.bodyMetricPoints + habitPoints;
  const scoreCap = dayMode === "full"
    ? 100
    : scoringWeights.steps + scoringWeights.exercise + scoringWeights.bodyMetrics.total + Object.values(scoringWeights.habits).reduce((sum, value) => sum + value, 0);
  const totalScore = Math.round((rawTotal / scoreCap) * 100);
  const bonusXp = getGoalBonus(entry, food.coreAnsweredCount) + miniQuestState.questXp;

  return {
    ...entry,
    mode: dayMode,
    stepPoints,
    exercisePoints,
    foodPoints: food.foodPoints,
    bodyMetricPoints: bodyMetrics.bodyMetricPoints,
    habitPoints,
    totalScore,
    dayType: totalScore >= dayThresholds.win ? "win" : totalScore >= dayThresholds.solid ? "solid" : "reset",
    bonusXp,
    questXp: miniQuestState.questXp,
    activeQuests: miniQuestState.activeQuests,
    questNarrative: miniQuestState.questNarrative,
    answeredMeals: mealSlots.filter((slot) => entry.food[slot] !== null),
    ...food,
    ...bodyMetrics,
  };
}

function getGoalBonus(entry, coreLoggedCount) {
  let bonus = 0;
  if (entry.weight != null && entry.weight <= state.settings.weightGoal) {
    bonus += 30;
  }
  if (entry.bodyFat != null && entry.bodyFat <= state.settings.bodyFatGoal) {
    bonus += 30;
  }
  if (coreLoggedCount === coreMealSlots.length) {
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

function getRecentLoggedDays(loggedEntries, count = 7) {
  return loggedEntries.slice(-count);
}

function getBestRollingAverage(series) {
  return series.length ? Math.min(...series.map((item) => item.value)) : null;
}

function getGapFromBest(currentValue, bestValue) {
  if (currentValue == null || bestValue == null) {
    return null;
  }
  return currentValue - bestValue;
}

function getMetricAverage(entries, key) {
  return average(entries.map((entry) => entry[key]).filter((value) => value != null));
}

function getNextDayWeightPairs(loggedEntries, metricKey) {
  const pairs = [];
  for (let index = 0; index < loggedEntries.length - 1; index += 1) {
    const current = loggedEntries[index];
    const next = loggedEntries[index + 1];
    if (current.weight == null || next.weight == null || current[metricKey] == null) {
      continue;
    }
    pairs.push({
      feature: current[metricKey],
      nextDayWeightChange: next.weight - current.weight,
    });
  }
  return pairs;
}

function pearsonCorrelation(xValues, yValues) {
  if (xValues.length !== yValues.length || xValues.length < 2) {
    return null;
  }

  const xMean = average(xValues);
  const yMean = average(yValues);
  let numerator = 0;
  let xVariance = 0;
  let yVariance = 0;

  for (let index = 0; index < xValues.length; index += 1) {
    const xDelta = xValues[index] - xMean;
    const yDelta = yValues[index] - yMean;
    numerator += xDelta * yDelta;
    xVariance += xDelta ** 2;
    yVariance += yDelta ** 2;
  }

  if (!xVariance || !yVariance) {
    return null;
  }

  return numerator / Math.sqrt(xVariance * yVariance);
}

function buildCorrelationInsight(loggedEntries) {
  const recentEntries = loggedEntries.slice(-30);
  const metrics = [
    { key: "steps", label: "steps" },
    { key: "exerciseMinutes", label: "exercise" },
    { key: "foodPoints", label: "food score" },
    { key: "totalScore", label: "total score" },
  ];

  const ranked = metrics.map((metric) => {
    const pairs = getNextDayWeightPairs(recentEntries, metric.key);
    const correlation = pearsonCorrelation(
      pairs.map((pair) => pair.feature),
      pairs.map((pair) => pair.nextDayWeightChange)
    );
    return {
      ...metric,
      usablePairs: pairs.length,
      correlation,
      helpfulness: correlation == null ? null : -correlation,
    };
  }).filter((metric) => metric.correlation != null && metric.usablePairs >= 8);

  if (ranked.length < 2) {
    return null;
  }

  const top = [...ranked].sort((a, b) => (b.helpfulness ?? -Infinity) - (a.helpfulness ?? -Infinity)).slice(0, 2);
  if ((top[0]?.helpfulness ?? -Infinity) <= 0) {
    return {
      title: "What seems to help",
      body: "Your recent data is still mixed. No single lever has separated itself clearly yet, so keep watching exercise, steps, food score, and total score together.",
    };
  }
  return {
    title: "What seems to help",
    body: `In your recent data, ${top.map((item) => item.label).join(" and ")} have shown the strongest relationship with better next-day scale movement.`,
  };
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
  const recentLoggedDays = getRecentLoggedDays(loggedEntries, 7);

  const allWeeklyWeightAverages = buildRollingAverageSeries(loggedEntries, "weight");
  const latestWeeklyWeightAverage = allWeeklyWeightAverages.length ? allWeeklyWeightAverages[allWeeklyWeightAverages.length - 1].value : null;
  const previousWeeklyWeightAverages = allWeeklyWeightAverages.slice(0, -1);
  const priorLowestWeeklyWeightAverage = getBestRollingAverage(previousWeeklyWeightAverages);
  const bestSevenDayWeightAverage = getBestRollingAverage(allWeeklyWeightAverages);
  const gapFromBestWeightAverage = getGapFromBest(latestWeeklyWeightAverage, bestSevenDayWeightAverage);

  const scoreSeries = buildRollingAverageSeries(loggedEntries, "totalScore");
  const latestScoreAverage = scoreSeries.length ? scoreSeries[scoreSeries.length - 1].value : null;
  const priorScoreAverage = scoreSeries.length > 1 ? scoreSeries[scoreSeries.length - 2].value : null;

  const weightSeries = buildRollingAverageSeries(loggedEntries, "weight");
  const latestWeightAverage = weightSeries.length ? weightSeries[weightSeries.length - 1].value : null;
  const priorWeightAverage = weightSeries.length > 1 ? weightSeries[weightSeries.length - 2].value : null;
  const latestWeight = loggedEntries.filter((day) => day.weight != null).slice(-1)[0]?.weight ?? null;

  return {
    scoreAverage,
    weightAverage,
    bodyFatAverage,
    loggedDays,
    latestWeeklyWeightAverage,
    priorLowestWeeklyWeightAverage,
    bestSevenDayWeightAverage,
    gapFromBestWeightAverage,
    latestScoreAverage,
    priorScoreAverage,
    latestWeightAverage,
    priorWeightAverage,
    latestWeight,
    avgStepsLogged: getMetricAverage(recentLoggedDays, "steps"),
    avgExerciseLogged: getMetricAverage(recentLoggedDays, "exerciseMinutes"),
    avgFoodPointsLogged: getMetricAverage(recentLoggedDays.filter((day) => day.mode === "full"), "foodPoints"),
    correlationInsight: buildCorrelationInsight(loggedEntries),
  };
}

function buildRollingAverageSeries(loggedEntries, key, windowSize = 7) {
  const series = [];
  const usable = [];

  for (const day of loggedEntries) {
    if (day[key] == null) {
      continue;
    }

    usable.push(day);
    if (usable.length < windowSize) {
      continue;
    }

    const window = usable.slice(-windowSize);
    series.push({
      date: day.date,
      value: average(window.map((item) => item[key])),
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
      return state.meta.lastUnlockedSevenDayAvgWeight != null && (
        state.meta.lastClaimedSevenDayAvgWeight == null ||
        state.meta.lastUnlockedSevenDayAvgWeight <= state.meta.lastClaimedSevenDayAvgWeight - 0.2 ||
        reward.claimed === false
      );
    default:
      return false;
  }
}

function syncRewardMilestones(weekly) {
  let changed = false;
  const previousBest = state.meta.bestSevenDayAvgWeight ?? weekly.priorLowestWeeklyWeightAverage;
  if (weekly.bestSevenDayWeightAverage != null) {
    const nextBest = state.meta.bestSevenDayAvgWeight == null
      ? weekly.bestSevenDayWeightAverage
      : Math.min(state.meta.bestSevenDayAvgWeight, weekly.bestSevenDayWeightAverage);
    if (nextBest !== state.meta.bestSevenDayAvgWeight) {
      state.meta.bestSevenDayAvgWeight = nextBest;
      changed = true;
    }
  }

  if (weekly.latestWeeklyWeightAverage != null) {
    const isMeaningfullyNewBest = previousBest == null || weekly.latestWeeklyWeightAverage <= previousBest - 0.2;
    if (isMeaningfullyNewBest) {
      state.meta.lowestAvgWeightRewarded = weekly.latestWeeklyWeightAverage;
      state.meta.lastUnlockedSevenDayAvgWeight = weekly.latestWeeklyWeightAverage;
      state.rewards = state.rewards.map((reward) =>
        reward.criteriaType === "lowest_avg_weight"
          ? { ...reward, claimed: false }
          : reward
      );
      if (state.meta.bestSevenDayAvgWeight == null || weekly.latestWeeklyWeightAverage < state.meta.bestSevenDayAvgWeight) {
        state.meta.bestSevenDayAvgWeight = weekly.latestWeeklyWeightAverage;
      }
      saveState();
      return;
    }
  }

  if (changed) {
    saveState();
  }
}

function getWorkoutPlan() {
  return state.strengthPlan?.workouts?.[0] || defaultStrengthPlan.workouts[0];
}

function slugifyExerciseName(name) {
  return String(name || "")
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getExerciseHelpEntry(slugOrName) {
  const library = window.EXERCISE_HELP_LIBRARY || {};
  const aliases = {
    "dumbbell-bench-press-incline-push-ups": "dumbbell-bench-press",
    "plank-dead-bug": "plank",
  };
  const normalized = slugifyExerciseName(slugOrName);
  return library[slugOrName] || library[aliases[normalized] || normalized] || null;
}

function getWeekdayCode(dateKey) {
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(`${dateKey}T12:00:00`).getDay()];
}

function isStrengthDay(dateKey) {
  return state.strengthSettings.enabled && state.strengthSettings.preferredDays.includes(getWeekdayCode(dateKey));
}

function getNextStrengthDay(dateKey) {
  const cursor = new Date(`${dateKey}T12:00:00`);
  for (let index = 1; index <= 7; index += 1) {
    cursor.setDate(cursor.getDate() + 1);
    const candidate = cursor.toISOString().slice(0, 10);
    if (isStrengthDay(candidate)) {
      return candidate;
    }
  }
  return null;
}

function getStrengthSessionForDate(dateKey) {
  if (state.meta.currentStrengthSession?.date === dateKey) {
    return state.meta.currentStrengthSession;
  }
  return state.strengthHistory.find((session) => session.date === dateKey) || null;
}

function getLastCompletedStrengthSession() {
  return [...state.strengthHistory].reverse().find((session) => session.completed) || null;
}

function getLastExercisePerformance(name) {
  for (let index = state.strengthHistory.length - 1; index >= 0; index -= 1) {
    const session = state.strengthHistory[index];
    const exercise = session.exercises?.find((item) => item.name === name && item.actualSets?.some((set) => set.reps || set.weight));
    if (exercise) {
      return { session, exercise };
    }
  }
  return null;
}

function getLastIncreaseMarker(name) {
  for (let index = state.strengthHistory.length - 1; index >= 0; index -= 1) {
    const session = state.strengthHistory[index];
    const exercise = session.exercises?.find((item) => item.name === name && item.increaseNextTime);
    if (exercise) {
      return { session, exercise };
    }
  }
  return null;
}

function getExerciseProgressionSuggestion(exercise) {
  const previous = getLastExercisePerformance(exercise.name);
  const increaseMarker = getLastIncreaseMarker(exercise.name);
  if (increaseMarker) {
    return "Marked to increase from last time. Consider adding 1 rep or a small weight bump if form stays solid.";
  }
  if (!previous) {
    const guidance = getExerciseStartingGuidance(exercise);
    return guidance.summaryText || `Start with a manageable load for ${exercise.sets}x${exercise.reps}.`;
  }

  const lastSets = previous.exercise.actualSets || [];
  const numericTarget = Number(exercise.repRange?.[0] || exercise.reps || 0);
  const topRep = Number(exercise.repRange?.[1] || exercise.reps || numericTarget);
  const allHitTarget = lastSets.length >= exercise.sets && lastSets.every((set) => Number(set.reps || 0) >= numericTarget);
  const allHitTop = lastSets.length >= exercise.sets && lastSets.every((set) => Number(set.reps || 0) >= topRep);
  const lastWeight = lastSets.find((set) => set.weight)?.weight || "";

  if (allHitTop && lastWeight) {
    return `You've earned a weight increase next session. Try ${lastWeight} + a small bump and restart at ${numericTarget} reps.`;
  }
  if (allHitTarget) {
    return `Try ${lastWeight || "the same load"} for ${exercise.sets}x${numericTarget + 1} today.`;
  }
  return `Repeat ${lastWeight || "the same load"} and own the prescription before adding more.`;
}

function getExerciseStartingGuidance(exercise) {
  const helpEntry = getExerciseHelpEntry(exercise.helpSlug || exercise.name);
  const weightText = helpEntry?.recommendedStartingWeight || "";
  const repsText = helpEntry?.recommendedStartingReps || `${exercise.sets} x ${exercise.reps}`;
  const prefillWeight = helpEntry?.recommendedStartingWeightValue || "";
  return {
    helpEntry,
    weightText,
    repsText,
    prefillWeight,
    isBodyweight: !prefillWeight,
    summaryText: weightText
      ? `Suggested start: ${weightText} for ${repsText}`
      : `Suggested start: ${repsText}`,
  };
}

function createStrengthSession(dateKey) {
  const workout = getWorkoutPlan();
  return migrateStrengthSession({
    date: dateKey,
    workoutId: workout.id,
    workoutName: workout.name,
    durationMinutes: state.strengthSettings.defaultWorkoutDuration,
    completed: false,
    exercises: workout.exercises.map((exercise) => {
      const last = getLastExercisePerformance(exercise.name);
      const lastWeight = last?.exercise?.actualSets?.find((set) => set.weight)?.weight || "";
      const starter = getExerciseStartingGuidance(exercise);
      const actualSets = Array.from({ length: exercise.sets }, (_, index) => ({
        set: index + 1,
        weight: lastWeight || starter.prefillWeight,
        reps: "",
        completed: false,
      }));
      return {
        name: exercise.name,
        helpSlug: exercise.helpSlug,
        alternateHelpSlug: exercise.alternateHelpSlug || null,
        targetSets: exercise.sets,
        targetReps: exercise.reps,
        actualSets,
        completed: false,
        progressed: false,
        pr: false,
        increaseNextTime: false,
        note: "",
      };
    }),
  }, state.strengthPlan);
}

function getCompletedStrengthWorkoutsInWindow(days = 7) {
  const end = new Date(`${getTodayKey()}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  return state.strengthHistory.filter((session) => {
    const date = new Date(`${session.date}T12:00:00`);
    return session.completed && date >= start && date <= end;
  });
}

function getStrengthProgressSummary() {
  const workoutsThisWeek = getCompletedStrengthWorkoutsInWindow(7);
  const workoutsThisMonth = getCompletedStrengthWorkoutsInWindow(30);
  const keyExercises = ["Goblet Squat", "Dumbbell Bench Press / Incline Push-Ups", "One-Arm Dumbbell Row", "Romanian Deadlift"];
  const liftProgress = keyExercises.map((name) => {
    const sessions = state.strengthHistory
      .map((session) => ({
        date: session.date,
        exercise: session.exercises?.find((item) => item.name === name),
      }))
      .filter((item) => item.exercise?.actualSets?.some((set) => set.weight || set.reps));
    if (!sessions.length) {
      return null;
    }
    const firstWeight = Number(sessions[0].exercise.actualSets.find((set) => set.weight)?.weight || 0);
    const latestWeight = Number(sessions[sessions.length - 1].exercise.actualSets.find((set) => set.weight)?.weight || 0);
    return {
      name,
      firstWeight,
      latestWeight,
    };
  }).filter(Boolean);

  return {
    workoutsThisWeek,
    workoutsThisMonth,
    liftProgress,
  };
}

function getStrengthStatus(dateKey) {
  const session = getStrengthSessionForDate(dateKey);
  if (session?.completed) {
    return "complete";
  }
  if (session && !session.completed) {
    return "in_progress";
  }
  return isStrengthDay(dateKey) ? "due" : "not_due";
}

function getTodayFocus(summary) {
  const dateKey = getSelectedDateKey();
  const liftStatus = getStrengthStatus(dateKey);
  if (liftStatus === "due") {
    return "Stay on track with food and complete your strength workout.";
  }
  if (liftStatus === "in_progress") {
    return "Finish your workout cleanly and keep food control steady late.";
  }
  return "Recovery day: stay steady with food, movement, and trend-aware decisions.";
}

function getKeyActions(summary) {
  const actions = [];
  if (getStrengthStatus(getSelectedDateKey()) === "due") {
    actions.push("Complete Strength Quest workout");
  }
  if (summary.today.foodIsProvisional) {
    actions.push("Log food honestly");
  }
  if (summary.today.stepPoints < scoringWeights.steps * 0.75) {
    actions.push("Hit movement goal");
  }
  if (summary.today.mode === "full") {
    if (summary.today.foodModel === "structure-v1") {
      if ((summary.today.foodStructureScore ?? 0) < 4) {
        actions.push("Tighten food structure");
      }
    } else if ((summary.today.food?.other ?? 0) < 4) {
      actions.push("Stay out of 4-5 eating territory");
    }
  }
  return actions.slice(0, 3);
}

function getFoodStatusSummary(day) {
  if (day.foodModel === "structure-v1") {
    const score = day.foodStructureScore ?? getFoodStructureScore(day.foodStructure);
    if (score >= 4) {
      return score >= 5 ? "Excellent structure" : "Strong structure";
    }
    if (score >= 3) {
      return "Acceptable structure";
    }
    return "Food drift";
  }
  const logged = mealSlots.filter((slot) => day.food[slot] != null);
  if (!logged.length) {
    return "No meals logged yet";
  }
  const buckets = logged.map((slot) => foodOptions[day.food[slot]]?.bucket);
  if (buckets.every((bucket) => bucket === "in_control" || bucket === "n/a")) {
    return "In control";
  }
  if (buckets.some((bucket) => bucket === "off_track")) {
    return "Off track";
  }
  return "Warning";
}

function getStrengthStoryHook(summary) {
  const workoutsThisWeek = getCompletedStrengthWorkoutsInWindow(7).length;
  if (workoutsThisWeek >= 3) {
    return "Training Grounds cleared this week.";
  }
  if (summary.strength.status === "complete") {
    return "Momentum is building.";
  }
  if (summary.strength.status === "due") {
    return "The forge is lit. Strength work is due today.";
  }
  return "You held the line this week.";
}

function getStrengthPrimaryAction(summary) {
  const status = summary.strength.status;
  if (status === "in_progress") {
    return { label: "Resume Workout", detail: "Pick up where you left off.", mode: "resume" };
  }
  if (status === "due") {
    return { label: "Start Workout", detail: "Today's session is ready.", mode: "start" };
  }
  if (status === "complete") {
    return { label: "Review Workout", detail: "See today's logged session.", mode: "review" };
  }
  return {
    label: "Open Strength",
    detail: summary.strength.nextDay ? `Next lifting day: ${formatDisplayDate(summary.strength.nextDay)}` : "Check the plan and next session.",
    mode: "open",
  };
}

function handleStrengthPrimaryAction(summary, options = {}) {
  const { switchTab = true } = options;
  const dateKey = getSelectedDateKey();
  const action = getStrengthPrimaryAction(summary);

  if ((action.mode === "start" || action.mode === "resume") &&
      (!state.meta.currentStrengthSession || state.meta.currentStrengthSession.date !== dateKey)) {
    state.meta.currentStrengthSession = createStrengthSession(dateKey);
    saveState();
  }

  if (switchTab) {
    setActiveTab("strength");
  } else {
    render();
  }
}

function openExerciseHelp(helpSlug, alternateHelpSlug = null) {
  const primary = getExerciseHelpEntry(helpSlug);
  const alternate = alternateHelpSlug ? getExerciseHelpEntry(alternateHelpSlug) : null;
  if (!primary) {
    setStatus("Exercise help is not ready for that movement yet.");
    return;
  }

  const showingCombo = primary.slug === "plank" && alternate?.slug === "dead-bug";
  exerciseHelpTitle.textContent = showingCombo ? "Plank / Dead Bug" : primary.name;
  exerciseHelpContent.innerHTML = `
    ${renderExerciseHelpBlock(primary, showingCombo ? "Primary Option" : "")}
    ${showingCombo && alternate ? renderExerciseHelpBlock(alternate, "Alternative Core Option") : ""}
    ${alternate && !showingCombo ? `
      <div class="help-section alternate-help">
        <div class="help-section-title">Alternative Option</div>
        <p class="help-description">${escapeHtml(alternate.name)} is a valid substitute on days when you want a bodyweight press.</p>
        <button id="swap-help-entry" type="button" class="secondary-button">Show ${escapeHtml(alternate.name)}</button>
      </div>
    ` : ""}
  `;

  const swapButton = document.getElementById("swap-help-entry");
  if (swapButton && alternateHelpSlug) {
    swapButton.addEventListener("click", () => openExerciseHelp(alternateHelpSlug, helpSlug));
  }

  exerciseHelpSheet.classList.remove("is-hidden");
  exerciseHelpSheet.setAttribute("aria-hidden", "false");
}

function renderExerciseHelpBlock(entry, label = "") {
  return `
    <section class="help-entry-block">
      ${label ? `<div class="help-entry-label">${escapeHtml(label)}</div>` : ""}
      <div class="help-entry-name">${escapeHtml(entry.name)}</div>
      <div class="help-media">
        ${renderExerciseDemoMedia(entry)}
      </div>
      <p class="help-description">${escapeHtml(entry.description)}</p>
      <div class="help-section">
        <div class="help-section-title">Starting Recommendation</div>
        <div class="help-starting-grid">
          <div class="help-starting-stat"><strong>${escapeHtml(entry.recommendedStartingWeight || "bodyweight")}</strong><span>starting weight</span></div>
          <div class="help-starting-stat"><strong>${escapeHtml(entry.recommendedStartingReps || "--")}</strong><span>starting reps</span></div>
        </div>
        ${entry.recommendedStartingNote ? `<div class="help-description">${escapeHtml(entry.recommendedStartingNote)}</div>` : ""}
        ${entry.backSensitivityNote ? `<div class="help-safety-note">${escapeHtml(entry.backSensitivityNote)}</div>` : ""}
      </div>
      <div class="help-section">
        <div class="help-section-title">Quick Cues</div>
        <div class="cue-chip-list">
          ${(entry.quickCues || []).map((cue) => `<span class="cue-chip">${escapeHtml(cue)}</span>`).join("")}
        </div>
      </div>
      <div class="help-section">
        <div class="help-section-title">Form Tips</div>
        <ul>
          ${entry.formTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
        </ul>
      </div>
      <div class="help-section">
        <div class="help-section-title">Common Mistakes</div>
        <ul>
          ${entry.commonMistakes.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
        </ul>
      </div>
    </section>
  `;
}

function closeExerciseHelp() {
  exerciseHelpSheet.classList.add("is-hidden");
  exerciseHelpSheet.setAttribute("aria-hidden", "true");
}

function renderExerciseDemoMedia(entry) {
  const videoUrl = String(entry?.demoAsset || "");
  const webmUrl = String(entry?.fallbackVideoAsset || "");
  const fallbackUrl = String(entry?.fallbackDemoAsset || "");
  const alt = escapeHtml(entry?.demoAlt || entry?.name || "Exercise demo");
  const fallbackMessage = escapeHtml(entry?.fallbackMessage || "Demo coming soon.");

  if (videoUrl.endsWith(".mp4") || webmUrl.endsWith(".webm")) {
    const fallbackScript = `this.onerror=null;this.classList.add('is-hidden');const shell=this.closest('.help-video-shell');if(shell){shell.classList.add('is-fallback');const note=shell.querySelector('.help-fallback-note');const fallback=shell.querySelector('.help-media-fallback');const badge=shell.querySelector('.help-source-badge');if(note){note.classList.remove('is-hidden');}if(fallback){fallback.classList.remove('is-hidden');}if(badge){badge.textContent='SVG fallback';}}`;
    const loadedScript = `const shell=this.closest('.help-video-shell');if(shell){const badge=shell.querySelector('.help-source-badge');if(badge){const src=(this.currentSrc||'').toLowerCase();badge.textContent=src.endsWith('.webm')?'WEBM':'MP4';}}`;
    return `
      <div class="help-video-shell">
        <div class="help-source-badge" aria-label="Demo source">Video</div>
        <video autoplay muted loop playsinline preload="none" aria-label="${alt}" onerror="${fallbackScript}" onloadeddata="${loadedScript}">
          ${videoUrl ? `<source src="${escapeHtml(videoUrl)}" type="video/mp4">` : ""}
          ${webmUrl ? `<source src="${escapeHtml(webmUrl)}" type="video/webm">` : ""}
        </video>
        <div class="help-fallback-note is-hidden">${fallbackMessage}</div>
        ${fallbackUrl ? `<object data="${escapeHtml(fallbackUrl)}" type="image/svg+xml" aria-label="${alt}" class="help-media-fallback is-hidden"></object>` : ""}
      </div>
    `;
  }

  if (fallbackUrl.endsWith(".svg")) {
    return `
      <div class="help-video-shell is-fallback">
        <div class="help-source-badge" aria-label="Demo source">SVG fallback</div>
        <object data="${escapeHtml(fallbackUrl)}" type="image/svg+xml" aria-label="${alt}"></object>
      </div>
    `;
  }

  return `
    <div class="help-video-shell is-fallback">
      <div class="help-source-badge" aria-label="Demo source">No local media</div>
      <div class="help-fallback-note">${fallbackMessage}</div>
      ${fallbackUrl ? `<object data="${escapeHtml(fallbackUrl)}" type="image/svg+xml" aria-label="${alt}"></object>` : ""}
    </div>
  `;
}

function getTodayBreakdownNote(day) {
  if (day.foodIsProvisional) {
    return "Some of today's score is still provisional because the day is not fully logged.";
  }

  const movementGap = (scoringWeights.steps - day.stepPoints) + (scoringWeights.exercise - day.exercisePoints);
  const foodGap = day.mode === "full" ? scoringWeights.food.total - day.foodPoints : -Infinity;

  if (foodGap > movementGap && foodGap >= 8) {
    return "Food quality / control is the biggest drag on today's score.";
  }

  if (movementGap >= 12) {
    return "Today's score ceiling is being limited mostly by movement.";
  }

  return "Today's score is being carried by steady reps more than by measurement alone.";
}

function renderTodayCard(summary) {
  const today = summary.today;
  const selectedDateLabel = formatDisplayDate(getSelectedDateKey());
  const isMaintenance = state.settings.mode === "maintenance";
  const chapter = summary.currentChapter;
  const showingStructuredFood = !isMaintenance && shouldUseStructuredFoodUI(today);
  const structuredFood = readFoodStructureForm(today.foodStructure);
  const structuredPreview = scoreFood({ ...today, foodModel: "structure-v1", foodStructure: structuredFood });
  const focus = getTodayFocus(summary);
  const keyActions = getKeyActions(summary);
  const quickStats = [
    { label: "Food", value: getFoodStatusSummary(today) },
    { label: "Strength", value: capitalize(summary.strength.status.replace("_", " ")) },
    { label: "Weight Trend", value: summary.weekly.gapFromBestWeightAverage != null && summary.weekly.gapFromBestWeightAverage <= 0.3 ? "Near best" : summary.weekly.latestWeeklyWeightAverage != null && summary.weekly.priorWeightAverage != null && summary.weekly.latestWeeklyWeightAverage <= summary.weekly.priorWeightAverage ? "Trending down" : "Watch trend" },
    { label: "Region", value: summary.region.currentRegion.name },
  ];
  const noteMarkup = `
    <label class="quick-field quick-notes">
      <span>Notes</span>
      <input id="today-notes" type="text" maxlength="120" value="${escapeHtml(today.notes || "")}" placeholder="client lunch, poor sleep, field day">
    </label>
  `;
  const strengthAction = getStrengthPrimaryAction(summary);

  todayCard.innerHTML = `
    <div class="today-grid">
      <div class="today-main">
        <div class="today-kicker">${escapeHtml(selectedDateLabel)}</div>
        <div class="today-score">${today.totalScore}</div>
        <div class="today-copy">Win day at 75+. Solid day at 55-74. Regular streak survives solid days; elite streak needs wins.</div>
        <div class="today-focus">
          <div class="today-focus-label">Today's Focus</div>
          <div class="today-focus-copy">${escapeHtml(focus)}</div>
        </div>
        <div class="today-focus">
          <div class="today-focus-label">Key Actions</div>
          <div class="today-actions-list">
            ${keyActions.map((action) => `<div class="today-action-pill">${escapeHtml(action)}</div>`).join("")}
          </div>
        </div>
        <div class="chapter-banner">
          <div class="chapter-label">${escapeHtml(campaignMeta.title)}</div>
          <div class="chapter-title">${escapeHtml(chapter.title)}</div>
          <div class="chapter-subtitle">${escapeHtml(chapter.subtitle)}</div>
        </div>
        <div class="dispatch-card">
          <div class="today-focus-label">${escapeHtml(summary.dailyDispatch.label)}</div>
          <div class="dispatch-title">${escapeHtml(summary.dailyDispatch.title)}</div>
          <div class="dispatch-copy">${escapeHtml(summary.dailyDispatch.body)}</div>
        </div>
        <div class="xp-progress-card">
          <div class="xp-line">Level ${summary.level} | ${summary.totalXp.toLocaleString()} XP total</div>
          <div class="xp-line">Next level at ${summary.nextLevelXp.toLocaleString()} XP</div>
          <div class="xp-line">${summary.xpToNext.toLocaleString()} XP to go</div>
          <div class="xp-progress"><span style="width:${Math.max(0, Math.min(100, ((summary.totalXp - getXpForLevel(summary.level)) / 250) * 100))}%"></span></div>
        </div>
        <div class="region-inline-card">
          <div class="today-focus-label">Current Region</div>
          <div class="dispatch-title">${escapeHtml(summary.region.currentRegion.name)}</div>
          <div class="dispatch-copy">${escapeHtml(summary.region.currentRegion.focus)}</div>
        </div>
        <div class="boss-fight-card">
          <div class="boss-title">Boss Fight: ${escapeHtml(summary.bossFight.title)}</div>
          <div class="boss-copy">${escapeHtml(summary.bossFight.body)}</div>
        </div>
        <div class="quest-card">
          <div class="today-focus-label">Active Quests</div>
          <div class="quest-list">
            ${(today.activeQuests || []).map((quest) => `
              <article class="quest-item ${quest.completed ? "completed" : ""}">
                <div class="quest-row">
                  <strong>${escapeHtml(quest.title)}</strong>
                  <span class="quest-xp">+${quest.xpReward} XP</span>
                </div>
                <div class="quest-copy">${escapeHtml(quest.description)}</div>
                <div class="quest-status">${quest.completed ? "Completed" : `Target: ${escapeHtml(quest.duration)}`}</div>
              </article>
            `).join("")}
          </div>
          ${today.questNarrative ? `<div class="quest-narrative">${escapeHtml(today.questNarrative)}</div>` : ""}
        </div>
        <div class="strength-inline-card">
          <div class="strength-inline-top">
            <div>
              <div class="boss-title">Strength Quest</div>
              <div class="boss-copy">${escapeHtml(getStrengthStoryHook(summary))}</div>
            </div>
            <button id="today-strength-shortcut" type="button" class="strength-shortcut-button">${escapeHtml(strengthAction.label)}</button>
          </div>
          <div class="strength-inline-meta">
            <span>${summary.strength.status === "due" ? "Workout due today" : summary.strength.status === "complete" ? "Workout complete" : summary.strength.status === "in_progress" ? "Workout in progress" : "Recovery / non-lifting day"}</span>
            <span>${summary.strength.nextDay ? `Next: ${formatDisplayDate(summary.strength.nextDay)}` : "Next session pending"}</span>
          </div>
          <div class="strength-inline-detail">${escapeHtml(strengthAction.detail)}</div>
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
          ${showingStructuredFood ? `
            <div class="today-meals">
              <div class="today-meals-header">
                <span>Food Structure</span>
                <span class="today-meals-hint">5 daily checkpoints for control and consistency.</span>
              </div>
              <div class="food-structure-grid compact">
                ${foodStructureItems.map((item) => `
                  <label class="food-structure-item compact">
                    <input id="today-food-structure-${item.key}" type="checkbox" ${structuredFood[item.key] ? "checked" : ""}>
                    <span class="food-structure-copy">
                      <strong>${escapeHtml(item.label)}</strong>
                      <small>${escapeHtml(item.helper)}</small>
                    </span>
                  </label>
                `).join("")}
              </div>
              <div class="food-structure-summary compact">
                <div class="food-structure-score">Food Structure Score: ${structuredPreview.foodStructureScore}/5</div>
                <div class="food-structure-rating">${escapeHtml(structuredPreview.foodStructureRating)}</div>
                <div class="food-structure-coaching">${escapeHtml(structuredPreview.foodCoachingCopy)}</div>
                <div class="food-structure-hint">Protein-forward meals support lifting recovery.</div>
              </div>
              <label class="quick-field quick-notes">
                <span>Food structure note</span>
                <input id="today-food-structure-note" type="text" maxlength="120" value="${escapeHtml(today.foodStructureNote || "")}" placeholder="What helped, or what pushed food off track?">
              </label>
            </div>
          ` : ""}
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
        <div class="score-row"><span>Steps</span><span>${today.stepPoints}/${scoringWeights.steps}</span></div>
        <div class="score-row"><span>Exercise</span><span>${today.exercisePoints}/${scoringWeights.exercise}</span></div>
        ${today.mode === "full" ? `<div class="score-row"><span>${today.foodModel === "structure-v1" ? "Food Structure" : "Legacy Food"}</span><span>${today.foodModel === "structure-v1" ? `${today.foodStructureScore || 0}/5` : `${today.foodPoints}/${scoringWeights.food.total}`}</span></div>` : ""}
        <div class="score-row"><span>Body metrics</span><span>${today.bodyMetricPoints}/${scoringWeights.bodyMetrics.total}</span></div>
        <div class="score-row"><span>Habits</span><span>${today.habitPoints}/${Object.values(scoringWeights.habits).reduce((sum, value) => sum + value, 0)}</span></div>
        <div class="today-breakdown-note">${escapeHtml(getTodayBreakdownNote(today))}</div>
      </div>
    </div>
  `;

  wireTodayQuickInputs();
  wireTodayMealInputs();
  const repeatMealsButton = document.getElementById("repeat-last-meals");
  if (repeatMealsButton) {
    repeatMealsButton.addEventListener("click", repeatLastMeals);
  }
  const todayStrengthShortcut = document.getElementById("today-strength-shortcut");
  if (todayStrengthShortcut) {
    todayStrengthShortcut.addEventListener("click", () => handleStrengthPrimaryAction(summary));
  }
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
  syncQuickInput("today-food-structure-note", document.getElementById("food-structure-note"));
}

function wireTodayMealInputs() {
  for (const input of todayCard.querySelectorAll('input[id^="today-food-structure-"]')) {
    input.addEventListener("change", () => {
      render();
    });
  }
}

function repeatLastMeals() {
  const lastEntry = [...Object.values(state.entries)]
    .map((entry) => migrateEntry(entry.date, entry))
    .filter((entry) => entry.date < getSelectedDateKey() && mealSlots.some((slot) => entry.food[slot] != null))
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!lastEntry) {
    setStatus("No recent meal pattern found to repeat yet.");
    return;
  }

  const current = getEntry(getSelectedDateKey());
  state.entries[getSelectedDateKey()] = {
    ...current,
    date: getSelectedDateKey(),
    food: { ...lastEntry.food },
    foodNote: lastEntry.foodNote || current.foodNote || "",
  };
  saveState();
  render();
  setStatus(`Repeated meals from ${formatDisplayDate(lastEntry.date)}.`);
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
  const statCards = [
    statCard(`Level ${summary.level}`, `${summary.totalXp.toLocaleString()} XP`, `${state.settings.displayName}'s total campaign experience`),
    statCard("Regular Streak", `${summary.regularStreak} days`, `Best: ${summary.bestRegularStreak}`),
    statCard("Elite Streak", `${summary.eliteStreak} days`, `Best: ${summary.bestEliteStreak}`),
    statCard("Next Level", `${summary.nextLevelXp.toLocaleString()} XP`, `${summary.xpToNext.toLocaleString()} XP remaining`),
    statCard("7-day Avg Score", formatMaybe(summary.weekly.scoreAverage), `${summary.weekly.loggedDays} days logged this week`),
    statCard("Current 7-day Avg Weight", formatMaybe(summary.weekly.latestWeeklyWeightAverage, 1), `Best: ${formatMaybe(summary.weekly.bestSevenDayWeightAverage, 1)} | Gap: ${formatSigned(summary.weekly.gapFromBestWeightAverage, 1)}`),
    statCard("7-day Avg Body Fat", formatMaybe(summary.weekly.bodyFatAverage, 1, "%"), `Goal: ${state.settings.bodyFatGoal}%`),
    statCard("Best 7-day Weight Avg", formatMaybe(summary.weekly.bestSevenDayWeightAverage, 1), "Lowest rolling weekly average achieved"),
    statCard("7-day Avg Steps", formatMaybe(summary.weekly.avgStepsLogged), `Goal: ${state.settings.stepGoal}`),
    statCard("7-day Avg Exercise", formatMaybe(summary.weekly.avgExerciseLogged), `Goal: ${state.settings.exerciseGoal} min`),
    statCard("7-day Avg Food Score*", formatMaybe(summary.weekly.avgFoodPointsLogged), `Target: ${scoringWeights.food.total}`),
  ];

  summaryStats.innerHTML = statCards.join("");

  const guardrailMarkup = buildGuardrails(summary)
    .map((message) => `<div class="guardrail-item">${escapeHtml(message)}</div>`);
  if (summary.weekly.correlationInsight) {
    guardrailMarkup.push(`
      <article class="guardrail-item insight-card">
        <strong>${escapeHtml(summary.weekly.correlationInsight.title)}</strong>
        <div>${escapeHtml(summary.weekly.correlationInsight.body)}</div>
      </article>
    `);
  }
  guardrailMarkup.push(`<div class="guardrail-item">Food scoring updated to structured model on April 6, 2026. Legacy food scores remain preserved in history.</div>`);
  guardrailList.innerHTML = guardrailMarkup.join("");
}

function renderStrengthCard(summary) {
  const dateKey = getSelectedDateKey();
  const workout = getWorkoutPlan();
  const session = summary.strength.session;
  const isDue = summary.strength.status === "due";
  const isInProgress = summary.strength.status === "in_progress";
  const isComplete = summary.strength.status === "complete";
  const strengthAction = getStrengthPrimaryAction(summary);
  const exercises = (session?.exercises || workout.exercises.map((exercise) => ({
    ...exercise,
    targetSets: exercise.sets,
    targetReps: exercise.reps,
    actualSets: Array.from({ length: exercise.sets }, (_, index) => ({
      set: index + 1,
      weight: getExerciseStartingGuidance(exercise).prefillWeight,
      reps: "",
      completed: false,
    })),
  })));

  strengthCard.innerHTML = `
    <div class="strength-hero">
      <div>
        <div class="strength-kicker">${isStrengthDay(dateKey) ? "Workout scheduled today" : "Recovery / non-lifting day"}</div>
        <h3>${escapeHtml(workout.name)}</h3>
        <p>${isStrengthDay(dateKey) ? "Thirty-minute full-body session. Progress with clean reps and steady effort." : `Next lifting day: ${summary.strength.nextDay ? formatDisplayDate(summary.strength.nextDay) : "TBD"}`}</p>
        <div class="strength-guidance-card">
          <div class="strength-guidance-title">First Week Guidance</div>
          <ul class="strength-guidance-list">
            <li>Start lighter than you think you need.</li>
            <li>You should finish each set feeling like you still had 2-3 good reps left.</li>
            <li>If form breaks down, the weight is too heavy.</li>
            <li>Controlled reps matter more than load.</li>
            <li>For back-sensitive movements, especially Romanian deadlifts, use caution and stay conservative.</li>
            <li>It is better to leave the gym feeling capable than wrecked.</li>
          </ul>
          <div class="strength-guidance-meta">Rest 60 seconds between sets. For squat and Romanian deadlift, use 75-90 seconds if needed. Complete all 3 sets of one exercise before moving to the next exercise.</div>
          <div class="strength-guidance-warning">Back safety: Romanian deadlift is a technique exercise first, goblet squat depth only goes as low as posture stays solid, rows should avoid twisting or jerking, and if low-back discomfort appears, reduce load, shorten range, or stop the movement.</div>
        </div>
      </div>
      <div class="strength-actions">
        ${isComplete
          ? `<button id="start-strength-session" type="button" class="secondary-button">${escapeHtml(strengthAction.label)}</button>`
          : isDue || isInProgress
            ? `<button id="start-strength-session" type="button">${escapeHtml(strengthAction.label)}</button>`
            : `<button id="start-strength-session" type="button" class="secondary-button">${escapeHtml(strengthAction.label)}</button>`}
      </div>
    </div>
    <div class="strength-list">
      ${exercises.map((exercise, exerciseIndex) => `
          ${(() => {
            const last = getLastExercisePerformance(exercise.name);
            const lastWeight = last?.exercise?.actualSets?.find((set) => set.weight)?.weight || "";
            const lastReps = last?.exercise?.actualSets?.map((set) => set.reps).filter(Boolean).join("/") || "";
            const helpEntry = getExerciseHelpEntry(exercise.helpSlug || exercise.name);
            const alternateEntry = exercise.alternateHelpSlug ? getExerciseHelpEntry(exercise.alternateHelpSlug) : null;
            const starter = getExerciseStartingGuidance(exercise);
            const increaseMarker = getLastIncreaseMarker(exercise.name);
            return `
        <article class="strength-exercise">
          <div class="strength-exercise-top">
            <div>
              <div class="strength-exercise-name">${escapeHtml(exercise.name)}</div>
              <div class="strength-exercise-meta">${escapeHtml(helpEntry?.description || "Simple full-body strength work.")}</div>
              ${helpEntry?.primaryCue ? `<div class="strength-primary-cue">${escapeHtml(helpEntry.primaryCue)}</div>` : ""}
              <div class="strength-cues">
                ${(helpEntry?.quickCues || []).slice(0, 3).map((cue) => `<span class="cue-chip subtle">${escapeHtml(cue)}</span>`).join("")}
              </div>
              <div class="strength-help-actions">
                <button type="button" class="secondary-button exercise-help-trigger" data-help-slug="${escapeHtml(exercise.helpSlug || exercise.name)}" ${exercise.alternateHelpSlug ? `data-help-alt="${escapeHtml(exercise.alternateHelpSlug)}"` : ""}>How to Do This</button>
                ${alternateEntry ? `<span class="strength-exercise-meta">Alternative available: ${escapeHtml(alternateEntry.name)}</span>` : ""}
              </div>
              <div class="strength-exercise-meta">Target ${escapeHtml(String(exercise.targetSets || exercise.sets))} x ${escapeHtml(String(exercise.targetReps || exercise.reps))}</div>
              <div class="strength-exercise-meta">Last: ${escapeHtml(lastWeight || "--")} ${lastReps ? `for ${escapeHtml(lastReps)}` : ""}</div>
              ${!last ? `<div class="strength-starting-meta">${escapeHtml(starter.summaryText)}</div>` : ""}
              ${!last && helpEntry?.recommendedStartingNote ? `<div class="strength-exercise-meta">${escapeHtml(helpEntry.recommendedStartingNote)}</div>` : ""}
              ${!last && helpEntry?.backSensitivityNote ? `<div class="strength-safety-note">${escapeHtml(helpEntry.backSensitivityNote)}</div>` : ""}
              ${increaseMarker ? `<div class="strength-increase-reminder">Marked to increase from last time</div>` : ""}
              <div class="strength-exercise-meta">${escapeHtml(getExerciseProgressionSuggestion(exercise))}</div>
            </div>
          </div>
          <div class="strength-sets">
            ${(exercise.actualSets || []).map((set, setIndex) => `
              <div class="strength-set-row">
                <span class="strength-set-label">Set ${setIndex + 1}</span>
                <input data-strength-exercise="${exerciseIndex}" data-strength-set="${setIndex}" data-strength-field="weight" type="text" inputmode="decimal" placeholder="wt" value="${escapeHtml(String(set.weight ?? ""))}">
                <input data-strength-exercise="${exerciseIndex}" data-strength-set="${setIndex}" data-strength-field="reps" type="text" inputmode="decimal" placeholder="reps" value="${escapeHtml(String(set.reps ?? ""))}">
                <button type="button" class="secondary-button strength-complete-set" data-strength-exercise="${exerciseIndex}" data-strength-set="${setIndex}">${set.completed ? "Done" : "Set"}</button>
              </div>
            `).join("")}
          </div>
          <label class="checkbox-row compact strength-increase-toggle">
            <input type="checkbox" data-strength-exercise-flag="${exerciseIndex}" ${exercise.increaseNextTime ? "checked" : ""}>
            Increase next time
          </label>
          ${exercise.increaseNextTime ? `<div class="strength-flag-badge">Marked to increase</div>` : ""}
        </article>
      `;
        })()}
      `).join("")}
    </div>
    <div class="strength-footer">
      <label class="quick-field">
        <span>Duration (min)</span>
        <input id="strength-duration" type="number" min="5" max="180" step="5" value="${session?.durationMinutes ?? state.strengthSettings.defaultWorkoutDuration}">
      </label>
      <label class="quick-field">
        <span>Workout score</span>
        <select id="strength-score">
          <option value="">Auto</option>
          ${[0, 1, 2, 3, 4, 5].map((value) => `<option value="${value}" ${session?.workoutScoreOverride === value ? "selected" : ""}>${value}</option>`).join("")}
        </select>
      </label>
      <label class="quick-field quick-notes">
        <span>Workout note</span>
        <input id="strength-note" type="text" maxlength="160" value="${escapeHtml(session?.note || "")}" placeholder="Strong session, bench felt better, left one rep in reserve">
      </label>
      <div class="strength-footer-actions">
        <button id="save-strength-session" type="button">Save Workout</button>
      </div>
    </div>
  `;

  const startButton = document.getElementById("start-strength-session");
  if (startButton) {
    startButton.addEventListener("click", () => handleStrengthPrimaryAction(summary, { switchTab: false }));
  }

  for (const input of strengthCard.querySelectorAll("[data-strength-field]")) {
    input.addEventListener("input", handleStrengthDraftChange);
  }
  for (const button of strengthCard.querySelectorAll(".strength-complete-set")) {
    button.addEventListener("click", handleStrengthSetToggle);
  }
  for (const button of strengthCard.querySelectorAll(".exercise-help-trigger")) {
    button.addEventListener("click", () => openExerciseHelp(button.dataset.helpSlug, button.dataset.helpAlt || null));
  }
  for (const input of strengthCard.querySelectorAll("[data-strength-exercise-flag]")) {
    input.addEventListener("change", handleStrengthIncreaseToggle);
  }
  const saveWorkoutButton = document.getElementById("save-strength-session");
  if (saveWorkoutButton) {
    saveWorkoutButton.addEventListener("click", saveStrengthSession);
  }
}

function renderSignals(summary) {
  signalsList.innerHTML = summary.signals.length
    ? summary.signals.map((signal) => `<div class="signal-card">${escapeHtml(signal)}</div>`).join("")
    : `<div class="empty-state">Signals will appear once the app has enough trend context.</div>`;
}

function renderScorecard(summary) {
  const card = summary.scorecard;
  scorecardCard.innerHTML = `
    <div class="scorecard-grid">
      <div class="scorecard-stat"><strong>${card.completedWorkouts}</strong><span>workouts completed / ${card.plannedWorkouts} planned</span></div>
      <div class="scorecard-stat"><strong>${formatMaybe(card.averageEatingScore, 1)}</strong><span>avg eating score</span></div>
      <div class="scorecard-stat"><strong>${card.inControlDays}</strong><span>1-2 days</span></div>
      <div class="scorecard-stat"><strong>${card.offTrackDays}</strong><span>4-5 days</span></div>
      <div class="scorecard-stat"><strong>${formatSigned(card.weightChange, 1)}</strong><span>weight change</span></div>
      <div class="scorecard-stat"><strong>${formatSigned(card.bodyFatChange, 1)}</strong><span>body fat change</span></div>
      <div class="scorecard-stat"><strong>${card.consistencyScore}</strong><span>consistency score</span></div>
    </div>
    <div class="scorecard-copy">
      <p><strong>What went well:</strong> ${escapeHtml(card.wentWell)}</p>
      <p><strong>What slipped:</strong> ${escapeHtml(card.slipped)}</p>
      <p><strong>Next focus:</strong> ${escapeHtml(card.nextFocus)}</p>
    </div>
  `;
}

function renderProgress(summary) {
  progressCard.innerHTML = `
    <div class="progress-copy">
      <div class="progress-region-card">
        <div class="today-focus-label">Current Region</div>
        <div class="dispatch-title">${escapeHtml(summary.region.currentRegion.name)}</div>
        <div class="dispatch-copy">${escapeHtml(summary.region.currentRegion.focus)}</div>
      </div>
      <p>${escapeHtml(summary.progress.workoutSummary)}</p>
      <p>${escapeHtml(summary.progress.liftSummary)}</p>
      <p>${escapeHtml(summary.progress.eatingSummary)}</p>
      <p>${escapeHtml(summary.progress.weightSummary)}</p>
      <p>${escapeHtml(`Archive status: ${(summary.storyArchive || []).length} campaign entries recorded, from early survey marks to the current region.`)}</p>
      <div class="story-action-row">
        <button id="open-story-full" type="button" class="secondary-button">Read Full Story to Date</button>
        <button id="open-story-summary" type="button" class="secondary-button">Summary to Date</button>
      </div>
    </div>
  `;
  document.getElementById("open-story-full")?.addEventListener("click", () => {
    openStoryArchive("full");
  });
  document.getElementById("open-story-summary")?.addEventListener("click", () => {
    openStoryArchive("summary");
  });
}

function getEditableStrengthSession() {
  return state.meta.currentStrengthSession ||
    migrateStrengthSession(getStrengthSessionForDate(getSelectedDateKey()), state.strengthPlan) ||
    createStrengthSession(getSelectedDateKey());
}

function handleStrengthDraftChange(event) {
  const session = getEditableStrengthSession();
  const exerciseIndex = Number(event.target.dataset.strengthExercise);
  const setIndex = Number(event.target.dataset.strengthSet);
  const field = event.target.dataset.strengthField;
  session.exercises[exerciseIndex].actualSets[setIndex][field] = event.target.value;
  state.meta.currentStrengthSession = session;
}

function handleStrengthSetToggle(event) {
  const session = getEditableStrengthSession();
  const exerciseIndex = Number(event.currentTarget.dataset.strengthExercise);
  const setIndex = Number(event.currentTarget.dataset.strengthSet);
  const target = session.exercises[exerciseIndex].actualSets[setIndex];
  target.completed = !target.completed;
  state.meta.currentStrengthSession = session;
  render();
}

function handleStrengthIncreaseToggle(event) {
  const session = getEditableStrengthSession();
  const exerciseIndex = Number(event.target.dataset.strengthExerciseFlag);
  session.exercises[exerciseIndex].increaseNextTime = event.target.checked;
  state.meta.currentStrengthSession = session;
  render();
}

function getAutoWorkoutScore(session) {
  const completedSets = session.exercises.flatMap((exercise) => exercise.actualSets).filter((set) => set.completed).length;
  const totalSets = session.exercises.reduce((sum, exercise) => sum + exercise.actualSets.length, 0);
  const ratio = totalSets ? completedSets / totalSets : 0;
  if (!completedSets) {
    return 0;
  }
  if (ratio < 0.25) {
    return 1;
  }
  if (ratio < 0.75) {
    return 2;
  }
  const progressed = session.exercises.some((exercise) => exercise.progressed);
  return progressed ? 4 : 3;
}

function saveStrengthSession() {
  const session = getEditableStrengthSession();
  session.durationMinutes = clampNumber(document.getElementById("strength-duration")?.value, 5, 180, state.strengthSettings.defaultWorkoutDuration);
  session.note = (document.getElementById("strength-note")?.value || "").trim().slice(0, 160);
  const overrideValue = document.getElementById("strength-score")?.value;
  session.workoutScoreOverride = overrideValue === "" ? null : Number(overrideValue);
  session.exercises = session.exercises.map((exercise) => {
    const last = getLastExercisePerformance(exercise.name);
    const lastWeight = Number(last?.exercise?.actualSets?.find((set) => set.weight)?.weight || 0);
    const currentWeight = Number(exercise.actualSets.find((set) => set.weight)?.weight || 0);
    const targetReps = Number(exercise.targetReps || 0);
    const allSetsHit = exercise.actualSets.every((set) => Number(set.reps || 0) >= targetReps);
    return {
      ...exercise,
      completed: exercise.actualSets.every((set) => set.completed || (set.weight || set.reps)),
      progressed: currentWeight > lastWeight || allSetsHit,
      pr: currentWeight > lastWeight,
      increaseNextTime: Boolean(exercise.increaseNextTime),
    };
  });
  const completedSets = session.exercises.flatMap((exercise) => exercise.actualSets).filter((set) => set.completed || set.weight || set.reps).length;
  const totalSets = session.exercises.reduce((sum, exercise) => sum + exercise.actualSets.length, 0);
  session.completed = totalSets ? completedSets / totalSets >= 0.75 : false;
  session.workoutScore = session.workoutScoreOverride ?? getAutoWorkoutScore(session);

  state.strengthHistory = [
    ...state.strengthHistory.filter((item) => item.date !== session.date),
    session,
  ].sort((a, b) => a.date.localeCompare(b.date));
  state.meta.currentStrengthSession = null;
  saveState();
  render();
  setStatus(`Saved Strength Quest session for ${formatDisplayDate(session.date)}.`);
}

function buildSignals(loggedEntries, weekly, strengthSummary) {
  const signals = [];
  if (weekly.latestWeeklyWeightAverage != null && weekly.priorWeightAverage != null) {
    signals.push(
      weekly.latestWeeklyWeightAverage <= weekly.priorWeightAverage
        ? "Weight trend is still moving down over the last 7 days."
        : "Weight trend has flattened recently."
    );
  }
  const workoutsThisWeek = strengthSummary.progress.workoutsThisWeek.length;
  signals.push(`You completed ${workoutsThisWeek} of ${state.strengthSettings.daysPerWeek} strength workouts this week.`);
  const recentFood = loggedEntries.slice(-14).filter((day) => day.mode === "full");
  const priorFood = loggedEntries.slice(-28, -14).filter((day) => day.mode === "full");
  if (recentFood.length >= 4 && priorFood.length >= 4) {
    const recentAverage = average(recentFood.map((day) => getUnifiedFoodMetric(day)).filter((value) => value != null));
    const priorAverage = average(priorFood.map((day) => getUnifiedFoodMetric(day)).filter((value) => value != null));
    if (recentAverage != null && priorAverage != null && recentAverage > priorAverage) {
      signals.push("Food control improved compared to the prior block.");
    }
  }
  const recentWarningDays = loggedEntries.slice(-5).filter((day) =>
    day.foodModel === "structure-v1"
      ? (day.foodStructureScore ?? 0) <= 2
      : ((day.food?.dinner ?? 0) >= 3 || (day.food?.other ?? 0) >= 3)
  ).length;
  if (recentWarningDays >= 3) {
    signals.push("You've had three warning/off-track eating days in the last 5 days.");
  }
  if (workoutsThisWeek >= 2) {
    signals.push("Strength consistency is improving.");
  }
  const region = computeRegionState(loggedEntries, strengthSummary).currentRegion;
  signals.push(`Current region: ${region.name}. ${region.focus}`);
  return signals.slice(0, 5);
}

function buildWeeklyScorecard(loggedEntries, weekly, strengthSummary) {
  const recentWeek = loggedEntries.slice(-7);
  const currentRegion = computeRegionState(loggedEntries, strengthSummary).currentRegion;
  const recentBody = recentWeek.filter((day) => day.bodyFat != null);
  const recentWeights = recentWeek.filter((day) => day.weight != null);
  const eatingDays = recentWeek.filter((day) => day.mode === "full" && (day.foodModel === "structure-v1" || day.answeredMeals.length));
  const eatingAverages = eatingDays.map((day) => getUnifiedFoodMetric(day)).filter((value) => value != null);
  const inControlDays = eatingDays.filter((day) => day.foodModel === "structure-v1" ? (day.foodStructureScore ?? 0) >= 4 : (getLegacyFoodAverage(day) ?? 99) <= 2).length;
  const offTrackDays = eatingDays.filter((day) => day.foodModel === "structure-v1" ? (day.foodStructureScore ?? 0) <= 2 : (getLegacyFoodAverage(day) ?? 0) >= 4).length;
  const consistencyScore = Math.round(
    (Math.min(1, strengthSummary.progress.workoutsThisWeek.length / Math.max(1, state.strengthSettings.daysPerWeek)) * 40) +
    (Math.min(1, inControlDays / Math.max(1, eatingAverages.length || 1)) * 35) +
    (Math.min(1, (weekly.avgStepsLogged || 0) / Math.max(1, state.settings.stepGoal)) * 25)
  );

  return {
    completedWorkouts: strengthSummary.progress.workoutsThisWeek.length,
    plannedWorkouts: state.strengthSettings.daysPerWeek,
    averageEatingScore: eatingAverages.length ? average(eatingAverages) : null,
    inControlDays,
    offTrackDays,
    weightChange: recentWeights.length >= 2 ? recentWeights[recentWeights.length - 1].weight - recentWeights[0].weight : null,
    bodyFatChange: recentBody.length >= 2 ? recentBody[recentBody.length - 1].bodyFat - recentBody[0].bodyFat : null,
    consistencyScore,
    wentWell: strengthSummary.progress.workoutsThisWeek.length >= 3 ? "You completed all planned training and reinforced capacity." : inControlDays >= 4 ? "Food control held together on most logged days." : "You kept the campaign honest by logging and staying engaged.",
    slipped: offTrackDays >= 2 ? "Late-day drift showed up more than once." : weekly.avgStepsLogged != null && weekly.avgStepsLogged < state.settings.stepGoal * 0.75 ? "Movement volume fell below target." : "Nothing major slipped, but the edges still need guarding.",
    nextFocus: offTrackDays >= 2 ? "Reduce late-day drift." : strengthSummary.progress.workoutsThisWeek.length < state.strengthSettings.daysPerWeek ? "Finish all scheduled strength sessions." : currentRegion.phase === "early" ? "Keep building repeatable structure." : currentRegion.phase === "middle" ? "Protect rhythm and avoid false summits." : "Refine the system without softening standards.",
  };
}

function buildProgressSummary(loggedEntries, weekly, strengthSummary) {
  const liftSummaryText = strengthSummary.progress.liftProgress.length
    ? strengthSummary.progress.liftProgress
      .slice(0, 3)
      .map((lift) => `${lift.name} ${lift.firstWeight || 0} lb to ${lift.latestWeight || 0} lb`)
      .join(" | ")
    : null;
  return {
    workoutSummary: `You logged ${strengthSummary.progress.workoutsThisMonth.length} strength workouts in the last 30 days.`,
    liftSummary: liftSummaryText ? `Lift progress: ${liftSummaryText}.` : "Log a few workouts to start seeing lift progress milestones.",
    eatingSummary: `You stayed in control on ${buildWeeklyScorecard(loggedEntries, weekly, strengthSummary).inControlDays} of the last 7 logged days.`,
    weightSummary: weekly.latestWeeklyWeightAverage != null && weekly.priorWeightAverage != null && weekly.latestWeeklyWeightAverage <= weekly.priorWeightAverage
      ? "Trend is still down despite normal day-to-day scale noise."
      : "Daily scale is noisy. Use the rolling average to judge direction.",
  };
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows) {
  return rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
}

function exportCsv(type) {
  const scored = computeSummary().timelineLogged;
  let rows = [];
  let filename = "";

  if (type === "food") {
    filename = `health-quest-food-${getTodayKey()}.csv`;
    rows = [[
      "date", "food_model", "morning", "lunch", "afternoon", "dinner", "other",
      "breakfast_controlled", "lunch_anchor_meal", "afternoon_snack_controlled", "dinner_portion_controlled", "no_night_eating",
      "food_structure_score", "food_note", "food_structure_note"
    ]].concat(
      scored.map((day) => [
        day.date,
        day.foodModel || "legacy",
        day.food.morning ?? "",
        day.food.lunch ?? "",
        day.food.afternoon ?? "",
        day.food.dinner ?? "",
        day.food.other ?? "",
        day.foodStructure?.breakfastControlled ? 1 : 0,
        day.foodStructure?.lunchAnchorMeal ? 1 : 0,
        day.foodStructure?.afternoonSnackControlled ? 1 : 0,
        day.foodStructure?.dinnerPortionControlled ? 1 : 0,
        day.foodStructure?.noNightEating ? 1 : 0,
        day.foodStructureScore ?? "",
        day.foodNote || "",
        day.foodStructureNote || "",
      ])
    );
  } else if (type === "body") {
    filename = `health-quest-body-${getTodayKey()}.csv`;
    rows = [["date", "weight", "body_fat", "steps", "exercise_minutes"]].concat(
      scored.map((day) => [day.date, day.weight ?? "", day.bodyFat ?? "", day.steps ?? 0, day.exerciseMinutes ?? 0])
    );
  } else if (type === "strength") {
    filename = `health-quest-strength-${getTodayKey()}.csv`;
    rows = [["date", "workout", "completed", "duration_minutes", "workout_score", "exercise", "set", "weight", "reps"]].concat(
      state.strengthHistory.flatMap((session) => session.exercises.flatMap((exercise) => exercise.actualSets.map((set, index) => [
        session.date,
        session.workoutName,
        session.completed,
        session.durationMinutes,
        session.workoutScore,
        exercise.name,
        index + 1,
        set.weight ?? "",
        set.reps ?? "",
      ])))
    );
  } else {
    filename = `health-quest-summary-${getTodayKey()}.csv`;
    rows = [["date", "score", "steps", "exercise", "food_points", "habit_points", "body_points", "day_type"]].concat(
      scored.map((day) => [day.date, day.totalScore, day.steps, day.exerciseMinutes, day.foodPoints, day.habitPoints, day.bodyMetricPoints, day.dayType])
    );
  }

  downloadTextFile(filename, toCsv(rows), "text/csv;charset=utf-8");
  setStatus(`Exported ${type.toUpperCase()} CSV.`);
}

function renderCharts(summary) {
  const weightDays = summary.timelineLogged.filter((day) => day.weight != null);
  const bodyFatDays = summary.timelineLogged.filter((day) => day.bodyFat != null);
  const scoreDays = summary.timelineLogged;

  chartWrap.innerHTML = `
    ${renderLineChart("Weight", weightDays, "weight", state.settings.weightGoal, buildRollingAverageSeries(weightDays, "weight"))}
    ${renderLineChart("Body Fat %", bodyFatDays, "bodyFat", state.settings.bodyFatGoal, buildRollingAverageSeries(bodyFatDays, "bodyFat"))}
    ${renderLineChart("Daily Score", scoreDays, "totalScore", dayThresholds.win, buildRollingAverageSeries(scoreDays, "totalScore"))}
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
  const seriesStats = buildSeriesSummary(data, key);
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
        <span>7-day avg: ${formatMaybe(seriesStats.currentAverage ?? currentAverage, decimals)}</span>
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

function getRecentWindowLabel(data) {
  if (!data.length) {
    return "Recent change";
  }

  const latestDate = new Date(`${data[data.length - 1].date}T12:00:00`);
  const cutoff = new Date(latestDate);
  cutoff.setDate(cutoff.getDate() - 30);
  const recentWindow = data.filter((item) => new Date(`${item.date}T12:00:00`) >= cutoff);
  if (recentWindow.length <= 1) {
    return recentWindow.length ? "Last logged span" : "Recent change";
  }
  const earliestRecent = new Date(`${recentWindow[0].date}T12:00:00`);
  const daySpan = Math.max(1, Math.round((latestDate - earliestRecent) / 86400000));
  return daySpan >= 27 ? "Last 30 days" : `Last ${daySpan} days`;
}

function buildSeriesSummary(data, key) {
  const stats = getSeriesStats(data, key);
  const currentAverage = buildRollingAverageSeries(data, key).slice(-1)[0]?.value ?? null;
  return {
    ...stats,
    currentAverage,
    recentLabel: getRecentWindowLabel(data),
  };
}

function buildGuardrails(summary) {
  const messages = [];
  if (
    summary.weekly.latestWeeklyWeightAverage != null &&
    summary.weekly.bestSevenDayWeightAverage != null &&
    summary.weekly.latestWeeklyWeightAverage <= summary.weekly.bestSevenDayWeightAverage + 0.3
  ) {
    messages.push("You are still near your best recent trend. Don't overreact to one weigh-in.");
  }
  if (
    summary.today.weight != null &&
    summary.weekly.latestWeeklyWeightAverage != null &&
    summary.weekly.priorWeightAverage != null &&
    summary.today.weight > summary.weekly.latestWeeklyWeightAverage &&
    summary.weekly.latestWeeklyWeightAverage <= summary.weekly.priorWeightAverage + 0.1
  ) {
    messages.push("Daily scale is noisy. Trend is more stable than today's reading.");
  }
  if (summary.weekly.avgStepsLogged != null && summary.weekly.avgStepsLogged < state.settings.stepGoal * 0.75) {
    messages.push("Movement volume has slipped below target.");
  }
  if (summary.weekly.avgExerciseLogged != null && summary.weekly.avgExerciseLogged < state.settings.exerciseGoal * 0.6) {
    messages.push("Exercise consistency is falling off.");
  }
  if (summary.weekly.avgFoodPointsLogged != null && summary.weekly.avgFoodPointsLogged < 18) {
    messages.push("Food quality / control is probably the main leak right now.");
  }
  if (summary.weekly.loggedDays < 4) {
    messages.push(`You logged only ${summary.weekly.loggedDays} of the last 7 days.`);
  }
  if (
    summary.weekly.latestScoreAverage != null &&
    summary.weekly.priorScoreAverage != null &&
    summary.weekly.latestScoreAverage < summary.weekly.priorScoreAverage - 5
  ) {
    messages.push("Average score is down this week.");
  }
  if (!messages.length) {
    messages.push("Weekly trend is steady. Keep the system simple and consistent.");
  }
  return messages;
}

function getBossFight(context) {
  const recent = context.loggedEntries.slice(-5);
  if (context.loggedEntries.length < 3) {
    return bossFightLibrary.find((item) => item.key === "maintenance_amnesia");
  }

  const loggingDays = context.weekly.loggedDays;
  const latestWeight = recent.filter((day) => day.weight != null).slice(-1)[0]?.weight ?? null;
  const previousWeight = recent.filter((day) => day.weight != null).slice(-2, -1)[0]?.weight ?? null;
  const highFoodDays = recent.filter((day) => day.mode === "full" && day.foodPoints <= 8).length;
  const sparseFoodLogging = recent.some((day) => day.mode === "full" && (
    day.foodModel === "structure-v1"
      ? (day.foodStructureScore ?? 0) <= 2
      : (day.answeredMeals?.length || 0) <= 2
  ));
  const highActivity = recent.some((day) => day.exerciseMinutes >= state.settings.exerciseGoal * 1.4);
  const socialPattern = recent.some((day) => /party|birthday|client|dinner|lunch|social|restaurant/i.test(day.notes || ""));

  if (latestWeight != null && previousWeight != null && latestWeight < previousWeight - 0.5) {
    return bossFightLibrary.find((item) => item.key === (context.regularStreak >= 4 ? "drift_after_victory" : "false_summit"));
  }

  if (highFoodDays >= 2) {
    return bossFightLibrary.find((item) => item.key === "reward_creep");
  }

  if (socialPattern || loggingDays < 4 || sparseFoodLogging) {
    return bossFightLibrary.find((item) => item.key === (socialPattern ? "social_current" : "fog_of_close_enough"));
  }

  if (recent.some((day) => day.mode === "full" && (
    day.foodModel === "structure-v1"
      ? (day.foodStructureScore ?? 0) <= 2
      : mealSlots.some((slot) => (day.food?.[slot] ?? 0) >= 4)
  ))) {
    return bossFightLibrary.find((item) => item.key === "the_easy_extra");
  }

  if (highActivity) {
    return bossFightLibrary.find((item) => item.key === "underfuel_overreach");
  }

  if (context.regularStreak >= 5) {
    return bossFightLibrary.find((item) => item.key === "drift_after_victory");
  }

  return bossFightLibrary.find((item) => item.key === "quiet_rationalization");
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
  const storyRewardsMarkup = (summary.storyRewards || []).length
    ? `
      <div class="reward-subsection">
        <div class="today-focus-label">Campaign Unlocks</div>
        ${(summary.storyRewards || []).map((reward) => `
          <article class="reward-card unlocked story-reward-card">
            <div>
              <div class="reward-title">${escapeHtml(reward.title)}</div>
              <div class="reward-meta">${escapeHtml(reward.label)}</div>
            </div>
            <div class="reward-story-detail">${escapeHtml(reward.detail)}</div>
          </article>
        `).join("")}
      </div>
    `
    : "";

  const customRewardsMarkup = summary.rewards.length
    ? `
      <div class="reward-subsection">
        <div class="today-focus-label">Custom Rewards</div>
        ${summary.rewards
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
                ${reward.unlocked && !reward.claimed ? "" : "disabled"}
              >${reward.claimed ? "Claimed" : reward.unlocked ? "Claim Reward" : "Locked"}</button>
            </article>
          `)
          .join("")}
      </div>
    `
    : `<div class="empty-state">Add rewards that unlock by level, streak, logged days, or a new lowest 7-day average weight.</div>`;

  rewardList.innerHTML = `${storyRewardsMarkup}${customRewardsMarkup}`;

  for (const button of rewardList.querySelectorAll(".reward-button")) {
    button.addEventListener("click", (event) => toggleRewardClaim(event.currentTarget.dataset.rewardId));
  }
}

function renderStory(summary) {
  const chapter = summary.currentChapter;
  const archiveMode = state.meta.storyArchiveMode || "summary";
  const mapMarkup = `
    <div class="region-map">
      ${regionDefinitions.map((region) => `
        <div class="region-node ${summary.region.unlockedRegionIds.includes(region.id) ? "unlocked" : ""} ${summary.region.currentRegionId === region.id ? "current" : ""}">
          <div class="region-node-title">${escapeHtml(region.name)}</div>
          <div class="region-node-meta">${escapeHtml(region.rewardTitle)}</div>
        </div>
      `).join("")}
    </div>
  `;
  const archiveMarkup = archiveMode === "full"
    ? `
      <div class="story-archive-list">
        ${(summary.storyArchive || []).map((event) => `
          <article class="archive-entry">
            <div class="story-kicker">${escapeHtml(formatDisplayDate(event.date))}</div>
            <h4>${escapeHtml(event.title)}</h4>
            <p><strong>${escapeHtml(event.subtitle)}</strong></p>
            <p>${escapeHtml(event.body)}</p>
            ${event.reward ? `<div class="archive-reward">Unlocked: ${escapeHtml(event.reward.title)}</div>` : ""}
          </article>
        `).join("")}
      </div>
    `
    : `
      <div class="story-summary-card">
        <p>${escapeHtml(summary.storySummary)}</p>
      </div>
    `;
  storyCard.innerHTML = `
    <div class="story-kicker">${escapeHtml(campaignMeta.title)}</div>
    <h3>${escapeHtml(chapter.title)}</h3>
    <p><strong>${escapeHtml(chapter.subtitle)}</strong></p>
    <p>${escapeHtml(chapter.body)}</p>
    <p>${escapeHtml(campaignMeta.subtitle)}</p>
    <p>${escapeHtml(campaignMeta.themeLine)}</p>
    <div class="today-focus-label">Region Map</div>
    ${mapMarkup}
    <div class="story-action-row">
      <button id="story-summary-mode" type="button" class="secondary-button ${archiveMode === "summary" ? "active-story-button" : ""}">Summary to Date</button>
      <button id="story-full-mode" type="button" class="secondary-button ${archiveMode === "full" ? "active-story-button" : ""}">Read Full Story to Date</button>
    </div>
    ${archiveMarkup}
  `;
  document.getElementById("story-summary-mode")?.addEventListener("click", () => {
    openStoryArchive("summary");
  });
  document.getElementById("story-full-mode")?.addEventListener("click", () => {
    openStoryArchive("full");
  });
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
          ${day.mode === "full" ? `<span class="metric-pill">${day.foodModel === "structure-v1" ? `Food Structure ${day.foodStructureScore || 0}/5` : `Legacy Food ${day.foodPoints}/${scoringWeights.food.total}`}</span>` : ""}
          <span class="metric-pill">Habits ${day.habitPoints}/${Object.values(scoringWeights.habits).reduce((sum, value) => sum + value, 0)}</span>
          <span class="metric-pill">${day.weight != null ? `${day.weight} lb` : "No weight"}</span>
          <span class="metric-pill">${day.bodyFat != null ? `${day.bodyFat}% fat` : "No body fat"}</span>
        </div>
        ${day.notes ? `<div class="day-notes">${escapeHtml(day.notes)}</div>` : ""}
        ${day.foodNote ? `<div class="day-notes">Food note: ${escapeHtml(day.foodNote)}</div>` : ""}
        ${day.foodStructureNote ? `<div class="day-notes">Food structure note: ${escapeHtml(day.foodStructureNote)}</div>` : ""}
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

function getMealDisplayLabel(slot) {
  const labels = {
    morning: "AM",
    lunch: "Lunch",
    afternoon: "PM",
    dinner: "Dinner",
    other: "Other",
  };
  return labels[slot] || capitalize(slot);
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
  if (statusMessage) {
    statusMessage.textContent = message;
  }
}

function renderSection(name, target, callback) {
  if (!target) {
    return;
  }
  try {
    callback();
  } catch (error) {
    console.error(`Health Quest render failed in ${name}`, error);
    if ("innerHTML" in target) {
      target.innerHTML = `<div class="empty-state">This section hit a loading problem. Refresh once; if it persists, export JSON before changing anything.</div>`;
    }
    setStatus(`A section failed to render (${name}). The rest of the app is still available.`);
  }
}
