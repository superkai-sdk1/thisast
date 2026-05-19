import { Injectable, Logger } from '@nestjs/common';
import { MeiliSearch } from 'meilisearch';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);
  private client: MeiliSearch;
  private readonly indexName = 'properties';

  constructor() {
    this.client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
      apiKey: process.env.MEILISEARCH_API_KEY,
    });
  }

  async indexProperty(property: Record<string, unknown>): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.addDocuments([
        {
          id: property['id'],
          property_type: property['property_type'],
          city: property['city'],
          district: property['district'],
          street: property['street'],
          price: property['price'],
          area_sqm: property['area_sqm'],
          rooms: property['rooms'],
          floor: property['floor'],
          description: property['description'],
          visibility_status: property['visibility_status'],
          tags: property['tags'],
        },
      ]);
    } catch (err) {
      this.logger.error('Failed to index property in Meilisearch', err);
    }
  }

  async deleteProperty(propertyId: string): Promise<void> {
    try {
      const index = this.client.index(this.indexName);
      await index.deleteDocument(propertyId);
    } catch (err) {
      this.logger.error('Failed to delete property from Meilisearch', err);
    }
  }

  async search(query: string, filters?: Record<string, unknown>) {
    const index = this.client.index(this.indexName);
    const filterStrings: string[] = [];

    if (filters?.['visibility_status']) {
      filterStrings.push(`visibility_status = "${filters['visibility_status']}"`);
    }
    if (filters?.['property_type']) {
      filterStrings.push(`property_type = "${filters['property_type']}"`);
    }
    if (filters?.['price_min']) {
      filterStrings.push(`price >= ${filters['price_min']}`);
    }
    if (filters?.['price_max']) {
      filterStrings.push(`price <= ${filters['price_max']}`);
    }

    return index.search(query, {
      filter: filterStrings.length ? filterStrings.join(' AND ') : undefined,
      limit: 20,
    });
  }
}
