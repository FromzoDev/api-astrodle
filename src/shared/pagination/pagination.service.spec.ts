import { SelectQueryBuilder } from 'typeorm';
import { PaginationService } from './pagination.service';

type FakeQueryBuilder = {
  skip: jest.Mock;
  take: jest.Mock;
  getManyAndCount: jest.Mock;
};

const createQueryBuilder = (
  items: unknown[],
  total: number,
): FakeQueryBuilder => {
  const qb: Partial<FakeQueryBuilder> = {};
  qb.skip = jest.fn().mockReturnValue(qb);
  qb.take = jest.fn().mockReturnValue(qb);
  qb.getManyAndCount = jest.fn().mockResolvedValue([items, total]);
  return qb as FakeQueryBuilder;
};

describe('PaginationService', () => {
  let service: PaginationService;

  beforeEach(() => {
    service = new PaginationService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('applies default page (1) and limit (20) when options are empty', async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const qb = createQueryBuilder(items, 2);

    const result = await service.paginate(
      qb as unknown as SelectQueryBuilder<any>,
      {},
    );

    expect(qb.skip).toHaveBeenCalledWith(0);
    expect(qb.take).toHaveBeenCalledWith(20);
    expect(result).toEqual({
      items,
      total: 2,
      page: 1,
      limit: 20,
      lastPage: 1,
    });
  });

  it('computes the correct skip value for a given page and limit', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({ id: i }));
    const qb = createQueryBuilder(items, 55);

    const result = await service.paginate(
      qb as unknown as SelectQueryBuilder<any>,
      { page: 3, limit: 10 },
    );

    expect(qb.skip).toHaveBeenCalledWith(20);
    expect(qb.take).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      items,
      total: 55,
      page: 3,
      limit: 10,
      lastPage: 6,
    });
  });

  it('caps the limit at 100 even when a higher limit is requested', async () => {
    const qb = createQueryBuilder([], 0);

    await service.paginate(qb as unknown as SelectQueryBuilder<any>, {
      page: 1,
      limit: 500,
    });

    expect(qb.take).toHaveBeenCalledWith(100);
  });

  it('returns an empty result set with lastPage 0 when there are no items', async () => {
    const qb = createQueryBuilder([], 0);

    const result = await service.paginate(
      qb as unknown as SelectQueryBuilder<any>,
      { page: 1, limit: 20 },
    );

    expect(result).toEqual({
      items: [],
      total: 0,
      page: 1,
      limit: 20,
      lastPage: 0,
    });
  });

  it('rounds lastPage up when total is not an exact multiple of limit', async () => {
    const qb = createQueryBuilder([], 21);

    const result = await service.paginate(
      qb as unknown as SelectQueryBuilder<any>,
      { page: 1, limit: 20 },
    );

    expect(result.lastPage).toBe(2);
  });

  it('does not clamp a page of 0 (documents current pass-through behaviour)', async () => {
    const qb = createQueryBuilder([], 0);

    const result = await service.paginate(
      qb as unknown as SelectQueryBuilder<any>,
      { page: 0, limit: 10 },
    );

    // page ?? 1 leaves 0 untouched since 0 is not nullish, producing a
    // negative skip. This test documents the actual current behaviour.
    expect(qb.skip).toHaveBeenCalledWith(-10);
    expect(result.page).toBe(0);
  });

  it('does not clamp a negative page (documents current pass-through behaviour)', async () => {
    const qb = createQueryBuilder([], 0);

    const result = await service.paginate(
      qb as unknown as SelectQueryBuilder<any>,
      { page: -2, limit: 10 },
    );

    expect(qb.skip).toHaveBeenCalledWith(-30);
    expect(result.page).toBe(-2);
  });
});
