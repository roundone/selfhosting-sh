import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const dateSchema = z.coerce.date();

const baseFrontmatter = {
  title: z.string(),
  description: z.string().max(160),
  datePublished: dateSchema,
  dateUpdated: dateSchema,
};

const apps = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/apps" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("app-guide"),
    app: z.string(),
    category: z.string(),
    replaces: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    officialUrl: z.string().url().optional(),
    githubUrl: z.string().url().optional(),
    defaultPort: z.number().optional(),
    minRam: z.string().optional(),
  }),
});

const comparisons = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/comparisons" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("comparison"),
    apps: z.array(z.string()).min(2),
    category: z.string(),
    winner: z.string().optional(),
  }),
});

const roundups = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/roundups" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("roundup"),
    category: z.string(),
    appsRanked: z.array(z.string()),
  }),
});

const replace = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/replace" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("replace"),
    replaces: z.string(),
    category: z.string(),
    recommendedApp: z.string(),
    alternatives: z.array(z.string()),
  }),
});

const hardware = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/hardware" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("hardware"),
    subcategory: z.string(),
    hasAffiliateLinks: z.boolean().default(false),
  }),
});

const foundations = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/foundations" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("foundation"),
    topic: z.string(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    prerequisites: z.array(z.string()).optional(),
  }),
});

const troubleshooting = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/troubleshooting" }),
  schema: z.object({
    ...baseFrontmatter,
    type: z.literal("troubleshooting"),
    app: z.string(),
    category: z.string(),
    symptoms: z.array(z.string()),
    relatedIssues: z.array(z.string()).optional(),
  }),
});

export const collections = {
  apps,
  comparisons,
  roundups,
  replace,
  hardware,
  foundations,
  troubleshooting,
};
