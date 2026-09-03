import { DataSource } from 'typeorm';
import { Personality } from '../../src/personality/personality.entity';
import { Telescope } from '../../src/telescopes/telescopes.entity';
import { SpaceSkyObject } from '../../src/spaceSkyObject/space-sky-object.entity';
import { GuessSkyObjectGame } from '../../src/guessSkyObject/guess-sky-object-game.entity';
import { GameConfig } from '../../src/game/gameConfig/game-config.entity';
import { Country } from '../../src/common/enum/country.enum';
import { Profession } from '../../src/common/enum/profession.enum';
import {
  TelescopeLocation,
  TelescopeSpectrum,
} from '../../src/common/enum/telecope.enum';
import { ObjectType } from '../../src/common/enum/object-type.enum';
import { GameType } from '../../src/common/enum/game-type.enum';
import { GameMode } from '../../src/common/enum/game-mode.enum';

let fixtureCounter = 0;
function unique(): string {
  fixtureCounter += 1;
  return `${Date.now()}_${fixtureCounter}`;
}

export async function seedPersonality(
  dataSource: DataSource,
  overrides: Partial<Personality> = {},
): Promise<Personality> {
  return dataSource.getRepository(Personality).save({
    firstName: 'Galileo',
    lastName: `Galilei_${unique()}`,
    dateOfBirth: new Date('1564-02-15'),
    nationality: Country.Italy,
    profession: Profession.Astronomer,
    description: 'Italian astronomer',
    ...overrides,
  });
}

export async function seedTelescope(
  dataSource: DataSource,
  overrides: Partial<Telescope> = {},
): Promise<Telescope> {
  return dataSource.getRepository(Telescope).save({
    name: `Telescope_${unique()}`,
    telescopeLocation: TelescopeLocation.Ground,
    telescopeSpectrum: TelescopeSpectrum.Optical,
    isAmateur: false,
    ...overrides,
  });
}

export async function seedSpaceSkyObject(
  dataSource: DataSource,
  overrides: Partial<SpaceSkyObject> = {},
): Promise<SpaceSkyObject> {
  const discoverer =
    overrides.discoverer ?? (await seedPersonality(dataSource));
  const telescope = overrides.telescope ?? (await seedTelescope(dataSource));

  return dataSource.getRepository(SpaceSkyObject).save({
    name: `Object_${unique()}`,
    constellationName: 'Orion',
    discoveryDate: new Date('1610-11-26'),
    objectType: ObjectType.Nebula,
    magnitude: 4.0,
    distanceLightYears: 1344,
    description: 'A notable nebula',
    ...overrides,
    discoverer,
    telescope,
  });
}

export async function seedGuessSkyObjectGame(
  dataSource: DataSource,
  overrides: { isEnabled?: boolean; spaceSkyObject?: SpaceSkyObject } = {},
): Promise<GuessSkyObjectGame> {
  const spaceSkyObject =
    overrides.spaceSkyObject ?? (await seedSpaceSkyObject(dataSource));

  return dataSource.getRepository(GuessSkyObjectGame).save({
    spaceSkyObject,
    isEnabled: overrides.isEnabled ?? true,
  });
}

export async function seedGameConfig(
  dataSource: DataSource,
  gameType: GameType,
  mode: GameMode,
  isEnabled = true,
): Promise<GameConfig> {
  return dataSource
    .getRepository(GameConfig)
    .save({ gameType, mode, isEnabled });
}
