import { Injectable } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  private client: MeiliSearch;

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_KEY,
    });
  }

  async indexProperty(property: Record<string, unknown>) {
    const index = this.client.index('properties');
    await index.addDocuments([
      {
        id: property['id'],
        city: property['city'],
        district: property['district'],
        street: property['street'],
        property_type: property['property_type'],
        price: property['price'],
        rooms: property['rooms'],
        area_sqm: property['area_sqm'],
        description: property['description'],
        tags: property['tags'],
        visibility_status: property['visibility_status'],
      },
    ]);
  }

  async deleteProperty(id: string) {
    const index = this.client.index('properties');
    await index.deleteDocument(id);
  }

  async searchProperties(q: string, filters?: Record<string, unknown>) {
    const index = this.client.index('properties');
    return index.search(q, {
      filter: filters
        ? Object.entries(filters)
            .filter(([, v]) => v != null)
            .map(([k, v]) => `${k} = "${v}"`)
            .join(' AND ')
        : undefined,
      limit: 50,
      attributesToHighlight: ['description', 'street'],
    });
  }

  async ensureIndexes() {
    const index = this.client.index('properties');
    await index.updateFilterableAttributes(['city', 'district', 'property_type', 'visibility_status', 'rooms']);
    await index.updateSortableAttributes(['price', 'area_sqm']);
    await index.updateSearchableAttributes(['street', 'district', 'city', 'description', 'tags']);
  }
}
