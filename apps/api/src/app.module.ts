import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { ToolsModule } from './modules/tools/tools.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { KpisModule } from './modules/kpis/kpis.module';
import { WebsocketModule } from './modules/websocket/websocket.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '../../.env' }),
    PrismaModule,
    AuthModule,
    ProjectsModule,
    ToolsModule,
    TasksModule,
    KpisModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
