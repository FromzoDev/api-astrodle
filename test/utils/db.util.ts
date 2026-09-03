import { DataSource } from 'typeorm';

export async function clearDatabase(dataSource: DataSource): Promise<void> {
  const tableNames = dataSource.entityMetadatas
    .map((entity) => `"${entity.tableName}"`)
    .join(', ');

  if (!tableNames) {
    return;
  }

  await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
}
