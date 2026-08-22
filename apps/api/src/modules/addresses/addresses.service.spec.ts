import { ResourceNotFoundException } from '../../common/errors/api-exception';
import type { PrismaService } from '../../prisma/prisma.service';
import { AddressesService } from './addresses.service';

const OWNER_ID = '11111111-1111-4111-8111-111111111111';
const ADDRESS_ID = '44444444-4444-4444-8444-444444444444';
const NOW = new Date('2026-08-22T10:00:00.000Z');

interface AddressDelegate {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  updateMany: jest.Mock;
}

function buildService(): { service: AddressesService; addresses: AddressDelegate } {
  const addresses: AddressDelegate = {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
  };

  const prisma = { userAddress: addresses } as unknown as PrismaService;

  return { service: new AddressesService(prisma), addresses };
}

const validAddress = {
  label: 'Home',
  addressLine: '12 Camp Road',
  locality: 'Camp',
  city: 'Belagavi',
  state: 'Karnataka',
  pincode: '590001',
};

describe('AddressesService', () => {
  describe('listForUser', () => {
    it('scopes the query to the caller and hides soft-deleted rows', async () => {
      const { service, addresses } = buildService();
      addresses.findMany.mockResolvedValue([]);

      await service.listForUser(OWNER_ID);

      expect(addresses.findMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('create', () => {
    it('takes the owner from the session, never from the payload', async () => {
      const { service, addresses } = buildService();
      addresses.create.mockResolvedValue({});

      // A hostile client sends someone else's id; it must be ignored.
      await service.create(OWNER_ID, {
        ...validAddress,
        // @ts-expect-error deliberately passing a field the schema strips
        userId: 'attacker-supplied-id',
      });

      expect(addresses.create.mock.calls[0][0].data.userId).toBe(OWNER_ID);
    });

    it('defaults absent optional fields to null rather than undefined', async () => {
      const { service, addresses } = buildService();
      addresses.create.mockResolvedValue({});

      await service.create(OWNER_ID, validAddress);

      const { data } = addresses.create.mock.calls[0][0];
      expect(data.latitude).toBeNull();
      expect(data.longitude).toBeNull();
      expect(data.instructions).toBeNull();
    });
  });

  describe('update — ownership', () => {
    it('includes the owner in the write itself, not in a check afterwards', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 1 });
      addresses.findFirst.mockResolvedValue({ id: ADDRESS_ID });

      await service.update(OWNER_ID, ADDRESS_ID, { label: 'Office' });

      expect(addresses.updateMany).toHaveBeenCalledWith({
        where: { id: ADDRESS_ID, userId: OWNER_ID, deletedAt: null },
        data: { label: 'Office' },
      });
    });

    it("reports 404 — not 403 — for another user's address, leaking nothing", async () => {
      const { service, addresses } = buildService();
      // The row exists but belongs to someone else, so the scoped update matches
      // nothing.
      addresses.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update(OWNER_ID, ADDRESS_ID, { label: 'Hijacked' }),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('does not read the row back when the scoped update matched nothing', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update(OWNER_ID, ADDRESS_ID, { label: 'x' })).rejects.toThrow();

      expect(addresses.findFirst).not.toHaveBeenCalled();
    });

    it('rejects an already soft-deleted address', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.update(OWNER_ID, ADDRESS_ID, { city: 'Hubli' })).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('only writes the fields present in the patch', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 1 });
      addresses.findFirst.mockResolvedValue({ id: ADDRESS_ID });

      await service.update(OWNER_ID, ADDRESS_ID, { city: 'Hubli' });

      expect(addresses.updateMany.mock.calls[0][0].data).toEqual({ city: 'Hubli' });
    });

    it('can clear nullable fields explicitly', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 1 });
      addresses.findFirst.mockResolvedValue({ id: ADDRESS_ID });

      await service.update(OWNER_ID, ADDRESS_ID, { instructions: null });

      expect(addresses.updateMany.mock.calls[0][0].data).toEqual({ instructions: null });
    });
  });

  describe('softDelete — ownership', () => {
    it('marks the row deleted rather than removing it, preserving booking history', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 1 });

      await service.softDelete(OWNER_ID, ADDRESS_ID, NOW);

      expect(addresses.updateMany).toHaveBeenCalledWith({
        where: { id: ADDRESS_ID, userId: OWNER_ID, deletedAt: null },
        data: { deletedAt: NOW },
      });
    });

    it("reports 404 for another user's address", async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.softDelete(OWNER_ID, ADDRESS_ID, NOW)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });

    it('is not silently idempotent — a second delete reports 404', async () => {
      const { service, addresses } = buildService();
      addresses.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.softDelete(OWNER_ID, ADDRESS_ID, NOW)).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
    });
  });
});
