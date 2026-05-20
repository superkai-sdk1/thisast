import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { TasksService } from './tasks.service';

@Injectable()
export class TasksCron {
  private readonly logger = new Logger(TasksCron.name);

  constructor(private tasksService: TasksService) {}

  @Cron('*/5 * * * *')
  async markOverdueTasks() {
    const overdue = await this.tasksService.markOverdueTasks().catch((e) => {
      this.logger.error('markOverdueTasks failed', e);
      return [];
    });
    if (overdue.length > 0) {
      this.logger.log(`Marked ${overdue.length} tasks as overdue`);
    }
  }

  @Cron('0 * * * *')
  async sendDueReminders() {
    await this.tasksService.sendDueReminders().catch((e) => {
      this.logger.error('sendDueReminders failed', e);
    });
  }
}
