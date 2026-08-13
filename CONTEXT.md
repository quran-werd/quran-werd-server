# Quran Werd

A daily Qur'an revision (murajah) tracker. Users record the ranges they've
memorized, then follow a recurring daily schedule that cycles through those
ranges indefinitely so nothing is forgotten.

## Language

**Range**:
A contiguous span of ayat within a single surah that a user has memorized.
Identified by a stable, content-derived `rangeId` (`surah:from:to`) so it
survives independently of any schedule built from it.
_Avoid_: Memorization, section

**Werd**:
A chunk of a Range sized to fit `dailyCapacity`, generated on demand as part
of a RevisionPlan's cycle. A Werd has no identity of its own beyond the
current cycle — it's recomputed whenever the plan regenerates, and nothing
outside the RevisionPlan should hold a durable reference to one.
_Avoid_: Portion, chunk (as a standalone term), daily task

**Cycle**:
One full pass through all of a user's memorized Ranges, chunked into an
ordered sequence of Werds. A cycle ends when every Werd in it has been
completed; the next cycle only starts when the user explicitly regenerates
the plan (no automatic recycling).
_Avoid_: Round, pass

**RevisionPlan**:
The single source of truth for a user's schedule and progress: `dailyCapacity`,
the ordered `incompleteAwrad` (Werds not yet done this cycle) and
`completedAwrad` (Werds done this cycle, each with a `completedAt`). There is
no separate log of completions — status for "today" is derived entirely from
these two lists.
_Avoid_: Schedule, revision log

**dailyCapacity**:
The number of Mushaf pages that make up one Werd (a positive integer: 1, 2,
3, ...). Not an ayah count. A Werd's boundaries always land on Mushaf page
boundaries (via `AYAH_MAP`/`PAGE_MAP`), except when truncated by the end of
the Range it's drawn from.
_Avoid_: Pace, speed

**Finished** (plan status):
The state once `incompleteAwrad` is empty — the user has completed every
Werd in the current cycle. The plan stays `finished` until the user
explicitly regenerates it; nothing happens automatically.
_Avoid_: Completed (that's the status of an individual Werd, not the plan)
