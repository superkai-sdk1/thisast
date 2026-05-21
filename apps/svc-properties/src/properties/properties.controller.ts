import { Controller, Inject, Logger } from '@nestjs/common';
import { MessagePattern, EventPattern, ClientProxy, Payload } from '@nestjs/microservices';
import {
  MSG_PROPS_LIST,
  MSG_PROPS_FIND_ONE,
  MSG_PROPS_CREATE,
  MSG_PROPS_UPDATE,
  MSG_PROPS_DELETE,
  MSG_PROPS_UPDATE_VISIBILITY,
  MSG_PROPS_PDF,
  MSG_PROPS_GET_MATCHES,
  MSG_PROPS_PHOTO_UPLOAD,
  MSG_PROPS_PHOTO_DELETE,
  MSG_PROPS_PHOTO_REORDER,
  MSG_PROPS_TRASH_LIST,
  MSG_PROPS_RESTORE,
  MSG_PROPS_GET_EVENTS,
  EVT_PROPERTY_CREATED,
  EVT_PROPERTY_UPDATED,
  EVT_PROPERTY_PRICE_DROP,
  EVT_AUDIT_LOG,
} from '@crm/shared-types';
import { PropertiesService } from './properties.service';
import { PdfService } from '../pdf/pdf.service';
import { StorageService } from '../storage/storage.service';
import { REDIS_CLIENT } from '../redis-client.module';

