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

// Tipos para discover/suggestions
export interface GameSkill {
  game: string;
  skill: string;
  isRanked: boolean;
}

export interface Profile {
  id: number;
  username: string;
  age: number;
  image: string;
  bio: string;
  gameSkill: GameSkill[];
}

export interface Suggestion {
  id: number;
  username: string;
  age: number;
  image: string;
  bio: string;
  game: string;
  skill: string;
  isRanked: boolean;
}

export interface UserProfile {
  username: string;
  email: string;
  bio: string;
  server?: string;
  discord?: string;
  tracker?: string;
  age: number;
  games?: UserGame[];
  images?: UserImage[];
}

export interface UserGame {
  game_id: number;
  game_name: string;
  skill_level: string;
  is_ranked: boolean;
  game_rank_local_id?: number;
  rank_name?: string;
}

export interface UserImage {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface UpdateProfileRequest {
  username?: string;
  password?: string;
  bio?: string;
  server?: string;
  discord?: string;
  tracker?: string;
  birthdate?: string;
  games?: Array<{
    game_id?: number;
    skill_level?: string;
    is_ranked?: boolean;
    game_rank_local_id?: number;
  }>;
}

export interface UpdateProfileResponse {
  message: string;
  new_profile: {
    username: string;
    email: string;
    bio: string;
    server?: string;
    discord?: string;
    tracker?: string;
    birthdate: string;
  };
}

export interface SwipeResponse {
  message: string;
  match: boolean;
  match_id?: number;
  chat_id?: number;
  game_id?: number;
  is_ranked?: boolean;
}

export interface SwipeInput {
  target_user_id: number;
  like: boolean;
  game_id?: number;
}

// Tipos para auth
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ApiError {
  detail: string;
}