import { getAllQuizIds } from "@/lib/quizzes";
import { getCatalogCategories, getSearchIndex } from "@/data/catalog";
import { getNavUser } from "@/lib/auth";
import { Navbar } from "./Navbar";

/**
 * Server wrapper that assembles the Navbar with the catalog categories,
 * Random target ids, and the current auth user. Reused across the homepage
 * and the category pages so the top nav stays consistent.
 */
export async function SiteHeader() {
  const quizIds = getAllQuizIds();
  const categories = getCatalogCategories();
  const searchIndex = getSearchIndex();
  const user = await getNavUser();

  return (
    <Navbar
      categories={categories}
      quizIds={quizIds}
      user={user}
      searchIndex={searchIndex}
    />
  );
}
