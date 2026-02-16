import satori from 'satori';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const fontsDir = join(process.cwd(), 'src/assets/fonts');

const interBold = readFileSync(join(fontsDir, 'Inter-Bold.ttf'));
const interRegular = readFileSync(join(fontsDir, 'Inter-Regular.ttf'));
const jetbrainsMono = readFileSync(join(fontsDir, 'JetBrainsMono-Bold.ttf'));

const categoryLabels: Record<string, string> = {
  apps: 'App Guide',
  compare: 'Comparison',
  best: 'Best Of',
  replace: 'Replace Guide',
  hardware: 'Hardware Guide',
  foundations: 'Foundation',
  troubleshooting: 'Troubleshooting',
};

const CACHE_DIR = join(process.cwd(), 'node_modules/.og-cache');

function getCacheKey(title: string, collection: string): string {
  return createHash('sha256').update(`${title}::${collection}`).digest('hex');
}

export async function generateOgImage(title: string, category: string, collection: string): Promise<Buffer> {
  // Check cache first
  if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true });
  const cacheKey = getCacheKey(title, collection);
  const cachePath = join(CACHE_DIR, `${cacheKey}.png`);
  if (existsSync(cachePath)) {
    return readFileSync(cachePath);
  }

  const categoryLabel = categoryLabels[collection] || collection;

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#0f1117',
          padding: '60px',
          fontFamily: 'Inter',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: {
                            color: '#22c55e',
                            fontSize: '20px',
                            fontFamily: 'JetBrains Mono',
                            fontWeight: 700,
                            backgroundColor: '#22c55e20',
                            padding: '6px 16px',
                            borderRadius: '6px',
                            border: '1px solid #22c55e40',
                          },
                          children: categoryLabel,
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'h1',
                  props: {
                    style: {
                      fontSize: title.length > 50 ? '44px' : '52px',
                      fontWeight: 700,
                      color: '#f1f5f9',
                      lineHeight: 1.2,
                      margin: 0,
                    },
                    children: title,
                  },
                },
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid #1e293b',
                paddingTop: '24px',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontFamily: 'JetBrains Mono',
                    },
                    children: [
                      {
                        type: 'span',
                        props: {
                          style: { color: '#22c55e', fontSize: '24px', fontWeight: 700 },
                          children: '$',
                        },
                      },
                      {
                        type: 'span',
                        props: {
                          style: { color: '#e2e8f0', fontSize: '24px', fontWeight: 700 },
                          children: ' selfhosting.sh',
                        },
                      },
                    ],
                  },
                },
                {
                  type: 'span',
                  props: {
                    style: { color: '#64748b', fontSize: '18px' },
                    children: 'Replace your cloud subscriptions',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Inter', data: interRegular, weight: 400, style: 'normal' },
        { name: 'Inter', data: interBold, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: jetbrainsMono, weight: 700, style: 'normal' },
      ],
    }
  );

  const png = await sharp(Buffer.from(svg)).png({ quality: 80 }).toBuffer();

  // Write to cache for future builds
  writeFileSync(cachePath, png);

  return png;
}
