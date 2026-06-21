// Split Visualiser — frequency rebuild.
// You build a 1–2 week rotation of sessions, each session a set of EXERCISES
// (grouped under movement PATTERNS in the picker). Each exercise carries per-set
// muscle WEIGHTS (1 = primary mover, <1 = secondary); groups map to the SVG
// figure's REGION classes. The body map shades each region by how often it's a
// PRIMARY mover per week; secondary involvement only tints faintly. Frequency is
// the metric — weights just decide primary vs secondary, they don't sum to volume.

export type GroupKey =
  | "chest" | "frontDelts" | "sideDelts" | "rearDelts" | "traps" | "lats"
  | "lowerBack" | "biceps" | "triceps" | "forearms" | "core" | "quads"
  | "hamstrings" | "glutes" | "adductors" | "calves";

export interface Group {
  key: GroupKey;
  label: string;
  /** SVG path classes this group paints. */
  regions: string[];
  /** Surfaced in the coverage check (minor groups are coloured but not flagged). */
  major: boolean;
}

export const GROUPS: Group[] = [
  { key: "chest", label: "Chest", regions: ["upper-chest", "lower-chest"], major: true },
  { key: "frontDelts", label: "Front delts", regions: ["front-delts"], major: true },
  { key: "sideDelts", label: "Side delts", regions: ["side-delts"], major: true },
  { key: "rearDelts", label: "Rear delts", regions: ["rear-delts"], major: true },
  { key: "traps", label: "Traps", regions: ["upper-traps", "middle-traps", "lower-traps"], major: true },
  { key: "lats", label: "Lats / upper back", regions: ["lats-and-teres-major"], major: true },
  { key: "lowerBack", label: "Lower back", regions: ["spinal-erectors"], major: true },
  { key: "biceps", label: "Biceps", regions: ["biceps"], major: true },
  { key: "triceps", label: "Triceps", regions: ["triceps"], major: true },
  { key: "forearms", label: "Forearms", regions: ["forearms"], major: false },
  { key: "core", label: "Core", regions: ["abdominals", "serratus-and-obliques"], major: true },
  { key: "quads", label: "Quads", regions: ["quads"], major: true },
  { key: "hamstrings", label: "Hamstrings", regions: ["hamstrings"], major: true },
  { key: "glutes", label: "Glutes", regions: ["glutes"], major: true },
  { key: "adductors", label: "Adductors", regions: ["hip-adductors"], major: false },
  { key: "calves", label: "Calves", regions: ["calves"], major: true },
];

export const GROUP_BY_KEY: Record<string, Group> = Object.fromEntries(
  GROUPS.map((g) => [g.key, g]),
);

export type Family = "push" | "pull" | "legs" | "core" | "explosive";

/** Movement patterns — the collapsible groups in the exercise picker. */
export interface MovementPattern {
  key: string;
  label: string;
  family: Family;
}

export const PATTERNS: MovementPattern[] = [
  { key: "horizontal-push", label: "Horizontal push", family: "push" },
  { key: "vertical-push", label: "Vertical push", family: "push" },
  { key: "horizontal-pull", label: "Horizontal pull", family: "pull" },
  { key: "vertical-pull", label: "Vertical pull", family: "pull" },
  { key: "squat", label: "Squat (knee)", family: "legs" },
  { key: "hinge", label: "Hinge (hip)", family: "legs" },
  { key: "lunge", label: "Lunge (unilateral)", family: "legs" },
  { key: "calf", label: "Calves", family: "legs" },
  { key: "core", label: "Core / carry", family: "core" },
  { key: "explosive", label: "Explosive / Olympic", family: "explosive" },
];

export const PATTERN_BY_KEY: Record<string, MovementPattern> = Object.fromEntries(
  PATTERNS.map((p) => [p.key, p]),
);

export interface Exercise {
  key: string;
  name: string;
  /** Which movement pattern this lives under (the picker group). */
  pattern: string;
  /** Per-set muscle involvement: 1 = primary mover, <1 = secondary (faint). */
  weights: Partial<Record<GroupKey, number>>;
}

