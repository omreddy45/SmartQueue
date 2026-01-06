export enum OrderStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface Canteen {
  id: string;
  name: string;
  campus: string;
  themeColor: string;
}

export interface Token {
  id: string;
  canteenId: string; // Link order to specific canteen
  couponCode: string;
  tokenNumber: string; // e.g., A-101
  foodItem: string; // The item ordered
  status: OrderStatus;
  timestamp: number; // Created at
  estimatedWaitTimeMinutes: number;
  aiReasoning?: string; // New field for AI explanation
  completedAt?: number;
}

export interface QueueStats {
  totalOrdersToday: number;
  averageWaitTime: number;
  peakHour: string;
  activeQueueLength: number;
}

export interface MenuItem {
  id: string;
  name: string;
  icon: any; // React node
  color: string;
  defaultImage?: string; // Base64 or URL
}

export enum UserRole {
  NONE = 'NONE',
  STUDENT = 'STUDENT',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN'
}