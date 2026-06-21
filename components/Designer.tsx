"use client";

import { useEffect, useMemo, useState } from "react";
import {
  deriveFrequencies,
  deriveEffectiveSets,
  regionOpacities,
  coverage,
  SEED_ROTATION,
  SETS_CEILING,
  isFullyUtilised,
  DEFAULT_SETS,
  type Rotation,
  type Session,
  type SessionExercise,
  type CoverStatus,
} from "@/lib/splitviz";
import { BodyMap } from "./BodyMap";
import { RotationBuilder } from "./RotationBuilder";

const STORAGE_KEY = "splitviz:rotation";

const fmt = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

const STATUS_RANK: Record<CoverStatus, number> = { none: 0, under: 1, near: 2, ok: 3 };
const STATUS_STYLE: Record<CoverStatus, string> = {
  none: "bg-slate-100 text-slate-400 ring-1 ring-slate-200",
  under: "bg-red-50 text-red-600 ring-1 ring-red-200",
  near: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  ok: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
};

// Why the ~8-set "fully utilised" line — both camps, on purpose: the high-volume
// dose–response it departs from, and the effective-reps / lower-volume case it rests on.
const REFERENCES: { title: string; href: string; note: string }[] = [
  { title: "Stronger by Science — Set Volume for Muscle Growth", href: "https://www.strongerbyscience.com/volume/", note: "dose–response, diminishing returns, no clear plateau" },
  { title: "Pelland et al. 2024 — training dose–response meta", href: "https://pubmed.ncbi.nlm.nih.gov/41343037/", note: "tracks volume to ~40–50 sets; the high-volume case" },
  { title: "Beardsley — stimulating (effective) reps", href: "https://www.patreon.com/posts/stimulating-reps-99706085", note: "~5 growth-driving reps per heavy set" },
  { title: "Beardsley — junk volume", href: "https://www.patreon.com/SandCResearch/posts/junk-volume-83579414", note: "sets past the stimulus mostly add fatigue" },
  { title: "Fisher, Steele et al. 2011 — Evidence-Based Resistance Training Recommendations", href: "https://pure.solent.ac.uk/ws/files/10205168/ms_2011_03_08_Fisher.pdf", note: "peer-reviewed: intensity of effort, not volume, is the primary driver" },
  { title: "Minor, Helms & Schepis 2020 — RE: Mesocycle Progression in Hypertrophy", href: "https://www.docdroid.net/bpAoChw/minor-b-et-al-2020-re-mesocycle-progression-in-hypertrophy-volume-versus-intensity-pdf", note: "peer-reviewed rebuttal of RP's progress-volume-to-MRV model" },
  { title: "Renaissance Periodization — volume landmarks", href: "https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth", note: "MEV/MAV/MRV; heavy compounds have lower MRV" },
  { title: "Set for Set — is low-volume training effective?", href: "https://www.setforset.com/blogs/news/is-low-volume-training-effective-for-muscle-growth-and-strength", note: "MEV ~4 hard sets" },
  { title: "Full Range Strength — critique of high-volume conclusions", href: "https://www.fullrangestrength.com/schoenfeld-training-volume.html", note: "viewpoint: effort over volume" },
];

