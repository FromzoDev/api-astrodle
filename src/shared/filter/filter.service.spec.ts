import { Brackets, SelectQueryBuilder } from 'typeorm';
import { FilterService } from './filter.service';

type FakeQueryBuilder = {
  andWhere: jest.Mock;
  orderBy: jest.Mock;
};

const createQueryBuilder = (): FakeQueryBuilder => {
  const qb: Partial<FakeQueryBuilder> = {};
  qb.andWhere = jest.fn().mockReturnValue(qb);
  qb.orderBy = jest.fn().mockReturnValue(qb);
  return qb as FakeQueryBuilder;
};

describe('FilterService', () => {
  let service: FilterService;

  beforeEach(() => {
    service = new FilterService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('applySearch', () => {
    it('does not modify the query builder when search is undefined', () => {
      const qb = createQueryBuilder();

      const result = service.applySearch(
        qb as unknown as SelectQueryBuilder<any>,
        undefined,
        ['a.name'],
      );

      expect(result).toBe(qb);
      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('does not modify the query builder when search is an empty/whitespace string', () => {
      const qb = createQueryBuilder();

      service.applySearch(
        qb as unknown as SelectQueryBuilder<any>,
        '   ',
        ['a.name'],
      );

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('adds a Brackets where clause covering all fields with ILIKE', () => {
      const qb = createQueryBuilder();

      service.applySearch(
        qb as unknown as SelectQueryBuilder<any>,
        '  jupiter  ',
        ['a.name', 'a.description', 'a.constellationName'],
      );

      expect(qb.andWhere).toHaveBeenCalledTimes(1);
      const bracketsArg = qb.andWhere.mock.calls[0][0];
      expect(bracketsArg).toBeInstanceOf(Brackets);

      const subQb = {
        where: jest.fn().mockReturnThis(),
        orWhere: jest.fn().mockReturnThis(),
      };
      (bracketsArg as any).whereFactory(subQb);

      expect(subQb.where).toHaveBeenCalledWith('a.name ILIKE :search', {
        search: '%jupiter%',
      });
      expect(subQb.orWhere).toHaveBeenCalledWith(
        'a.description ILIKE :search',
        { search: '%jupiter%' },
      );
      expect(subQb.orWhere).toHaveBeenCalledWith(
        'a.constellationName ILIKE :search',
        { search: '%jupiter%' },
      );
      expect(subQb.orWhere).toHaveBeenCalledTimes(2);
    });

    it('trims the search term used in the ILIKE parameter', () => {
      const qb = createQueryBuilder();

      service.applySearch(
        qb as unknown as SelectQueryBuilder<any>,
        '  mars  ',
        ['a.name'],
      );

      const bracketsArg = qb.andWhere.mock.calls[0][0];
      const subQb = { where: jest.fn().mockReturnThis(), orWhere: jest.fn() };
      (bracketsArg as any).whereFactory(subQb);

      expect(subQb.where).toHaveBeenCalledWith('a.name ILIKE :search', {
        search: '%mars%',
      });
    });
  });

  describe('applyExactFilter', () => {
    it('does not modify the query builder when value is undefined', () => {
      const qb = createQueryBuilder();

      service.applyExactFilter(
        qb as unknown as SelectQueryBuilder<any>,
        undefined,
        'a.objectType',
      );

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('applies the exact filter when value is defined', () => {
      const qb = createQueryBuilder();

      service.applyExactFilter(
        qb as unknown as SelectQueryBuilder<any>,
        'planet',
        'spaceSkyObject.objectType',
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'spaceSkyObject.objectType = :spaceSkyObject_objectType',
        { spaceSkyObject_objectType: 'planet' },
      );
    });

    it('applies the filter even for falsy defined values (0, empty string, false)', () => {
      const qb = createQueryBuilder();

      service.applyExactFilter(
        qb as unknown as SelectQueryBuilder<any>,
        0,
        'a.count',
      );

      expect(qb.andWhere).toHaveBeenCalledWith('a.count = :a_count', {
        a_count: 0,
      });
    });
  });

  describe('applyOrderFilter', () => {
    it('does not order when orderBy is undefined', () => {
      const qb = createQueryBuilder();

      service.applyOrderFilter(
        qb as unknown as SelectQueryBuilder<any>,
        undefined,
        'ASC',
      );

      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it('does not order when orderDirection is undefined', () => {
      const qb = createQueryBuilder();

      service.applyOrderFilter(
        qb as unknown as SelectQueryBuilder<any>,
        'a.name',
        undefined,
      );

      expect(qb.orderBy).not.toHaveBeenCalled();
    });

    it('orders when both orderBy and orderDirection are provided', () => {
      const qb = createQueryBuilder();

      service.applyOrderFilter(
        qb as unknown as SelectQueryBuilder<any>,
        'a.name',
        'DESC',
      );

      expect(qb.orderBy).toHaveBeenCalledWith('a.name', 'DESC');
    });
  });

  describe('applyArrayContainsFilter', () => {
    it('does not modify the query builder when value is undefined', () => {
      const qb = createQueryBuilder();

      service.applyArrayContainsFilter(
        qb as unknown as SelectQueryBuilder<any>,
        undefined,
        'a.countries',
      );

      expect(qb.andWhere).not.toHaveBeenCalled();
    });

    it('applies an ILIKE filter with wildcard when value is defined', () => {
      const qb = createQueryBuilder();

      service.applyArrayContainsFilter(
        qb as unknown as SelectQueryBuilder<any>,
        'France',
        'spaceOrganisation.countries',
      );

      expect(qb.andWhere).toHaveBeenCalledWith(
        'spaceOrganisation.countries ILIKE :spaceOrganisation_countries',
        { spaceOrganisation_countries: '%France%' },
      );
    });

    it('applies the filter even for an empty string value', () => {
      const qb = createQueryBuilder();

      service.applyArrayContainsFilter(
        qb as unknown as SelectQueryBuilder<any>,
        '',
        'a.countries',
      );

      expect(qb.andWhere).toHaveBeenCalledWith('a.countries ILIKE :a_countries', {
        a_countries: '%%',
      });
    });
  });
});
