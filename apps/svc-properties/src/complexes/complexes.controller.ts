import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  MSG_COMPLEXES_LIST,
  MSG_COMPLEXES_FIND_ONE,
  MSG_COMPLEXES_CREATE,
  MSG_COMPLEXES_UPDATE,
  MSG_COMPLEXES_DELETE,
  MSG_COMPLEXES_PHOTO_UPLOAD,
  MSG_COMPLEXES_PHOTO_DELETE,
  MSG_COMPLEXES_APARTMENT_LIST,
  MSG_COMPLEXES_APARTMENT_CREATE,
  MSG_COMPLEXES_APARTMENT_UPDATE,
  MSG_COMPLEXES_APARTMENT_DELETE,
  MSG_COMPLEXES_DOCUMENT_LIST,
  MSG_COMPLEXES_DOCUMENT_UPLOAD,
  MSG_COMPLEXES_DOCUMENT_DELETE,
  MSG_COMPLEXES_TRASH_LIST,
  MSG_COMPLEXES_RESTORE,
} from '@crm/shared-types';
import { ComplexesService } from './complexes.service';
import { StorageService } from '../storage/storage.service';
import type { ComplexFilter, CreateComplexDto, CreateApartmentDto } from './complexes.service';

@Controller()
export class ComplexesController {
  constructor(
    private readonly complexesService: ComplexesService,
    private readonly storageService: StorageService,
  ) {}

  @MessagePattern(MSG_COMPLEXES_LIST)
  list(@Payload() data: { filter?: ComplexFilter }) {
    return this.complexesService.findAll(data.filter ?? {});
  }

  @MessagePattern(MSG_COMPLEXES_FIND_ONE)
  findOne(@Payload() data: { id: string }) {
    return this.complexesService.findOne(data.id);
  }

  @MessagePattern(MSG_COMPLEXES_CREATE)
  create(@Payload() data: { dto: CreateComplexDto; actor: { sub: string } }) {
    return this.complexesService.create(data.dto, data.actor.sub);
  }

  @MessagePattern(MSG_COMPLEXES_UPDATE)
  update(@Payload() data: { id: string; dto: Partial<CreateComplexDto> }) {
    return this.complexesService.update(data.id, data.dto);
  }

  @MessagePattern(MSG_COMPLEXES_DELETE)
  delete(@Payload() data: { id: string }) {
    return this.complexesService.delete(data.id);
  }

  @MessagePattern(MSG_COMPLEXES_TRASH_LIST)
  listTrash() {
    return this.complexesService.listTrashed();
  }

  @MessagePattern(MSG_COMPLEXES_RESTORE)
  restore(@Payload() data: { id: string }) {
    return this.complexesService.restore(data.id);
  }

  @MessagePattern(MSG_COMPLEXES_PHOTO_UPLOAD)
  async photoUpload(
    @Payload() data: { complexId: string; buffer: number[]; originalname: string; mimetype: string; isCover: boolean },
  ) {
    const buffer = Buffer.from(data.buffer);
    const objectName = await this.storageService.upload(buffer, data.originalname, data.mimetype, 'crm-photos');
    const url = this.storageService.getPublicUrl('crm-photos', objectName);
    return this.complexesService.addPhoto(data.complexId, url, data.isCover ?? false);
  }

  @MessagePattern(MSG_COMPLEXES_PHOTO_DELETE)
  photoDelete(@Payload() data: { photoId: string }) {
    return this.complexesService.deletePhoto(data.photoId);
  }

  // ── Apartments ────────────────────────────────────────────────────────────────

  @MessagePattern(MSG_COMPLEXES_APARTMENT_LIST)
  apartmentList(@Payload() data: { complexId: string }) {
    return this.complexesService.getApartments(data.complexId);
  }

  @MessagePattern(MSG_COMPLEXES_APARTMENT_CREATE)
  apartmentCreate(@Payload() data: { complexId: string; dto: CreateApartmentDto }) {
    return this.complexesService.createApartment(data.complexId, data.dto);
  }

  @MessagePattern(MSG_COMPLEXES_APARTMENT_UPDATE)
  apartmentUpdate(@Payload() data: { id: string; dto: Partial<CreateApartmentDto> }) {
    return this.complexesService.updateApartment(data.id, data.dto);
  }

  @MessagePattern(MSG_COMPLEXES_APARTMENT_DELETE)
  apartmentDelete(@Payload() data: { id: string }) {
    return this.complexesService.deleteApartment(data.id);
  }

  // ── Documents ─────────────────────────────────────────────────────────────────

  @MessagePattern(MSG_COMPLEXES_DOCUMENT_LIST)
  documentList(@Payload() data: { complexId: string }) {
    return this.complexesService.getDocuments(data.complexId);
  }

  @MessagePattern(MSG_COMPLEXES_DOCUMENT_UPLOAD)
  async documentUpload(
    @Payload() data: { complexId: string; buffer: number[]; originalname: string; mimetype: string; name: string },
  ) {
    const buffer = Buffer.from(data.buffer);
    const objectName = await this.storageService.upload(buffer, data.originalname, data.mimetype, 'crm-documents');
    const url = this.storageService.getPublicUrl('crm-documents', objectName);
    return this.complexesService.createDocument(data.complexId, url, data.name);
  }

  @MessagePattern(MSG_COMPLEXES_DOCUMENT_DELETE)
  documentDelete(@Payload() data: { id: string }) {
    return this.complexesService.deleteDocument(data.id);
  }
}
