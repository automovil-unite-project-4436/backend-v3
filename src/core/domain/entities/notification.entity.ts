// src/core/domain/entities/notification.entity.ts

export class Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    relatedId?: string; // ID relacionado (ej: ID de alquiler, vehículo, etc.)
    isRead: boolean;
    createdAt: Date;
  
    constructor(partial: Partial<Notification>) {
      Object.assign(this, partial);
      
      // Valores por defecto
      this.isRead = partial.isRead || false;
      this.createdAt = partial.createdAt || new Date();
    }
  
    public markAsRead(): void {
      this.isRead = true;
    }
  }