// Library: a coarse "(any)" generic per pattern (back-compat with the old keys),
// plus specific lifts. Every exercise must have ≥1 muscle at 1.0, or it trains
// nothing as a primary and stays invisible to the frequency count.
export const EXERCISES: Exercise[] = [
  // — horizontal push —
  { key: "hpush", name: "Horizontal push (any)", pattern: "horizontal-push", weights: { chest: 1, frontDelts: 1, triceps: 1, core: 0.5 } },
  { key: "bench", name: "Bench press", pattern: "horizontal-push", weights: { chest: 1, triceps: 0.5, frontDelts: 0.5 } },
  { key: "inclinebench", name: "Incline bench press", pattern: "horizontal-push", weights: { chest: 1, frontDelts: 0.75, triceps: 0.5 } },
  { key: "dip", name: "Dip", pattern: "horizontal-push", weights: { chest: 1, triceps: 0.75, frontDelts: 0.5 } },
  { key: "pushup", name: "Push-up", pattern: "horizontal-push", weights: { chest: 1, triceps: 0.5, frontDelts: 0.5, core: 0.25 } },
  { key: "tricepext", name: "Triceps extension", pattern: "horizontal-push", weights: { triceps: 1 } },

  // — vertical push —
  { key: "vpush", name: "Vertical push (any)", pattern: "vertical-push", weights: { frontDelts: 1, sideDelts: 1, triceps: 1, chest: 0.5, traps: 0.5 } },
  { key: "ohp", name: "Overhead press", pattern: "vertical-push", weights: { frontDelts: 1, sideDelts: 0.5, triceps: 0.5, traps: 0.25 } },
  { key: "lateralraise", name: "Lateral raise", pattern: "vertical-push", weights: { sideDelts: 1 } },

  // — horizontal pull —
  { key: "hpull", name: "Horizontal pull (any)", pattern: "horizontal-pull", weights: { lats: 1, traps: 1, rearDelts: 1, biceps: 1, forearms: 0.5, lowerBack: 0.5 } },
  { key: "row", name: "Barbell row", pattern: "horizontal-pull", weights: { lats: 1, traps: 0.75, rearDelts: 0.5, biceps: 0.5, lowerBack: 0.5 } },
  { key: "facepull", name: "Face pull", pattern: "horizontal-pull", weights: { rearDelts: 1, traps: 0.5 } },
  { key: "shrug", name: "Shrug", pattern: "horizontal-pull", weights: { traps: 1, forearms: 0.25 } },

  // — vertical pull —
  { key: "vpull", name: "Vertical pull (any)", pattern: "vertical-pull", weights: { lats: 1, biceps: 1, rearDelts: 0.5, traps: 0.5, forearms: 0.5 } },
  { key: "pullup", name: "Pull-up", pattern: "vertical-pull", weights: { lats: 1, biceps: 0.5, rearDelts: 0.25, forearms: 0.5 } },
  { key: "latpulldown", name: "Lat pulldown", pattern: "vertical-pull", weights: { lats: 1, biceps: 0.5, rearDelts: 0.25 } },
  { key: "curl", name: "Biceps curl", pattern: "vertical-pull", weights: { biceps: 1, forearms: 0.5 } },

  // — squat —
  { key: "squat", name: "Squat (any)", pattern: "squat", weights: { quads: 1, glutes: 1, adductors: 0.5, lowerBack: 0.5, hamstrings: 0.5 } },
  { key: "backsquat", name: "Back squat", pattern: "squat", weights: { quads: 1, glutes: 0.75, adductors: 0.5, lowerBack: 0.5 } },
  { key: "frontsquat", name: "Front squat", pattern: "squat", weights: { quads: 1, glutes: 0.5, core: 0.5, lowerBack: 0.5 } },
  { key: "legpress", name: "Leg press", pattern: "squat", weights: { quads: 1, glutes: 0.5 } },

  // — hinge —
  { key: "hinge", name: "Hinge (any)", pattern: "hinge", weights: { hamstrings: 1, glutes: 1, lowerBack: 1, lats: 0.5, forearms: 0.5, adductors: 0.5 } },
  { key: "rdl", name: "Romanian deadlift", pattern: "hinge", weights: { hamstrings: 1, glutes: 0.75, lowerBack: 0.5 } },
  { key: "deadlift", name: "Deadlift", pattern: "hinge", weights: { hamstrings: 1, glutes: 1, lowerBack: 1, traps: 0.5, quads: 0.5, forearms: 0.5 } },
  { key: "hipthrust", name: "Hip thrust", pattern: "hinge", weights: { glutes: 1, hamstrings: 0.5 } },
  { key: "legcurl", name: "Leg curl", pattern: "hinge", weights: { hamstrings: 1 } },

  // — lunge —
  { key: "lunge", name: "Lunge (any)", pattern: "lunge", weights: { quads: 1, glutes: 1, hamstrings: 0.5, adductors: 0.5, calves: 0.5 } },
  { key: "walkinglunge", name: "Walking lunge", pattern: "lunge", weights: { quads: 1, glutes: 0.75, hamstrings: 0.25, adductors: 0.25 } },
  { key: "bulgarian", name: "Bulgarian split squat", pattern: "lunge", weights: { quads: 1, glutes: 0.75, adductors: 0.25 } },

  // — calves —
  { key: "calfraise", name: "Calf raise", pattern: "calf", weights: { calves: 1 } },

  // — core / carry —
  { key: "core", name: "Core / carry (any)", pattern: "core", weights: { core: 1, lowerBack: 0.5, forearms: 0.5 } },
  { key: "plank", name: "Plank", pattern: "core", weights: { core: 1, lowerBack: 0.25 } },
  { key: "hangingleg", name: "Hanging leg raise", pattern: "core", weights: { core: 1, forearms: 0.25 } },
  { key: "cablecrunch", name: "Cable crunch", pattern: "core", weights: { core: 1 } },
  { key: "farmercarry", name: "Farmer's carry", pattern: "core", weights: { forearms: 1, traps: 0.75, core: 0.5 } },

  // — explosive / Olympic —
  { key: "snatch", name: "Snatch", pattern: "explosive", weights: { glutes: 1, hamstrings: 1, lowerBack: 1, traps: 1, quads: 0.75, sideDelts: 0.5, forearms: 0.5, calves: 0.5, core: 0.5 } },
  { key: "cleanjerk", name: "Clean & jerk", pattern: "explosive", weights: { glutes: 1, hamstrings: 1, lowerBack: 1, traps: 1, quads: 0.75, frontDelts: 0.5, triceps: 0.5, forearms: 0.5, calves: 0.5, core: 0.5 } },
  { key: "powerclean", name: "Power clean", pattern: "explosive", weights: { glutes: 1, hamstrings: 1, lowerBack: 1, traps: 1, quads: 0.5, forearms: 0.5, calves: 0.5, core: 0.5 } },
  { key: "powersnatch", name: "Power snatch", pattern: "explosive", weights: { glutes: 1, hamstrings: 1, lowerBack: 1, traps: 1, quads: 0.5, sideDelts: 0.5, forearms: 0.5, calves: 0.5 } },
  { key: "highpull", name: "High pull", pattern: "explosive", weights: { traps: 1, lowerBack: 1, glutes: 0.75, hamstrings: 0.75, rearDelts: 0.5, forearms: 0.5 } },
  { key: "powershrug", name: "Power shrug", pattern: "explosive", weights: { traps: 1, lowerBack: 0.5, glutes: 0.5, hamstrings: 0.5, forearms: 0.5 } },
];

