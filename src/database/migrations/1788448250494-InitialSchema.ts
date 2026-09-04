import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788448250494 implements MigrationInterface {
  name = 'InitialSchema1788448250494';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(
      `CREATE TABLE "user" ("id" SERIAL NOT NULL, "roles" text NOT NULL DEFAULT '["user"]', "email" character varying NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "username" character varying NOT NULL, "profilePicture" character varying, "password" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "space_organisation" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "description" character varying NOT NULL, "countries" text NOT NULL, "agencyLogo" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_61c586f40e5884c5f2821c7f002" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "amateur_owner" ("id" SERIAL NOT NULL, "firstName" character varying, "lastName" character varying, "consentToDisplayName" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c4695c9c21003cdbf9ce94be9a1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "personality" ("id" SERIAL NOT NULL, "firstName" character varying NOT NULL, "lastName" character varying NOT NULL, "dateOfBirth" TIMESTAMP NOT NULL, "dateOfDeath" TIMESTAMP, "nationality" character varying NOT NULL, "profession" character varying NOT NULL, "description" character varying NOT NULL, "personalityImage" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_97c40c392c5c1660fe601a376d1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "space_sky_object" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "constellationName" character varying NOT NULL, "discoveryDate" TIMESTAMP NOT NULL, "objectType" character varying NOT NULL, "magnitude" numeric(5,2) NOT NULL, "distanceLightYears" numeric(12,2) NOT NULL, "objectImage" character varying, "description" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "discovererId" integer, "telescopeId" integer, CONSTRAINT "PK_887cbd553fe4a8e8d55e8c49f78" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "telescope" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "telescopeImage" character varying, "telescopeLocation" character varying NOT NULL, "telescopeSpectrum" character varying NOT NULL, "isAmateur" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "amateurOwnerId" integer, CONSTRAINT "PK_249930f3d5aac42a6d28da542bc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "guess_sky_object_stats" ("id" SERIAL NOT NULL, "mode" character varying NOT NULL, "totalPlayed" integer NOT NULL DEFAULT '0', "avgAttemptsUsed" numeric(5,2) NOT NULL DEFAULT '0', "winCountByAttemptNumber" text NOT NULL DEFAULT '{}', CONSTRAINT "UQ_9b050092a24afcd3d6516555953" UNIQUE ("mode"), CONSTRAINT "PK_974aacf63aa5c74b9c4b3b2fb4f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "guess_sky_object_game" ("id" SERIAL NOT NULL, "isEnabled" boolean NOT NULL DEFAULT true, "totalPlayed" integer NOT NULL DEFAULT '0', "totalWon" integer NOT NULL DEFAULT '0', "totalLost" integer NOT NULL DEFAULT '0', "totalAbandoned" integer NOT NULL DEFAULT '0', "winRate" numeric(5,2) NOT NULL DEFAULT '0', "avgAttemptsUsed" numeric(5,2) NOT NULL DEFAULT '0', "winCountByAttemptNumber" text NOT NULL DEFAULT '{}', "spaceSkyObjectId" integer, CONSTRAINT "REL_823d56b515277d349633721e14" UNIQUE ("spaceSkyObjectId"), CONSTRAINT "PK_1c53f4e9a4757fe3c9481ce72fd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "daily_game_schedule" ("id" SERIAL NOT NULL, "date" date NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "guessSkyObjectGameId" integer, CONSTRAINT "UQ_a78fcf50ea8e8cbc019e05b5f14" UNIQUE ("date"), CONSTRAINT "REL_b356bc55a6357c0787f51ab018" UNIQUE ("guessSkyObjectGameId"), CONSTRAINT "PK_a7bcb1d8d783bce38643b8fc691" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "token_blacklist" ("id" SERIAL NOT NULL, "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, CONSTRAINT "PK_3e37528d03f0bd5335874afa48d" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_stats" ("id" SERIAL NOT NULL, "gameType" character varying NOT NULL, "mode" character varying NOT NULL, "totalPlayed" integer NOT NULL DEFAULT '0', "totalWon" integer NOT NULL DEFAULT '0', "totalLost" integer NOT NULL DEFAULT '0', "totalAbandoned" integer NOT NULL DEFAULT '0', "winRate" numeric(5,2) NOT NULL DEFAULT '0', CONSTRAINT "UQ_7faba080d4e3fbe526fde95c0aa" UNIQUE ("gameType", "mode"), CONSTRAINT "PK_289bd8cd7cadaeb5f3f75746196" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."game_session_status_enum" AS ENUM('in_progress', 'won', 'lost', 'abandoned')`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_session" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "gameType" character varying NOT NULL, "contentId" integer NOT NULL, "mode" character varying NOT NULL, "status" "public"."game_session_status_enum" NOT NULL DEFAULT 'in_progress', "gameData" text, "startedAt" TIMESTAMP NOT NULL DEFAULT now(), "finishedAt" TIMESTAMP, CONSTRAINT "PK_58b630233711ccafbb0b2a904fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "game_config" ("id" SERIAL NOT NULL, "gameType" character varying NOT NULL, "mode" character varying NOT NULL, "isEnabled" boolean NOT NULL DEFAULT true, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_56a2fcb771340805c6c565b3efc" UNIQUE ("gameType", "mode"), CONSTRAINT "PK_6572e2a84c4c5d72a9227e0b894" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "telescope_space_organisation" ("telescopeId" integer NOT NULL, "spaceOrganisationId" integer NOT NULL, CONSTRAINT "PK_4406b751edbeda9b2e6b9a3aaa4" PRIMARY KEY ("telescopeId", "spaceOrganisationId"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_1702479fc4181f826f4006dca9" ON "telescope_space_organisation" ("telescopeId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_0bf9e8f623f241e1b035bb52d4" ON "telescope_space_organisation" ("spaceOrganisationId") `,
    );
    await queryRunner.query(
      `ALTER TABLE "space_sky_object" ADD CONSTRAINT "FK_134230d4383b319dc268c02adb2" FOREIGN KEY ("discovererId") REFERENCES "personality"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_sky_object" ADD CONSTRAINT "FK_717b6458d6b9905cc0ba441aa3a" FOREIGN KEY ("telescopeId") REFERENCES "telescope"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "telescope" ADD CONSTRAINT "FK_95241d8adbaf237a2a8435cfbc2" FOREIGN KEY ("amateurOwnerId") REFERENCES "amateur_owner"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "guess_sky_object_game" ADD CONSTRAINT "FK_823d56b515277d349633721e142" FOREIGN KEY ("spaceSkyObjectId") REFERENCES "space_sky_object"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_game_schedule" ADD CONSTRAINT "FK_b356bc55a6357c0787f51ab018b" FOREIGN KEY ("guessSkyObjectGameId") REFERENCES "guess_sky_object_game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "telescope_space_organisation" ADD CONSTRAINT "FK_1702479fc4181f826f4006dca90" FOREIGN KEY ("telescopeId") REFERENCES "telescope"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "telescope_space_organisation" ADD CONSTRAINT "FK_0bf9e8f623f241e1b035bb52d4f" FOREIGN KEY ("spaceOrganisationId") REFERENCES "space_organisation"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "telescope_space_organisation" DROP CONSTRAINT "FK_0bf9e8f623f241e1b035bb52d4f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "telescope_space_organisation" DROP CONSTRAINT "FK_1702479fc4181f826f4006dca90"`,
    );
    await queryRunner.query(
      `ALTER TABLE "daily_game_schedule" DROP CONSTRAINT "FK_b356bc55a6357c0787f51ab018b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "guess_sky_object_game" DROP CONSTRAINT "FK_823d56b515277d349633721e142"`,
    );
    await queryRunner.query(
      `ALTER TABLE "telescope" DROP CONSTRAINT "FK_95241d8adbaf237a2a8435cfbc2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_sky_object" DROP CONSTRAINT "FK_717b6458d6b9905cc0ba441aa3a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "space_sky_object" DROP CONSTRAINT "FK_134230d4383b319dc268c02adb2"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_0bf9e8f623f241e1b035bb52d4"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_1702479fc4181f826f4006dca9"`,
    );
    await queryRunner.query(`DROP TABLE "telescope_space_organisation"`);
    await queryRunner.query(`DROP TABLE "game_config"`);
    await queryRunner.query(`DROP TABLE "game_session"`);
    await queryRunner.query(`DROP TYPE "public"."game_session_status_enum"`);
    await queryRunner.query(`DROP TABLE "game_stats"`);
    await queryRunner.query(`DROP TABLE "token_blacklist"`);
    await queryRunner.query(`DROP TABLE "daily_game_schedule"`);
    await queryRunner.query(`DROP TABLE "guess_sky_object_game"`);
    await queryRunner.query(`DROP TABLE "guess_sky_object_stats"`);
    await queryRunner.query(`DROP TABLE "telescope"`);
    await queryRunner.query(`DROP TABLE "space_sky_object"`);
    await queryRunner.query(`DROP TABLE "personality"`);
    await queryRunner.query(`DROP TABLE "amateur_owner"`);
    await queryRunner.query(`DROP TABLE "space_organisation"`);
    await queryRunner.query(`DROP TABLE "user"`);
    await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
