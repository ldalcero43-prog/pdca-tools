import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: { origin: ['http://localhost:3000'], credentials: true },
  namespace: '/',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinProject')
  handleJoinProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.join(`project:${projectId}`);
    client.emit('project.joined', { projectId });
    this.logger.log(`Client ${client.id} joined project:${projectId}`);
  }

  @SubscribeMessage('leaveProject')
  handleLeaveProject(@MessageBody() projectId: string, @ConnectedSocket() client: Socket) {
    client.leave(`project:${projectId}`);
  }

  emitToProject(projectId: string, event: string, data: any) {
    this.server.to(`project:${projectId}`).emit(event, data);
  }

  emitTaskUpdated(projectId: string, task: any) {
    this.emitToProject(projectId, 'task:updated', task);
  }

  emitTaskCreated(projectId: string, task: any) {
    this.emitToProject(projectId, 'task:created', task);
  }

  emitTaskDeleted(projectId: string, taskId: string) {
    this.emitToProject(projectId, 'task:deleted', { taskId });
  }

  emitCommentCreated(projectId: string, comment: any) {
    this.emitToProject(projectId, 'comment:created', comment);
  }

  emitPhaseChanged(projectId: string, phase: string, status: string) {
    this.emitToProject(projectId, 'project:phase_changed', { phase, status });
  }
}
