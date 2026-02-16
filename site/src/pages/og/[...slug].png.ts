import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { generateOgImage } from '../../lib/og-image';

const collections = ['apps', 'compare', 'best', 'replace', 'hardware', 'foundations', 'troubleshooting'] as const;

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = [];
  for (const collection of collections) {
    try {
      const entries = await getCollection(collection, ({ data }) => !data.draft);
      for (const entry of entries) {
        paths.push({
          params: { slug: `${collection}/${entry.id}` },
          props: { title: entry.data.title, category: entry.data.category, collection },
        });
      }
    } catch {
      // Empty collections throw; skip them
    }
  }
  return paths;
};

export const GET: APIRoute = async ({ props }) => {
  const { title, category, collection } = props;
  const png = await generateOgImage(title, category, collection);
  return new Response(png, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
