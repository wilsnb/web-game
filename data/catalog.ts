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
  /** Pro-only game — requires an active Qwardoo Pro subscription to play. */
  pro?: boolean;
  /** Where a playable game links to. Omitted while a game is a placeholder. */
  href?: string;
}

export interface CatalogCategory {
  slug: string;
  label: string;
  description: string;
  thumbnail: string;
  /** Show this category as a section on the homepage landing page. */
  featuredOnHome?: boolean;
  games: CatalogGame[];
}

export const CATALOG: CatalogCategory[] = [
  {
    slug: "category-trivia-rankings",
    label: "Trivia & Rankings",
    description: "Guess the ranked list — closer to #1 scores more.",
    thumbnail: "/thumbnails/music.svg",
    featuredOnHome: true,
    games: [
      {
        id: "top-100-streamed-artists",
        title: "Top 100 Most Streamed Artists",
        description: "Name the most-streamed artists of all time.",
        comingSoon: false,
        href: "/play/top-100-streamed-artists",
      },
      {
        id: "top-100-highest-paid-athletes",
        title: "Top 100 Highest-Paid Athletes",
        description: "Rank the world's biggest sports earners.",
        comingSoon: false,
        href: "/play/top-100-highest-paid-athletes",
      },
      {
        id: "best-selling-music-artists",
        title: "Top 25 Best-Selling Music Artists of All Time",
        description:
          "The acts that have sold the most records across all of music history.",
        comingSoon: false,
        href: "/play/best-selling-music-artists",
      },
      {
        id: "most-populous-us-states",
        title: "Top 20 Most Populous U.S. States",
        description:
          "Rank America's biggest states by how many people call them home.",
        comingSoon: false,
        href: "/play/most-populous-us-states",
      },
      {
        id: "highest-grossing-films",
        title: "Top 15 Highest-Grossing Films of All Time",
        description:
          "The blockbusters that made the most money at the global box office.",
        comingSoon: false,
        href: "/play/highest-grossing-films",
      },
      {
        id: "most-visited-websites",
        title: "Top 15 Most Visited Websites in the World",
        description:
          "The sites that pull the most traffic on the entire internet.",
        comingSoon: false,
        href: "/play/most-visited-websites",
      },
      {
        id: "nba-all-time-scorers",
        title: "Top 12 NBA All-Time Leading Scorers",
        description:
          "The legends who racked up the most career points in NBA history.",
        comingSoon: false,
        href: "/play/nba-all-time-scorers",
      },
      {
        id: "most-populous-countries",
        title: "Top 10 Most Populous Countries",
        description:
          "Name the ten nations where the most people on Earth live.",
        comingSoon: false,
        href: "/play/most-populous-countries",
      },
      {
        id: "most-consumed-beverages",
        title: "Top 10 Most Consumed Beverages Worldwide",
        description:
          "The drinks the world pours most, from the everyday to the indulgent.",
        comingSoon: false,
        href: "/play/most-consumed-beverages",
      },
    ],
  },
  {
    slug: "category-party-games",
    label: "Party Games",
    description: "Fast, social games for the whole room.",
    thumbnail: "/thumbnails/internet.svg",
    featuredOnHome: true,
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
    featuredOnHome: true,
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
    featuredOnHome: true,
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
        pro: true,
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
        pro: true,
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

/** Is the game with this id a Pro-only game? */
export function isProGameId(id: string): boolean {
  for (const c of CATALOG) {
    const g = c.games.find((game) => game.id === id);
    if (g) return Boolean(g.pro);
  }
  return false;
}

export interface SearchItem {
  type: "game" | "category";
  title: string;
  subtitle: string;
  href: string;
  comingSoon?: boolean;
}

/**
 * Flat, client-safe index of everything searchable: each category and each
 * game. Games link to their playable href if available, otherwise to the
 * category page. Derived from the catalog so it stays accurate.
 */
export function getSearchIndex(): SearchItem[] {
  const items: SearchItem[] = [];
  for (const c of CATALOG) {
    const slug = urlSlug(c);
    items.push({
      type: "category",
      title: c.label,
      subtitle: c.description,
      href: `/category/${slug}`,
    });
    for (const g of c.games) {
      items.push({
        type: "game",
        title: g.title,
        subtitle: `${c.label} · ${g.description}`,
        href: g.href ?? `/category/${slug}`,
        comingSoon: g.comingSoon,
      });
    }
  }
  return items;
}

/** Categories to feature as sections on the homepage landing page. */
export function getHomeCategories(): CatalogCategory[] {
  return CATALOG.filter((c) => c.featuredOnHome);
}

export interface FlatGame extends CatalogGame {
  categoryLabel: string;
  thumbnail: string;
}

/**
 * Every game across all categories, flattened, each carrying its category's
 * label and thumbnail. Playable games first, then coming-soon.
 */
export function getAllGames(): FlatGame[] {
  const flat: FlatGame[] = CATALOG.flatMap((c) =>
    c.games.map((g) => ({
      ...g,
      categoryLabel: c.label,
      thumbnail: c.thumbnail,
    }))
  );
  return flat.sort(
    (a, b) => Number(a.comingSoon) - Number(b.comingSoon)
  );
}

/** Count of games that are actually playable today (not coming soon). */
export function getPlayableGameCount(): number {
  return CATALOG.reduce(
    (n, c) => n + c.games.filter((g) => !g.comingSoon).length,
    0
  );
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
