export function articleSchema(data: {
  title: string;
  description: string;
  datePublished: Date;
  dateModified: Date;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: data.title,
    description: data.description,
    datePublished: data.datePublished.toISOString(),
    dateModified: data.dateModified.toISOString(),
    url: data.url,
    publisher: {
      "@type": "Organization",
      name: "selfhosting.sh",
      url: "https://selfhosting.sh",
    },
  };
}

export function softwareAppSchema(data: {
  name: string;
  url?: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: data.name,
    applicationCategory: data.category || "DeveloperApplication",
    operatingSystem: "Linux",
    ...(data.url ? { url: data.url } : {}),
  };
}

export function faqSchema(
  questions: { question: string; answer: string }[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((q) => ({
      "@type": "Question",
      name: q.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: q.answer,
      },
    })),
  };
}