@Controller()
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

  constructor(
    private readonly propertiesService: PropertiesService,
    private readonly pdfService: PdfService,
    private readonly storageService: StorageService,
    @Inject(REDIS_CLIENT) private readonly client: ClientProxy,
  ) {}

  @MessagePattern(MSG_PROPS_LIST)
  async list(@Payload() data: { filter: any; actor: any }) {
    return this.propertiesService.findAll(data.filter ?? {}, data.actor);
  }

  @MessagePattern(MSG_PROPS_FIND_ONE)
  async findOne(@Payload() data: { id: string; actor: any }) {
    return this.propertiesService.findOne(data.id, data.actor);
  }

  @MessagePattern(MSG_PROPS_CREATE)
  async create(@Payload() data: { dto: any; actor: any }) {
    const property = await this.propertiesService.create(data.dto, data.actor);

    this.client.emit(EVT_PROPERTY_CREATED, { propertyId: property.id, property });
    this.client.emit(EVT_AUDIT_LOG, {
      actor_id: data.actor.sub,
      action_type: 'CREATE_RECORD',
      target_type: 'property',
      target_id: property.id,
    });

    return property;
  }

  @MessagePattern(MSG_PROPS_UPDATE)
  async update(@Payload() data: { id: string; dto: any; actor: any }) {
    const { updated, oldPrice } = await this.propertiesService.update(data.id, data.dto, data.actor);

    this.client.emit(EVT_PROPERTY_UPDATED, { propertyId: data.id, property: updated });
    this.client.emit(EVT_AUDIT_LOG, {
      actor_id: data.actor.sub,
      action_type: 'UPDATE_RECORD',
      target_type: 'property',
      target_id: data.id,
      metadata: { old_price: oldPrice, new_price: updated.price },
    });

    // Emit price drop event if price decreased
    if (data.dto.price !== undefined && Number(data.dto.price) < Number(oldPrice)) {
      this.client.emit(EVT_PROPERTY_PRICE_DROP, {
        propertyId: data.id,
        old_price: oldPrice,
        new_price: updated.price,
      });
    }

    return updated;
  }

  @MessagePattern(MSG_PROPS_DELETE)
  async delete(@Payload() data: { id: string; actor: any }) {
    const result = await this.propertiesService.softDelete(data.id, data.actor);
    this.client.emit(EVT_AUDIT_LOG, {
      actor_id: data.actor.sub,
      action_type: 'DELETE_RECORD',
      target_type: 'property',
      target_id: data.id,
    });
    return result;
  }

  @MessagePattern(MSG_PROPS_UPDATE_VISIBILITY)
  async updateVisibility(@Payload() data: { id: string; visibility: string; actor: any }) {
    const { updated, oldVisibility } = await this.propertiesService.updateVisibility(
      data.id,
      data.visibility,
      data.actor,
    );

    this.client.emit(EVT_AUDIT_LOG, {
      actor_id: data.actor.sub,
      action_type: 'CHANGE_VISIBILITY',
      target_type: 'property',
      target_id: data.id,
      metadata: { old: oldVisibility, new: data.visibility },
    });

    // If newly shared/public, trigger matching
    if (['shared', 'public'].includes(data.visibility)) {
      this.client.emit(EVT_PROPERTY_CREATED, { propertyId: data.id, property: updated });
    }

    return updated;
  }

  @MessagePattern(MSG_PROPS_PDF)
  async generatePdf(@Payload() data: { id: string; actor: any }) {
    const property = await this.propertiesService.findOne(data.id, data.actor);
    const agent = await this.pdfService.getAgentInfo(data.actor.sub);

    const pdfBuffer = await this.pdfService.generatePropertyCard(property, agent);

    this.client.emit(EVT_AUDIT_LOG, {
      actor_id: data.actor.sub,
      action_type: 'DOWNLOAD_PDF',
      target_type: 'property',
      target_id: data.id,
    });

    // Return as base64 string for safe transport over Redis
    return { pdf: pdfBuffer.toString('base64') };
  }

  @MessagePattern(MSG_PROPS_GET_MATCHES)
  async getMatches(@Payload() data: { id: string; limit?: number }) {
    return this.propertiesService.getMatches(data.id, data.limit);
  }

  @MessagePattern(MSG_PROPS_TRASH_LIST)
  async listTrash(@Payload() data: { actor: any }) {
    return this.propertiesService.listTrashed(data.actor);
  }

  @MessagePattern(MSG_PROPS_RESTORE)
  async restore(@Payload() data: { id: string; actor: any }) {
    return this.propertiesService.restore(data.id, data.actor);
  }

  @MessagePattern(MSG_PROPS_GET_EVENTS)
  async getEvents(@Payload() data: { id: string }) {
    return this.propertiesService.getEvents(data.id);
  }

  @MessagePattern(MSG_PROPS_PHOTO_UPLOAD)
  async uploadPhoto(@Payload() data: {
    propertyId: string;
    fileBuffer: string;
    mimetype: string;
    originalname: string;
    user: any;
  }) {
    const buffer = Buffer.from(data.fileBuffer, 'base64');
    const objectName = await this.storageService.upload(
      buffer,
      data.originalname,
      data.mimetype,
      'crm-photos',
    );
    const url = this.storageService.getImgproxyUrl(objectName, 'crm-photos');

    // Insert photo record and get updated property photos
    const { rows } = await (this.propertiesService as any).db.query(
      `INSERT INTO property_photos (property_id, url, display_order, is_cover)
       VALUES ($1, $2,
         (SELECT COALESCE(MAX(display_order), 0) + 1 FROM property_photos WHERE property_id = $1),
         (SELECT COUNT(*) = 0 FROM property_photos WHERE property_id = $1)
       ) RETURNING *`,
      [data.propertyId, url],
    );

    return rows[0];
  }

  @MessagePattern(MSG_PROPS_PHOTO_DELETE)
  async deletePhoto(@Payload() data: { propertyId: string; photoId: string; user: any }) {
    const { rows } = await (this.propertiesService as any).db.query(
      `DELETE FROM property_photos WHERE id = $1 AND property_id = $2 RETURNING url`,
      [data.photoId, data.propertyId],
    );
    if (rows[0]?.url) {
      try {
        // Extract objectName from imgproxy URL (last segment after /plain/)
        const parts = rows[0].url.split('/');
        const encoded = parts[parts.length - 1];
        const s3Path = Buffer.from(encoded, 'base64url').toString();
        const objectName = s3Path.replace(/^s3:\/\/[^/]+\//, '');
        await this.storageService.delete('crm-photos', objectName);
      } catch { /* ignore storage errors */ }
    }
    return { deleted: true };
  }

  @MessagePattern(MSG_PROPS_PHOTO_REORDER)
  async reorderPhotos(@Payload() data: {
    propertyId: string;
    order: { id: string; display_order: number }[];
    user: any;
  }) {
    const db = (this.propertiesService as any).db;
    await Promise.all(
      data.order.map(({ id, display_order }) =>
        db.query(
          'UPDATE property_photos SET display_order = $1 WHERE id = $2 AND property_id = $3',
          [display_order, id, data.propertyId],
        ),
      ),
    );
    return { reordered: true };
  }
}