export function Designer() {
  const [rotation, setRotation] = useState<Rotation>(SEED_ROTATION);
  const [target, setTarget] = useState(2);
  const [figure, setFigure] = useState<"female" | "male">("female");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Rotation;
        // Migrate old saves: `patterns` → `exercises`, and bare key strings →
        // { key, sets } objects.
        for (const week of parsed.weeks ?? []) {
          for (const s of week) {
            const legacy = s as Session & { patterns?: unknown };
            const items = (s.exercises ?? legacy.patterns ?? []) as Array<
              string | SessionExercise
            >;
            s.exercises = items.map((it) =>
              typeof it === "string" ? { key: it, sets: DEFAULT_SETS } : it,
            );
          }
        }
        setRotation(parsed);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rotation));
    } catch {
      /* ignore */
    }
  }, [rotation, hydrated]);

  const freqs = useMemo(() => deriveFrequencies(rotation), [rotation]);
  const sets = useMemo(() => deriveEffectiveSets(rotation), [rotation]);
  const opacities = useMemo(() => regionOpacities(freqs, target), [freqs, target]);
  const cover = useMemo(() => coverage(freqs, target), [freqs, target]);

  const problem = cover.filter(
    (c) => c.major && (c.status === "none" || c.status === "under"),
  ).length;
  const nearCount = cover.filter((c) => c.major && c.status === "near").length;
  const headline =
    problem > 0
      ? `${problem} group${problem > 1 ? "s" : ""} under-trained at ${fmt(target)}×/week.`
      : nearCount > 0
        ? `All groups trained — ${nearCount} just under ${fmt(target)}×/week.`
        : `Every major group hits ${fmt(target)}×/week or more.`;
  const majors = useMemo(
    () => cover.filter((c) => c.major).sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]),
    [cover],
  );

  // ---- rotation mutations -------------------------------------------------
  const mutateSession = (wi: number, sid: string, fn: (s: Session) => Session) =>
    setRotation((r) => ({
      ...r,
      weeks: r.weeks.map((wk, i) =>
        i !== wi ? wk : wk.map((s) => (s.id === sid ? fn(s) : s)),
      ),
    }));

  const onSetWeeks = (n: number) =>
    setRotation((r) => {
      if (n === r.weeks.length) return r;
      if (n < r.weeks.length) return { ...r, weeks: r.weeks.slice(0, n) };
      const extra = Array.from({ length: n - r.weeks.length }, () => [
        { id: crypto.randomUUID(), name: "Day 1", exercises: [] },
      ]);
      return { ...r, weeks: [...r.weeks, ...extra] };
    });

  const onRenameSession = (wi: number, sid: string, name: string) =>
    mutateSession(wi, sid, (s) => ({ ...s, name }));
  const onAddExercise = (wi: number, sid: string, ek: string) =>
    mutateSession(wi, sid, (s) => ({
      ...s,
      exercises: [...s.exercises, { key: ek, sets: DEFAULT_SETS }],
    }));
  const onRemoveExercise = (wi: number, sid: string, idx: number) =>
    mutateSession(wi, sid, (s) => ({
      ...s,
      exercises: s.exercises.filter((_, i) => i !== idx),
    }));
  const onSetExerciseSets = (wi: number, sid: string, idx: number, sets: number) =>
    mutateSession(wi, sid, (s) => ({
      ...s,
      exercises: s.exercises.map((e, i) =>
        i === idx ? { ...e, sets: Math.max(1, Math.min(12, sets)) } : e,
      ),
    }));
  const onAddSession = (wi: number) =>
    setRotation((r) => ({
      ...r,
      weeks: r.weeks.map((wk, i) =>
        i !== wi
          ? wk
          : [...wk, { id: crypto.randomUUID(), name: `Day ${wk.length + 1}`, exercises: [] }],
      ),
    }));
  const onRemoveSession = (wi: number, sid: string) =>
    setRotation((r) => ({
      ...r,
      weeks: r.weeks.map((wk, i) => (i !== wi ? wk : wk.filter((s) => s.id !== sid))),
    }));

  const reset = () => {
    setRotation(SEED_ROTATION);
    setTarget(2);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Split Visualiser
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Build a 1–2 week rotation from movement patterns and see every muscle
            shaded by how often you train it — so nothing gets left in the grey.
            Frequency is counted across the whole rotation ÷ weeks (so an
            alternating L/U/L · U/L/U reads ~1.5×/week each).
          </p>
        </div>
        <button
          onClick={reset}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
        >
          Reset to default
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
            {rotation.name}
          </h2>
          <RotationBuilder
            rotation={rotation}
            onSetWeeks={onSetWeeks}
            onRenameSession={onRenameSession}
            onAddExercise={onAddExercise}
            onRemoveExercise={onRemoveExercise}
            onSetExerciseSets={onSetExerciseSets}
            onAddSession={onAddSession}
            onRemoveSession={onRemoveSession}
          />
        </section>

        <section className="lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-800">Weekly coverage</h2>
              <div className="flex gap-1">
                {(["female", "male"] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFigure(f)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize transition-colors ${
                      figure === f
                        ? "bg-orange-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {hydrated ? (
              <BodyMap regionOpacity={opacities} figure={figure} />
            ) : (
              <div style={{ height: 360 }} />
            )}

            <div className="mt-3 flex items-center gap-3">
              <span className="shrink-0 text-xs font-medium text-slate-500">
                Target {fmt(target)}×/wk
              </span>
              <input
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={target}
                onChange={(e) => setTarget(Number(e.target.value))}
                className="min-w-0 flex-1 accent-orange-500"
              />
            </div>

            <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <p className="mb-2 text-xs font-medium text-slate-500">{headline}</p>
              <div className="flex flex-wrap gap-1.5">
                {majors.map((c) => {
                  const s = sets[c.key] ?? 0;
                  const full = isFullyUtilised(s);
                  return (
                    <span
                      key={c.key}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium ${STATUS_STYLE[c.status]}`}
                      title={`${c.label}: ${fmt(c.primary)}×/wk frequency · ${fmt(
                        s,
                      )} fractional sets/wk${full ? ` — fully utilised (≥${SETS_CEILING}/wk)` : ""}`}
                    >
                      {c.label}
                      <span className="tabular-nums opacity-80">{fmt(c.primary)}×</span>
                      <span
                        className={`tabular-nums ${full ? "font-semibold text-red-600" : "font-normal opacity-60"}`}
                      >
                        {fmt(s)} sets
                      </span>
                      {full && (
                        <span className="rounded bg-red-100 px-1 py-px text-[9px] font-semibold text-red-700">
                          fully utilised
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>

            <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
              Tint = primary frequency (faint → solid orange as it approaches
              target). The <span className="font-medium">sets</span> figure sums each
              exercise&apos;s working sets × its per-set weights (a 0.5 secondary = half
              a set each) — so it rises with work the frequency count ignores. Set the
              working sets per exercise with the ± steppers. A muscle is marked{" "}
              <span className="font-medium text-red-600">fully utilised</span> once its
              effective sets reach ~{SETS_CEILING}/week — a defensible ceiling for a
              natural training heavy (6–8RM), not a hard limit.
            </p>

            <details className="mt-2 text-[11px] leading-relaxed text-slate-400">
              <summary className="cursor-pointer select-none font-medium text-slate-500 hover:text-slate-700">
                Why ~{SETS_CEILING} sets? — references
              </summary>
              <ul className="mt-1.5 space-y-1">
                {REFERENCES.map((r) => (
                  <li key={r.href}>
                    <a
                      href={r.href}
                      target="_blank"
                      rel="noreferrer"
                      className="underline decoration-slate-300 underline-offset-2 hover:text-orange-600"
                    >
                      {r.title}
                    </a>
                    <span className="text-slate-400"> — {r.note}</span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </section>
      </div>
    </div>
  );
}
