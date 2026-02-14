import { getCollection } from "astro:content";

export async function getArticlesByCategory(category: string) {
  const [apps, comparisons, roundups, replaceGuides] = await Promise.all([
    getCollection("apps", ({ data }) => data.category === category),
    getCollection("comparisons", ({ data }) => data.category === category),
    getCollection("roundups", ({ data }) => data.category === category),
    getCollection("replace", ({ data }) => data.category === category),
  ]);
  return { apps, comparisons, roundups, replaceGuides };
}

export async function getComparisonsForApp(appSlug: string) {
  return getCollection("comparisons", ({ data }) =>
    data.apps.includes(appSlug)
  );
}

export async function getAllCategories() {
  const apps = await getCollection("apps");
  const categories = [...new Set(apps.map((a) => a.data.category))];
  return categories.sort();
}

export async function getRoundupForCategory(category: string) {
  const roundups = await getCollection(
    "roundups",
    ({ data }) => data.category === category
  );
  return roundups[0] || null;
}

export const sectionUrlMap: Record<string, string> = {
  apps: "apps",
  comparisons: "compare",
  roundups: "best",
  replace: "replace",
  hardware: "hardware",
  foundations: "foundations",
  troubleshooting: "troubleshooting",
};
