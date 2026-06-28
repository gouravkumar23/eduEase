import { Timestamp } from 'firebase/firestore';

export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface FilterOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'faculty' | 'student' | 'admin';
  status: 'active' | 'pending' | 'blocked';
  emailVerified: boolean;
  isVerified: boolean;
  rollNumber?: string;
  branch?: string;
  year?: string;
  section?: string;
  dob?: string;
  activeSessionId?: string;
}
