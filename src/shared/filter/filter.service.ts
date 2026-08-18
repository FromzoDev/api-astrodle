import { Injectable } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';

@Injectable()
export class FilterService {
  applySearch<DataType extends object>(
    querybuilder: SelectQueryBuilder<DataType>,
    search: string | undefined,
    fields: string[],
  ): SelectQueryBuilder<DataType> {
    
    if (!search || !search.trim()) {
      return querybuilder;
    }

    querybuilder.andWhere(
      new Brackets((searchQueryBuilder) => {
        fields.forEach((field, index) => {
          const condition = `${field} ILIKE :search`;
          if (index === 0) {
            searchQueryBuilder.where(condition, { search: `%${search.trim()}%` });
          } else {
            searchQueryBuilder.orWhere(condition, { search: `%${search.trim()}%` });
          }
        });
      }),
    );

    return querybuilder;
  }

  applyExactFilter<DataType extends object, ValueType>(
    querybuilder: SelectQueryBuilder<DataType>,
    value: ValueType | undefined,
    field: string,
  ): SelectQueryBuilder<DataType> {
    if (value !== undefined) {
      const paramName = field.replace(/\./g, '_');
      querybuilder.andWhere(`${field} = :${paramName}`, { [paramName]: value });
    }
    return querybuilder;
  }

  applyOrderFilter<DataType extends object>(
  querybuilder: SelectQueryBuilder<DataType>,
  orderBy: string | undefined,
  orderDirection: 'ASC' | 'DESC' | undefined,
  ): SelectQueryBuilder<DataType> {
    if (orderBy && orderDirection) {
      querybuilder.orderBy(orderBy, orderDirection);
    }
    return querybuilder;
  }

  applyArrayContainsFilter<DataType extends object>(
  querybuilder: SelectQueryBuilder<DataType>,
  value: string | undefined,
  field: string,
): SelectQueryBuilder<DataType> {
  if (value !== undefined) {
    const paramName = field.replace(/\./g, '_');
    querybuilder.andWhere(`${field} ILIKE :${paramName}`, { [paramName]: `%${value}%` });
  }
  return querybuilder;
}
}
