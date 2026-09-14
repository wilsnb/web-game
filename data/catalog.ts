/**
 * Game catalog — the 7 launch categories and the games inside them.
 *
 * This is placeholder content: no game logic is wired up yet. Games flagged
 * `comingSoon` render as disabled "Coming soon" cards; the rest render as
 * regular (not-yet-interactive) cards.
 *
 * NOTE: the priority tiers the product owner uses internally (High/Mid/Low)
 * are intentionally NOT represented here — they only decide which games are
 * `comingSoon`. Mid- and low-priority games are marked coming soon.
 */

export interface CatalogGame {
  id: string;
  title: string;
  description: string;
  comingSoon: boolean;
}

export interface CatalogCategory {
  slug: string;
  label: string;
  description: string;
  thumbnail: string;
  games: CatalogGame[];
}

export const CATALOG: CatalogCategory[] = [
  {
    slug: "category-trivia-rankings",
    label: "Trivia & Rankings",
    description: "Guess the ranked list — closer to #1 scores more.",
    thumbnail: "/thumbnails/music.svg",
    games: [
      {
        id: "top-100-streamed-artists",
        title: "Top 100 Most Streamed Artists",
        description: "Name the most-streamed artists of all time.",
        comingSoon: false,
      },
      {
        id: "top-100-highest-paid-athletes",
        title: "Top 100 Highest-Paid Athletes",
        description: "Rank the world's biggest sports earners.",
        comingSoon: false,
      },
    ],
  },
  {
    slug: "category-party-games",
    label: "Party Games",
    description: "Fast, social games for the whole room.",
    thumbnail: "/thumbnails/internet.svg",
    games: [
      {
        id: "who-is-the-impostor",
        title: "Who is the Impostor",
        description: "Find the player who doesn't know the secret word.",
        comingSoon: false,
      },
      {
        id: "never-have-i-ever",
        title: "Never Have I Ever",
        description: "The classic confession game.",
        comingSoon: false,
      },
    ],
  },
  {
    slug: "category-couples",
    label: "Couples",
    description: "Games made for two.",
    thumbnail: "/thumbnails/food.svg",
    games: [
      {
        id: "truth-or-dare-couples",
        title: "Truth or Dare (Couples Edition)",
        description: "Truth or dare, tuned for couples.",
        comingSoon: false,
      },
      {
        id: "virtual-photobooth",
        title: "Virtual Photobooth",
        description: "Webcam-based photobooth for the two of you.",
        comingSoon: false,
      },
    ],
  },
  {
    slug: "category-brain-teasers",
    label: "Brain Teasers",
    description: "Puzzles that make you think fast.",
    thumbnail: "/thumbnails/geography.svg",
    games: [
      {
        id: "logic-pattern-puzzle",
        title: "Logic & Pattern Puzzle Quiz",
        description: "Spot the pattern, solve the puzzle.",
        comingSoon: true,
      },
      {
        id: "speed-math-challenge",
        title: "Speed Math Challenge",
        description: "How fast can you do the math?",
        comingSoon: true,
      },
    ],
  },
  {
    slug: "category-skill-reflex",
    label: "Skill & Reflex Games",
    description: "Test your reflexes and memory.",
    thumbnail: "/thumbnails/sports.svg",
    games: [
      {
        id: "reaction-time-test",
        title: "Reaction Time Test",
        description: "Tap the moment it changes — how quick are you?",
        comingSoon: true,
      },
      {
        id: "memory-sequence",
        title: "Memory Sequence Game",
        description: "Repeat the growing pattern without a slip.",
        comingSoon: true,
      },
    ],
  },
  {
    slug: "category-icebreakers",
    label: "Icebreakers & Conversation Games",
    description: "Easy prompts to get everyone talking.",
    thumbnail: "/thumbnails/movies.svg",
    games: [
      {
        id: "would-you-rather",
        title: "Would You Rather",
        description: "Two options, one impossible choice.",
        comingSoon: true,
      },
      {
        id: "this-or-that",
        title: "This or That",
        description: "Quick-fire preference showdowns.",
        comingSoon: true,
      },
    ],
  },
  {
    slug: "category-personality",
    label: "Personality & Compatibility Quizzes",
    description: "Find out who you are — and how you match.",
    thumbnail: "/thumbnails/internet.svg",
    games: [
      {
        id: "which-type-are-you",
        title: '"Which [Character/Type] Are You?" Quiz',
        description: "Answer a few questions, get your type.",
        comingSoon: true,
      },
      {
        id: "compatibility-test",
        title: "Friendship / Couple Compatibility Test",
        description: "See how well you really match.",
        comingSoon: true,
      },
    ],
  },
];

/** Bare URL slug for a category (e.g. "trivia-rankings"), used in /category/<slug>. */
export function urlSlug(category: CatalogCategory): string {
  return category.slug.replace(/^category-/, "");
}

/** Look up a category by its bare URL slug. */
export function getCategoryByUrlSlug(
  slug: string
): CatalogCategory | undefined {
  return CATALOG.find((c) => urlSlug(c) === slug);
}

/** All bare URL slugs — for generateStaticParams. */
export function getAllCategoryUrlSlugs(): string[] {
  return CATALOG.map(urlSlug);
}

/** Total number of games across all categories. */
export function getTotalGameCount(): number {
  return CATALOG.reduce((n, c) => n + c.games.length, 0);
}

/**
 * Categories for the nav dropdown: label, game count, the homepage anchor
 * slug, and the dedicated-page href.
 */
export function getCatalogCategories() {
  return CATALOG.map((c) => ({
    slug: c.slug,
    label: c.label,
    count: c.games.length,
    href: `/category/${urlSlug(c)}`,
  }));
}
