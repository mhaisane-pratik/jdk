import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ Relaxed: nullable=true prevents crashes
  @Column({ name: 'company_id', type: 'uuid', nullable: true })
  companyId: string;

  @Column({ type: 'text', nullable: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  email: string;

  // ✅ FIX: Match the SQL column name exactly
  @Column({ name: 'password_hash', type: 'text', nullable: true, select: false }) 
  passwordHash: string;

  @Column({ type: 'text', default: 'PARTICIPANT', nullable: true })
  role: string;

  @Column({ name: 'is_active', type: 'boolean', default: true, nullable: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}