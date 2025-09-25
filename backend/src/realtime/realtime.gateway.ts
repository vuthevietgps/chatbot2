import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Namespaces/rooms:
// - room: conversation:<conversationId>
// - room: page:<pageId>

@WebSocketGateway({ cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(RealtimeGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  onJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    if (!data?.conversationId) return;
    const room = `conversation:${data.conversationId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined ${room}`);
  }

  @SubscribeMessage('leaveConversation')
  onLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    if (!data?.conversationId) return;
    const room = `conversation:${data.conversationId}`;
    client.leave(room);
    this.logger.debug(`Client ${client.id} left ${room}`);
  }

  @SubscribeMessage('typing')
  onTyping(@MessageBody() data: { conversationId: string; userId: string; isTyping: boolean }) {
    if (!data?.conversationId) return;
    const room = `conversation:${data.conversationId}`;
    this.server.to(room).emit('typing', data);
  }

  // Emission helpers
  emitMessageCreated(conversationId: string, payload: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:new', payload);
  }

  emitMessageUpdated(conversationId: string, payload: any) {
    this.server.to(`conversation:${conversationId}`).emit('message:updated', payload);
  }

  emitNotification(userRoomOrPageId: string, payload: any) {
    // For simplicity, notify by page room or a generic channel
    this.server.to(`page:${userRoomOrPageId}`).emit('notify', payload);
  }
}
