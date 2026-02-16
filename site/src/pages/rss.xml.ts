import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';

export async function GET(context: APIContext) {
  const allCollections = await Promise.all([
    getCollection('apps', ({ data }) => !data.draft),
    getCollection('compare', ({ data }) => !data.draft),
    getCollection('best', ({ data }) => !data.draft),
    getCollection('replace', ({ data }) => !data.draft),
    getCollection('hardware', ({ data }) => !data.draft),
    getCollection('foundations', ({ data }) => !data.draft),
    getCollection('troubleshooting', ({ data }) => !data.draft),
  ]);

  const collectionNames = ['apps', 'compare', 'best', 'replace', 'hardware', 'foundations', 'troubleshooting'];

  const items = allCollections
    .flatMap((entries, i) =>
      entries.map((entry) => ({
        title: entry.data.title,
        description: entry.data.description,
        pubDate: entry.data.date,
        link: `/${collectionNames[i]}/${entry.id}/`,
      }))
    )
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 100);

  return rss({
    title: 'selfhosting.sh',
    description: 'Replace your cloud subscriptions with stuff you run yourself. Self-hosting guides, comparisons, and setup tutorials.',
    site: context.site!.toString(),
    items,
  });
}
