import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    CreateDateColumn 
  } from 'typeorm';
  import { UserEntity } from './user.entity';
  
  @Entity('notifications')
  export class NotificationEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @Column({ name: 'user_id' })
    userId: string;
  
    @Column({ length: 100 })
    title: string;
  
    @Column({ type: 'text' })
    message: string;
  
    @Column({ name: 'related_id', nullable: true })
    relatedId?: string;
  
    @Column({ name: 'is_read', default: false })
    isRead: boolean;
  
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
  
    // Relaciones
    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;
  }