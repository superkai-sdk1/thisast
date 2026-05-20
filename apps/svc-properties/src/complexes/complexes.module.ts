import { Module } from '@nestjs/common';
import { ComplexesController } from './complexes.controller';
import { ComplexesService } from './complexes.service';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StorageModule],
  controllers: [ComplexesController],
  providers: [ComplexesService],
})
export class ComplexesModule {}
