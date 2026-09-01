import type { CatalogResponse } from '@nest/types';

export type ClassifiedProblem = {
  summary: string;
  categoryName: string;
  serviceNames: string[];
  matchedText: string;
  confidence: number;
};

export type ProblemAnalysisInput = {
  text?: string | null;
  voiceTranscript?: string | null;
  imageContext?: string | null;
};

const keywordGroups: Array<{
  categoryName: string;
  serviceNames: string[];
  keywords: string[];
}> = [
  {
    categoryName: 'AC Repair',
    serviceNames: ['AC Repair', 'Air Conditioning Service', 'HVAC Service'],
    keywords: ['ac', 'air conditioning', 'cooling', 'heater', 'hvac', 'furnace', 'ventilation'],
  },
  {
    categoryName: 'Plumbing',
    serviceNames: ['Plumbing', 'Tap Repair', 'Pipe Fix', 'Drain Cleaning'],
    keywords: ['tap', 'sink', 'plumbing', 'leak', 'drain', 'pipe', 'toilet', 'shower', 'water'],
  },
  {
    categoryName: 'Electrical',
    serviceNames: ['Electrical', 'Wiring', 'Fan Repair', 'Lighting'],
    keywords: ['light', 'lighting', 'fan', 'electrical', 'flicker', 'switch', 'socket', 'wiring', 'power'],
  },
  {
    categoryName: 'Cleaning',
    serviceNames: ['Home Cleaning', 'Deep Cleaning', 'Apartment Cleaning'],
    keywords: ['clean', 'cleaning', 'mop', 'dust', 'apartment', 'home cleaning', 'sanitization'],
  },
  {
    categoryName: 'Appliance Repair',
    serviceNames: ['Appliance Repair', 'Washing Machine Repair', 'Refrigerator Repair'],
    keywords: ['washer', 'washing machine', 'fridge', 'refrigerator', 'appliance', 'dryer', 'microwave', 'stove'],
  },
  {
    categoryName: 'Painting',
    serviceNames: ['Painting', 'Wall Painting', 'Interior Painting'],
    keywords: ['paint', 'wall', 'painting', 'colour', 'color', 'peeling'],
  },
  {
    categoryName: 'General Handyman',
    serviceNames: ['General Handyman', 'Maintenance'],
    keywords: ['fix', 'repair', 'install', 'mount', 'door', 'cabinet', 'hinge', 'maintenance'],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

export function analyzeProblemInput(
  input: ProblemAnalysisInput,
  catalog: CatalogResponse | null,
): ClassifiedProblem {
  const mergedText = [input.text, input.voiceTranscript, input.imageContext]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .join(' ')
    .trim();

  return classifyProblem(mergedText, catalog);
}

export function classifyProblem(rawText: string, catalog: CatalogResponse | null): ClassifiedProblem {
  const cleaned = rawText.trim();
  const normalized = normalize(cleaned);

  if (!cleaned) {
    return {
      summary: 'Please describe the issue so we can match the right service.',
      categoryName: 'General Handyman',
      serviceNames: [],
      matchedText: '',
      confidence: 0,
    };
  }

  const catalogMatches = catalog?.categories ?? [];
  const catalogServiceNames = catalogMatches.flatMap((category) =>
    category.services.map((service) => ({
      categoryName: category.name,
      serviceName: service.name,
      haystack: `${category.name} ${service.name}`.toLowerCase(),
    })),
  );

  let bestMatch: { categoryName: string; serviceNames: string[]; score: number; matchedText: string } | null = null;

  for (const group of keywordGroups) {
    const matches = group.keywords.filter((keyword) => normalized.includes(keyword));
    if (matches.length > 0) {
      const serviceMatches = catalogServiceNames.filter((item) => {
        const haystack = item.haystack;
        return group.serviceNames.some((serviceName) => haystack.includes(serviceName.toLowerCase())) ||
          group.keywords.some((keyword) => haystack.includes(keyword));
      });

      const score = matches.length + serviceMatches.length;
      const candidate = {
        categoryName: group.categoryName,
        serviceNames: [...new Set(serviceMatches.map((item) => item.serviceName).slice(0, 4).concat(group.serviceNames))],
        score,
        matchedText: matches[0] ?? group.serviceNames[0] ?? group.categoryName,
      };

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = candidate;
      }
    }
  }

  if (!bestMatch) {
    const fallbackService = catalogServiceNames.find((service) => normalized.includes(service.serviceName.toLowerCase()))
      ?? catalogServiceNames.find((service) => normalized.includes(service.categoryName.toLowerCase()))
      ?? catalogServiceNames[0];

    if (fallbackService) {
      return {
        summary: `You need ${fallbackService.serviceName}.`,
        categoryName: fallbackService.categoryName,
        serviceNames: [fallbackService.serviceName],
        matchedText: fallbackService.serviceName,
        confidence: 0.5,
      };
    }

    return {
      summary: 'We can help with that issue. Let us find the right specialist.',
      categoryName: 'General Handyman',
      serviceNames: ['General Handyman'],
      matchedText: cleaned,
      confidence: 0.25,
    };
  }

  const serviceNames = [...new Set(bestMatch.serviceNames.filter(Boolean))];

  return {
    summary: `This looks like ${bestMatch.categoryName.toLowerCase()} work.`,
    categoryName: bestMatch.categoryName,
    serviceNames: serviceNames.length > 0 ? serviceNames : [bestMatch.categoryName],
    matchedText: bestMatch.matchedText,
    confidence: Math.min(bestMatch.score / 6, 1),
  };
}
