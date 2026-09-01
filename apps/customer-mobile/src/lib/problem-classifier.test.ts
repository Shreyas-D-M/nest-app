import { describe, expect, it } from 'vitest';
import type { CatalogResponse, MinorUnits, Uuid } from '@nest/types';
import { analyzeProblemInput, classifyProblem } from './problem-classifier';

const asUuid = (value: string): Uuid => value as Uuid;
const asMinorUnits = (value: number): MinorUnits => value as MinorUnits;

const acCatalog: CatalogResponse = {
  categories: [
    {
      id: asUuid('1'),
      name: 'Air Conditioning',
      slug: 'air-conditioning',
      icon: null,
      services: [{ id: asUuid('a'), name: 'AC Repair', slug: 'ac-repair', description: null, pricingType: 'ESTIMATE', basePriceMinor: asMinorUnits(1000) }],
    },
  ],
};

const plumbingCatalog: CatalogResponse = {
  categories: [
    {
      id: asUuid('2'),
      name: 'Plumbing',
      slug: 'plumbing',
      icon: null,
      services: [{ id: asUuid('b'), name: 'Plumbing', slug: 'plumbing', description: null, pricingType: 'ESTIMATE', basePriceMinor: asMinorUnits(1000) }],
    },
  ],
};

describe('problem classifier', () => {
  it('classifies AC cooling issues from typed text', () => {
    const result = classifyProblem('AC is not cooling', acCatalog);

    expect(result.categoryName).toMatch(/AC|Air Conditioning/i);
    expect(result.serviceNames.some((name) => /AC|Air Conditioning/i.test(name))).toBe(true);
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('merges text, voice transcript and image context into one classification input', () => {
    const result = analyzeProblemInput(
      {
        text: 'Kitchen sink is leaking',
        voiceTranscript: 'water pressure issue',
        imageContext: 'under sink cabinet',
      },
      plumbingCatalog,
    );

    expect(result.categoryName).toMatch(/Plumbing/i);
  });
});
