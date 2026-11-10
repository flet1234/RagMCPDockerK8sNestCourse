import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DocumentsModule } from './documents/documents.module.js';

@Module({
  imports: [DocumentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
