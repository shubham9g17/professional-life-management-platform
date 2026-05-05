# ADR-0008 — Group-by-mean correlation analysis (not Pearson r)

## Status

Accepted.

## Context

The analytics page surfaces relationships between domains — *"do you do better on days you exercise?"*. Two natural ways to compute this:

### Pearson correlation coefficient (`r ∈ [-1, 1]`)

Standard statistics. Output: `r = 0.42, p < 0.05`. Captures the linear relationship strength.

Problems for this audience:
- A non-technical user has no intuition for `r = 0.42`. Is that a lot? A little? Worth changing behavior over?
- Even technical users misinterpret weak correlations. `r = 0.2` *is* statistically significant with enough samples but means almost nothing in practice.
- The right communication of `r` requires showing scatter plots with regression lines, plus error bars. Visual real estate the analytics page can't afford.

### Group-by-mean comparison

Pick a binary condition (e.g. `exerciseMinutes >= 30`). Compute the mean of the metric (e.g. productivity score) on days where the condition is true vs. days where it's false. Express the result as a percentage delta.

Output: *"On days you exercise ≥ 30 min, your productivity score is 27 % higher (4.2 vs. 3.3 over 18 vs. 22 days)."*

This is a sentence the user can act on.

## Decision

Use **group-by-mean comparison** for the user-facing analytics. Implement five fixed comparisons:

| ID | Metric | Condition |
|---|---|---|
| `prod-vs-exercise` | productivity score | `exerciseMinutes >= 30` |
| `prod-vs-streak` | productivity score | `habitsCompleted >= habitsTotal` (full-streak day) |
| `wellness-vs-nutrition` | wellness score | `caloriesTracked` true |
| `wellness-vs-water` | wellness score | `waterGoalMet` true |
| `growth-vs-learning` | growth score | `learningMinutes > 0` |

Each comparison requires ≥ 3 days on each side (`MIN_SAMPLE = 3`); below that, the result is dropped so we don't draw conclusions from noise. The direction (`POSITIVE` / `NEGATIVE` / `NEUTRAL`) uses a 5 % threshold.

Implementation: `lib/repositories/analytics-repository.ts` → `getCorrelations(userId, days)`.

## Consequences

**Better:**
- Output reads as a sentence. *"+27 % on exercise days"* is something the user can act on.
- The math is transparent — anyone can audit it without remembering what `r` means.
- The 3-day minimum keeps results trustworthy.
- The 5-card panel fits naturally inside the analytics page without extra visualization.

**Worse / accepted trade-offs:**
- Loses the linearity-strength signal that Pearson would give. Two domains that vary together perfectly but with weak amplitude (`r=0.95`, percentage delta = 2 %) would *not* highlight here.
- The five comparisons are hard-coded. Adding a new one is a code change, not user configuration.
- It's not a substitute for proper statistical analysis if the user wants to research personal patterns rigorously.

## Future direction

If users ask for stronger statistical rigor, ADD Pearson alongside group-by-mean — don't replace it. The two answer different questions.
