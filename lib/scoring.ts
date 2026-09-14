/**
 * Rank-based scoring.
 *
 * The closer a correct guess is to #1, the MORE points it earns.
 * Formula: points = (listLength + 1) - rank
 *
 *  - Top 100 list: #1 = 100 points, #100 = 1 point.
 *  - Top 20 list:  #1 = 20 points,  #20  = 1 point.
 *
 * Always derived from the specific quiz's listLength — never hardcoded.
 */
export function pointsForRank(rank: number, listLength: number): number {
  if (rank < 1 || rank > listLength) {
    throw new Error(
      `Rank ${rank} is out of range for a list of length ${listLength}.`
    );
  }
  return listLength + 1 - rank;
}

/** Highest possible single-guess score for a quiz (i.e. guessing #1). */
export function maxPointsForList(listLength: number): number {
  return listLength;
}
