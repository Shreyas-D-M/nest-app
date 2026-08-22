import { ConflictException } from '@nestjs/common';
import type { PrismaService } from '../../prisma/prisma.service';
import { toCurrentUser } from './users.mapper';
import { UsersService } from './users.service';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const PHONE = '+919876543210';

interface UserDelegate {
  findUnique: jest.Mock;
  upsert: jest.Mock;
  update: jest.Mock;
}

function buildService(): { service: UsersService; users: UserDelegate } {
  const users: UserDelegate = {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  };

  const prisma = { user: users } as unknown as PrismaService;

  return { service: new UsersService(prisma), users };
}

const userRow = {
  id: USER_ID,
  phone: PHONE,
  email: null,
  name: null,
  avatarUrl: null,
  role: 'CUSTOMER' as const,
  status: 'ACTIVE' as const,
  createdAt: new Date('2026-08-22T10:00:00.000Z'),
  updatedAt: new Date('2026-08-22T10:00:00.000Z'),
};

describe('UsersService', () => {
  describe('findOrCreateByPhone', () => {
    it('relies on the unique index instead of read-then-write', async () => {
      const { service, users } = buildService();
      users.upsert.mockResolvedValue(userRow);

      await service.findOrCreateByPhone(PHONE);

      expect(users.upsert).toHaveBeenCalledWith({
        where: { phone: PHONE },
        create: { phone: PHONE },
        update: {},
      });
    });

    it('creates the account with no elevated role', async () => {
      const { service, users } = buildService();
      users.upsert.mockResolvedValue(userRow);

      await service.findOrCreateByPhone(PHONE);

      // Role and status are left to the schema defaults (CUSTOMER / ACTIVE);
      // passing them here would be a way to accidentally mint an admin.
      expect(users.upsert.mock.calls[0][0].create).toEqual({ phone: PHONE });
    });
  });

  describe('updateProfile', () => {
    it('writes only the fields present in the patch', async () => {
      const { service, users } = buildService();
      users.update.mockResolvedValue(userRow);

      await service.updateProfile(USER_ID, { name: 'Asha' });

      expect(users.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { name: 'Asha' },
      });
    });

    it('can clear a field with an explicit null', async () => {
      const { service, users } = buildService();
      users.update.mockResolvedValue(userRow);

      await service.updateProfile(USER_ID, { email: null });

      expect(users.update.mock.calls[0][0].data).toEqual({ email: null });
    });

    it('never writes phone, role or status even if they reach it', async () => {
      const { service, users } = buildService();
      users.update.mockResolvedValue(userRow);

      await service.updateProfile(USER_ID, {
        name: 'Asha',
        // @ts-expect-error fields the schema strips; asserting defence in depth
        role: 'ADMIN',
        status: 'ACTIVE',
        phone: '+910000000000',
      });

      const { data } = users.update.mock.calls[0][0];
      expect(data).toEqual({ name: 'Asha' });
      expect(data).not.toHaveProperty('role');
      expect(data).not.toHaveProperty('status');
      expect(data).not.toHaveProperty('phone');
    });

    it('translates a duplicate email into 409 rather than a 500', async () => {
      const { service, users } = buildService();
      users.update.mockRejectedValue({ code: 'P2002', meta: { target: ['email'] } });

      await expect(
        service.updateProfile(USER_ID, { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('propagates unrelated database errors untouched', async () => {
      const { service, users } = buildService();
      users.update.mockRejectedValue(new Error('connection reset'));

      await expect(service.updateProfile(USER_ID, { name: 'Asha' })).rejects.toThrow(
        'connection reset',
      );
    });
  });
});

describe('toCurrentUser', () => {
  it('serialises timestamps as ISO-8601 UTC', () => {
    const mapped = toCurrentUser(userRow);

    expect(mapped.createdAt).toBe('2026-08-22T10:00:00.000Z');
    expect(mapped.updatedAt).toBe('2026-08-22T10:00:00.000Z');
  });

  it('exposes exactly the documented fields and nothing more', () => {
    const mapped = toCurrentUser(userRow);

    expect(Object.keys(mapped).sort()).toEqual(
      [
        'avatarUrl',
        'createdAt',
        'email',
        'id',
        'name',
        'phone',
        'role',
        'status',
        'updatedAt',
      ].sort(),
    );
  });
});