export const EXERCISE_BY_KEY: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.key, e]),
);

/** Family (colour) of an exercise, via its pattern. */
export function familyOf(ex: Exercise): Family {
  return PATTERN_BY_KEY[ex.pattern]?.family ?? "core";
}

/** An exercise's per-set muscle contributions, heaviest first, for display. */
export function weightBreakdown(
  ex: Exercise,
): { key: GroupKey; label: string; weight: number }[] {
  return (Object.entries(ex.weights) as [GroupKey, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([key, weight]) => ({ key, label: GROUP_BY_KEY[key]?.label ?? key, weight }));
}

/** Weight at/above which an exercise counts that muscle as a primary mover. */
export const PRIMARY_WEIGHT = 1;

export interface SessionExercise {
  key: string;
  /** Working sets of this exercise — scales every muscle's per-set weight. */
  sets: number;
}

export interface Session {
  id: string;
  name: string;
  exercises: SessionExercise[];
}

/** Sets a freshly-added exercise starts with. */
export const DEFAULT_SETS = 3;

/** A rotation is 1–2 weeks; each week is a list of training sessions. */
export interface Rotation {
  name: string;
  weeks: Session[][];
}

export interface GroupFreq {
  /** Sessions per week this group is a primary mover. */
  primary: number;
  /** Sessions per week it's only a secondary mover. */
  secondary: number;
}

/** Per-group weekly frequency, averaged across the whole rotation. */
export function deriveFrequencies(rotation: Rotation): Record<GroupKey, GroupFreq> {
  const weeks = Math.max(1, rotation.weeks.length);
  const prim: Partial<Record<GroupKey, number>> = {};
  const sec: Partial<Record<GroupKey, number>> = {};

  for (const week of rotation.weeks) {
    for (const session of week) {
      for (const g of GROUPS) {
        // The heaviest involvement any exercise in the session gives this group.
        let maxW = 0;
        for (const se of session.exercises) {
          const w = EXERCISE_BY_KEY[se.key]?.weights[g.key] ?? 0;
          if (w > maxW) maxW = w;
        }
        // A session counts once per group: primary if some exercise targets it
        // (weight ≥ 1), else secondary if anything brushes it.
        if (maxW >= PRIMARY_WEIGHT) prim[g.key] = (prim[g.key] ?? 0) + 1;
        else if (maxW > 0) sec[g.key] = (sec[g.key] ?? 0) + 1;
      }
    }
  }

  const out = {} as Record<GroupKey, GroupFreq>;
  for (const g of GROUPS) {
    out[g.key] = { primary: (prim[g.key] ?? 0) / weeks, secondary: (sec[g.key] ?? 0) / weeks };
  }
  return out;
}

/**
 * Effective sets per muscle per week = Σ over every exercise of (sets × weight),
 * across the rotation ÷ weeks. Unlike frequency (count the session once), sets
 * SUM — two chest exercises in a day add up, and a 0.5 secondary weight adds half
 * a set per working set.
 */
export function deriveEffectiveSets(rotation: Rotation): Record<GroupKey, number> {
  const weeks = Math.max(1, rotation.weeks.length);
  const acc = {} as Record<GroupKey, number>;
  for (const g of GROUPS) acc[g.key] = 0;

  for (const week of rotation.weeks) {
    for (const session of week) {
      for (const se of session.exercises) {
        const ex = EXERCISE_BY_KEY[se.key];
        if (!ex) continue;
        for (const g of GROUPS) acc[g.key] += (ex.weights[g.key] ?? 0) * se.sets;
      }
    }
  }

  for (const g of GROUPS) acc[g.key] /= weeks;
  return acc;
}

/**
 * Practical weekly-set ceiling per muscle for a natural training heavy (~6–8RM).
 * NOT a hard biological limit — the dose–response keeps rising with diminishing
 * returns — but a defensible cost/benefit line: past here, extra hard sets mostly
 * buy fatigue, not muscle (few stimulating reps per heavy set + fatigue-capped
 * recoverable volume). Applied to the effective (fractional) sets figure above,
 * which already counts secondary work, so it sits a touch above a "direct sets"
 * count. Tunable. See README → References.
 */
export const SETS_CEILING = 8;

/** True once a muscle's effective weekly sets reach the ceiling ("fully utilised"). */
export function isFullyUtilised(sets: number, ceiling = SETS_CEILING): boolean {
  return sets >= ceiling;
}

// --- colour --------------------------------------------------------------
function hexLerp(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return "#" + c.map((v) => v.toString(16).padStart(2, "0")).join("");
}

const UNTRAINED = "#e2e8f0"; // slate-200
const SECONDARY_ONLY = "#fdebd9"; // faint orange

/** Region fill for a group's frequency. Primary drives the ramp; secondary-only
 * gets a faint tint so it reads as "touched, not trained". */
export function freqColor(f: GroupFreq, target: number): string {
  if (f.primary <= 0) return f.secondary > 0 ? SECONDARY_ONLY : UNTRAINED;
  const ratio = Math.min(1, f.primary / Math.max(0.5, target));
  return hexLerp("#fed7aa", "#ea580c", ratio); // orange-200 → orange-600
}

/** region class → fill colour, for a flat (image-less) body map. */
export function regionColors(
  freqs: Record<GroupKey, GroupFreq>,
  target: number,
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const g of GROUPS) {
    const color = freqColor(freqs[g.key], target);
    for (const r of g.regions) map[r] = color;
  }
  return map;
}

