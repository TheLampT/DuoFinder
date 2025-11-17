// lib/types.ts
export interface User {
  id: number;
  email: string;
  username: string;
  isActive: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}