import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class TokenBlacklist {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column()
  expiresAt: Date;
}