/** Orange tint opacity for one group over the musculature photo. Primary drives
 * the heat; a never-primary muscle stays transparent (plain muscle shows). */
export function regionOpacity(f: GroupFreq, target: number): number {
  if (f.primary <= 0) return f.secondary > 0 ? 0.14 : 0;
  const ratio = Math.min(1, f.primary / Math.max(0.5, target));
  return 0.3 + 0.45 * ratio;
}

/** region class → tint opacity, for the body map. */
export function regionOpacities(
  freqs: Record<GroupKey, GroupFreq>,
  target: number,
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const g of GROUPS) {
    const op = regionOpacity(freqs[g.key], target);
    for (const r of g.regions) map[r] = op;
  }
  return map;
}

export type CoverStatus = "ok" | "near" | "under" | "none";

export interface Coverage {
  key: GroupKey;
  label: string;
  primary: number;
  secondary: number;
  status: CoverStatus;
  major: boolean;
}

export function coverageStatus(primary: number, target: number): CoverStatus {
  if (primary <= 0) return "none";
  if (primary >= target) return "ok";
  if (primary >= target * 0.75) return "near";
  return "under";
}

export function coverage(
  freqs: Record<GroupKey, GroupFreq>,
  target: number,
): Coverage[] {
  return GROUPS.map((g) => {
    const f = freqs[g.key];
    return {
      key: g.key,
      label: g.label,
      primary: f.primary,
      secondary: f.secondary,
      status: coverageStatus(f.primary, target),
      major: g.major,
    };
  });
}

// --- seed ----------------------------------------------------------------
const LOWER = ["powerclean", "backsquat", "legcurl", "hipthrust", "calfraise", "hangingleg"];
const UPPER = ["bench", "ohp", "lateralraise", "row", "facepull", "curl", "tricepext"];
const mk = (id: string, name: string, keys: string[]): Session => ({
  id,
  name,
  exercises: keys.map((key) => ({ key, sets: DEFAULT_SETS })),
});

/** Lower/Upper/Lower · Upper/Lower/Upper — the user's example. */
export const SEED_ROTATION: Rotation = {
  name: "Lower / Upper alternating",
  weeks: [
    [mk("w1d1", "Lower A", LOWER), mk("w1d2", "Upper A", UPPER), mk("w1d3", "Lower B", LOWER)],
    [mk("w2d1", "Upper B", UPPER), mk("w2d2", "Lower C", LOWER), mk("w2d3", "Upper C", UPPER)],
  ],
};
