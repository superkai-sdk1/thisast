import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksCron } from './tasks.cron';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [TasksController],
  providers: [TasksService, TasksCron],
  exports: [TasksService],
})
export class TasksModule {}
