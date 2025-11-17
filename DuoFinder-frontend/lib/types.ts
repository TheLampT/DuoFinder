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

// types/profile.ts
export interface Profile {
  id: number;
  name: string;
  age: number;
  image: string;
  bio: string;
  game: string;
  skillLevel: string;
  isRanked: boolean;
  server?: string;
  discord?: string;
  tracker?: string;
  username?: string;
  birthdate?: string;
  games?: UserGame[];
}

export interface UserGame {
  game_id: number;
  game_name: string;
  skill_level: string;
  is_ranked: boolean;
  game_rank_local_id?: number;
  rank_name?: string;
}

// Interface para la respuesta de la API de sugerencias
export interface Suggestion {
  id: number;
  username: string;
  age: number;
  image: string | null;
  bio: string | null;
  game: string;
  skill: string;
  isRanked: boolean;
}

// Interface para el input de swipe
export interface SwipeInput {
  target_user_id: number;
  like: boolean;
  game_id?: number;
}

// Interface para la respuesta de swipe
export interface SwipeResponse {
  message: string;
  match: boolean;
  match_id?: number;
  chat_id?: number;
  game_id?: number;
  is_ranked?: boolean;
  created_now?: boolean;
  liked_by_low_high?: [boolean, boolean];
}