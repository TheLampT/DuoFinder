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
  id: number;
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

export interface Match {
  id: number;
  user1_id: number;
  user2_id: number;
  match_date: string;
  other_user?: UserProfile;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: number;
  match_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
}

export interface Chat {
  match_id: number;
  other_user: UserProfile;
  last_message?: Message;
  unread_count: number;
}

export interface UserPreferences {
  server?: string;
  is_ranked?: boolean;
  age_range?: {
    min: number;
    max: number;
  };
  // ... otras preferencias
}

export interface ChatMessage {
  id: number;
  match_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
}

export interface ChatListItem {
  match_id: number;
  other_user: {
    id: number;
    name: string;
    username: string;
    avatar: string;
    age?: number;
    bio?: string;
    onlineStatus?: boolean;
    location?: string;
    skillLevel?: string;
    gamePreferences?: string[];
    favoriteGames?: string[];
  };
  last_message?: {
    id: number;
    match_id: number;
    sender_id: number;
    content: string;
    created_at: string;
    read: boolean;
  };
  unread_count: number;
}

// Para matches
export interface Match {
  id: number;
  user1_id: number;
  user2_id: number;
  match_date: string;
  status?: string;
}

export interface ApiMessage {
  id: number;
  MatchesID: number;
  SenderID: number;
  ContentChat: string;
  CreatedDate: string;
  Status?: string;
  ReadChat: boolean;
}

export interface ApiMatch {
  ID: number;
  UserID1: number;
  UserID2: number;
  MatchDate: string;
  Status?: string;
}

// Para usar en el frontend (compatible con ambos)
export interface FrontendMessage {
  id: number;
  match_id: number;
  sender_id: number;
  content: string;
  created_at: string;
  read: boolean;
}

export interface FrontendChat {
  id: string;
  matchId: number;
  userId: number;
  matchedOn: string;
  lastMessage?: FrontendMessage;
  unreadCount: number;
  user: MessagesUserProfile;
  isCommunity?: boolean;
  communityId?: number;
}

export interface MessagesUserProfile {
  id: number;
  name: string;
  username?: string;
  age?: number;
  bio?: string;
  avatar: string;
  gamePreferences?: string[];
  onlineStatus?: boolean;
  lastOnline?: string;
  location?: string;
  skillLevel?: string;
  favoriteGames?: string[];
}