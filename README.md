# Split Visualiser

A rebuild of the old Splitviz, keyed on **frequency** instead of relative
engagement. You build a 1–2 week rotation from movement patterns and every
muscle on the figure is shaded by how often you train it — so nothing balanced
gets left in the grey.

## The model

Three layers, each mapping to the next:

```
exercise (per-set weights)  →  muscle group  →  SVG region(s)
"bench press" {chest:1, triceps:0.5, frontDelts:0.5}  →  chest…  →  paths on figure
```

You add **specific exercises** to each session, searched or picked from a
collapsible list. Categories are a **hybrid**: compounds grouped by **movement
pattern** (horizontal/vertical push & pull, squat, hinge, lunge, explosive),
isolation grouped **by muscle** (Shoulders, Biceps, Triceps, Calves, Core) — so
curls and extensions sit where people look for them, not under "vertical pull" —
plus a **Machines** equipment group. Each exercise carries per-set muscle
**weights**: `1` = primary mover, `<1` = secondary. Colour follows *function*
(pec dec = push, face pull = pull) even inside the muscle/equipment groups, so the
session-card push/pull/legs balance still reads true. Generic "(any)" entries per
compound pattern stay available for coarse entry.

- **Frequency = sessions across the whole rotation ÷ rotation length in weeks.**
  An alternating L/U/L · U/L/U reads **1.5×/week** for each of upper and lower
  (3 of each over 2 weeks), not "2 then 1". The target (default 2×/wk) is a
  slider, and a clean 3-day rotation reads *near* it, not alarmingly under it.
- **Frequency drives the map** — a muscle is "trained" in a session when some
  exercise makes it a **primary mover** (weight ≥ 1, via `PRIMARY_WEIGHT`); weight
  `<1` only tints it faintly. So bench's `triceps:0.5` reads as secondary, but a
  triceps extension (`triceps:1`) makes triceps primary.
- **Effective sets** show alongside the frequency in each coverage chip
  (`deriveEffectiveSets`): every exercise's **working sets × per-set weights**,
  summed across the rotation ÷ weeks (a 0.5 secondary = half a set, *no* per-session
  dedup — the opposite of frequency). Set the working sets per exercise with the ±
  steppers; triceps stacks bench's and OHP's `0.5`s onto the extension and reads
  higher than its frequency.
- **Volume ceiling (`SETS_CEILING`, 8/wk).** Once a muscle's effective sets reach
  ~8/week it's marked red · *fully utilised* — a defensible cost/benefit line for a
  natural training heavy (6–8RM), **not** a hard biological limit (the dose–response
  keeps rising with diminishing returns). It's applied to the fractional figure,
  which already counts secondary work, so it sits a touch above a "direct sets"
  count. Tunable. See [References](#references).
- **Every exercise has ≥1 muscle at `1.0`** — otherwise it would train nothing as
  a primary and stay invisible to the frequency count.

### Is "8" the right number?

For **movement patterns**, roughly yes — the canonical set is horizontal/vertical
× push/pull (4), squat, hinge, lunge, core/carry. For **muscles** it's ~10 majors
(or the figure's ~20 fine regions). The coverage check here is muscle-group
frequency; a pattern-coverage checklist is an easy follow-on (see roadmap).

## The figure

The body map is the Symmetric Strength musculature figure (front + back), reused
from the original Splitviz: a photo base (`public/img/*.jpg`) with ~22 muscle
regions as `<path>`s, each classed by region name so CSS can tint it by
frequency. Female / male toggle. *(Their asset — fine for a personal rebuild,
don't redistribute.)*

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · TypeScript. State persists to
`localStorage`; no backend.

```bash
bun install
bun run dev   # http://localhost:3220
```

## Code map

- `lib/splitviz.ts` — `GROUPS`, `PATTERNS` (collapsible groups), `EXERCISES` (the
  weighted library), `deriveFrequencies` (rotation → per-group ×/week, weight-
  driven), `regionOpacities` (frequency → tint), `coverage`
- `lib/figures.ts` — the two figure SVGs as strings (generated from the original)
- `components/BodyMap.tsx` — injects the figure, tints regions by opacity
- `components/RotationBuilder.tsx` — weeks → sessions → collapsible exercise picker
- `components/Designer.tsx` — state, `patterns→exercises` migration, derivation, coverage

## Roadmap

- **Movement-pattern checklist** — flag missing patterns (vertical pull, hinge,
  core are the usual gaps). Nearly free, since exercises already carry a pattern.
- **Per-muscle volume ceilings** — the 8-set line is global; delts and calves
  tolerate more and recover faster than hamstrings, so a per-group `SETS_CEILING`
  would flag "fully utilised" more accurately.
- **Per-muscle frequency targets** (delts tolerate more frequency than hamstrings).
- **Hover tooltips** — the original SVG still carries `data-title` per region.

## References

The 8-set "fully utilised" line is a cost/benefit ceiling for a natural training
heavy (~6–8RM), **not** a claim that growth stops there. The honest picture: the
highest-powered dose–response evidence finds *more is more* with diminishing returns
and no clear plateau — but for heavy, near-failure work in a drug-free lifter, sets
past ~6–10 mostly buy fatigue, because a heavy set banks most of its stimulus in a
few effective reps and costs more recovery. These span **both camps on purpose** —
the high-volume papers the line departs from, and the effort-over-volume / effective-
reps case it rests on, whose peer-reviewed backbone is the Fisher–Steele
recommendations and the Minor–Helms–Schepis rebuttal of RP's MRV-progression model.

- [Stronger by Science — Set Volume for Muscle Growth](https://www.strongerbyscience.com/volume/) — dose–response, diminishing returns, no clear plateau
- [Pelland et al. 2024 — training dose–response meta](https://pubmed.ncbi.nlm.nih.gov/41343037/) — tracks volume to ~40–50 sets/muscle; the high-volume case
- [Beardsley — stimulating (effective) reps](https://www.patreon.com/posts/stimulating-reps-99706085) — ~5 growth-driving reps per heavy set
- [Beardsley — junk volume](https://www.patreon.com/SandCResearch/posts/junk-volume-83579414) — sets past the stimulus mostly add fatigue
- [Fisher, Steele, Bruce-Low & Smith 2011 — Evidence-Based Resistance Training Recommendations](https://pure.solent.ac.uk/ws/files/10205168/ms_2011_03_08_Fisher.pdf) — *peer-reviewed*: intensity of **effort**, not volume, is the primary driver
- [Minor, Helms & Schepis 2020 — RE: Mesocycle Progression in Hypertrophy](https://www.docdroid.net/bpAoChw/minor-b-et-al-2020-re-mesocycle-progression-in-hypertrophy-volume-versus-intensity-pdf) — *peer-reviewed* rebuttal (Strength & Conditioning Journal) of RP's progress-volume-to-MRV model
- [Renaissance Periodization — volume landmarks](https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth) — MEV/MAV/MRV; heavy compounds have lower MRV
- [Set for Set — is low-volume training effective?](https://www.setforset.com/blogs/news/is-low-volume-training-effective-for-muscle-growth-and-strength) — MEV ~4 hard sets
- [Full Range Strength — critique of high-volume conclusions](https://www.fullrangestrength.com/schoenfeld-training-volume.html) — viewpoint: effort over volume
