"use client";

import { useState } from "react";
import type { Rotation, Family, Session, Exercise } from "@/lib/splitviz";
import {
  PATTERNS,
  PATTERN_BY_KEY,
  EXERCISES,
  EXERCISE_BY_KEY,
  familyOf,
  weightBreakdown,
} from "@/lib/splitviz";

const FAMILY_STYLE: Record<Family, string> = {
  push: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  pull: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  legs: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  core: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  explosive: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  machine: "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-300",
};

const FAMILY_DOT: Record<Family, string> = {
  push: "bg-sky-400",
  pull: "bg-violet-400",
  legs: "bg-emerald-400",
  core: "bg-amber-400",
  explosive: "bg-rose-400",
  machine: "bg-zinc-400",
};

function fractionLabel(w: number): string {
  if (w === 0.75) return "¾";
  if (w === 0.5) return "½";
  if (w === 0.25) return "¼";
  return `${w}`;
}

/** "Chest · Triceps ½ · Front delts ½" — fractions flag the half-sets. */
function breakdownText(ex: Exercise): string {
  return weightBreakdown(ex)
    .map((m) => (m.weight < 1 ? `${m.label} ${fractionLabel(m.weight)}` : m.label))
    .join(" · ");
}

interface Props {
  rotation: Rotation;
  onSetWeeks: (n: number) => void;
  onRenameSession: (wi: number, sid: string, name: string) => void;
  onAddExercise: (wi: number, sid: string, exerciseKey: string) => void;
  onRemoveExercise: (wi: number, sid: string, idx: number) => void;
  onSetExerciseSets: (wi: number, sid: string, idx: number, sets: number) => void;
  onAddSession: (wi: number) => void;
  onRemoveSession: (wi: number, sid: string) => void;
}

export function RotationBuilder(props: Props) {
  const weeks = props.rotation.weeks.length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-500">Rotation length</span>
        {[1, 2].map((n) => (
          <button
            key={n}
            onClick={() => props.onSetWeeks(n)}
            className={`rounded-md px-3 py-1 font-medium transition-colors ${
              weeks === n
                ? "bg-slate-800 text-white"
                : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {n} {n === 1 ? "week" : "weeks"}
          </button>
        ))}
      </div>

      <div className={`grid gap-4 ${weeks === 2 ? "lg:grid-cols-2" : "grid-cols-1"}`}>
        {props.rotation.weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-3">
            {weeks === 2 && (
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Week {wi + 1}
              </h3>
            )}
            {week.map((session) => (
              <SessionCard key={session.id} wi={wi} session={session} {...props} />
            ))}
            <button
              onClick={() => props.onAddSession(wi)}
              className="rounded-lg border border-dashed border-slate-300 py-2 text-sm font-medium text-slate-500 transition-colors hover:border-orange-400 hover:text-orange-600"
            >
              + Add session
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionCard({
  wi,
  session,
  onRenameSession,
  onAddExercise,
  onRemoveExercise,
  onSetExerciseSets,
  onRemoveSession,
}: { wi: number; session: Session } & Props) {
  const [picking, setPicking] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <input
          value={session.name}
          onChange={(e) => onRenameSession(wi, session.id, e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 font-semibold text-slate-800 hover:border-slate-200 focus:border-orange-400 focus:outline-none"
        />
        <button
          onClick={() => onRemoveSession(wi, session.id)}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          Remove
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        {session.exercises.map((se, idx) => {
          const ex = EXERCISE_BY_KEY[se.key];
          if (!ex) return null;
          return (
            <div
              key={`${se.key}-${idx}`}
              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1.5 ${FAMILY_STYLE[familyOf(ex)]}`}
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-semibold">{ex.name}</div>
                <div className="truncate text-[10px] opacity-70">
                  {breakdownText(ex)}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <div className="inline-flex items-center overflow-hidden rounded bg-white/70 text-slate-600">
                  <button
                    onClick={() => onSetExerciseSets(wi, session.id, idx, se.sets - 1)}
                    disabled={se.sets <= 1}
                    aria-label="Fewer sets"
                    className="px-1.5 py-0.5 hover:bg-black/5 disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="min-w-[1.5ch] text-center text-xs tabular-nums">
                    {se.sets}
                  </span>
                  <button
                    onClick={() => onSetExerciseSets(wi, session.id, idx, se.sets + 1)}
                    aria-label="More sets"
                    className="px-1.5 py-0.5 hover:bg-black/5"
                  >
                    +
                  </button>
                </div>
                <span className="text-[10px] opacity-60">sets</span>
                <button
                  onClick={() => onRemoveExercise(wi, session.id, idx)}
                  aria-label={`Remove ${ex.name}`}
                  className="px-1 opacity-50 hover:opacity-100"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
        {session.exercises.length === 0 && (
          <span className="py-1 text-xs text-slate-400">No exercises yet.</span>
        )}
      </div>

      <div className="mt-2 border-t border-slate-100 pt-2">
        <button
          onClick={() => setPicking((p) => !p)}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          {picking ? "Done" : "+ Add exercise"}
        </button>
        {picking && (
          <ExercisePicker onPick={(key) => onAddExercise(wi, session.id, key)} />
        )}
      </div>
    </div>
  );
}

/** Match on exercise name, its muscle breakdown, or its pattern label. */
function exerciseMatches(e: Exercise, q: string): boolean {
  if (!q) return true;
  if (e.name.toLowerCase().includes(q)) return true;
  if (breakdownText(e).toLowerCase().includes(q)) return true;
  const pat = PATTERN_BY_KEY[e.pattern];
  return pat ? pat.label.toLowerCase().includes(q) : false;
}

function ExercisePicker({ onPick }: { onPick: (key: string) => void }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const toggle = (k: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  // While searching, drop empty groups and force the rest open.
  const groups = PATTERNS.map((pat) => ({
    pat,
    exs: EXERCISES.filter((e) => e.pattern === pat.key && exerciseMatches(e, q)),
  })).filter((g) => !q || g.exs.length > 0);

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 p-2">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises or muscles…"
          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none"
        />
      </div>
      {groups.length === 0 && (
        <p className="px-3 py-3 text-xs text-slate-400">No exercises match.</p>
      )}
      {groups.map(({ pat, exs }) => {
        const open = q ? true : expanded.has(pat.key);
        return (
          <div key={pat.key} className="border-b border-slate-200 last:border-0">
            <button
              onClick={() => toggle(pat.key)}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-100"
            >
              <span className="flex items-center gap-2 font-medium text-slate-700">
                <span className={`h-2 w-2 rounded-full ${FAMILY_DOT[pat.family]}`} />
                {pat.label}
                <span className="text-xs font-normal text-slate-400">{exs.length}</span>
              </span>
              <span className="text-slate-400">{open ? "▾" : "▸"}</span>
            </button>
            {open && (
              <div className="flex flex-col gap-1 px-2 pb-2">
                {exs.map((e) => (
                  <button
                    key={e.key}
                    onClick={() => onPick(e.key)}
                    className={`flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors hover:brightness-95 ${FAMILY_STYLE[familyOf(e)]}`}
                  >
                    <span className="text-xs font-medium">+ {e.name}</span>
                    <span className="text-[10px] font-normal opacity-70">
                      {breakdownText(e)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
