import type { IsoTimestamp, Uuid } from './primitives';
import type { MinorUnits } from './money';

/**
 * Service catalogue.
 *
 * 06_API_SPEC.md exposes no category endpoint, so categories are never a
 * top-level resource — they appear only as the grouping inside a catalogue
 * response.
 */

/**
 * How a price behaves (02_PRD.md payment rules).
 *
 *   FIXED    — the quoted amount is the amount; it must not silently change.
 *   ESTIMATE — indicative only; the job needs inspection and a quotation.
 */
export const PRICING_TYPES = ['FIXED', 'ESTIMATE'] as const;

export type PricingType = (typeof PRICING_TYPES)[number];

export interface CatalogService {
  id: Uuid;
  name: string;
  slug: string;
  description: string | null;
  pricingType: PricingType;
  /**
   * Indicative starting price in integer paise, or null when the service has no
   * meaningful starting price. Presented as "from ₹x"; it is not a quote.
   */
  basePriceMinor: MinorUnits | null;
}

export interface CatalogCategory {
  id: Uuid;
  name: string;
  slug: string;
  icon: string | null;
  services: CatalogService[];
}

/** `GET /services` — the catalogue, grouped by category. */
export interface CatalogResponse {
  categories: CatalogCategory[];
}

/** `GET /services/:id` — one service, with the category it belongs to. */
export interface ServiceDetail extends CatalogService {
  category: {
    id: Uuid;
    name: string;
    slug: string;
    icon: string | null;
  };
  active: boolean;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
