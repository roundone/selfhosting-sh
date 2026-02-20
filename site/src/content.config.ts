import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const articleSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  dateUpdated: z.coerce.date().optional(),
  category: z.string(),
  apps: z.array(z.string()).optional().default([]),
  tags: z.array(z.string()).optional().default([]),
  author: z.string().default('selfhosting.sh'),
  draft: z.boolean().default(false),
  image: z.string().optional().default(''),
  imageAlt: z.string().optional().default(''),
});

const apps = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/apps' }),
  schema: articleSchema,
});

const compare = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/compare' }),
  schema: articleSchema,
});

const best = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/best' }),
  schema: articleSchema,
});

const replace = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/replace' }),
  schema: articleSchema,
});

const hardware = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hardware' }),
  schema: articleSchema,
});

const foundations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/foundations' }),
  schema: articleSchema,
});

const troubleshooting = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/troubleshooting' }),
  schema: articleSchema,
});

export const collections = {
  apps,
  compare,
  best,
  replace,
  hardware,
  foundations,
  troubleshooting,
};
