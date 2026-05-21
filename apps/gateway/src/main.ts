import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { TransformInterceptor } from '@crm/shared-core';
import { RpcToHttpExceptionFilter } from './filters/rpc-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(cookieParser());
  app.enableCors({ origin: process.env.WEB_URL ?? 'http://localhost:3000', credentials: true });

  app.useGlobalFilters(new RpcToHttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.setGlobalPrefix('api');

  if (process.env.NODE_ENV !== 'production') {
    const doc = new DocumentBuilder()
      .setTitle('Эста CRM API Gateway')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
  }

  // health check endpoint (no auth required)
  app.getHttpAdapter().get('/health', (_req: unknown, res: { json: (v: unknown) => void }) =>
    res.json({ status: 'ok' }),
  );
  await app.listen(process.env.PORT ?? 3001);
}

bootstrap();
