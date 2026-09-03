import { SpaceSkyObject } from '../spaceSkyObject/space-sky-object.entity';

export interface HintDefinition {
  key: string;
  resolve: (object: SpaceSkyObject) => string | number | null;
}

export const HINT_POOL: HintDefinition[] = [
  { key: 'constellationName', resolve: (o) => o.constellationName },
  { key: 'discoveryDate', resolve: (o) => o.discoveryDate?.toISOString().split('T')[0] ?? null },
  { key: 'objectType', resolve: (o) => o.objectType },
  { key: 'magnitude', resolve: (o) => o.magnitude },
  { key: 'distanceLightYears', resolve: (o) => o.distanceLightYears },
  { key: 'description', resolve: (o) => o.description },

  { key: 'discoverer.firstName', resolve: (o) => o.discoverer?.firstName ?? null },
  { key: 'discoverer.lastName', resolve: (o) => o.discoverer?.lastName ?? null },
  { key: 'discoverer.nationality', resolve: (o) => o.discoverer?.nationality ?? null },
  { key: 'discoverer.profession', resolve: (o) => o.discoverer?.profession ?? null },
  { key: 'discoverer.personalityImage', resolve: (o) => o.discoverer?.personalityImage ?? null },
  { key: 'discoverer.dateOfBirth', resolve: (o) => o.discoverer?.dateOfBirth?.toISOString().split('T')[0] ?? null },
  { key: 'discoverer.dateOfDeath', resolve: (o) => o.discoverer?.dateOfDeath?.toISOString().split('T')[0] ?? null },
  { key: 'discoverer.description', resolve: (o) => o.discoverer?.description ?? null },

  { key: 'telescope.name', resolve: (o) => o.telescope?.name ?? null },
  { key: 'telescope.telescopeImage', resolve: (o) => o.telescope?.telescopeImage ?? null },
];