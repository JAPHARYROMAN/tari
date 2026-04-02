import { Module } from '@nestjs/common';
import { ChatsModule } from '@modules/chats/chats.module';
import { RealtimeModule } from '@modules/realtime/realtime.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [ChatsModule, RealtimeModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
