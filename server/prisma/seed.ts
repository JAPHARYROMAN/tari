import { PrismaClient, ChatType, ChatRole, MessageType } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  // Seed-only: simple hash for dev data. Production uses argon2 via AuthService.
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function main() {
  console.log('Seeding database…');

  // Clean existing data
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.messageRead.deleteMany(),
    prisma.messageAttachment.deleteMany(),
    prisma.message.deleteMany(),
    prisma.chatParticipant.deleteMany(),
    prisma.chat.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ── Users ──────────────────────────────────────────────

  const alice = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      username: 'alice',
      password: hashPassword('password123'),
      name: 'Alice Johnson',
      bio: 'Building cool things',
      isOnline: true,
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      username: 'bob',
      password: hashPassword('password123'),
      name: 'Bob Smith',
      bio: 'Coffee enthusiast',
    },
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      username: 'charlie',
      password: hashPassword('password123'),
      name: 'Charlie Davis',
    },
  });

  console.log(`  Created ${3} users`);

  // ── Direct Chat (Alice ↔ Bob) ─────────────────────────

  const directChat = await prisma.chat.create({
    data: {
      type: ChatType.DIRECT,
      participants: {
        createMany: {
          data: [
            { userId: alice.id, role: ChatRole.MEMBER },
            { userId: bob.id, role: ChatRole.MEMBER },
          ],
        },
      },
    },
  });

  const msg1 = await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: alice.id,
      type: MessageType.TEXT,
      content: 'Hey Bob! How are you?',
    },
  });

  const msg2 = await prisma.message.create({
    data: {
      chatId: directChat.id,
      senderId: bob.id,
      type: MessageType.TEXT,
      content: 'Doing great! Working on that new feature.',
      replyToId: msg1.id,
    },
  });

  await prisma.chat.update({
    where: { id: directChat.id },
    data: { lastMessageAt: msg2.createdAt },
  });

  console.log(`  Created direct chat with ${2} messages`);

  // ── Group Chat ─────────────────────────────────────────

  const groupChat = await prisma.chat.create({
    data: {
      type: ChatType.GROUP,
      name: 'Tari Team',
      description: 'Main team channel',
      participants: {
        createMany: {
          data: [
            { userId: alice.id, role: ChatRole.OWNER },
            { userId: bob.id, role: ChatRole.ADMIN },
            { userId: charlie.id, role: ChatRole.MEMBER },
          ],
        },
      },
    },
  });

  const groupMsg = await prisma.message.create({
    data: {
      chatId: groupChat.id,
      senderId: alice.id,
      type: MessageType.TEXT,
      content: 'Welcome to the Tari Team channel!',
    },
  });

  await prisma.chat.update({
    where: { id: groupChat.id },
    data: { lastMessageAt: groupMsg.createdAt },
  });

  console.log(`  Created group chat with ${1} message`);

  // ── Read Receipts ──────────────────────────────────────

  await prisma.messageRead.create({
    data: {
      chatId: directChat.id,
      userId: alice.id,
      lastReadMessageId: msg2.id,
    },
  });

  console.log(`  Created read receipts`);

  // ── Notification ───────────────────────────────────────

  await prisma.notification.create({
    data: {
      userId: charlie.id,
      type: 'CHAT_INVITE',
      title: 'You were added to Tari Team',
      body: 'Alice added you to the group.',
      data: { chatId: groupChat.id },
    },
  });

  console.log(`  Created notifications`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
